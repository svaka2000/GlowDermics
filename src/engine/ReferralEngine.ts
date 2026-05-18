/**
 * ReferralEngine — pure, deterministic derivation of a brand-neutral local
 * invite code plus ready-to-share copy for the native share sheet.
 *
 * Fully decoupled — it imports NO other engine or service — and it never
 * mutates inputs, uses device storage, the network, scheduled reminders, any
 * AI call, or any nondeterministic source beyond an optional injected `now`.
 * Same inputs ⇒ same output.
 *
 * The code is a vanity / social-proof string for share copy only — there is
 * no server to redeem it against — so it is derived deterministically from a
 * stable local seed the caller supplies (no persistence, no PII). The caller
 * (a screen) reads counts via the existing read-only storage getters and
 * passes plain numbers in; this only derives strings.
 */

export interface ReferralInput {
  /** Stable local seed (e.g. earliest analysis id, else a constant fallback). */
  seed: string;
  /** Total scans tracked (>=0). */
  scans: number;
  /** Current day streak (>=0). */
  streak: number;
  /** Latest overall score 0-100, or null when unknown. */
  overall: number | null;
}

export interface ReferralResult {
  /** Vanity code, always matches /^VELU-[A-Z2-9]{6}$/. */
  code: string;
  shareTitle: string;
  shareMessage: string;
  inviteUrl: string;
}

/**
 * Unambiguous base32-ish alphabet — excludes O / 0 / I / 1 / L so a spoken or
 * hand-copied code is never misread. Every char is within [A-Z2-9].
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 chars

/**
 * Deterministic 32-bit FNV-1a-style string hash. No crypto, no randomness,
 * no time — same string in ⇒ same unsigned 32-bit out.
 */
function hash32(s: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0; // FNV prime, kept unsigned 32-bit
  }
  return h >>> 0;
}

/**
 * Six independent, well-distributed, fully deterministic characters: each
 * position hashes `${seed}#${i}` so every char varies with the seed and the
 * result is stable across runs.
 */
function encodeCode(seed: string): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    const h = hash32(`${seed}#${i}`);
    out += ALPHABET[h % ALPHABET.length];
  }
  return out;
}

/**
 * Pure derivation. Deterministic; time only via the optional `now` (accepted
 * for signature stability / test injection — never branched on).
 */
export function deriveReferral(input: ReferralInput, now?: number): ReferralResult {
  void now; // accepted for deterministic test injection; no nondeterministic use

  const seed =
    input && typeof input.seed === 'string' && input.seed.length > 0
      ? input.seed
      : 'velumi-guest';
  const scans =
    input && Number.isFinite(input.scans) && input.scans > 0
      ? Math.floor(input.scans)
      : 0;
  const streak =
    input && Number.isFinite(input.streak) && input.streak > 0
      ? Math.floor(input.streak)
      : 0;
  const overall =
    input && typeof input.overall === 'number' && Number.isFinite(input.overall)
      ? Math.round(input.overall)
      : null;

  const code = `VELU-${encodeCode(seed)}`;

  const scansClause = scans > 0 ? `, ${scans} ${scans === 1 ? 'scan' : 'scans'} in` : '';
  const streakClause = streak > 1 ? `, a ${streak}-day streak` : '';
  const overallClause = overall !== null ? ` (skin at ${overall}/100)` : '';

  const shareTitle = 'Join me on Velumi AI';
  const shareMessage =
    `I've been tracking my skin with Velumi AI — clinical-grade analysis` +
    `${scansClause}${streakClause}${overallClause}. ` +
    `Try it free: velumi.ai (my code: ${code})`;

  return {
    code,
    shareTitle,
    shareMessage,
    inviteUrl: 'velumi.ai',
  };
}

export default deriveReferral;
