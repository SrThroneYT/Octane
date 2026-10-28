import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/quests/RewardTrackView.css'), 'utf8');
const dialogCss = readFileSync(join(process.cwd(), 'src/css/quests/QuestsView.css'), 'utf8');

describe('reward track text (reward_track_main_xml, premium purchase confirmation)', () => {
    it('is regular Ubuntu, not the condensed `Ubuntu` face', () => {
        expect(css).toMatch(/@layer base \{\s*\.octane-reward-track :where\(\*\):not\(svg, svg \*\) \{[^}]*HabboAirUbuntu[^}]*!important/);
    });

    it('keeps the layout text sizes: title 18 bold, points 22 bold, task info name 17 bold, unclaimed count 11 bold', () => {
        expect(css).toMatch(/\.octane-reward-track-title \{[^}]*font-size: 18px;[^}]*font-weight: bold/);
        expect(css).toMatch(/\.octane-reward-track-points-value \{[^}]*font-size: 22px;[^}]*font-weight: bold/);
        expect(css).toMatch(/\.octane-reward-track-task-info-name \{[^}]*font-size: 17px;[^}]*font-weight: bold/);
        expect(css).toMatch(/\.octane-reward-track-unclaimed \{[^}]*color: #fff;[^}]*font-size: 11px;[^}]*font-weight: bold/);
    });

    it('colours the premium confirmation texts like the layout', () => {
        expect(dialogCss).toMatch(/\.octane-reward-track-premium-title \{[^}]*color: #5d2c82;[^}]*font-size: 14px/);
        expect(dialogCss).toMatch(/\.octane-reward-track-premium-info \{[^}]*color: #4d3559;[^}]*font-size: 11px/);
        expect(dialogCss).toMatch(/\.octane-reward-track-premium-desc \{[^}]*color: #2d1f35;[^}]*font-size: 12px;[^}]*font-weight: 700/);
        expect(dialogCss).toMatch(/\.octane-reward-track-premium-benefit \{[^}]*font-size: 11px/);
    });
});
