import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PropsWithChildren, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    setIntParams: vi.fn(),
    setStringParam: vi.fn(),
    setVariableIds: vi.fn(),
    setSourceTypes: vi.fn(),
    setFurniIds: vi.fn(),
    setFurniIds2: vi.fn(),
    setAllowsFurni: vi.fn(),
    field: null as null | Record<string, unknown>,
    rows: [] as string[]
}));

let trigger: Record<string, unknown> | null = null;

vi.mock('../../../../api', () => ({
    LocalizeText: (key: string) => key,
    localizeWithFallback: (_key: string, fallback: string) => fallback,
    WiredFurniType: { STUFF_SELECTION_OPTION_NONE: 0, STUFF_SELECTION_OPTION_BY_ID: 1 },
    WiredSelectionVisualizer: {
        applySelectionShaderToFurni: vi.fn(),
        applySecondarySelectionShaderToFurni: vi.fn(),
        clearSelectionShaderFromFurni: vi.fn(),
        clearSecondarySelectionShaderFromFurni: vi.fn()
    }
}));

vi.mock('../../../../hooks', () => ({
    useWired: () => ({
        trigger,
        furniIds: (trigger?.selectedItems as number[]) ?? [],
        setFurniIds: mocks.setFurniIds,
        setFurniIds2: mocks.setFurniIds2,
        setIntParams: mocks.setIntParams,
        setStringParam: mocks.setStringParam,
        setVariableIds: mocks.setVariableIds,
        setSourceTypes: mocks.setSourceTypes,
        setAllowsFurni: mocks.setAllowsFurni
    })
}));

vi.mock('../../../../common', () => ({
    Text: ({ children }: PropsWithChildren) => <span>{children}</span>
}));

vi.mock('../WiredSourcesSelector', () => ({
    FURNI_SOURCES: [{ value: 100, label: 'wiredfurni.params.sources.furni.100' }],
    sortWiredSourceOptions: (options: unknown[]) => options
}));

vi.mock('../WiredFurniSelectionSourceRow', () => ({
    WiredFurniSelectionSourceRow: (props: { title: string }) => {
        mocks.rows.push(props.title);

        return <div data-testid="source-row">{props.title}</div>;
    }
}));

vi.mock('../WiredValueOrVariableField', () => ({
    WIRED_VALUE_TARGET_GLOBAL: -10,
    normalizeWiredValueTarget: (value: number) => ([0, 1, -10, -20].includes(value) ? value : 0),
    variableTokenFromId: (text: string) => (parseInt(text, 10) > 0 ? `custom:${parseInt(text, 10)}` : ''),
    WiredValueOrVariableField: (props: Record<string, unknown>) => {
        mocks.field = props;

        return <div data-testid="value-field">{String(props.label)}</div>;
    }
}));

vi.mock('./WiredConditionBaseView', () => ({
    WiredConditionBaseView: ({ children, save, footer }: PropsWithChildren<{ save: () => void; footer?: ReactNode }>) => (
        <div>
            {children}
            {footer}
            <button type="button" onClick={save}>
                Save
            </button>
        </div>
    )
}));

import { WiredConditionChestHasItemsView } from './WiredConditionChestHasItemsView';
import { WiredConditionChestHasItemTypeView } from './WiredConditionChestHasItemTypeView';

const save = () => fireEvent.click(screen.getByText('Save'));
const field = () => mocks.field as Record<string, (value: unknown) => void> & { target: number; isVariable: boolean; literal: string; token: string; min: number; max: number };

describe('chest conditions (AIR ChestHasAmount)', () => {
    beforeEach(() => {
        Object.values(mocks).forEach((value) => typeof value === 'function' && 'mockClear' in value && value.mockClear());
        mocks.rows = [];
        mocks.field = null;
    });

    afterEach(cleanup);

    it('chest has items: comparison_selection, the value-or-variable amount and the official ints', () => {
        trigger = { intData: [], stringData: '', variableIds: [] };
        render(<WiredConditionChestHasItemsView />);

        expect(screen.getByText('wiredfurni.params.comparison_selection')).toBeTruthy();
        expect(screen.getByTestId('value-field')).toHaveTextContent('wiredfurni.params.chest_compare_amount');
        expect(field().min).toBe(0);
        expect(field().max).toBe(1_000_000);
        expect(field().target).toBe(-10);

        act(() => field().onIsVariableChange(true));
        save();
        // Variable mode without a variable keeps no id.
        expect(mocks.setVariableIds).toHaveBeenLastCalledWith([]);
    });

    it('chest has items: a context variable goes out as the first variable id', () => {
        trigger = { intData: [3, 1, -20, 2], stringData: '', variableIds: ['12'] };
        render(<WiredConditionChestHasItemsView />);

        expect(field().isVariable).toBe(true);
        expect(field().target).toBe(-20);
        expect(field().token).toBe('custom:12');
        save();
        expect(mocks.setIntParams).toHaveBeenLastCalledWith([3, 1, -20, 2]);
        expect(mocks.setVariableIds).toHaveBeenLastCalledWith(['12']);
        expect(mocks.setStringParam).toHaveBeenLastCalledWith('');

        act(() => field().onTargetChange(0));
        save();
        expect(mocks.setIntParams).toHaveBeenLastCalledWith([3, 1, 0, 2]);
    });

    it('chest has items: a box an older client saved keeps its token from the string', () => {
        trigger = { intData: [4, 1, 1, 5], stringData: 'custom:7', variableIds: [] };
        render(<WiredConditionChestHasItemsView />);

        expect(field().token).toBe('custom:7');
        expect(field().target).toBe(1);
        save();
        expect(mocks.setVariableIds).toHaveBeenLastCalledWith(['7']);
    });

    it('chest has item types: the item types are the first picks, the chests the second, the same ints', () => {
        trigger = { intData: [2, 0, -10, 1], stringData: '', variableIds: [], selectedItems: [5], selectedItems2: [9], furniSourceTypes: [100, 101] };
        render(<WiredConditionChestHasItemTypeView />);

        expect(mocks.rows.slice(0, 2)).toEqual(['wiredfurni.params.sources.furni.title.item_types', 'wiredfurni.params.sources.furni.title.chests']);
        expect(screen.getByTestId('value-field')).toHaveTextContent('wiredfurni.params.chest_compare_amount');
        save();
        expect(mocks.setIntParams).toHaveBeenLastCalledWith([2, 0, -10, 1]);
        expect(mocks.setSourceTypes).toHaveBeenLastCalledWith({ furni: [100, 101], users: [] });
        expect(mocks.setFurniIds2).toHaveBeenLastCalledWith([9]);
        expect(mocks.setVariableIds).toHaveBeenLastCalledWith([]);
    });
});
