import { ethers } from "ethers";

async function main() {
  const zero = BigInt(0);
  const FIELD_SIZE = BigInt(
    "21888242871839275222246405745257275088548364400416034343698204186575808495617"
  );

  const tornado = ethers.keccak256(ethers.toUtf8Bytes("tornado"));
  const zeroValue = BigInt(tornado) % FIELD_SIZE;

  console.log(zeroValue);
}

main();
