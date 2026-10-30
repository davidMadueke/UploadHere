import { createHash, randomBytes } from "node:crypto";

export function newLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Host links are stored only as this hash. Losing the Host link loses the Gig. */
export function hashLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
