import { describe, it, expect } from "vitest";
import { generateSecurePin, hashPin, verifyPinHash } from "@/lib/crypto/pin";

describe("PIN Handover Security", () => {
  it("generates 6-digit numeric PIN", () => {
    for (let i = 0; i < 20; i++) {
      const pin = generateSecurePin();
      expect(pin).toMatch(/^\d{6}$/);
      const num = parseInt(pin, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it("hashes PIN deterministically with salt", () => {
    const pin = "123456";
    const hash1 = hashPin(pin);
    const hash2 = hashPin(pin);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(pin);
  });

  it("verifies matching PIN successfully", () => {
    const pin = "789123";
    const hash = hashPin(pin);
    expect(verifyPinHash(pin, hash)).toBe(true);
  });

  it("rejects wrong or non-6-digit PINs", () => {
    const pin = "789123";
    const hash = hashPin(pin);
    expect(verifyPinHash("789124", hash)).toBe(false);
    expect(verifyPinHash("123", hash)).toBe(false);
    expect(verifyPinHash("abcdef", hash)).toBe(false);
    expect(verifyPinHash("", hash)).toBe(false);
  });
});
