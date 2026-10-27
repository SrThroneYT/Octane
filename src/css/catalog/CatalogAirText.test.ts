import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('catalogue text', () => {
    it('is set in regular Ubuntu at AIR sizes, after the other catalogue sheets', () => {
        const css = read('src/css/catalog/CatalogAirText.css');
        const index = read('src/index.tsx');
        const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))?.[1] ?? '';

        expect(rule('.octane-catalog-window')).toContain('font-family: HabboAirUbuntu');
        expect(rule('.octane-catalog-window .octane-catalog-navigation-item')).toContain('font-size: 12px');
        expect(rule('.octane-catalog-window .octane-catalog-purchase-selection-prompt')).toContain('font-size: 14px');
        expect(index.indexOf("'./css/catalog/CatalogAirText.css'")).toBeGreaterThan(index.lastIndexOf("'./css/catalog/SpecialItemsDisplay.css'"));
    });
});
