/* @vitest-environment jsdom */
import { GetRoomEngine, GetRoomSessionManager, GetSessionDataManager, RoomEngineTriggerWidgetEvent } from '@octane/renderer';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMockEventDispatcher, mockEventDispatcher } from '../../../../octane-renderer.mock';
import { useFurnitureStackHeightWidget } from './useFurnitureStackHeightWidget';

const setUp = (playTestMode: boolean, freeFurniMovements: boolean) => {
    const session = { roomId: 1, isRoomOwner: true, controllerLevel: 0, playTestMode };

    vi.mocked(GetRoomSessionManager).mockReturnValue({ getSession: () => session } as never);
    vi.mocked(GetSessionDataManager).mockReturnValue({ hasPermission: () => false, userId: 7 } as never);
    vi.mocked(GetRoomEngine).mockReturnValue({
        activeRoomHasFreeFurniMovementsMode: freeFurniMovements,
        getRoomObject: () => ({ getLocation: () => ({ z: 1.5 }), model: { getValue: (): number => 0 } })
    } as never);
};

const requestStackHeight = () =>
    act(() => {
        mockEventDispatcher.dispatchEvent({ type: RoomEngineTriggerWidgetEvent.REQUEST_STACK_HEIGHT, roomId: 1, objectId: 5, category: 10 } as never);
    });

describe('useFurnitureStackHeightWidget in playtest (the hotel rule beyond AIR)', () => {
    beforeEach(() => clearMockEventDispatcher());

    afterEach(() => {
        cleanup();
        vi.mocked(GetRoomSessionManager).mockReset();
        vi.mocked(GetSessionDataManager).mockReset();
        vi.mocked(GetRoomEngine).mockReset();
    });

    it('opens for the room owner in normal play', () => {
        setUp(false, false);
        const { result } = renderHook(() => useFurnitureStackHeightWidget());

        requestStackHeight();

        expect(result.current.objectId).toBe(5);
        expect(result.current.height).toBe(1.5);
    });

    it('stays closed for the room owner in playtest', () => {
        setUp(true, false);
        const { result } = renderHook(() => useFurnitureStackHeightWidget());

        requestStackHeight();

        expect(result.current.objectId).toBe(-1);
    });

    it('opens in playtest when the room has free furni movements', () => {
        setUp(true, true);
        const { result } = renderHook(() => useFurnitureStackHeightWidget());

        requestStackHeight();

        expect(result.current.objectId).toBe(5);
    });
});
