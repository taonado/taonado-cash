import path from "path";
import fs from "fs";
const genContract = require("circomlib/src/mimcsponge_gencontract.js");

const outputPath = path.join(__dirname, "..", "build", "Hasher.json");

export async function compileHasher(writeToFile = true) {
  const contract = {
    contractName: "Hasher",
    abi: genContract.abi,
    bytecode: genContract.createCode("mimcsponge", 220),
  };

  if (writeToFile) {
    fs.writeFileSync(outputPath, JSON.stringify(contract));
  }

  return contract;
}
