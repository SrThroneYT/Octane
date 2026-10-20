import { GetSessionDataManager } from '@octane/renderer';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInventoryFurni, useWiredTrading } from '../../../../hooks';
import { InventoryWiredTradeView } from './InventoryWiredTradeView';

vi.mock('../../../../hooks', () => ({ useInventoryFurni: vi.fn(), useWiredTrading: vi.fn() }));
vi.mock('../../../../hooks/inventory/useWiredTrading', () => ({
    WIRED_TRADING_STATE_ADDING_ITEMS: 1,
    WIRED_TRADING_STATE_COUNTDOWN: 2,
    WIRED_TRADING_STATE_CONFIRMING: 3,
    WIRED_TRADING_STATE_CONFIRMED: 4,
}));
vi.mock('./InventoryFurnitureSearchView', () => ({
    InventoryFurnitureSearchView: ({ groupItems, setGroupItems }: any) => {
        useEffect(() => setGroupItems(groupItems), [groupItems, setGroupItems]);
        return null;
    },
}));

const CLASS_BY_TYPE: Record<number, string> = { 30: 'chair_basic', 90: 'CF_50_goldbar' };

const group = (type: number, name: string, ids: number[]) => ({
    type,
    name,
    isWallItem: false,
    category: 1,
    iconUrl: `${ name }.png`,
    stuffData: { uniqueNumber: 0, getLegacyString: () => '' },
    getUnlockedCount: () => ids.length,
    getTradeItems: (count: number) => ids.slice(0, count).map((id) => ({ id })),
});

const tableItem = (itemId: number, spriteId: number) => ({
    itemId,
    ref: itemId,
    spriteId,
    isWallItem: false,
    isGroupable: true,
    stuffData: { getLegacyString: () => '' },
});

const trading = (overrides: Record<string, unknown> = {}) => ({
    requirementType: 0,
    youGetText: '',
    layoutType: 'generic',
    giveRules: [],
    getRule: null,
    rulesType: 0,
    multiplier: 1,
    autoMultiplierMax: 0,
    showRequirements: false,
    setShowRequirements: vi.fn(),
    requirementsHighlight: 0,
    state: 1,
    canAccept: false,
    extra: 0,
    secondsLeft: 300,
    countdown: 0,
    offeredItems: [],
    offeredCredits: 0,
    rewardItems: [],
    rewardCredits: 0,
    offerItems: vi.fn(),
    withdrawItem: vi.fn(),
    progress: vi.fn(),
    cancel: vi.fn(),
    ...overrides,
});

const chair = group(30, 'Chair', [11, 12]);
const goldBar = group(90, 'Gold bar', [21, 22, 23]);

afterEach(cleanup);

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(GetSessionDataManager).mockReturnValue({
        getFloorItemData: (id: number) => ({ className: CLASS_BY_TYPE[id] ?? '' }),
        getWallItemData: () => null,
    } as any);
    vi.mocked(useInventoryFurni).mockReturnValue({ groupItems: [chair, goldBar] } as any);
});

describe('InventoryWiredTradeView', () => {
    it('a coin chest deposit offers credit furni from the inventory and shows the payment picture', () => {
        const state = trading({ offeredItems: [tableItem(21, 90), tableItem(22, 90)], offeredCredits: 100, canAccept: true });
        vi.mocked(useWiredTrading).mockReturnValue(state as any);

        const { container } = render(<InventoryWiredTradeView />);

        // The chair cannot go into a coin chest; the gold bar can.
        const items = container.querySelectorAll('.layout-grid-item');
        expect(items[0].className).toContain('opacity-50');
        expect(items[1].className).not.toContain('opacity-50');

        fireEvent.doubleClick(items[1]);
        expect(state.offerItems).toHaveBeenCalledWith([21]);
        fireEvent.doubleClick(items[0]);
        expect(state.offerItems).toHaveBeenCalledTimes(1);

        // One slot for the two gold bars, with its count, and the table's totals.
        expect(container.querySelectorAll('.octane-wired-trade-slot.is-filled')).toHaveLength(1);
        expect(container.querySelector('.octane-wired-trade-slot-count')?.textContent).toBe('2');
        expect(container.querySelector('.octane-wired-trade-count.is-credits')?.textContent).toContain('100');

        // A deposit hands nothing back: AIR shows the payment picture instead of "you receive".
        expect(container.querySelector('.octane-wired-trade-offers.is-payment img')).not.toBeNull();
        expect(container.querySelector('.octane-wired-trade-offers.is-receive')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        expect(state.progress).toHaveBeenCalled();
    });

    it('a furni chest deposit takes the chair, not the credit furni, and the offer button sends the amount', () => {
        const state = trading({ requirementType: 1 });
        vi.mocked(useWiredTrading).mockReturnValue(state as any);

        const { container } = render(<InventoryWiredTradeView />);
        const items = container.querySelectorAll('.layout-grid-item');
        expect(items[0].className).not.toContain('opacity-50');
        expect(items[1].className).toContain('opacity-50');

        fireEvent.click(items[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Offer' }));
        expect(state.offerItems).toHaveBeenCalledWith([11]);

        // Accept waits for something on the table.
        expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
    });

    it('a contract with a reward shows what you receive and double click takes one back off the table', () => {
        const state = trading({
            requirementType: 4,
            giveRules: [{ nodes: [{ type: 1, amount: 1, itemType: { isWallItem: false, typeId: 30, legacyPosterId: '' } }] }],
            getRule: { nodes: [{ type: 0, amount: 5 }] },
            offeredItems: [tableItem(11, 30)],
            rewardCredits: 5,
        });
        vi.mocked(useWiredTrading).mockReturnValue(state as any);

        const { container } = render(<InventoryWiredTradeView />);

        expect(container.querySelector('.octane-wired-trade-offers.is-receive')).not.toBeNull();
        expect(container.querySelector('.octane-wired-trade-offers.is-payment')).toBeNull();

        fireEvent.doubleClick(container.querySelector('.octane-wired-trade-offers.is-own .octane-wired-trade-slot.is-filled'));
        expect(state.withdrawItem).toHaveBeenCalledWith(11);
    });

    it('the requirements button opens AIR\'s bubble', () => {
        const state = trading({ showRequirements: true, requirementType: 1 });
        vi.mocked(useWiredTrading).mockReturnValue(state as any);

        render(<InventoryWiredTradeView />);

        expect(screen.getByRole('dialog').textContent).toContain('Any amount of furni');
        fireEvent.click(screen.getByRole('button', { name: 'Payment requirements' }));
        expect(state.setShowRequirements).toHaveBeenCalledWith(false);
    });
});
