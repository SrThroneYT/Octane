import { describe, expect, it } from 'vitest';
import { WIRED_FX_CATEGORY, WIRED_FX_RENDERER } from './WiredVariableFx';
import { IWiredVariableFxCanvas, WiredVariableFxVisualizer } from './WiredVariableFxVisualizer';

const config = {
    category: WIRED_FX_CATEGORY.PROGRESS_BAR,
    styleId: 0,
    colorId: -1,
    widthId: 2,
    rendererId: WIRED_FX_RENDERER.PLAIN,
    showMode: 0,
    showDurationMs: 3000,
    defaultMinValue: 0,
    defaultMaxValue: 100,
    extra: {} as Record<string, string>
};

const status = (value: number, initialize = false) => ({ value, initialize, overrideMinValue: null, overrideMaxValue: null, extra: {} as Record<string, string> });

/** A canvas whose context swallows every call and measures 6 px per character. */
const fakeCanvas = (): IWiredVariableFxCanvas => {
    const context = new Proxy({} as Record<string, unknown>, {
        get: (target, prop: string) => {
            if (prop in target) return target[prop];
            if (prop === 'measureText') return (text: string) => ({ width: text.length * 6 });
            if (prop === 'createLinearGradient') return () => ({ addColorStop: () => undefined });

            return () => undefined;
        },
        set: (target, prop: string, value) => {
            target[prop] = value;

            return true;
        }
    });

    return { width: 0, height: 0, getContext: () => context as unknown as CanvasRenderingContext2D };
};

const fillWidth = (visualizer: WiredVariableFxVisualizer) => {
    const fill = visualizer.drawing.ops.find((op) => op.type === 'rect' && op.fill === '#5fd35f');

    return fill && fill.type === 'rect' ? fill.w : 0;
};

describe('WiredVariableFxVisualizer', () => {
    it('draws a frame the size of its drawing on its own canvas', () => {
        const visualizer = new WiredVariableFxVisualizer(fakeCanvas);

        expect(visualizer.needsUpdate(0)).toBe(false);

        visualizer.setData(config, status(25), false, 0);

        expect(visualizer.needsUpdate(0)).toBe(true);
        expect(visualizer.update(0)).toBe(true);
        expect(visualizer.frame).toMatchObject({ width: 68, height: 13, anchorX: 0, anchorY: 0, updateId: 1 });
        expect((visualizer.frame.source as unknown as IWiredVariableFxCanvas).width).toBe(68);
        expect(fillWidth(visualizer)).toBe(16);
        expect(visualizer.needsUpdate(16)).toBe(false);
    });

    it('slides the fill to a new value over 350 ms and flashes it for 500 ms', () => {
        const visualizer = new WiredVariableFxVisualizer(fakeCanvas);

        visualizer.setData(config, status(0), false, 0);
        visualizer.update(0);
        visualizer.setData(config, status(100), true, 1000);

        expect(visualizer.progressAt(1000)).toBe(0);
        expect(visualizer.progressAt(1175)).toBeCloseTo(0.75);
        expect(visualizer.progressAt(1350)).toBe(1);
        expect(visualizer.flashAt(1250)).toBeCloseTo(0.5);
        expect(visualizer.flashAt(1500)).toBe(0);

        visualizer.update(1175);
        expect(fillWidth(visualizer)).toBe(48);

        expect(visualizer.needsUpdate(1400)).toBe(true);
        visualizer.update(1400);
        expect(fillWidth(visualizer)).toBe(64);

        // One more frame once the flash is over, then it rests.
        expect(visualizer.needsUpdate(1600)).toBe(true);
        visualizer.update(1600);
        expect(visualizer.needsUpdate(1700)).toBe(false);
    });

    it('draws an initialize value at once, without a flash', () => {
        const visualizer = new WiredVariableFxVisualizer(fakeCanvas);

        visualizer.setData(config, status(0), false, 0);
        visualizer.update(0);
        visualizer.setData(config, status(50, true), true, 1000);

        expect(visualizer.progressAt(1000)).toBe(0.5);
        expect(visualizer.flashAt(1000)).toBe(0);
    });

    it('turns from a running slide towards the newest value', () => {
        const visualizer = new WiredVariableFxVisualizer(fakeCanvas);

        visualizer.setData(config, status(0), false, 0);
        visualizer.setData(config, status(100), true, 1000);
        visualizer.setData(config, status(0), true, 1175);

        expect(visualizer.progressAt(1175)).toBeCloseTo(0.75);
        expect(visualizer.progressAt(1525)).toBe(0);
    });

    it('draws nothing without a canvas', () => {
        const visualizer = new WiredVariableFxVisualizer(() => null);

        visualizer.setData(config, status(10), false, 0);

        expect(visualizer.update(0)).toBe(false);
        expect(visualizer.frame).toBeNull();
    });
});
