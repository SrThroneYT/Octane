export interface RememberLoginData {
    token?: string;
    expiresAt: number;
    username?: string;
}

const REMEMBER_LOGIN_KEY = 'nitro.auth.remember';
const LEGACY_REMEMBER_LOGIN_KEY = 'nitro.remember.token';
const DEFAULT_REMEMBER_SECONDS = 30 * 24 * 60 * 60;

export const GetRememberLogin = (): RememberLoginData | null => {
    try {
        const data = JSON.parse(window.localStorage.getItem(REMEMBER_LOGIN_KEY) || 'null') as (RememberLoginData & { ssoTicket?: string }) | null;

        if (!data?.token?.length) {
            // An entry with only an SSO ticket, written by older clients, can never log in again.
            if (data) ClearRememberLogin();
            return null;
        }
        if (data.expiresAt && data.expiresAt * 1000 <= Date.now()) {
            ClearRememberLogin();
            return null;
        }

        if (data.ssoTicket !== undefined) {
            // Older clients stored the SSO ticket too: a secret at rest that nothing reads. Drop it.
            const { ssoTicket: _dropped, ...rest } = data;
            SetRememberLogin(rest);
            return rest;
        }

        return data;
    } catch {
        try {
            const legacyToken = window.localStorage.getItem(LEGACY_REMEMBER_LOGIN_KEY) || '';

            if (!legacyToken.length) return null;

            const data: RememberLoginData = {
                token: legacyToken,
                expiresAt: Math.floor(Date.now() / 1000) + DEFAULT_REMEMBER_SECONDS
            };

            SetRememberLogin(data);

            return data;
        } catch {
            return null;
        }
    }
};

export const SetRememberLogin = (data: RememberLoginData): void => {
    if (!data?.token?.length) return;

    try {
        window.localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify(data));
    } catch {}
};

export const ClearRememberLogin = (): void => {
    try {
        window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
        window.localStorage.removeItem(LEGACY_REMEMBER_LOGIN_KEY);
    } catch {}
};

/**
 * Stores the remember token of a login, remember or refresh reply. A reply without one keeps the token already
 * remembered: a backend that only rotates the access token must not cost the user their remembered login.
 */
export const StoreRememberLoginFromPayload = (payload: Record<string, unknown>, username?: string): void => {
    const token = (typeof payload.rememberToken === 'string' ? payload.rememberToken : '') || GetRememberLogin()?.token || '';
    const rawExpiresAt = payload.rememberExpiresAt ?? payload.expiresAt;
    const parsedExpiresAt = typeof rawExpiresAt === 'number' ? rawExpiresAt : Number(rawExpiresAt || 0);
    const expiresAt = Number.isFinite(parsedExpiresAt) && parsedExpiresAt > 0 ? parsedExpiresAt : Math.floor(Date.now() / 1000) + DEFAULT_REMEMBER_SECONDS;

    if (!token.length) return;

    SetRememberLogin({ token, expiresAt, username });
};
