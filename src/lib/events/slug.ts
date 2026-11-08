import { randomInt } from "node:crypto";

// Short, unguessable, URL-safe. No look-alike characters (0/o, 1/l/i), so a
// link read aloud or retyped still works.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateSlug(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
