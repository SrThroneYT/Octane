import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ placed: [] as unknown[] }));

vi.mock('@octane/renderer', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@octane/renderer')>()),
    MouseEventType: { MOUSE_DOWN: 'mousedown', MOUSE_UP: 'mouseup', ROLL_OUT: 'mouseout' }
}));

vi.mock('../../../../api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../../../api')>()),
    attemptItemPlacement: (group: unknown) => state.placed.push(group),
    getWiredChestOverlayColor: () => null
}));

vi.mock('../../../../common', () => ({ LayoutLimitedEditionStyledNumberView: () => null }));

vi.mock('../../../../layout', () => ({
    classNames: (...names: unknown[]) => names.filter(Boolean).join(' '),
    InfiniteGrid: {
        Item: ({ children, itemActive: _a, itemCount: _c, itemImage: _i, itemUniqueNumber: _u, itemUnseen: _s, ...props }: any) => (
            <button type="button" {...props}>
                {children}
            </button>
        )
    }
}));

import { useRecyclerStore } from '../../../../state/recyclerStore';
import { InventoryFurnitureItemView } from './InventoryFurnitureItemView';

const groupItem = (recyclable: boolean) =>
    ({
        name: 'chair',
        iconUrl: 'chair.png',
        category: 1,
        hasUnseenItems: false,
        stuffData: { uniqueNumber: 0, rarityLevel: -1 },
        items: [{ id: 1, recyclable, locked: false }],
        getUnlockedCount: () => 1
    }) as any;

const renderTile = (group = groupItem(true)) => render(<InventoryFurnitureItemView groupItem={group} isActive onSelect={() => undefined} />);

afterEach(() => {
    cleanup();
    act(() => useRecyclerStore.setState({ offerGroup: null }));
});

beforeEach(() => {
    state.placed.length = 0;
});

describe('inventory furni tile while the recycler page is open (AIR RecyclerModel.running)', () => {
    it('goes into the recycler on double-click, and dragging it out still starts the placement', () => {
        const offered: unknown[] = [];

        act(() => useRecyclerStore.setState({ offerGroup: (group) => offered.push(group) > 0 }));

        const group = groupItem(true);
        const tile = renderTile(group).getByRole('button');

        fireEvent.doubleClick(tile);

        expect(offered).toEqual([group]);
        expect(state.placed).toEqual([]);

        // The recycler takes the placement when it is let go over its slots.
        fireEvent.mouseDown(tile);
        fireEvent.mouseOut(tile);

        expect(state.placed).toEqual([group]);
    });

    it('is placed in the room as usual when the furni cannot be recycled', () => {
        act(() => useRecyclerStore.setState({ offerGroup: () => true }));

        const tile = renderTile(groupItem(false)).getByRole('button');

        fireEvent.doubleClick(tile);

        expect(state.placed).toHaveLength(1);
    });

    it('is placed in the room as usual without the recycler page', () => {
        const tile = renderTile().getByRole('button');

        fireEvent.doubleClick(tile);

        expect(state.placed).toHaveLength(1);
    });
});
