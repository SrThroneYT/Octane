import type { IRoomObjectVariableFxFrame, IRoomObjectVariableFxVisualizer } from '@octane/renderer';
import { IWiredVariableFxConfigLike, IWiredVariableFxStatusLike } from './WiredVariableFx';
import { buildWiredVariableFxDrawing, IWiredVariableFxDrawing, paintWiredVariableFxDrawing, wiredVariableFxDrawProgress } from './WiredVariableFxDrawing';

/** A canvas to draw on; the browser's by default, a fake one in tests. */
export interface IWiredVariableFxCanvas {
    width: number;
    height: number;
    getContext(type: '2d'): CanvasRenderingContext2D | null;
}

export type WiredVariableFxCanvasFactory = () => IWiredVariableFxCanvas | null;

const createBrowserCanvas: WiredVariableFxCanvasFactory = () => (typeof document === 'undefined' ? null : document.createElement('canvas'));

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/**
 * Paints one variable fx value for the room renderer (AIR's VariableFxVisualizer): the holder's
 * visualization asks it for frames and stacks them. A new value slides the fill there over 350 ms
 * and flashes it for 500 ms; an "initialize" value is drawn at once.
 */
export class WiredVariableFxVisualizer implements IRoomObjectVariableFxVisualizer {
    public static FILL_TRANSITION_MS = 350;
    public static CHANGE_FLASH_MS = 500;

    private _config: IWiredVariableFxConfigLike = null;
    private _status: IWiredVariableFxStatusLike = null;
    private _fromProgress = 0;
    private _toProgress = 0;
    private _transitionStart = -Infinity;
    private _flashStart = -Infinity;
    private _dirty = true;
    private _canvas: IWiredVariableFxCanvas = null;
    private _frame: IRoomObjectVariableFxFrame = null;
    private _updateId = 0;
    private _lastDrawing: IWiredVariableFxDrawing = null;
    private _animating = false;

    constructor(private readonly _createCanvas: WiredVariableFxCanvasFactory = createBrowserCanvas) {}

    /** Takes the config and value to draw; `changed` flashes the fill (a real update of the value). */
    public setData(config: IWiredVariableFxConfigLike, status: IWiredVariableFxStatusLike & { initialize?: boolean }, changed: boolean, now: number): void {
        const first = !this._config;
        const target = wiredVariableFxDrawProgress(config, status);

        this._config = config;
        this._status = status;
        this._dirty = true;

        if (first || status.initialize) {
            this._fromProgress = target;
            this._toProgress = target;
            this._transitionStart = -Infinity;
        } else if (target !== this._toProgress) {
            this._fromProgress = this.progressAt(now);
            this._toProgress = target;
            this._transitionStart = now;
        }

        if (changed && !first && !status.initialize) this._flashStart = now;
    }

    public get frame(): IRoomObjectVariableFxFrame {
        return this._frame;
    }

    /** The last laid out drawing, for tests and debugging. */
    public get drawing(): IWiredVariableFxDrawing {
        return this._lastDrawing;
    }

    public needsUpdate(now: number): boolean {
        if (!this._config) return false;

        return this._dirty || !this._frame || this.isTransitioning(now) || this.isFlashing(now) || this.wasAnimating;
    }

    public update(now: number): boolean {
        if (!this._config) return false;

        if (!this._canvas) this._canvas = this._createCanvas();

        const context = this._canvas?.getContext('2d') ?? null;

        if (!context) return false;

        const measure = (text: string, font: string) => {
            context.font = font;

            return context.measureText(text).width;
        };
        const drawing = buildWiredVariableFxDrawing(this._config, this._status, { progress: this.progressAt(now), flash: this.flashAt(now) }, measure);

        if (this._canvas.width !== drawing.width || this._canvas.height !== drawing.height) {
            this._canvas.width = drawing.width;
            this._canvas.height = drawing.height;
        }

        paintWiredVariableFxDrawing(context, drawing);

        this._lastDrawing = drawing;
        this._dirty = false;
        this._animating = this.isTransitioning(now) || this.isFlashing(now);
        this._frame = { source: this._canvas as unknown as CanvasImageSource, width: drawing.width, height: drawing.height, anchorX: 0, anchorY: 0, updateId: ++this._updateId };

        return true;
    }

    /** 0..1 fill drawn at `now`. */
    public progressAt(now: number): number {
        const elapsed = now - this._transitionStart;

        if (!(elapsed < WiredVariableFxVisualizer.FILL_TRANSITION_MS)) return this._toProgress;

        return this._fromProgress + (this._toProgress - this._fromProgress) * easeOut(Math.max(0, elapsed) / WiredVariableFxVisualizer.FILL_TRANSITION_MS);
    }

    /** 0..1 brightness of the change flash at `now`, fading linearly. */
    public flashAt(now: number): number {
        const elapsed = now - this._flashStart;

        if (!(elapsed < WiredVariableFxVisualizer.CHANGE_FLASH_MS)) return 0;

        return 1 - Math.max(0, elapsed) / WiredVariableFxVisualizer.CHANGE_FLASH_MS;
    }

    /** The last frame was mid-animation: draw the settled one too. */
    private get wasAnimating(): boolean {
        return this._animating;
    }

    private isTransitioning(now: number): boolean {
        return now - this._transitionStart < WiredVariableFxVisualizer.FILL_TRANSITION_MS;
    }

    private isFlashing(now: number): boolean {
        return now - this._flashStart < WiredVariableFxVisualizer.CHANGE_FLASH_MS;
    }
}
