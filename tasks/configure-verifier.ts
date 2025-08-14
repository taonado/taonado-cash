import { task } from "hardhat/config";
import {
  configureVerifierForNetwork,
  restoreDefaultConfig,
} from "../tools/configure-verifier";

task("configure-verifier", "Configure verifier for target network")
  .addOptionalParam("variant", "Verifier variant (substrate|ethereum)")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.variant) {
      process.env.VERIFIER_TYPE = taskArgs.variant;
    }

    configureVerifierForNetwork(hre);
  });

task("reset-verifier", "Reset verifier to default configuration").setAction(
  async () => {
    restoreDefaultConfig();
  }
);
