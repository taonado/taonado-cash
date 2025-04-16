import { JsonDB, Config } from "node-json-db";
import { config } from "../config";
import { Addressable, BaseContract } from "ethers";

const db = new JsonDB(new Config("taonado-cash-db", true, true, "/"));

async function getDeployedContract<T extends BaseContract>(
  contractName: string
) {
  const contract = await db.getObject<T>(getPath(contractName));
  return contract;
}

async function storeContract<T extends BaseContract>(
  contractName: string,
  contract: T
) {
  await db.push(getPath(contractName), contract);
}

async function contractExists(contractName: string) {
  return await db.exists(getPath(contractName));
}

function getPath(contractName: string) {
  return `/${contractName}/${config.env}`;
}

export {
  contractExists,
  getDeployedContract,
  storeContract,
  db as __db,
  getPath,
};
