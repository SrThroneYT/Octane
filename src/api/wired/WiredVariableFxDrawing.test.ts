import { describe, expect, it } from 'vitest';
import { WIRED_FX_CATEGORY, WIRED_FX_RENDERER } from './WiredVariableFx';
import { buildWiredVariableFxDrawing, IWiredVariableFxDrawing, paintWiredVariableFxDrawing, WiredVariableFxDrawOp, wiredVariableFxIconGlyph, wiredVariableFxSegmentFills } from './WiredVariableFxDrawing';

const config = (overrides: Record<string, unknown> = {}) => ({
    category: WIRED_FX_CATEGORY.PROGRESS_BAR,
    styleId: 0,
    colorId: -1,
    widthId: 2,
    rendererId: WIRED_FX_RENDERER.PLAIN,
    showMode: 0,
    showDurationMs: 3000,
    defaultMinValue: 0,
    defaultMaxValue: 100,
    extra: {} as Record<string, string>,
    ...overrides
});

const status = (value: number, overrides: Record<string, unknown> = {}) => ({ value, overrideMinValue: null, overrideMaxValue: null, extra: {} as Record<string, string>, ...overrides });

// Every character is 6 px wide.
const measure = (text: string) => [...text].length * 6;

const draw = (cfg: ReturnType<typeof config>, value: ReturnType<typeof status>, progress = 0.5, flash = 0) => buildWiredVariableFxDrawing(cfg, value, { progress, flash }, measure);

const texts = (drawing: IWiredVariableFxDrawing) => drawing.ops.filter((op): op is Extract<WiredVariableFxDrawOp, { type: 'text' }> => op.type === 'text').map((op) => op.text);
const fills = (drawing: IWiredVariableFxDrawing, color: string) => drawing.ops.filter((op) => op.type === 'rect' && op.fill === color) as Extract<WiredVariableFxDrawOp, { type: 'rect' }>[];

describe('WiredVariableFxDrawing', () => {
    it('lights whole segments and one partial one', () => {
        expect(wiredVariableFxSegmentFills(0.5, 4)).toEqual([1, 1, 0, 0]);
        expect(wiredVariableFxSegmentFills(0.625, 4)).toEqual([1, 1, 0.5, 0]);
        expect(wiredVariableFxSegmentFills(2, 3)).toEqual([1, 1, 1]);
        expect(wiredVariableFxSegmentFills(-1, 2)).toEqual([0, 0]);
        expect(wiredVariableFxSegmentFills(0.5, 0)).toEqual([0.5]);
    });

    it('has a glyph for every named icon and none for no icon', () => {
        expect(wiredVariableFxIconGlyph('misc_heart')).toBe('♥');
        expect(wiredVariableFxIconGlyph('misc_skull')).toBe('☠');
        expect(wiredVariableFxIconGlyph('something_new')).toBe('●');
        expect(wiredVariableFxIconGlyph('')).toBe('');
    });

    it('draws a plain bar of the width option, filled to the drawn progress', () => {
        const drawing = draw(config(), status(25), 0.25);
        const fill = fills(drawing, '#5fd35f');

        // Medium is 64 px inside a 1 px border and 1 px padding.
        expect(drawing.width).toBe(68);
        expect(drawing.height).toBe(13);
        expect(fill).toHaveLength(1);
        expect(fill[0]).toMatchObject({ x: 2, y: 2, w: 16, h: 8 });
    });

    it('draws segments when the config carries a count, the mini bar thinner', () => {
        expect(fills(draw(config({ rendererId: WIRED_FX_RENDERER.BLOCK, extra: { segments: '4' } }), status(50), 0.5), 'rgba(255, 255, 255, 0.12)')).toHaveLength(4);
        expect(draw(config({ rendererId: WIRED_FX_RENDERER.CLASSIC_MINI }), status(50)).height).toBe(9);
        expect(draw(config({ rendererId: WIRED_FX_RENDERER.ARROW, extra: { segments: '3' } }), status(50)).ops.some((op) => op.type === 'chevron')).toBe(true);
        expect(draw(config({ rendererId: WIRED_FX_RENDERER.THERMOMETER }), status(50))).toMatchObject({ width: 12, height: 41 });
    });

    it('uses the palette colour and puts the icon before the bar', () => {
        const drawing = draw(config({ colorId: 1, extra: { icon: 'misc_heart' } }), status(50));

        expect(fills(drawing, '#e04b4b')).toHaveLength(1);
        expect(texts(drawing)).toEqual(['♥']);
        expect(drawing.width).toBe(14 + 3 + 68);
    });

    it('draws stacked hearts, one heart and a health bar for the health styles', () => {
        const hearts = draw(config({ category: WIRED_FX_CATEGORY.HEALTH_POINTS, rendererId: WIRED_FX_RENDERER.STACKED_HEARTS }), status(50));

        expect(texts(hearts).filter((text) => text === '♥').length).toBeGreaterThanOrEqual(5);
        expect(hearts.ops.filter((op) => op.type === 'clip')).toHaveLength(3);

        const single = draw(config({ category: WIRED_FX_CATEGORY.HEALTH_POINTS, rendererId: WIRED_FX_RENDERER.SINGLE_HEART }), status(50));
        const clip = single.ops.find((op) => op.type === 'clip') as Extract<WiredVariableFxDrawOp, { type: 'clip' }>;

        // Filled from the bottom: the clip covers the lower half.
        expect(clip.y).toBe(11);
        expect(clip.h).toBe(11);

        const health = draw(config({ category: WIRED_FX_CATEGORY.HEALTH_POINTS, rendererId: WIRED_FX_RENDERER.HEALTH_BAR }), status(50));

        expect(health.ops.some((op) => op.type === 'shade')).toBe(true);
    });

    it('writes the level beside its bar, full when maxed', () => {
        const levelled = draw(
            config({ category: WIRED_FX_CATEGORY.LEVELLING_PROGRESS, rendererId: WIRED_FX_RENDERER.LEVEL_WITH_PROGRESS }),
            status(150, { overrideMinValue: 100, overrideMaxValue: 200, extra: { current_level: '3', max_level: '10', is_maxed: 'false' } }),
            0.5
        );

        expect(texts(levelled)).toContain('3');
        expect(levelled.ops.some((op) => op.type === 'circle' && !op.glow)).toBe(true);

        const maxed = draw(config({ category: WIRED_FX_CATEGORY.LEVELLING_PROGRESS, rendererId: WIRED_FX_RENDERER.LEVEL_WITH_PROGRESS }), status(150, { extra: { current_level: '10', max_level: '10', is_maxed: 'true' } }), 0.2);

        expect(maxed.ops.some((op) => op.type === 'circle' && !!op.glow)).toBe(true);

        const details = draw(config({ category: WIRED_FX_CATEGORY.LEVELLING_PROGRESS, rendererId: WIRED_FX_RENDERER.LEVEL_DETAILS }), status(150, { overrideMinValue: 100, overrideMaxValue: 200, extra: { current_level: '3', max_level: '10' } }));

        expect(texts(details)).toEqual(['Lv 3 / 10', '50 / 100']);
    });

    it('writes the boss bar and number display values with their icons', () => {
        const boss = draw(config({ category: WIRED_FX_CATEGORY.BOSS_BAR, rendererId: WIRED_FX_RENDERER.BOSS, defaultMaxValue: 5000, extra: { icon: 'misc_skull', icon_alignment: 'double' } }), status(1250), 0.25);

        expect(texts(boss)).toEqual(['☠', '1250 / 5000', '☠']);
        expect(fills(boss, '#e04b4b')[0].w).toBe(55);

        const number = draw(config({ category: WIRED_FX_CATEGORY.NUMBER_DISPLAY, rendererId: WIRED_FX_RENDERER.NUMBER_STYLED, extra: { design: 'blocky', icon: 'gold', icon_alignment: 'right' } }), status(123456));

        expect(texts(number)).toEqual(['123k', '◆']);
        expect(number.ops.find((op) => op.type === 'text' && op.text === '123k')).toMatchObject({ stroke: '#000', fill: '#fff' });
    });

    it('flashes the fill after a change', () => {
        expect(fills(draw(config(), status(50), 0.5, 1), '#fff')).toHaveLength(1);
        expect(fills(draw(config(), status(50), 0.5, 0), '#fff')).toHaveLength(0);
    });

    it('paints the operations on a 2D context', () => {
        const calls: string[] = [];
        const context = new Proxy(
            {},
            {
                get: (target: Record<string, unknown>, prop: string) => {
                    if (prop in target) return target[prop];
                    if (prop === 'createLinearGradient') return () => ({ addColorStop: () => calls.push('stop') });

                    return (...args: unknown[]) => calls.push(`${prop}${prop === 'fillText' ? `:${args[0]}` : ''}`);
                },
                set: (target: Record<string, unknown>, prop: string, value: unknown) => {
                    target[prop] = value;

                    return true;
                }
            }
        ) as unknown as CanvasRenderingContext2D;

        paintWiredVariableFxDrawing(context, draw(config({ rendererId: WIRED_FX_RENDERER.HEALTH_BAR, extra: { icon: 'misc_heart' } }), status(50), 0.5, 0.5));

        expect(calls[0]).toBe('clearRect');
        expect(calls).toContain('fillText:♥');
        expect(calls.filter((call) => call === 'fill').length).toBeGreaterThanOrEqual(3);
        expect(calls).toContain('stop');
    });
});
