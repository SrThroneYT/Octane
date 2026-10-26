/* @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const wheel = vi.hoisted(() => ({ finishSpin: vi.fn(), pendingPrizeId: -1 }));

vi.mock('@octane/renderer', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    AddLinkEventTracker: vi.fn(),
    RemoveLinkEventTracker: vi.fn()
}));
vi.mock('../../hooks', () => ({
    useHasPermission: () => false,
    useFortuneWheel: () => ({
        freeSpins: 0,
        extraSpins: 0,
        spinCost: 0,
        spinCostType: -1,
        prizes: [{ id: 4 }, { id: 5 }],
        recentWins: [],
        pendingPrizeId: wheel.pendingPrizeId,
        isSpinning: wheel.pendingPrizeId >= 0,
        open: vi.fn(),
        spin: vi.fn(),
        buySpin: vi.fn(),
        finishSpin: wheel.finishSpin
    })
}));

import { FortuneWheelView } from './FortuneWheelView';

describe('FortuneWheelView', () => {
    it('ends a spin whose result arrives while the window is closed, so the wheel is not stuck', () => {
        wheel.pendingPrizeId = 5;

        render(<FortuneWheelView />);

        expect(wheel.finishSpin).toHaveBeenCalledTimes(1);
    });
});
