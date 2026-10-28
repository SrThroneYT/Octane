import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/quests/QuestsView.css'), 'utf8');

describe('daily tasks text (dailytasks, dailytasks_unclaimed)', () => {
    it('is regular Ubuntu, not the condensed `Ubuntu` face', () => {
        expect(css).toMatch(/:where\([^)]*\.octane-daily-tasks[^)]*\) :where\(\*\):not\(svg, svg \*\) \{[^}]*HabboAirUbuntu[^}]*!important/);
    });

    it('draws task_title_txt 13 bold white, the completion 12 bold 0x24850b and the reward amount 11 bold white', () => {
        expect(css).toMatch(/\.octane-daily-task-title \{[^}]*color: #fff;[^}]*font-weight: bold;[^}]*font-size: 13px/);
        expect(css).toMatch(/\.octane-daily-task-complete \{[^}]*color: #24850b;[^}]*font-weight: bold;[^}]*font-size: 12px/);
        expect(css).toMatch(/\.octane-daily-task-reward-amount \{[^}]*color: #fff;[^}]*font-size: 11px;[^}]*font-weight: bold/);
    });

    it('draws the progress text 12 bold and the unclaimed button 12 regular', () => {
        expect(css).toMatch(/\.octane-daily-task-progress \{[^}]*font-size: 12px;[^}]*font-weight: 700/);
        expect(css).toMatch(/\.octane-daily-tasks \.octane-daily-tasks-unclaimed-button,[^{]*\{\s*font-size: 12px !important;\s*font-weight: 400 !important;/);
    });
});
