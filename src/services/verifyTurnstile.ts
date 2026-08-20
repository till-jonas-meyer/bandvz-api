import 'dotenv/config';

if (!process.env.TURNSTILE_VERIFY_URL) {
  console.error('TURNSTILE_VERIFY_URL not set.');
}

export interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
}

export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<TurnstileResponse> {
  const response = await fetch(
    process.env.TURNSTILE_VERIFY_URL!,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Turnstile verification failed');
  }

  return response.json() as Promise<TurnstileResponse>;
}
