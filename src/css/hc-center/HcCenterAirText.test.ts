import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/hc-center/HcCenterView.css'), 'utf8');
const view = readFileSync(join(process.cwd(), 'src/components/hc-center/HcCenterView.tsx'), 'utf8');

describe('HC center text (hc_center)', () => {
    it('is regular Ubuntu on its own window class', () => {
        expect(view).toContain('octane-hc-center-window');
        expect(view).toContain("import '../../css/hc-center/HcCenterView.css'");
        expect(css).toMatch(/\.octane-hc-center-window :where\(\*\):not\(svg, svg \*\) \{[^}]*HabboAirUbuntu, UbuntuRegular/);
    });

    it('uses the AIR sizes and colours', () => {
        expect(css).toMatch(/\.octane-hc-center__status-title \{[^}]*font-size: 12px;[^}]*font-weight: 700/);
        expect(css).toMatch(/\.octane-hc-center__title \{[^}]*font-size: 16px;[^}]*font-weight: 700/);
        expect(css).toMatch(/\.octane-hc-center__title--blue \{[^}]*color: #4a8eb1/);
        expect(css).toMatch(/\.octane-hc-center__postit-content \{[^}]*color: #683203;[^}]*font-size: 16px;[^}]*font-weight: 400/);
        expect(css).toMatch(/\.octane-hc-center__link--blue \{[^}]*color: #4a8eb1/);
    });
});
