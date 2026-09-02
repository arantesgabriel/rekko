import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { AesGcmEncryptionService } from "./encryption";

const key = randomBytes(32).toString("base64");

describe("AesGcmEncryptionService", () => {
  it("round-trips a secret", () => {
    const service = new AesGcmEncryptionService(key, 1);
    expect(service.decrypt(service.encrypt("linear-token"))).toBe(
      "linear-token",
    );
  });

  it("uses a unique nonce and ciphertext", () => {
    const service = new AesGcmEncryptionService(key, 1);
    const first = service.encrypt("same");
    const second = service.encrypt("same");
    expect(first.nonce).not.toBe(second.nonce);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("fails with the wrong key", () => {
    const encrypted = new AesGcmEncryptionService(key, 1).encrypt("secret");
    const wrong = new AesGcmEncryptionService(
      randomBytes(32).toString("base64"),
      1,
    );
    expect(() => wrong.decrypt(encrypted)).toThrow();
  });

  it("fails with a modified auth tag", () => {
    const service = new AesGcmEncryptionService(key, 1);
    const encrypted = service.encrypt("secret");
    expect(() =>
      service.decrypt({
        ...encrypted,
        authTag: Buffer.alloc(16).toString("base64"),
      }),
    ).toThrow();
  });
});
