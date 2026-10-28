import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/user-profile/UserProfileView.css'), 'utf8');

describe('user profile text (new_extended_profile)', () => {
    it('is regular Ubuntu with a 12 px bold friend status and a bold hidden-profile notice', () => {
        expect(css).toMatch(/\.octane-extended-profile-window :where\(\*\):not\(svg, svg \*\) \{[^}]*HabboAirUbuntu/);
        expect(css).toMatch(/\.octane-extended-profile__status-text \{[^}]*font-size: 12px/);
        expect(css).toMatch(/\.octane-extended-profile__hidden-notice \{[^}]*font-weight: 700/);
    });

    it('scrolls a long group list inside the panel', () => {
        expect(css).toMatch(/\.octane-extended-profile-groups \{[^}]*grid-template-rows: minmax\(0, 1fr\)/);
        expect(css).toMatch(/\.octane-extended-profile-groups__sidebar \{[^}]*min-height: 0/);
        expect(css).toMatch(/\.octane-extended-profile-groups__list \{[^}]*min-height: 0;[^}]*overflow-y: auto/);
    });
});
