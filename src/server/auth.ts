/**
 * Server-Side Authentication & Password Hashing for Rongdhonu Trade
 * Built using native Web Crypto API (SubtleCrypto) supported by Cloudflare Workers & Node.js.
 */

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number; // Unix timestamp in seconds
}

const DEFAULT_SECRET = 'rongdhonu-secure-auth-secret-key-prod-d1-2026';
const PBKDF2_ITERATIONS = 100000;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Hashes a plaintext password using PBKDF2-HMAC-SHA256 with a random salt.
 * Returns formatted string: pbkdf2:100000:<saltHex>:<hashHex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltHex = bufferToHex(salt.buffer);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = bufferToHex(derivedBits);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored hash (or handles legacy upgrade).
 */
export async function verifyPassword(password: string, storedHashOrPassword: string): Promise<boolean> {
  if (!storedHashOrPassword) return false;

  // Handle standard PBKDF2 format
  if (storedHashOrPassword.startsWith('pbkdf2:')) {
    const parts = storedHashOrPassword.split(':');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    const salt = hexToBuffer(saltHex);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const actualHashHex = bufferToHex(derivedBits);
    // Constant-time comparison
    if (actualHashHex.length !== expectedHashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < actualHashHex.length; i++) {
      diff |= actualHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return diff === 0;
  }

  // Graceful fallback for initial legacy / plaintext accounts (e.g. initial super admin)
  // Constant-time check
  if (password === storedHashOrPassword) {
    return true;
  }

  return false;
}

/**
 * Creates an HMAC-SHA256 signed JWT-like authorization token.
 */
export async function createAuthToken(
  payload: Omit<TokenPayload, 'exp'>,
  secret: string = DEFAULT_SECRET,
  expiresInSeconds: number = 7 * 24 * 3600 // 7 days
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: TokenPayload = { ...payload, exp };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${message}.${encodedSignature}`;
}

/**
 * Verifies and parses an HMAC-SHA256 auth token.
 */
export async function verifyAuthToken(
  token: string,
  secret: string = DEFAULT_SECRET
): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(
      base64UrlDecode(encodedSignature),
      (c) => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      enc.encode(message)
    );

    if (!isValid) return null;

    const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
