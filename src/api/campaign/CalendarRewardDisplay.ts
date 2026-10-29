import { GetRoomEngine, GetSessionDataManager } from '@octane/renderer';
import { GetConfigurationValue } from '../octane';
import { ICalendarItem } from './ICalendarItem';

/** The inventory icon of a floor or wall furni by classname, or null when furnidata does not know it. */
export const getFurnitureIconUrl = (className: string): string => {
    if (!className) return null;

    const floorData = GetSessionDataManager().getFloorItemDataByName(className);

    if (floorData) return GetRoomEngine().getFurnitureFloorIconUrl(floorData.id);

    const wallData = GetSessionDataManager().getWallItemDataByName(className);

    return wallData ? GetRoomEngine().getFurnitureWallIconUrl(wallData.id) : null;
};

/**
 * The name of a received calendar reward: the product's localized name when the product name is a known product
 * code (a furni classname, for example), otherwise the text the hotel gave the reward.
 */
export const getCalendarRewardName = (reward: ICalendarItem): string => {
    if (!reward) return '';

    return GetSessionDataManager().getProductData(reward.productName)?.name || reward.productName || '';
};

/** The picture of a received calendar reward: its custom image from the image library, else the furni icon. */
export const getCalendarRewardImageUrl = (reward: ICalendarItem): string => {
    if (!reward) return null;
    if (reward.customImage) return GetConfigurationValue<string>('image.library.url') + reward.customImage;

    return getFurnitureIconUrl(reward.furnitureClassName) ?? getFurnitureIconUrl(reward.productName);
};
