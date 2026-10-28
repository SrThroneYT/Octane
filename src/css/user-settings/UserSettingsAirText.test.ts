import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/user-settings/UserSettingsView.css'), 'utf8');

describe('user settings text (memenu settings / sound / chat / other settings)', () => {
    it('is regular Ubuntu everywhere, never the condensed `Ubuntu` face', () => {
        expect(css).not.toMatch(/UbuntuRegular, Ubuntu,/);
        expect(css).toMatch(/\.user-settings-window :where\(\*\):not\(svg, svg \*\) \{[^}]*HabboAirUbuntu, UbuntuRegular/);
    });

    it('draws titles, labels and buttons as u_regular 12 px white', () => {
        expect(css).toMatch(/\.air-settings-window__title \{[^}]*color: #ffffff;[^}]*font: 400 12px\/17px HabboAirUbuntu/);
        expect(css).toMatch(/\.air-settings-volume-row__label \{[^}]*color: #ffffff;[^}]*font: 400 12px\/18px HabboAirUbuntu/);
        expect(css).toMatch(/\.air-settings-button \{[^}]*font: 400 12px\/16px HabboAirUbuntu/);
    });
});

describe('account settings text (Octane extra, AIR conventions)', () => {
    it('is regular Ubuntu at 12 px with a 14 px bold name and 10 px fine print', () => {
        expect(css).toMatch(/\.user-account-settings-window :where\(\*\):not\(svg, svg \*\) \{[^}]*HabboAirUbuntu, UbuntuRegular/);
        expect(css).toMatch(/\.user-account-settings__content :where\(\*\):not\([^)]*\) \{[^}]*font-size: 12px !important/);
        expect(css).toMatch(/\.user-account-settings__name \{[^}]*font-size: 14px !important;[^}]*font-weight: 700/);
        expect(css).toMatch(/\.user-account-settings__fine-print \{[^}]*font-size: 10px !important/);
        expect(css).toMatch(/\.user-account-settings__content button \{[^}]*font-weight: 400 !important/);
    });
});
