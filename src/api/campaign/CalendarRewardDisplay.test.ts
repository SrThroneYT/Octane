import { GetRoomEngine, GetSessionDataManager } from '@octane/renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../octane', () => ({ GetConfigurationValue: () => 'https://images/' }));

import { CalendarItem } from './CalendarItem';
import { getCalendarRewardImageUrl, getCalendarRewardName } from './CalendarRewardDisplay';

const sessionData = (products: Record<string, string>, floor: Record<string, number> = {}) =>
    vi.mocked(GetSessionDataManager).mockReturnValue({
        getProductData: (code: string) => (products[code] ? { name: products[code] } : null),
        getFloorItemDataByName: (name: string) => (floor[name] ? { id: floor[name] } : null),
        getWallItemDataByName: () => null
    } as never);

afterEach(() => vi.mocked(GetSessionDataManager).mockReset());

describe('calendar reward name and picture', () => {
    it('names a known product by its localized name, anything else by the text the hotel gave it', () => {
        sessionData({ throne: 'Troon' });

        expect(getCalendarRewardName(new CalendarItem('throne', '', 'throne'))).toBe('Troon');
        expect(getCalendarRewardName(new CalendarItem('50 credits', '', ''))).toBe('50 credits');
        expect(getCalendarRewardName(null)).toBe('');
    });

    it('shows the custom image from the image library, else the furni icon', () => {
        sessionData({}, { throne: 7 });
        vi.mocked(GetRoomEngine).mockReturnValue({ getFurnitureFloorIconUrl: (id: number) => `icon-${id}` } as never);

        expect(getCalendarRewardImageUrl(new CalendarItem('50 credits', 'calendar/credits.png', ''))).toBe('https://images/calendar/credits.png');
        expect(getCalendarRewardImageUrl(new CalendarItem('Troon', '', 'throne'))).toBe('icon-7');
        expect(getCalendarRewardImageUrl(new CalendarItem('50 credits', '', ''))).toBeNull();
    });
});
