// PROTECT YOUR PRIVATE KEYS WELL, NEVER COMMIT THEM TO GITHUB OR SHARE WITH ANYONE
import { BigNumberish } from "ethers";

const ethPrivateKey: string =
  "0000000000000000000000000000000000000000000000000000000000000001";

const subSeed: string = "//Alice"; // this can be found in the hotkey file, "secretSeed"

const env: string = "local"; // local, testnet, mainnet
const netuid: BigNumberish = "0x71"; //local = 0x2, testnet = 0x15B, mainnet = 0x71 (SN113)
const MERKLE_TREE_HEIGHT: BigNumberish = 20;

export const config = {
  ethPrivateKey,
  env,
  netuid,
  subSeed,
  MERKLE_TREE_HEIGHT,
};
