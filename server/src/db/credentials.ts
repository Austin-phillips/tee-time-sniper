import { supabaseAdmin } from './client';
import { encrypt, decrypt } from '../crypto/encrypt';

interface PlatformCredential {
  platform: string;
  email: string;
  password: string;
}

export async function getCredentials(userId: string, platform: string): Promise<PlatformCredential | null> {
  const { data, error } = await supabaseAdmin
    .from('platform_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();

  if (error || !data) return null;

  return {
    platform: data.platform,
    email: data.email,
    password: await decrypt(data.encrypted_password),
  };
}

export async function storeCredentials(
  userId: string,
  platform: string,
  email: string,
  password: string
): Promise<void> {
  const encryptedPassword = await encrypt(password);

  const { error } = await supabaseAdmin
    .from('platform_credentials')
    .upsert({
      user_id: userId,
      platform,
      email,
      encrypted_password: encryptedPassword,
    }, {
      onConflict: 'user_id,platform',
    });

  if (error) throw new Error(`Failed to store credentials: ${error.message}`);
}
