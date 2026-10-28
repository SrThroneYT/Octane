import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(join(process.cwd(), 'src/css/groups', name), 'utf8');

describe('group windows text (groups_info_window, Member Entry)', () => {
    it('use the regular Ubuntu cut, never the condensed `Ubuntu` face', () => {
        for (const name of ['GroupView.css', 'GroupManagement.css', 'GroupForum.css']) {
            expect(read(name)).not.toMatch(/font-family: Ubuntu,/);
        }
    });

    it('draw the members drop menu at 12 px and the page info in black', () => {
        const css = read('GroupView.css');

        expect(css).toMatch(/\.octane-group-members-search \.octane-select-trigger \{[^}]*font-size: 12px !important/);
        expect(css).toMatch(/\.octane-group-members \.octane-groups-footer \.text \{[^}]*color: #000000 !important/);
    });
});
