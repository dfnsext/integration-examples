import crypto, { BinaryToTextEncoding } from "crypto";

export const stringToUint8 = (data: string): Uint8Array => {
  if (data.length % 2 !== 0)
    throw new Error("hex string length must be a multiple of 2");

  const matches = data.match(/.{1,2}/g);
  if (!matches) throw new Error("string is not hex encoded");

  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};

export const ripemd160FromUint8 = (
  msg: Uint8Array,
  encoding?: BinaryToTextEncoding
): string | Buffer =>
  encoding
    ? crypto.createHash("ripemd160").update(msg).digest(encoding)
    : crypto.createHash("ripemd160").update(msg).digest();

export const sha256FromUint8 = (
  msg: Uint8Array,
  encoding?: BinaryToTextEncoding
): string | Buffer =>
  encoding
    ? crypto.createHash("sha256").update(msg).digest(encoding)
    : crypto.createHash("sha256").update(msg).digest();
