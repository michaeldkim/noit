// src/lib/gis.ts
declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let loaded: Promise<void> | null = null;
function loadGIS(): Promise<void> {
  if (loaded) return loaded;
  loaded = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => res();
    s.onerror = () => rej(new Error('failed to load GIS'));
    document.head.appendChild(s);
  });
  return loaded;
}

let accessToken: string | null = null;
let tokenExp = 0;

export async function getAccessToken(scopes: string[]): Promise<string> {
  await loadGIS();
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string;
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID missing');

  const now = Math.floor(Date.now() / 1000);
  if (accessToken && now < tokenExp - 60) return accessToken;

  return new Promise<string>((resolve, reject) => {
    const tc = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(' '),
      callback: (resp: any) => {
        if (resp.error) return reject(resp);
        accessToken = resp.access_token;
        tokenExp = now + (resp.expires_in ?? 3600);
        resolve(accessToken!);
      },
    });
    // if we already have a token, try silent; otherwise show consent
    tc.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
}

export function revokeToken() {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExp = 0;
}