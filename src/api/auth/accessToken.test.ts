import { beforeEach, describe, expect, it } from 'vitest';
import { clearAccessToken, getAccessToken, getAccessTokenExpiresAt, setAccessToken } from './accessToken';

describe('accessToken', () =>
{
    beforeEach(() => window.localStorage.clear());

    it('forgets the token and its expiry when it is cleared', () =>
    {
        setAccessToken('token-of-the-first-user', 4102444800);

        expect(getAccessToken()).toBe('token-of-the-first-user');

        clearAccessToken();

        expect(getAccessToken()).toBe('');
        expect(getAccessTokenExpiresAt()).toBe(0);
    });
});
