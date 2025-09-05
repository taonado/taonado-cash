import fs from "fs";
import circomlib from "circomlib";
import merkleTree from "fixed-merkle-tree";
import buildGroth16 from "websnark/src/groth16";
import webSnarkUtils from "websnark/src/utils";
import { assert } from "chai";
import {
  DepositEvent,
  ERC20Taonado,
} from "../typechain-types/core/ERC20Taonado";
import { Deposit } from "./Deposit";
import { bigInt } from "snarkjs";
import crypto from "crypto";
import { AddressLike } from "ethers";
import circuit from "../build/circuits/withdraw.json";

const MERKLE_TREE_HEIGHT = 20;

/** Generate random number of specified byte length */
const rbigint = (nbytes: number): bigInt =>
  bigInt.leBuff2int(crypto.randomBytes(nbytes));

/** Compute pedersen hash */
const pedersenHash = (data) =>
  circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];

/** BigNumber to hex string of specified length */
export const toHex = (number, length = 32) =>
  "0x" +
  (number instanceof Buffer
    ? number.toString("hex")
    : bigInt(number).toString(16)
  ).padStart(length * 2, "0");

/**
 * Create deposit object from secret and nullifier
 */
function _createDeposit(nullifier: bigInt, secret: bigInt) {
  let deposit: Deposit = { nullifier, secret };
  deposit.preimage = Buffer.concat([
    bigInt.leInt2Buff(deposit.nullifier, 31),
    bigInt.leInt2Buff(deposit.secret, 31),
  ]);
  deposit.commitment = pedersenHash(deposit.preimage);
  deposit.nullifierHash = pedersenHash(
    bigInt.leInt2Buff(deposit.nullifier, 31)
  );
  return deposit;
}

// format protocol-currency-amount-netId-note
export async function createNote(deposit: Deposit) {
  return `taonado-wtao-1-964-${toHex(deposit.preimage, 62)}`;
}

export function parseNote(noteString: string) {
  const noteRegex =
    /taonado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g;
  const match = noteRegex.exec(noteString);

  // TypeScript compliance: check match and match.groups existence
  if (!match || !match.groups || typeof match.groups.note !== "string") {
    throw new Error("Invalid note format");
  }

  const buf = Buffer.from(match.groups.note, "hex");
  const nullifier = bigInt.leBuff2int(buf.subarray(0, 31));
  const secret = bigInt.leBuff2int(buf.subarray(31, 62));
  return _createDeposit(nullifier, secret);
}

export async function createDeposit() {
  const deposit = _createDeposit(rbigint(31), rbigint(31));
  const note = await createNote(deposit);
  return { deposit, note };
}

export async function generateSnarkProof(
  deposit: Deposit,
  recipient: AddressLike,
  contract: ERC20Taonado
) {
  // Compute merkle proof of commitment
  const { root, pathElements, pathIndices } = await generateMerkleProof(
    deposit,
    contract
  );

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: 0,
    fee: 0,
    refund: 0,

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements,
    pathIndices,
  };
  const groth16 = await buildGroth16();

  const proving_key = fs.readFileSync(
    __dirname + "/../build/circuits/withdraw_proving_key.bin"
  ).buffer;

  console.log("Generating SNARK proof...");
  const proofData = await webSnarkUtils.genWitnessAndProve(
    groth16,
    input,
    circuit,
    proving_key
  );
  const { proof } = webSnarkUtils.toSolidityInput(proofData);

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund),
  ];

  return { proof, args };
}

export async function generateMerkleProof(
  deposit: Deposit,
  contract: ERC20Taonado
) {
  console.log("Getting contract state...");
  const depositEvents = await contract.queryFilter(
    contract.filters.Deposit(),
    0,
    "latest"
  );

  const leaves = depositEvents
    .sort((a, b) =>
      a.args.leafIndex < b.args.leafIndex
        ? -1
        : a.args.leafIndex > b.args.leafIndex
        ? 1
        : 0
    ) // Sort events in chronological order
    .map((e) => e.args.commitment);
  const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves);

  // Find current commitment in the tree
  const depositEvent = depositEvents.find(
    (e) => e.args.commitment === toHex(deposit.commitment)
  );
  const leafIndex: bigint = depositEvent?.args.leafIndex ?? BigInt(-1);

  // Validate that our data is correct (optional)
  const isValidRoot = await contract.isKnownRoot(toHex(tree.root()));
  const isSpent = await contract.isSpent(toHex(deposit.nullifierHash));
  assert(isValidRoot === true, "Merkle tree is corrupted");
  assert(isSpent === false, "The note is already spent");
  assert(leafIndex >= 0, "The deposit is not found in the tree");

  // Compute merkle proof of our commitment
  const { pathElements, pathIndices } = tree.path(Number(leafIndex));
  return { pathElements, pathIndices, root: tree.root() };
}

export { Deposit } from "./Deposit";
