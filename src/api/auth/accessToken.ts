const STORAGE_KEY = 'nitro.access.token';
const EXPIRES_KEY = 'nitro.access.token.exp';

export const setAccessToken = (token: string | null | undefined, expiresAt?: number | null): void => {
    try {
        if (token && typeof token === 'string') {
            window.localStorage.setItem(STORAGE_KEY, token);
            if (typeof expiresAt === 'number' && expiresAt > 0) window.localStorage.setItem(EXPIRES_KEY, String(expiresAt));
            else window.localStorage.removeItem(EXPIRES_KEY);
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
            window.localStorage.removeItem(EXPIRES_KEY);
        }
    } catch {}
};

export const getAccessToken = (): string => {
    try {
        return window.localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
        return '';
    }
};

export const getAccessTokenExpiresAt = (): number => {
    try {
        const raw = window.localStorage.getItem(EXPIRES_KEY);
        if (!raw) return 0;
        const value = parseInt(raw, 10);
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
};

// The SSO ticket the stored token was issued with, in memory only. A token found in storage at start-up has none:
// it may belong to whoever used this browser last, so a new ticket never trusts it.
let tokenTicket: string | null = null;

export const clearAccessToken = (): void => {
    tokenTicket = null;
    setAccessToken(null);
};

/** Whether the stored token was issued for the session of this SSO ticket. */
export const isAccessTokenFor = (ssoTicket: string): boolean => !!ssoTicket && tokenTicket === ssoTicket && !!getAccessToken();

/**
 * Stores the access token of a login, remember or refresh reply. Pass the SSO ticket of that session when the reply
 * came with one; a refresh keeps the session the token already belonged to.
 */
export const persistAccessTokenFromPayload = (payload: Record<string, unknown> | null | undefined, ssoTicket?: string): void => {
    if (!payload) return;
    const token = typeof payload.accessToken === 'string' ? payload.accessToken : '';
    const expiresAt = typeof payload.accessTokenExpiresAt === 'number' ? payload.accessTokenExpiresAt : null;
    if (!token) return;
    setAccessToken(token, expiresAt);
    if (ssoTicket) tokenTicket = ssoTicket;
};
