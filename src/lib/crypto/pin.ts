import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric PIN.
 */
export function generateSecurePin(): string {
  const pinNumber = crypto.randomInt(100000, 1000000);
  return pinNumber.toString();
}

/**
 * Hashes a PIN using SHA-256 with an application salt.
 */
export function hashPin(pin: string, salt: string = "sirkula-reflow-pin-salt"): string {
  return crypto
    .createHash("sha256")
    .update(`${salt}:${pin.trim()}`)
    .digest("hex");
}

/**
 * Securely verifies entered PIN against stored hash using constant-time comparison.
 */
export function verifyPinHash(
  enteredPin: string,
  storedHash: string,
  salt: string = "sirkula-reflow-pin-salt"
): boolean {
  if (!/^\d{6}$/.test(enteredPin.trim())) {
    return false;
  }

  const computedHash = hashPin(enteredPin, salt);
  const bufA = Buffer.from(computedHash, "utf8");
  const bufB = Buffer.from(storedHash, "utf8");

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
