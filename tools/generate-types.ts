import { execSync } from "child_process";
import { sync as globSync } from "glob";

//workaround since Pairing.json has an emtpy abi which causes typechain gen to fail

function generateTypes() {
  try {
    // Find all contract artifacts except Pairing.json and debug files
    const artifacts = globSync("artifacts/contracts/**/*.json", {
      ignore: ["**/Pairing.json", "**/**.dbg.json"],
    });

    if (artifacts.length === 0) {
      console.log(
        'No contract artifacts found. Run "npx hardhat compile" first.'
      );
      return;
    }

    // Run typechain with the filtered artifacts
    const command = `npx typechain --target ethers-v6 --out-dir typechain-types ${artifacts.join(
      " "
    )}`;
    console.log("Generating TypeChain types...");
    execSync(command, { stdio: "inherit" });

    console.log("✅ TypeChain types generated successfully!");
  } catch (error) {
    console.error("❌ Error generating TypeChain types:", error);
    process.exit(1);
  }
}

generateTypes();
