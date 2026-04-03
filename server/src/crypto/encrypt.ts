import sodium from 'libsodium-wrappers';
import dotenv from 'dotenv';

dotenv.config();

let initialized = false;

async function init(): Promise<void> {
  if (!initialized) {
    await sodium.ready;
    initialized = true;
  }
}

function getKey(): Uint8Array {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error('Missing ENCRYPTION_KEY environment variable');
  return sodium.from_hex(keyHex);
}

export async function encrypt(plaintext: string): Promise<string> {
  await init();
  const key = getKey();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(
    sodium.from_string(plaintext),
    nonce,
    key
  );

  // Store as nonce + ciphertext, hex-encoded
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);
  return sodium.to_hex(combined);
}

export async function decrypt(encrypted: string): Promise<string> {
  await init();
  const key = getKey();
  const combined = sodium.from_hex(encrypted);
  const nonceLength = sodium.crypto_secretbox_NONCEBYTES;
  const nonce = combined.slice(0, nonceLength);
  const ciphertext = combined.slice(nonceLength);

  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return sodium.to_string(decrypted);
}

export async function generateKey(): Promise<string> {
  await init();
  const key = sodium.crypto_secretbox_keygen();
  return sodium.to_hex(key);
}
