import { z } from "zod";

/** 32 random bytes, base64url. Host links and Performer links use the same shape. */
export const LINK_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const linkTokenSchema = z.string().regex(LINK_TOKEN_PATTERN);

export const NAME_MAX_LENGTH = 120;

/** Gig name, Performer name, and Track name share these rules. */
export const nameSchema = z.string().trim().min(1, "Enter a name.").max(NAME_MAX_LENGTH);

export function isLinkToken(value: string): boolean {
  return LINK_TOKEN_PATTERN.test(value);
}

/** Case and outer spaces don't make a name different. The database indexes use the same rule. */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
