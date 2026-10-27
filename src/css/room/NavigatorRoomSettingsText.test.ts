import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/room/NavigatorRoomSettings.css'), 'utf8');

describe('room settings text (ros_room_settings)', () => {
    it('sets the content in regular Ubuntu 12 px with 14 px captions and the AIR delete colour', () => {
        expect(css).toMatch(/\.octane-room-settings \.octane-card-content-shell \{[^}]*font-family: HabboAirUbuntu[^}]*font-size: 12px/);
        expect(css).toMatch(/\.octane-room-settings-caption \{[^}]*font-size: 14px !important/);
        expect(css).toMatch(/\.octane-room-settings-delete \{[^}]*color: #bb2200 !important/);
    });
});
