import { describe, expect, it } from "vitest";

import {
  mapAuthApiError,
  validateAuthEmail,
  validateAuthName,
  validateAuthPassword,
} from "./auth-form-validation";

describe("auth form validation", () => {
  it("requires a name", () => {
    expect(validateAuthName("   ")).toBe("Informe seu nome.");
    expect(validateAuthName("Ana")).toBe("");
  });

  it("validates email only after a complete value", () => {
    expect(validateAuthEmail("")).toBe("Informe seu email.");
    expect(validateAuthEmail("ana")).toBe("Informe um email válido.");
    expect(validateAuthEmail("ana@rekko.com")).toBe("");
  });

  it("enforces the same 8-character password rule as signup", () => {
    expect(validateAuthPassword("short")).toBe(
      "A senha deve ter pelo menos 8 caracteres.",
    );
    expect(validateAuthPassword("12345678")).toBe("");
  });

  it("maps credential and existing-account errors without leaking internals", () => {
    expect(mapAuthApiError({ kind: "CREDENTIALS" })).toBe(
      "Email ou senha incorretos.",
    );
    expect(mapAuthApiError({ code: "USER_ALREADY_EXISTS" })).toBe("EXISTS");
    expect(mapAuthApiError({ status: 429 })).toContain("Muitas tentativas");
  });
});
