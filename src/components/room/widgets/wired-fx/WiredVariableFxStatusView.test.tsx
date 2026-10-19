import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WIRED_FX_CATEGORY, WIRED_FX_RENDERER, WIRED_FX_SHOW_MODE } from '../../../../api';
import { WiredVariableFxStatusView } from './WiredVariableFxStatusView';

const config = (overrides: Record<string, unknown> = {}) => ({
    configId: 7,
    userFx: true,
    showMode: WIRED_FX_SHOW_MODE.ALWAYS,
    updateMask: 0,
    showOnMouseHover: false,
    showDurationMs: 3000,
    category: WIRED_FX_CATEGORY.PROGRESS_BAR,
    styleId: 0,
    colorId: -1,
    widthId: 2,
    rendererId: WIRED_FX_RENDERER.PLAIN,
    defaultMinValue: 0,
    defaultMaxValue: 100,
    extra: {} as Record<string, string>,
    ...overrides
});

const entry = (value: number, overrides: Record<string, unknown> = {}, shownAt: number | null = null) => ({
    key: '7|user:20|u|100',
    status: { configId: 7, variableId: 'user:20', initialize: false, userEntity: true, entityId: 100, value, overrideMinValue: null, overrideMaxValue: null, extra: {} as Record<string, string>, ...overrides },
    createdAt: 0,
    shownAt,
    previousValue: null as number | null
});

describe('WiredVariableFxStatusView', () => {
    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('draws a plain bar at the value fraction of the range', () => {
        render(<WiredVariableFxStatusView config={config()} entry={entry(25)} />);

        const fill = screen.getByTestId('fx-bar').firstElementChild as HTMLElement;
        expect(fill.style.width).toBe('25%');
    });

    it('draws segments when the config carries a count', () => {
        render(<WiredVariableFxStatusView config={config({ rendererId: WIRED_FX_RENDERER.BLOCK, extra: { segments: '4' } })} entry={entry(50)} />);

        expect(screen.getByTestId('fx-bar').children).toHaveLength(4);
    });

    it('draws stacked hearts, one heart and a health bar for the health styles, and a level badge for the level style', () => {
        let view = render(<WiredVariableFxStatusView config={config({ category: WIRED_FX_CATEGORY.HEALTH_POINTS, rendererId: WIRED_FX_RENDERER.STACKED_HEARTS })} entry={entry(50)} />);
        expect(screen.getByTestId('fx-status').children).toHaveLength(5);
        view.unmount();

        view = render(<WiredVariableFxStatusView config={config({ category: WIRED_FX_CATEGORY.HEALTH_POINTS, rendererId: WIRED_FX_RENDERER.SINGLE_HEART })} entry={entry(50)} />);
        expect(screen.getByTestId('fx-status').children).toHaveLength(1);
        view.unmount();

        view = render(
            <WiredVariableFxStatusView config={config({ category: WIRED_FX_CATEGORY.HEALTH_POINTS, rendererId: WIRED_FX_RENDERER.HEALTH_BAR, extra: { icon: 'misc_heart' } })} entry={entry(50)} />
        );
        expect(screen.getByLabelText('misc heart')).toBeTruthy();
        expect(screen.getByTestId('fx-bar')).toBeTruthy();
        view.unmount();

        render(
            <WiredVariableFxStatusView
                config={config({ category: WIRED_FX_CATEGORY.LEVELLING_PROGRESS, rendererId: WIRED_FX_RENDERER.LEVEL_WITH_PROGRESS })}
                entry={entry(150, { overrideMinValue: 100, overrideMaxValue: 200, extra: { current_level: '3', max_level: '10', is_maxed: 'false' } })}
            />
        );
        expect(screen.getByText('3')).toBeTruthy();
        expect((screen.getByTestId('fx-bar').firstElementChild as HTMLElement).style.width).toBe('50%');
    });

    it('writes the boss bar and number display values', () => {
        const { unmount } = render(
            <WiredVariableFxStatusView config={config({ category: WIRED_FX_CATEGORY.BOSS_BAR, rendererId: WIRED_FX_RENDERER.BOSS, defaultMaxValue: 5000, extra: { icon: 'misc_skull', icon_alignment: 'double' } })} entry={entry(1250)} />
        );
        expect(screen.getByText('1250 / 5000')).toBeTruthy();
        expect(screen.getAllByLabelText('misc skull')).toHaveLength(2);
        unmount();

        render(<WiredVariableFxStatusView config={config({ category: WIRED_FX_CATEGORY.NUMBER_DISPLAY, rendererId: WIRED_FX_RENDERER.NUMBER_STYLED, extra: { design: 'blocky' } })} entry={entry(123456)} />);
        expect(screen.getByText('123k')).toBeTruthy();
    });

    it('shows a hover-only value under the cursor and hides a changing one once its show duration is over', () => {
        vi.useFakeTimers();
        vi.setSystemTime(10000);

        const hoverOnly = config({ showMode: WIRED_FX_SHOW_MODE.NEVER, showOnMouseHover: true });
        const { rerender, unmount } = render(<WiredVariableFxStatusView config={hoverOnly} entry={entry(50)} />);
        expect(screen.queryByTestId('fx-status')).toBeNull();
        rerender(<WiredVariableFxStatusView config={hoverOnly} entry={entry(50)} hovered={true} />);
        expect(screen.getByTestId('fx-status')).toBeTruthy();
        unmount();

        render(<WiredVariableFxStatusView config={config({ showMode: WIRED_FX_SHOW_MODE.WHEN_CHANGES, showDurationMs: 2000 })} entry={entry(50, {}, 9000)} />);
        expect(screen.getByTestId('fx-status')).toBeTruthy();

        act(() => {
            vi.advanceTimersByTime(1100);
        });
        expect(screen.queryByTestId('fx-status')).toBeNull();
    });
});
