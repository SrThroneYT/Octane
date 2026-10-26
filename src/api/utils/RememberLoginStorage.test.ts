/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { GetRememberLogin, SetRememberLogin, StoreRememberLoginFromPayload } from './RememberLogin';

const KEY = 'nitro.auth.remember';
const stored = () => JSON.parse(window.localStorage.getItem(KEY) || 'null');

describe('remembered login storage', () => {
    beforeEach(() => window.localStorage.clear());

    it('never stores the SSO ticket of the session', () => {
        StoreRememberLoginFromPayload({ rememberToken: 'remember-1', rememberExpiresAt: 4102444800, ssoTicket: 'ticket-1' }, 'alice');

        expect(stored()).toEqual({ token: 'remember-1', expiresAt: 4102444800, username: 'alice' });
    });

    it('keeps the remembered token when a reply comes without one', () => {
        SetRememberLogin({ token: 'remember-1', expiresAt: 4102444800, username: 'alice' });

        StoreRememberLoginFromPayload({ accessToken: 'access-2', rememberExpiresAt: 4102444900 }, 'alice');

        expect(stored()).toEqual({ token: 'remember-1', expiresAt: 4102444900, username: 'alice' });
    });

    it('drops the SSO ticket an older client left in storage', () => {
        window.localStorage.setItem(KEY, JSON.stringify({ token: 'remember-1', ssoTicket: 'old-ticket', expiresAt: 4102444800 }));

        expect(GetRememberLogin()).toEqual({ token: 'remember-1', expiresAt: 4102444800 });
        expect(stored()).toEqual({ token: 'remember-1', expiresAt: 4102444800 });
    });

    it('forgets an entry that holds only an SSO ticket, which can never log in', () => {
        window.localStorage.setItem(KEY, JSON.stringify({ ssoTicket: 'old-ticket', expiresAt: 4102444800 }));

        expect(GetRememberLogin()).toBeNull();
        expect(stored()).toBeNull();
    });
});
