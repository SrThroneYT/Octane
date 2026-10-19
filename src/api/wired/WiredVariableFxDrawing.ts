import {
    formatWiredVariableFxValue,
    IWiredVariableFxConfigLike,
    IWiredVariableFxStatusLike,
    resolveWiredVariableFxColor,
    resolveWiredVariableFxRange,
    WIRED_FX_CONFIG_EXTRA,
    WIRED_FX_RENDERER,
    wiredVariableFxLevel,
    wiredVariableFxProgress,
    wiredVariableFxWidthPx
} from './WiredVariableFx';

/**
 * The bitmap one variable fx is drawn as in the room (the holder's visualization stacks it), built
 * as a list of drawing operations first so the layout is plain data, then painted on a 2D canvas.
 */
export type WiredVariableFxDrawOp =
    | { type: 'rect'; x: number; y: number; w: number; h: number; r: number; fill?: string; stroke?: string; alpha?: number }
    | { type: 'shade'; x: number; y: number; w: number; h: number; r: number; top: string; bottom: string }
    | { type: 'stripes'; x: number; y: number; w: number; h: number; r: number; color: string }
    | { type: 'chevron'; x: number; y: number; w: number; h: number; fill: string; alpha?: number }
    | { type: 'circle'; cx: number; cy: number; radius: number; fill: string; stroke?: string; glow?: string }
    | { type: 'text'; x: number; y: number; text: string; font: string; fill: string; align: 'left' | 'center'; stroke?: string; shadow?: boolean }
    | { type: 'clip'; x: number; y: number; w: number; h: number }
    | { type: 'unclip' };

export interface IWiredVariableFxDrawing {
    width: number;
    height: number;
    ops: WiredVariableFxDrawOp[];
}

/** How wide a text is in a font; the canvas measures, tests count characters. */
export type WiredVariableFxMeasure = (text: string, font: string) => number;

/** What changes between frames of the same value: the fill sliding to the new value, the change flash. */
export interface IWiredVariableFxDrawState {
    /** 0..1 drawn fill (animated towards the value's progress). */
    progress: number;
    /** 0..1 how bright the fill flashes after a change. */
    flash: number;
}

const FONT_FAMILY = "'Ubuntu', sans-serif";
const TEXT_SHADOW = 'rgba(0, 0, 0, 0.6)';
const BAR_BACKGROUND = 'rgba(0, 0, 0, 0.65)';
const BAR_BORDER = 'rgba(255, 255, 255, 0.35)';
const SEGMENT_BACKGROUND = 'rgba(255, 255, 255, 0.12)';
const DEFAULT_COLOR = '#5fd35f';
const HEART_COLOR = '#e04b4b';
const LEVEL_COLOR = '#3b7de3';
const ICON_SIZE = 14;
const GAP = 3;

export const wiredVariableFxFont = (size: number, weight: 'bold' | 'normal' = 'bold', family: string = FONT_FAMILY) => `${weight} ${size}px ${family}`;

/** How full each of `count` segments is for a bar at `progress`; the last lit one is partial. */
export const wiredVariableFxSegmentFills = (progress: number, count: number): number[] => {
    const segments = Math.max(1, Math.min(100, Math.trunc(count) || 1));
    const clamped = Math.max(0, Math.min(1, progress));
    const fills: number[] = [];

    for (let index = 0; index < segments; index++) {
        const start = index / segments;
        const end = (index + 1) / segments;

        fills.push(clamped >= end ? 1 : clamped <= start ? 0 : (clamped - start) / (end - start));
    }

    return fills;
};

/** The glyph an icon name is drawn with when the client has no sprite for it. */
export const wiredVariableFxIconGlyph = (icon: string): string => {
    switch (icon) {
        case 'misc_heart':
        case 'health':
            return '♥';
        case 'misc_skull':
            return '☠';
        case 'misc_star':
        case 'star_power':
            return '★';
        case 'shield':
            return '⛨';
        case 'energy':
        case 'battery':
            return '⚡';
        case 'timeleft':
        case 'cooldown':
            return '⏱';
        case 'gold':
        case 'cash':
        case 'gems':
            return '◆';
        case 'droplet':
        case 'mana':
            return '💧';
        case 'burning':
            return '🔥';
        case 'freezing':
            return '❄';
        case 'food':
        case 'fish':
            return '🍖';
        case 'magic':
            return '✦';
        case 'eye':
        case 'stealth':
            return '👁';
        case 'poison':
            return '☣';
        case 'repairing':
        case 'upgrading':
            return '🔧';
        case 'wooden_logs':
            return '🪵';
        default:
            return icon ? '●' : '';
    }
};

/** The number designs: fill colour, outline, font. */
const NUMBER_DESIGNS: Record<string, { fill: string | null; stroke: string; family: string }> = {
    freeze_style: { fill: '#8fe3ff', stroke: '#1c4f7a', family: FONT_FAMILY },
    shalimar: { fill: '#ffd83d', stroke: '#7a4b00', family: "'Cherry Bomb One', 'Ubuntu', sans-serif" },
    blocky: { fill: '#fff', stroke: '#000', family: "'Pixelify Sans', 'Ubuntu', monospace" }
};

/** A drawable box laid out left to right; `draw` puts its ops at an origin. */
interface IPiece {
    width: number;
    height: number;
    draw(x: number, y: number, ops: WiredVariableFxDrawOp[]): void;
}

const row = (pieces: IPiece[], gap: number): IPiece => {
    const visible = pieces.filter((piece) => piece && piece.width > 0);
    const width = visible.reduce((sum, piece) => sum + piece.width, 0) + Math.max(0, visible.length - 1) * gap;
    const height = visible.reduce((max, piece) => Math.max(max, piece.height), 0);

    return {
        width,
        height,
        draw: (x, y, ops) => {
            let left = x;

            for (const piece of visible) {
                piece.draw(left, y + Math.round((height - piece.height) / 2), ops);
                left += piece.width + gap;
            }
        }
    };
};

const column = (pieces: IPiece[], gap: number): IPiece => {
    const visible = pieces.filter((piece) => piece && piece.width > 0);
    const width = visible.reduce((max, piece) => Math.max(max, piece.width), 0);
    const height = visible.reduce((sum, piece) => sum + piece.height, 0) + Math.max(0, visible.length - 1) * gap;

    return {
        width,
        height,
        draw: (x, y, ops) => {
            let top = y;

            for (const piece of visible) {
                piece.draw(x + Math.round((width - piece.width) / 2), top, ops);
                top += piece.height + gap;
            }
        }
    };
};

const padded = (piece: IPiece, padX: number, padY: number, background: { fill: string; stroke?: string; r: number }): IPiece => ({
    width: piece.width + padX * 2,
    height: piece.height + padY * 2,
    draw: (x, y, ops) => {
        ops.push({ type: 'rect', x: x + 0.5, y: y + 0.5, w: piece.width + padX * 2 - 1, h: piece.height + padY * 2 - 1, r: background.r, fill: background.fill, stroke: background.stroke });
        piece.draw(x + padX, y + padY, ops);
    }
});

const text = (measure: WiredVariableFxMeasure, value: string, size: number, fill: string, options: { weight?: 'bold' | 'normal'; family?: string; stroke?: string } = {}): IPiece => {
    const font = wiredVariableFxFont(size, options.weight ?? 'bold', options.family);
    const width = Math.ceil(measure(value, font)) + (options.stroke ? 2 : 0);
    const height = Math.ceil(size * 1.25) + 1;

    return {
        width,
        height,
        draw: (x, y, ops) => ops.push({ type: 'text', x: x + width / 2, y: y + height / 2, text: value, font, fill, align: 'center', stroke: options.stroke, shadow: !options.stroke })
    };
};

const icon = (measure: WiredVariableFxMeasure, name: string, size = ICON_SIZE, fontSize = 11): IPiece => {
    if (!name) return null;

    const glyph = wiredVariableFxIconGlyph(name);
    const font = wiredVariableFxFont(fontSize, 'normal');
    const width = Math.max(size, Math.ceil(measure(glyph, font)));

    return {
        width,
        height: size,
        draw: (x, y, ops) => ops.push({ type: 'text', x: x + width / 2, y: y + size / 2, text: glyph, font, fill: '#fff', align: 'center', shadow: true })
    };
};

/** The fill of a bar, with the renderer's finish and the change flash over it. */
const pushFill = (ops: WiredVariableFxDrawOp[], x: number, y: number, w: number, h: number, r: number, color: string, finish: string, flash: number) => {
    if (w <= 0 || h <= 0) return;

    ops.push({ type: 'rect', x, y, w, h, r, fill: color });

    if (finish === 'health') ops.push({ type: 'shade', x, y, w, h, r, top: 'rgba(255, 255, 255, 0.3)', bottom: 'rgba(0, 0, 0, 0.25)' });
    else if (finish === 'metallic') ops.push({ type: 'shade', x, y, w, h, r, top: 'rgba(255, 255, 255, 0.55)', bottom: 'rgba(0, 0, 0, 0.4)' });
    else if (finish === 'striped') ops.push({ type: 'stripes', x, y, w, h, r, color: 'rgba(0, 0, 0, 0.3)' });

    if (flash > 0) ops.push({ type: 'rect', x, y, w, h, r, fill: '#fff', alpha: Math.min(1, flash) * 0.45 });
};

const barFinish = (rendererId: number, metallic: boolean) =>
    metallic ? 'metallic' : rendererId === WIRED_FX_RENDERER.HEALTH_BAR ? 'health' : rendererId === WIRED_FX_RENDERER.STRIPED ? 'striped' : 'plain';

/** A horizontal bar: 1 px border, 1 px padding, the fill or the segments inside. */
const bar = (rendererId: number, state: IWiredVariableFxDrawState, segments: number, color: string, widthPx: number, metallic: boolean, innerHeight?: number): IPiece => {
    if (rendererId === WIRED_FX_RENDERER.THERMOMETER) return thermometer(state, segments, color);

    const inner = innerHeight ?? (rendererId === WIRED_FX_RENDERER.CLASSIC_MINI ? 4 : 8);
    const finish = barFinish(rendererId, metallic);

    return {
        width: widthPx + 4,
        height: inner + 4,
        draw: (x, y, ops) => {
            ops.push({ type: 'rect', x: x + 0.5, y: y + 0.5, w: widthPx + 3, h: inner + 3, r: 3, fill: BAR_BACKGROUND, stroke: BAR_BORDER });

            if (segments <= 0) {
                pushFill(ops, x + 2, y + 2, Math.round(widthPx * state.progress), inner, 2, color, finish, state.flash);

                return;
            }

            const fills = wiredVariableFxSegmentFills(state.progress, segments);
            const segmentWidth = (widthPx - (fills.length - 1)) / fills.length;

            fills.forEach((fill, index) => {
                const left = x + 2 + index * (segmentWidth + 1);

                if (rendererId === WIRED_FX_RENDERER.ARROW) {
                    ops.push({ type: 'chevron', x: left, y: y + 2, w: segmentWidth, h: inner, fill: SEGMENT_BACKGROUND });

                    if (fill > 0) {
                        ops.push({ type: 'clip', x: left, y: y + 2, w: segmentWidth * fill, h: inner });
                        ops.push({ type: 'chevron', x: left, y: y + 2, w: segmentWidth, h: inner, fill: color });
                        if (state.flash > 0) ops.push({ type: 'chevron', x: left, y: y + 2, w: segmentWidth, h: inner, fill: '#fff', alpha: state.flash * 0.45 });
                        ops.push({ type: 'unclip' });
                    }

                    return;
                }

                ops.push({ type: 'rect', x: left, y: y + 2, w: segmentWidth, h: inner, r: 1, fill: SEGMENT_BACKGROUND });
                pushFill(ops, left, y + 2, segmentWidth * fill, inner, 1, color, finish, state.flash);
            });
        }
    };
};

/** The upright bar: 8 px wide, 36 px tall, filled from the bottom. */
const thermometer = (state: IWiredVariableFxDrawState, segments: number, color: string): IPiece => ({
    width: 12,
    height: 40,
    draw: (x, y, ops) => {
        ops.push({ type: 'rect', x: x + 0.5, y: y + 0.5, w: 11, h: 39, r: 3, fill: BAR_BACKGROUND, stroke: BAR_BORDER });

        if (segments <= 0) {
            const filled = Math.round(36 * state.progress);

            pushFill(ops, x + 2, y + 2 + 36 - filled, 8, filled, 2, color, 'plain', state.flash);

            return;
        }

        const fills = wiredVariableFxSegmentFills(state.progress, segments);
        const segmentHeight = (36 - (fills.length - 1)) / fills.length;

        fills.forEach((fill, index) => {
            const bottom = y + 2 + 36 - index * (segmentHeight + 1);

            ops.push({ type: 'rect', x: x + 2, y: bottom - segmentHeight, w: 8, h: segmentHeight, r: 1, fill: SEGMENT_BACKGROUND });
            pushFill(ops, x + 2, bottom - segmentHeight * fill, 8, segmentHeight * fill, 1, color, 'plain', state.flash);
        });
    }
});

/** A heart glyph, dark with an outline, filled by `fill` in the colour (from the left, or the bottom). */
const heart = (measure: WiredVariableFxMeasure, fill: number, color: string, size: number, fromBottom: boolean, flash: number): IPiece => {
    const font = wiredVariableFxFont(size, 'normal');
    const width = Math.ceil(measure('♥', font)) + 2;
    const height = size + 2;

    return {
        width,
        height,
        draw: (x, y, ops) => {
            const cx = x + width / 2;
            const cy = y + height / 2;

            ops.push({ type: 'text', x: cx, y: cy, text: '♥', font, fill: 'rgba(0, 0, 0, 0.55)', align: 'center', stroke: 'rgba(255, 255, 255, 0.5)' });

            if (fill <= 0) return;

            ops.push(fromBottom ? { type: 'clip', x, y: y + height * (1 - fill), w: width, h: height * fill } : { type: 'clip', x, y, w: width * fill, h: height });
            ops.push({ type: 'text', x: cx, y: cy, text: '♥', font, fill: color, align: 'center' });
            if (flash > 0) ops.push({ type: 'text', x: cx, y: cy, text: '♥', font, fill: 'rgba(255, 255, 255, 0.45)', align: 'center' });
            ops.push({ type: 'unclip' });
        }
    };
};

const withIcons = (measure: WiredVariableFxMeasure, body: IPiece, iconName: string, alignment: string, size = ICON_SIZE, fontSize = 11, gap = GAP): IPiece => {
    const left = alignment === 'left' || alignment === 'double' ? icon(measure, iconName, size, fontSize) : null;
    const right = alignment === 'right' || alignment === 'double' ? icon(measure, iconName, size, fontSize) : null;

    return row([left, body, right], gap);
};

/** Lays one value out for its renderer, as the room shows it. */
export const buildWiredVariableFxDrawing = (
    config: IWiredVariableFxConfigLike,
    status: IWiredVariableFxStatusLike,
    state: IWiredVariableFxDrawState,
    measure: WiredVariableFxMeasure
): IWiredVariableFxDrawing => {
    const range = resolveWiredVariableFxRange(config, status);
    const color = resolveWiredVariableFxColor(config, status);
    const widthPx = wiredVariableFxWidthPx(config.widthId);
    const segments = parseInt(config.extra?.[WIRED_FX_CONFIG_EXTRA.SEGMENTS] ?? '0', 10) || 0;
    const iconName = config.extra?.[WIRED_FX_CONFIG_EXTRA.ICON] ?? '';
    const metallic = config.extra?.[WIRED_FX_CONFIG_EXTRA.METALLIC] === 'true';
    const alignment = config.extra?.[WIRED_FX_CONFIG_EXTRA.ICON_ALIGNMENT] ?? 'left';
    let piece: IPiece;

    switch (config.rendererId) {
        case WIRED_FX_RENDERER.STACKED_HEARTS:
            piece = row(
                wiredVariableFxSegmentFills(state.progress, segments > 0 ? segments : 5).map((fill) => heart(measure, fill, color ?? HEART_COLOR, 13, false, state.flash)),
                GAP
            );
            break;
        case WIRED_FX_RENDERER.SINGLE_HEART:
            piece = heart(measure, state.progress, color ?? HEART_COLOR, 20, true, state.flash);
            break;
        case WIRED_FX_RENDERER.LEVEL_WITH_PROGRESS: {
            const level = wiredVariableFxLevel(status);
            const subRenderer = parseInt(config.extra?.[WIRED_FX_CONFIG_EXTRA.SUB_RENDERER] ?? '', 10) || WIRED_FX_RENDERER.BLOCK;
            const label = text(measure, String(level.level), 10, '#fff');
            const diameter = Math.max(18, label.width + 6);
            const badge: IPiece = {
                width: diameter + 2,
                height: 20,
                draw: (x, y, ops) => {
                    ops.push({ type: 'circle', cx: x + diameter / 2 + 1, cy: y + 10, radius: diameter / 2, fill: color ?? LEVEL_COLOR, stroke: 'rgba(255, 255, 255, 0.7)', glow: level.maxed ? 'rgba(255, 216, 61, 0.9)' : undefined });
                    label.draw(x + 1 + Math.round((diameter - label.width) / 2), y + Math.round((20 - label.height) / 2), ops);
                }
            };

            piece = row([badge, bar(subRenderer, level.maxed ? { ...state, progress: 1 } : state, segments, color ?? DEFAULT_COLOR, widthPx, false)], GAP);
            break;
        }
        case WIRED_FX_RENDERER.LEVEL_DETAILS: {
            const level = wiredVariableFxLevel(status);
            const title = text(measure, `Lv ${level.level}${level.maxLevel > 1 ? ` / ${level.maxLevel}` : ''}`, 11, color ?? '#fff');
            const detail = text(
                measure,
                level.maxed ? 'MAX' : `${formatWiredVariableFxValue(status.value - range.min)} / ${formatWiredVariableFxValue(range.max - range.min)}`,
                9,
                'rgba(255, 255, 255, 0.9)',
                { weight: 'normal' }
            );

            piece = padded(column([title, detail], 0), 6, 1, { fill: 'rgba(0, 0, 0, 0.6)', r: 6 });
            break;
        }
        case WIRED_FX_RENDERER.BOSS: {
            const body = column(
                [
                    bar(WIRED_FX_RENDERER.PLAIN, state, 0, color ?? HEART_COLOR, Math.max(widthPx * 3, 220), false, 10),
                    text(measure, `${formatWiredVariableFxValue(status.value)} / ${formatWiredVariableFxValue(range.max)}`, 10, '#fff')
                ],
                2
            );

            piece = padded(withIcons(measure, body, iconName, alignment, 18, 16, 6), 10, 4, { fill: 'rgba(0, 0, 0, 0.55)', stroke: 'rgba(255, 255, 255, 0.25)', r: 8 });
            break;
        }
        case WIRED_FX_RENDERER.NUMBER_STYLED:
        case WIRED_FX_RENDERER.NUMBER_FREEZE: {
            const design = NUMBER_DESIGNS[config.extra?.[WIRED_FX_CONFIG_EXTRA.DESIGN] ?? 'freeze_style'] ?? NUMBER_DESIGNS.freeze_style;
            const number = text(measure, formatWiredVariableFxValue(status.value), 16, color ?? design.fill ?? '#fff', { family: design.family, stroke: design.stroke });

            piece = withIcons(measure, number, iconName, alignment);
            break;
        }
        default:
            piece = row([icon(measure, iconName), bar(config.rendererId, state, segments, color ?? DEFAULT_COLOR, widthPx, metallic)], GAP);
            break;
    }

    // Room for the 1 px text shadow under the drawing.
    const width = Math.max(1, Math.ceil(piece.width));
    const height = Math.max(1, Math.ceil(piece.height) + 1);
    const ops: WiredVariableFxDrawOp[] = [];

    piece.draw(0, 0, ops);

    return { width, height, ops };
};

/** The progress a value is drawn at before any animation: its range fraction, full when maxed. */
export const wiredVariableFxDrawProgress = (config: IWiredVariableFxConfigLike, status: IWiredVariableFxStatusLike): number => {
    const range = resolveWiredVariableFxRange(config, status);

    return wiredVariableFxProgress(status.value, range.min, range.max);
};

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));

    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.arcTo(x + w, y, x + w, y + radius, radius);
    context.lineTo(x + w, y + h - radius);
    context.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    context.lineTo(x + radius, y + h);
    context.arcTo(x, y + h, x, y + h - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
};

/** Paints a drawing on a context sized to it. */
export const paintWiredVariableFxDrawing = (context: CanvasRenderingContext2D, drawing: IWiredVariableFxDrawing): void => {
    context.clearRect(0, 0, drawing.width, drawing.height);

    for (const op of drawing.ops) {
        switch (op.type) {
            case 'rect':
                context.save();
                context.globalAlpha = op.alpha ?? 1;
                roundedRect(context, op.x, op.y, op.w, op.h, op.r);

                if (op.fill) {
                    context.fillStyle = op.fill;
                    context.fill();
                }

                if (op.stroke) {
                    context.strokeStyle = op.stroke;
                    context.lineWidth = 1;
                    context.stroke();
                }

                context.restore();
                break;
            case 'shade': {
                const gradient = context.createLinearGradient(0, op.y, 0, op.y + op.h);

                gradient.addColorStop(0, op.top);
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(1, op.bottom);
                roundedRect(context, op.x, op.y, op.w, op.h, op.r);
                context.fillStyle = gradient;
                context.fill();
                break;
            }
            case 'stripes':
                context.save();
                roundedRect(context, op.x, op.y, op.w, op.h, op.r);
                context.clip();
                context.strokeStyle = op.color;
                context.lineWidth = 2;
                context.beginPath();

                for (let offset = -op.h; offset < op.w; offset += 6) {
                    context.moveTo(op.x + offset, op.y + op.h);
                    context.lineTo(op.x + offset + op.h, op.y);
                }

                context.stroke();
                context.restore();
                break;
            case 'chevron':
                context.save();
                context.globalAlpha = op.alpha ?? 1;
                context.beginPath();
                context.moveTo(op.x, op.y);
                context.lineTo(op.x + op.w * 0.75, op.y);
                context.lineTo(op.x + op.w, op.y + op.h / 2);
                context.lineTo(op.x + op.w * 0.75, op.y + op.h);
                context.lineTo(op.x, op.y + op.h);
                context.lineTo(op.x + op.w * 0.25, op.y + op.h / 2);
                context.closePath();
                context.fillStyle = op.fill;
                context.fill();
                context.restore();
                break;
            case 'circle':
                context.save();

                if (op.glow) {
                    context.shadowColor = op.glow;
                    context.shadowBlur = 6;
                }

                context.beginPath();
                context.arc(op.cx, op.cy, op.radius, 0, Math.PI * 2);
                context.fillStyle = op.fill;
                context.fill();
                context.shadowBlur = 0;

                if (op.stroke) {
                    context.strokeStyle = op.stroke;
                    context.lineWidth = 1;
                    context.stroke();
                }

                context.restore();
                break;
            case 'text':
                context.save();
                context.font = op.font;
                context.textAlign = op.align;
                context.textBaseline = 'middle';

                if (op.shadow) {
                    context.fillStyle = TEXT_SHADOW;
                    context.fillText(op.text, op.x, op.y + 1);
                }

                if (op.stroke) {
                    context.strokeStyle = op.stroke;
                    context.lineWidth = 2;
                    context.lineJoin = 'round';
                    context.strokeText(op.text, op.x, op.y);
                }

                context.fillStyle = op.fill;
                context.fillText(op.text, op.x, op.y);
                context.restore();
                break;
            case 'clip':
                context.save();
                context.beginPath();
                context.rect(op.x, op.y, op.w, op.h);
                context.clip();
                break;
            case 'unclip':
                context.restore();
                break;
        }
    }
};
