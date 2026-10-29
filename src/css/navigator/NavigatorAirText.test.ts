import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/navigator/NavigatorView.css'), 'utf8');
const rule = (selector: string) => css.match(new RegExp(`(?:^|\\}|\\*/)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))?.[1] ?? '';

describe('navigator text (navigator_frame_2, room_info_popup_bubble, property, tag)', () => {
    it('uses the AIR text styles', () => {
        expect(rule('.octane-navigator-air__search-input')).toContain('font-size: 12px');
        expect(rule('.octane-navigator-air__usercount')).toContain('font-size: 12px');
        expect(rule('.octane-navigator-air__tile-name')).toContain('font-weight: 400');
        expect(rule('.octane-navigator-air__room-popover-description')).toContain('font-size: 12px');
        expect(rule('.octane-navigator-air__room-popover-actions button')).toContain('font-size: 12px');
        expect(rule('.octane-navigator-air__tag')).toContain('background: #f1a700');
        expect(rule('.octane-navigator-air__tag')).toContain('font-size: 10px');
        expect(rule('.octane-navigator-air__room-popover-event-name')).toContain('font-weight: 700');
    });

    it('lets a long property value wrap without running into the next row', () => {
        const properties = rule('.octane-navigator-air__room-popover-properties');

        expect(properties).toContain('grid-template-columns: 70px minmax(0, 1fr)');
        expect(properties).toContain('grid-auto-rows: minmax(20px, auto)');
    });

    it('draws the doorbell and password windows in black regular Ubuntu with grey shiny buttons', () => {
        const view = readFileSync(join(process.cwd(), 'src/components/navigator/views/NavigatorDoorStateView.tsx'), 'utf8');

        expect(rule('.octane-navigator-doorbell .octane-navigator-air__door-state')).toContain('color: #000000');
        expect(css).toMatch(/\.octane-navigator-air__door-state \.habbo-btn-secondary \{[^}]*border-image-source: var\(--habbo-skin-shiny\) !important;[^}]*font-weight: 400 !important/);
        expect(view).not.toMatch(/variant="(success|danger)"/);
    });
});
