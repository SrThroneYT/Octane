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
});
