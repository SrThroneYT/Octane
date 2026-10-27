import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(join(process.cwd(), 'src/css/inventory', name), 'utf8');
const rule = (css: string, selector: string) => css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))?.[1] ?? '';

describe('inventory text (AIR inventory layout)', () => {
    it('uses the AIR sizes for the description, the preview names and the wearing title', () => {
        expect(rule(read('InventoryView.css'), '.octane-inventory-furni-desc')).toContain('font-size: 12px');
        expect(rule(read('InventoryAnimals.css'), '.octane-inventory-animal-name')).toContain('font-size: 14px');
        expect(rule(read('InventoryBadges.css'), '.octane-inventory-badges-wearing-title')).toContain('font-size: 14px');
    });
});
