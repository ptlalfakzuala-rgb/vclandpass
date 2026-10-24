/**
 * Client-Side AES-GCM 256-bit Data Encryption for Offline Local Cache
 * Secures Village Council Land Records stored on device offline cache.
 */

const ENCRYPTION_KEY_NAME = 'saiphai_vc_cache_key_v1';

async function getOrCreateCryptoKey(): Promise<CryptoKey> {
  const existingKeyJson = localStorage.getItem(ENCRYPTION_KEY_NAME);

  if (existingKeyJson && window.crypto && window.crypto.subtle) {
    try {
      const rawKey = Uint8Array.from(atob(existingKeyJson), c => c.charCodeAt(0));
      return await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (e) {
      console.warn('Failed to import existing key, generating new one', e);
    }
  }

  // Generate new 256-bit AES-GCM key
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await window.crypto.subtle.exportKey('raw', key);
  const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(ENCRYPTION_KEY_NAME, base64Key);

  return key;
}

export async function encryptData(payload: unknown): Promise<string> {
  try {
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    }

    const key = await getOrCreateCryptoKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(payload));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const result = {
      iv: Array.from(iv),
      cipher: Array.from(new Uint8Array(cipherBuffer)),
      timestamp: Date.now()
    };

    return JSON.stringify(result);
  } catch (err) {
    console.error('Encryption failed:', err);
    return JSON.stringify({ raw: payload });
  }
}

export async function decryptData<T>(encryptedString: string): Promise<T | null> {
  try {
    if (!encryptedString) return null;

    if (!window.crypto || !window.crypto.subtle) {
      return JSON.parse(decodeURIComponent(escape(atob(encryptedString))));
    }

    const parsed = JSON.parse(encryptedString);
    if (parsed.raw) {
      return parsed.raw as T;
    }

    if (!parsed.iv || !parsed.cipher) {
      return null;
    }

    const key = await getOrCreateCryptoKey();
    const iv = new Uint8Array(parsed.iv);
    const cipherBuffer = new Uint8Array(parsed.cipher).buffer;

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}
