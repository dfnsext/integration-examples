import { SigningGroup } from "@dfns/bik";
import { AccountData } from "@cosmjs/amino/build/signer";
import bech32 from "bech32";
import { SignDoc } from "@cosmjs/stargate/build/codec/cosmos/tx/v1beta1/tx";
import { fromHex } from "@cosmjs/encoding";
import { ExtendedSecp256k1Signature } from "@cosmjs/crypto";
import { encodeSecp256k1Signature } from "@cosmjs/amino";
import { DirectSignResponse, makeSignBytes } from "@cosmjs/proto-signing";
import { ripemd160FromUint8, sha256FromUint8, stringToUint8 } from "./utils";

export class CosmosSigner {
  private static addressPrefix = "cosmos";
  private stringPubKey: string;
  constructor(private signingGroup: SigningGroup) {}

  getPubKeyAsString(): string {
    if (!this.stringPubKey) {
      this.stringPubKey = this.getPublicKey().toString('hex');
    }
    return this.stringPubKey;
  }

  getPublicKey(): Buffer {
    return this.signingGroup.getPublicKey();
  }

  pubKeyToAddress(pubKey: Uint8Array): string {
    const hashed = ripemd160FromUint8(sha256FromUint8(pubKey) as Buffer);
    const words = bech32.toWords(hashed as Buffer);
    return bech32.encode(CosmosSigner.addressPrefix, words);
  }

  async getAddress(): Promise<string> {
    const publicKey = this.getPubKeyAsString();
    if (!publicKey) {
      return "";
    }
    return this.pubKeyToAddress(stringToUint8(publicKey));
  }

  _buildTrxHash(signDoc: SignDoc): Buffer {
    return sha256FromUint8(makeSignBytes(signDoc)) as Buffer;
  }

  async signDirect(
    signerAddress: string,
    signDoc: SignDoc
  ): Promise<DirectSignResponse> {
    const pubkey = this.getPubKeyAsString();
    const hashedMessage = this._buildTrxHash(signDoc);
    const signature = await this.signingGroup.sign(Buffer.from(hashedMessage));
    const r = fromHex(signature.r.substring(2));
    const s = fromHex(signature.s.substring(2));
    const sig = new ExtendedSecp256k1Signature(r, s, Number(signature.recid));
    const signatureBytes = new Uint8Array([...sig.r(32), ...sig.s(32)]);

    const stdSignature = encodeSecp256k1Signature(
      fromHex(pubkey),
      signatureBytes
    );

    return {
      signed: signDoc,
      signature: stdSignature,
    };
  }

  async getAccounts(): Promise<readonly AccountData[]> {
    const address = await this.getAddress();
    const pubkey = this.getPubKeyAsString();
    return [
      {
        address,
        algo: "secp256k1",
        pubkey: stringToUint8(pubkey),
      },
    ];
  }
}
