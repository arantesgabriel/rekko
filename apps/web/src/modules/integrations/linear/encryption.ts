import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedSecret = {
  authTag: string;
  ciphertext: string;
  keyVersion: number;
  nonce: string;
};

export interface EncryptionService {
  decrypt(secret: EncryptedSecret): string;
  encrypt(plaintext: string): EncryptedSecret;
}

export class AesGcmEncryptionService implements EncryptionService {
  readonly #key: Buffer;

  constructor(
    key: string,
    readonly keyVersion: number,
  ) {
    this.#key = Buffer.from(key, "base64");
    if (this.#key.length !== 32)
      throw new Error("REKKO_ENCRYPTION_KEY_V1 must decode to 32 bytes");
  }

  encrypt(plaintext: string): EncryptedSecret {
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.#key, nonce);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);
    return {
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
      keyVersion: this.keyVersion,
      nonce: nonce.toString("base64"),
    };
  }

  decrypt(secret: EncryptedSecret): string {
    if (secret.keyVersion !== this.keyVersion)
      throw new Error("Unsupported encryption key version");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.#key,
      Buffer.from(secret.nonce, "base64"),
    );
    decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}
