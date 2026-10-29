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

    it('keeps the AIR button skins: green only for buy / recycle, grey for gift, redeem, guild and the VIP stub', () => {
        const css = read('src/css/catalog/CatalogAirText.css');
        const vip = read('src/css/catalog/CatalogVipBuyView.css');
        const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))?.[1] ?? '';

        expect(rule('.octane-catalog-window .octane-catalog-standard-buy-button')).toContain('font-size: 12px !important');
        expect(rule('.octane-catalog-window .octane-catalog-standard-gift-button')).toContain('color: #000000 !important');
        expect(rule('.octane-catalog-window .octane-catalog-standard-gift-button')).toContain('font-weight: 400 !important');
        expect(rule('.octane-catalog-window .octane-catalog-club-upgrade-button')).toContain('var(--habbo-skin-shiny-thick)');
        expect(rule('.octane-catalog-window .octane-catalog-air-recycler .octane-catalog-air-recycler__recycle')).toContain('var(--habbo-skin-shiny-green)');
        expect(rule('.octane-catalog-window .octane-catalog-sound-listen-button')).toContain('var(--habbo-skin-shiny)');
        expect(css).toMatch(
            /@layer base \{[^@]*:where\(\.octane-catalog-redeem-button, \.octane-catalog-air-info__guild-buy, \.octane-catalog-guild-join-btn\)\.habbo-btn-primary \{[^}]*border-image-source: var\(--habbo-skin-shiny\) !important;[^}]*color: #000000 !important/
        );
        expect(vip).toMatch(/\.octane-catalog-club-gift__select \{[^}]*color: #000;/);
        expect(read('src/components/catalog/views/page/widgets/CatalogClubUpgradeButton.tsx')).not.toContain('octane-catalog-standard-buy-button');
        expect(read('src/components/catalog/views/page/common/CatalogRedeemVoucherView.tsx')).not.toContain('variant="primary"');
    });
});
