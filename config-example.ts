// PROTECT YOUR PRIVATE KEYS WELL, NEVER COMMIT THEM TO GITHUB OR SHARE WITH ANYONE
import { BigNumberish } from "ethers";

const ethPrivateKey: string =
  "0000000000000000000000000000000000000000000000000000000000000001";

const subSeed: string = "//Alice"; // this can be found in the hotkey file, "secretSeed"

const env: string = "local";
const netuid: BigNumberish = "0x99";

export const config = {
  ethPrivateKey,
  env,
  netuid,
  subSeed,
};
