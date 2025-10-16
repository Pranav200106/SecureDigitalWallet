// Utility to robustly parse QR payloads that may be raw JSON, URL-encoded JSON,
// base64-encoded JSON, or a URL with a data param. It returns the parsed object or throws.

export function parseQRData(input) {
  // Normalize to string
  if (typeof input !== 'string') {
    input = input?.text ?? input?.data ?? String(input ?? '');
  }

  // Try URL: extract common query param names
  try {
    const url = new URL(input);
    const payload =
      url.searchParams.get('data') ||
      url.searchParams.get('payload') ||
      url.searchParams.get('q') ||
      url.searchParams.get('p');
    if (payload) {
      // decode '+' and percent sequences
      const decoded = decodeURIComponent(payload.replace(/\+/g, '%20'));
      try {
        return JSON.parse(decoded);
      } catch (e) {
        // If not JSON, continue to other strategies with decoded text
        input = decoded;
      }
    } else {
      // It's a URL but without payload param: fall through to try whole string
    }
  } catch (_) {
    // Not a URL, continue
  }

  // 1) Try plain JSON
  try {
    return JSON.parse(input);
  } catch (_) {}

  // 2) Try URL-decoding then JSON
  try {
    const decoded = decodeURIComponent(input.replace(/\+/g, '%20'));
    return JSON.parse(decoded);
  } catch (_) {}

  // 3) Try base64 -> JSON
  try {
    const text =
      typeof atob === 'function'
        ? atob(input)
        : Buffer.from(input, 'base64').toString('utf8');
    return JSON.parse(text);
  } catch (_) {}

  throw new Error('Unable to parse QR data as JSON');
}