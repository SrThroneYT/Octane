import { IWiredVariableFxConfig } from '@octane/renderer';
import { wiredVariableFxStackOrder } from '../../../../api';
import { IWiredVariableFxStatusEntry, wiredVariableFxHolderKey } from '../../../../hooks';

export interface IWiredVariableFxDrawn {
    entry: IWiredVariableFxStatusEntry;
    config: IWiredVariableFxConfig;
}

/** Every fx drawn over one avatar or furni, in stack order: the first sits lowest, nearest the holder. */
export interface IWiredVariableFxEntityGroup {
    entityKey: string;
    userEntity: boolean;
    entityId: number;
    drawn: IWiredVariableFxDrawn[];
}

/**
 * AIR's stack order (StackedAdditionStack): a higher stack order sits lower, then the older fx
 * (first shown on the holder), then the config id and the variable.
 */
export const compareWiredVariableFxStack = (left: IWiredVariableFxDrawn, right: IWiredVariableFxDrawn): number =>
    wiredVariableFxStackOrder(right.config) - wiredVariableFxStackOrder(left.config) ||
    left.entry.createdAt - right.entry.createdAt ||
    left.config.configId - right.config.configId ||
    left.entry.status.variableId.localeCompare(right.entry.status.variableId);

/**
 * Pairs each status with its config and piles them up over their avatar or furni, every category
 * alike (AIR draws boss bars in the holder's stack too). A status whose config has not arrived yet
 * is skipped rather than drawn wrong.
 */
export const groupWiredVariableFxStatuses = (
    configs: Record<number, IWiredVariableFxConfig>,
    statuses: Record<string, IWiredVariableFxStatusEntry>
): IWiredVariableFxEntityGroup[] => {
    const entities = new Map<string, IWiredVariableFxEntityGroup>();

    for (const entry of Object.values(statuses)) {
        const config = configs[entry.status.configId];

        if (!config) continue;

        const entityKey = wiredVariableFxHolderKey(entry.status.userEntity, entry.status.entityId);
        let group = entities.get(entityKey);

        if (!group) {
            group = { entityKey, userEntity: entry.status.userEntity, entityId: entry.status.entityId, drawn: [] };
            entities.set(entityKey, group);
        }

        group.drawn.push({ entry, config });
    }

    for (const group of entities.values()) group.drawn.sort(compareWiredVariableFxStack);

    return [...entities.values()].sort((left, right) => left.entityKey.localeCompare(right.entityKey));
};

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
