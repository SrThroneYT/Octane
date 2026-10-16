import { describe, expect, it } from 'vitest';
import { parsePhotoData } from './useFurnitureExternalImageWidget';

describe('parsePhotoData', () => {
    it('reads a photo item', () => {
        expect(parsePhotoData('{"w":"https://cdn/1_2.png","s":7,"u":3}')).toEqual({ w: 'https://cdn/1_2.png', s: 7, u: 3 });
    });

    it('skips broken items instead of throwing', () => {
        expect(parsePhotoData('{broken')).toBeNull();
        expect(parsePhotoData('')).toBeNull();
        expect(parsePhotoData('42')).toBeNull();
    });
});
