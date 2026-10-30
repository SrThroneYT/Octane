import { CSSProperties, DetailedHTMLProps, FC, HTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import { NativeText } from './NativeText';
import { isNativeTextEnabled } from './nativeTextEnabled';
import { CssNativeFont, resolveCssNativeFont } from './resolveCssNativeFont';

// The host is a custom element: a window's generic `span` / `i` rules (colours, sizes) would otherwise land on it instead of
// letting it inherit the text's own style.
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'octane-label': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

interface NativeLabelProps {
    text: string;
    /** The label is measured again when this changes: pass the state the surrounding CSS styles by (class names, active, disabled). */
    stateKey?: unknown;
}

interface Measurement {
    key: string;
    font: CssNativeFont | null;
    maxWidth?: number;
    lineHeight?: number;
    lines: number;
    align?: 'left' | 'center' | 'right';
}

const ALIGN: Record<string, Measurement['align']> = { center: 'center', right: 'right', end: 'right', left: 'left', start: 'left' };

// The width the browser wraps in: the parent's content box (the label is an inline run inside it).
const contentWidth = (element: HTMLElement) => {
    const css = getComputedStyle(element);

    return Math.max(1, Math.floor(element.clientWidth - (parseFloat(css.paddingLeft) || 0) - (parseFloat(css.paddingRight) || 0)));
};

const countLines = (host: HTMLElement) => new Set(Array.from(host.getClientRects(), (rect) => Math.round(rect.top))).size || 1;

/**
 * A text label drawn by AIR's native text renderer in the font its CSS asks for (see resolveCssNativeFont). The browser lays the
 * text out first: the font, colour, line height and, for text the browser wrapped, the width to wrap in are read from that, then the
 * raster takes its place, each line centred in the CSS line height. The raster's 2 px TextField gutter is folded away so the text stays
 * where the CSS put it. Anything the native fonts cannot draw stays browser text.
 */
export const NativeLabel: FC<NativeLabelProps> = ({ text, stateKey }) => {
    const hostRef = useRef<HTMLElement>(null);
    const [measurement, setMeasurement] = useState<Measurement | null>(null);
    const [resizeTick, setResizeTick] = useState(0);
    const key = `${text}\u0000${String(stateKey)}\u0000${resizeTick}`;
    const current = measurement?.key === key ? measurement : null;

    useLayoutEffect(() => {
        const host = hostRef.current;

        if (!host || measurement?.key === key) return;
        if (!isNativeTextEnabled()) {
            setMeasurement({ key, font: null, lines: 1 });

            return;
        }

        const css = getComputedStyle(host);
        const font = resolveCssNativeFont(css);
        const lines = countLines(host);
        const lineHeight = parseFloat(css.lineHeight);

        setMeasurement({
            key,
            font,
            lines,
            maxWidth: lines > 1 && font?.wrap && host.parentElement ? contentWidth(host.parentElement) + 4 : undefined,
            lineHeight: Number.isFinite(lineHeight) ? lineHeight : undefined,
            align: lines > 1 ? ALIGN[css.textAlign] : undefined
        });
    }, [key, measurement?.key]);

    // A wrapped label follows its container's width: when that changes, the browser lays the text out again.
    const wrapped = current?.maxWidth !== undefined;

    useLayoutEffect(() => {
        const parent = hostRef.current?.parentElement;

        if (!wrapped || !parent || typeof ResizeObserver === 'undefined') return;

        let width = parent.clientWidth;
        const observer = new ResizeObserver(() => {
            if (Math.abs(parent.clientWidth - width) < 1) return;

            width = parent.clientWidth;
            setResizeTick((tick) => tick + 1);
        });

        observer.observe(parent);

        return () => observer.disconnect();
    }, [wrapped]);

    if (!current?.font) return <octane-label ref={hostRef}>{text}</octane-label>;

    const { font, maxWidth, lineHeight, align } = current;
    const label = font.transform === 'uppercase' ? text.toUpperCase() : font.transform === 'lowercase' ? text.toLowerCase() : text;
    const hostStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'top',
        maxWidth: '100%'
    };

    return (
        <octane-label ref={hostRef} className="octane-native-label" style={hostStyle}>
            <NativeText align={align} background={null} lineHeight={lineHeight} maxWidth={maxWidth} overrides={font.style} text={label} textStyle="u_regular" />
        </octane-label>
    );
};
