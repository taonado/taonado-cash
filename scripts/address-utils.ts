import { hexToU8a } from "@polkadot/util";
import {
  encodeAddress,
  decodeAddress,
  blake2AsU8a,
} from "@polkadot/util-crypto";

function convertH160ToSS58(ethAddress: string) {
  const prefix = "evm:";
  const prefixBytes = new TextEncoder().encode(prefix);
  const addressBytes = hexToU8a(
    ethAddress.startsWith("0x") ? ethAddress : `0x${ethAddress}`
  );
  const combined = new Uint8Array(prefixBytes.length + addressBytes.length);

  // Concatenate prefix and Ethereum address
  combined.set(prefixBytes);
  combined.set(addressBytes, prefixBytes.length);

  // Hash the combined data (the public key)
  const hash = blake2AsU8a(combined);

  // Convert the hash to SS58 format
  const ss58Address = encodeAddress(hash, 42); // Assuming network ID 42, change as per your network
  return ss58Address;
}

function publicKeyToHex(publicKey: Uint8Array) {
  return "0x" + Buffer.from(publicKey).toString("hex");
}

function ss58ToPublicKey(ss58Address: string) {
  // Get the substrate address public key
  const publicKey = decodeAddress(ss58Address);
  return publicKey;
}

function ss58ToH160(ss58Address: string) {
  // Decode the SS58 address to a Uint8Array public key
  const publicKey = decodeAddress(ss58Address);

  // Take the first 20 bytes of the hashed public key for the Ethereum address
  const ethereumAddressBytes = publicKey.slice(0, 20);

  // Convert the 20 bytes into an Ethereum H160 address format (Hex string)
  const ethereumAddress =
    "0x" + Buffer.from(ethereumAddressBytes).toString("hex");

  return ethereumAddress;
}

export { convertH160ToSS58, ss58ToH160, publicKeyToHex, ss58ToPublicKey };
