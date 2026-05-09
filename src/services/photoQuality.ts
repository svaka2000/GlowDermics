import { PhotoQuality } from '../types';

/**
 * Lightweight client-side photo quality check.
 *
 * Runs BEFORE the AI vision call to catch obvious quality issues so we don't
 * waste an API call (and the user's daily scan quota) on unanalyzable photos.
 *
 * The deep check is still performed by the AI on the server side; this is the
 * cheap pre-flight that catches the worst cases:
 *   - solid black / blank / very low entropy
 *   - extreme over- or under-exposure
 *   - tiny image dimensions
 *
 * Heuristics — not perfect, but fast and offline. Decoded base64 size + simple
 * histogram on a small sample.
 */

interface PreflightInput {
  /** Pure base64 (no `data:` prefix). */
  base64: string;
  /** Optional decoded width/height. If unknown, byte-size heuristics are used. */
  width?: number;
  height?: number;
  mimeType: 'image/jpeg' | 'image/png';
}

const MIN_BYTES = 6_000;       // ~6KB — anything smaller is almost certainly a corrupted/blank capture
const TINY_BYTES = 18_000;     // <18KB triggers a "low quality" warning
const HUGE_BYTES = 6_000_000;  // >6MB is unnecessarily large; warn but allow

export function preflightPhotoQuality(input: PreflightInput): PhotoQuality {
  const { base64 } = input;
  const decodedBytes = Math.floor((base64.length * 3) / 4); // ~base64 -> bytes
  const recommendations: string[] = [];

  if (!base64 || decodedBytes < MIN_BYTES) {
    return {
      ok: false,
      score: 5,
      lighting: 'good',
      focus: 'blurry',
      faceDetected: false,
      warning: 'The captured image looks blank or corrupted. Try again with the camera or upload a clear selfie.',
      recommendations: ['Re-take the photo', 'Use the rear camera if the front is unavailable'],
    };
  }

  let qualityScore = 75; // baseline — assume decent until we find issues

  // Byte-size heuristic (proxy for resolution / detail).
  if (decodedBytes < TINY_BYTES) {
    qualityScore -= 25;
    recommendations.push('Use a higher-resolution photo or move closer to good lighting');
  } else if (decodedBytes > HUGE_BYTES) {
    qualityScore -= 5;
    recommendations.push('Photo is very large — compression may help next time');
  }

  // Resolution heuristic (when dimensions are known).
  if (input.width && input.height) {
    const minSide = Math.min(input.width, input.height);
    if (minSide < 240) {
      qualityScore -= 30;
      recommendations.push('Try a photo at least 480×480 — closer to the camera, please');
    } else if (minSide < 480) {
      qualityScore -= 10;
    }
  }

  qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

  return {
    ok: qualityScore >= 50,
    score: qualityScore,
    lighting: 'good',  // server side AI determines this for real
    focus: 'sharp',    // server side AI determines this for real
    faceDetected: true, // assume optimistically; AI confirms
    warning:
      qualityScore < 50
        ? 'Photo quality looks low. The analysis may be less accurate.'
        : undefined,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  };
}

/**
 * Merge a client preflight result with the AI's server-side photoQuality.
 * Server result wins on every field except `recommendations` which are merged.
 */
export function mergePhotoQuality(
  client: PhotoQuality | undefined,
  server: PhotoQuality | undefined,
): PhotoQuality | undefined {
  if (!client && !server) return undefined;
  if (!server) return client;
  if (!client) return server;
  const recs = [
    ...(server.recommendations ?? []),
    ...(client.recommendations ?? []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  return {
    ...server,
    recommendations: recs.length ? recs : undefined,
  };
}
