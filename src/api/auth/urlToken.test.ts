import { describe, expect, it, vi } from 'vitest';
import { takeLoginTokenFromUrl } from './urlToken';

const at = (search: string) =>
{
    const replaceState = vi.fn();

    return { location: { href: `https://hotel.example/client/${ search }` } as Location, history: { state: null, replaceState } as unknown as History, replaceState };
};

describe('takeLoginTokenFromUrl', () =>
{
    it('returns the token and takes it and its expiry out of the address', () =>
    {
        const { location, history, replaceState } = at('?token=abc&token_exp=4102444800&room=7');

        expect(takeLoginTokenFromUrl(location, history)).toEqual({ token: 'abc', expiresAt: 4102444800 });
        expect(replaceState).toHaveBeenCalledWith(null, '', 'https://hotel.example/client/?room=7');
    });

    it('defaults the expiry to thirty days when none is given', () =>
    {
        const { location, history } = at('?token=abc');
        const result = takeLoginTokenFromUrl(location, history);

        expect(result?.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 29 * 24 * 60 * 60);
    });

    it('leaves an address without a token untouched', () =>
    {
        const { location, history, replaceState } = at('?room=7');

        expect(takeLoginTokenFromUrl(location, history)).toBeNull();
        expect(replaceState).not.toHaveBeenCalled();
    });
});
