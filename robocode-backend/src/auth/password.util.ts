import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

// Readable temp passwords for admin resets: no ambiguous chars (0/O/1/l/I).
const tempPw = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789", 10);

/** A human-friendly temporary password handed to a user after an admin reset. */
export function generateTempPassword(): string {
  return tempPw();
}

/** How long a reset-issued temporary password remains valid. */
export const TEMP_PASSWORD_TTL_HOURS = 72;

/** Expiry timestamp for a freshly issued temporary password. */
export function tempPasswordExpiry(): Date {
  return new Date(Date.now() + TEMP_PASSWORD_TTL_HOURS * 60 * 60 * 1000);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
