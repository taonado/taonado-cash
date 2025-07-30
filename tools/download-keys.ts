// Download the keys direct from the github repo release.
// These were generated with a trusted setup ceremony.
// The local building of these keys is possible but it is not secure!

import axios from "axios";
import path from "path";
import fs from "fs";

const files = [
  "withdraw.json",
  "withdraw_proving_key.bin",
  "Verifier.sol",
  "withdraw_verification_key.json",
];
const circuitsPath = __dirname + "/../build/circuits";
const contractsPath = __dirname + "/../build/contracts";

async function downloadFile({ url, path }: { url: string; path: string }) {
  const writer = fs.createWriteStream(path);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(true));
    writer.on("error", reject);
  });
}

async function main() {
  const release = await axios.get(
    "https://api.github.com/repos/tornadocash/tornado-core/releases/latest"
  );
  const { assets } = release.data;
  if (!fs.existsSync(circuitsPath)) {
    fs.mkdirSync(circuitsPath, { recursive: true });
    fs.mkdirSync(contractsPath, { recursive: true });
  }
  for (let asset of assets) {
    if (files.includes(asset.name)) {
      console.log(`Downloading ${asset.name} ...`);
      await downloadFile({
        url: asset.browser_download_url,
        path: path.resolve(__dirname, circuitsPath, asset.name),
      });
    }
  }
}

main();
