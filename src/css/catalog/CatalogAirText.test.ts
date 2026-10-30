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

    it('draws the remaining grey buttons with the shiny skin, never the flat 3 px button_default picture', () => {
        const view = read('src/css/catalog/CatalogView.css');
        const vip = read('src/css/catalog/CatalogVipBuyView.css');

        expect(view).toMatch(
            /\.octane-catalog-window \.octane-catalog-standard-button \{[^}]*border-image-source: var\(--habbo-skin-shiny\) !important;[^}]*color: #000000 !important;[^}]*font-size: 12px !important;\s*font-weight: 400 !important/
        );
        expect(view).toMatch(/\.octane-catalog-air-trophies__model \{[^}]*border-image-source: var\(--habbo-skin-shiny\);/);
        expect(vip).toMatch(/\.octane-club-offer\.is-compact \.octane-club-offer-action \{[^}]*border-image-source: var\(--habbo-skin-shiny\) !important/);
        expect(vip).toMatch(/\.octane-catalog-club-gift__select:disabled \{\s*border-image-source: var\(--habbo-skin-shiny-disabled\)/);
        expect(vip).not.toContain('var(--habbo-skin-button');
    });

    it('draws the special items claim_btn (style 4) dark and the builder place buttons tinted as AIR', () => {
        const special = read('src/css/catalog/SpecialItemsDisplay.css');
        const builders = read('src/css/catalog/BuildersBlocks.css');

        expect(special).toMatch(
            /\.octane-special-items-claim-button \{[^}]*border-image-source: var\(--habbo-skin-shiny-black\);[^}]*color: #ffffff;[^}]*font-size: 12px;[^}]*font-weight: 400/
        );
        expect(special).toMatch(/\.octane-special-items-claim-button:hover:not\(:disabled\) \{\s*border-image-source: var\(--habbo-skin-shiny-black-hover\)/);
        expect(special).not.toContain('var(--habbo-skin-button');
        expect(builders).toMatch(/\.octane-builders-place-button\.is-one \{\s*border-image-source: var\(--habbo-skin-shiny-thick-tint-dda100\);/);
        expect(builders).toMatch(/\.octane-builders-place-button\.is-many \{\s*border-image-source: var\(--habbo-skin-shiny-thick-tint-0a9bc5\);/);
        expect(builders).not.toMatch(/\.octane-builders-place-button[^{]*\{[^}]*linear-gradient/);
    });

    it('tints the targeted offer btn_buy 0x4faf4f as AIR', () => {
        const css = read('src/css/catalog/CatalogAirText.css');
        expect(read('src/components/catalog/views/targeted-offer/OfferWindowView.tsx')).toContain('octane-targeted-offer__buy');
        expect(css).toMatch(
            /\.octane-targeted-offer \.octane-targeted-offer__buy\.habbo-btn-primary \{\s*border-image-source: var\(--habbo-skin-shiny-thick-tint-4faf4f\) !important;\s*color: #ffffff !important;/
        );
        expect(css).toMatch(
            /\.octane-targeted-offer__buy\.habbo-btn-primary:hover \{\s*border-image-source: var\(--habbo-skin-shiny-thick-tint-4faf4f-hover\)/
        );
    });
});
