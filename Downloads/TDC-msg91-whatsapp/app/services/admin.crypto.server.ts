import { createHash } from "node:crypto";

// ─── Super Admin Identity ─────────────────────────────────────────────────
// The plaintext identity of the Super Admin is NOT stored here.
const _SA_DIGEST = "559ccb0a09b459f5c59e585c2d7ccc21680503c6ef7289ec088d13485d8a5f20";

function _hashEmail(email: string): string {
  return createHash("sha256").update(email).digest("hex");
}

/** Returns true ONLY if the supplied email belongs to the platform Super Admin. */
export function verifySuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return _hashEmail(email) === _SA_DIGEST;
}
