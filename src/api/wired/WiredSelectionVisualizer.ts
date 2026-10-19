import { GetRoomEngine, IRoomObject, IRoomObjectSpriteVisualization, RoomObjectCategory, WiredFilter } from '@octane/renderer';

/*
 * The official picked-furni look (RoomObjectHighLighter): a colour matrix that keeps a quarter of the furni's colour
 * and adds 115.5 / 141 / 141, then the furnitureFilter shader turns what was black (the outline) white. As a mix that
 * is 75 % towards 154 / 188 / 188.
 */
const PICKED_LOOK = { lineColor: [1, 1, 1] as [number, number, number], color: [154 / 255, 188 / 255, 188 / 255] as [number, number, number], mix: 0.75 };

export class WiredSelectionVisualizer {
    private static _selectionShader: WiredFilter = new WiredFilter(PICKED_LOOK);
    // Official dual picking, second set: the picked look, then blue x 1.15 + 40.
    private static _secondarySelectionShader: WiredFilter = new WiredFilter({ ...PICKED_LOOK, scale: [1, 1, 1.15], offset: [0, 0, 40 / 255] });
    // Official highlightActiveWired(): the open box gets red x 0.9, green + 40, blue + 80 at 80 % alpha.
    private static _activeWiredShader: WiredFilter = new WiredFilter({
        lineColor: [0, 0, 0],
        color: [0, 0, 0],
        mix: 0,
        replaceLine: false,
        scale: [0.9, 1, 1],
        offset: [0, 40 / 255, 80 / 255],
        alpha: 0.8
    });
    private static _activeWiredId: number = null;
    private static _variableHighlightShader: WiredFilter = new WiredFilter({
        lineColor: [0.52, 0.92, 1],
        color: [0.2, 0.7, 1]
    });
    /**
     * What should be highlighted, by "category:objectId". A furni's sprites can be rebuilt (a state
     * change, an animation frame), which drops the filter; {@link refresh} puts it back.
     */
    private static _intended: Map<string, Set<WiredFilter>> = new Map();

    private static remember(category: number, objectId: number, filter: WiredFilter): void {
        const key = `${category}:${objectId}`;
        let filters = WiredSelectionVisualizer._intended.get(key);

        if (!filters) WiredSelectionVisualizer._intended.set(key, (filters = new Set()));

        filters.add(filter);
    }

    private static forget(category: number, objectId: number, filter: WiredFilter): void {
        const key = `${category}:${objectId}`;
        const filters = WiredSelectionVisualizer._intended.get(key);

        if (!filters) return;

        filters.delete(filter);

        if (!filters.size) WiredSelectionVisualizer._intended.delete(key);
    }

    /** Official highlightActiveWired(): marks the box whose editor is open; one at a time. */
    public static highlightActiveWired(furniId: number): void {
        if (WiredSelectionVisualizer._activeWiredId !== null && WiredSelectionVisualizer._activeWiredId !== furniId) {
            WiredSelectionVisualizer.unhighlightActiveWired(WiredSelectionVisualizer._activeWiredId);
        }

        WiredSelectionVisualizer._activeWiredId = furniId;
        WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._activeWiredShader);
    }

    public static unhighlightActiveWired(furniId: number): void {
        if (WiredSelectionVisualizer._activeWiredId === furniId) WiredSelectionVisualizer._activeWiredId = null;

        WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), WiredSelectionVisualizer._activeWiredShader);
    }

    /** Puts every intended highlight back on the furni's current sprites. */
    public static refresh(): void {
        if (WiredSelectionVisualizer._activeWiredId !== null) {
            WiredSelectionVisualizer.applySelectionShader(
                WiredSelectionVisualizer.getRoomObject(WiredSelectionVisualizer._activeWiredId),
                WiredSelectionVisualizer._activeWiredShader
            );
        }

        for (const [key, filters] of WiredSelectionVisualizer._intended) {
            const [category, objectId] = key.split(':').map(Number);
            const roomObject = WiredSelectionVisualizer.getRoomObjectByCategory(objectId, category);

            for (const filter of filters) WiredSelectionVisualizer.applySelectionShader(roomObject, filter);
        }
    }

    private static showFurni(furniId: number, filter: WiredFilter): void {
        WiredSelectionVisualizer.remember(RoomObjectCategory.FLOOR, furniId, filter);
        WiredSelectionVisualizer.applySelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), filter);
    }

    private static hideFurni(furniId: number, filter: WiredFilter): void {
        WiredSelectionVisualizer.forget(RoomObjectCategory.FLOOR, furniId, filter);
        WiredSelectionVisualizer.clearSelectionShader(WiredSelectionVisualizer.getRoomObject(furniId), filter);
    }

    public static show(furniId: number): void {
        WiredSelectionVisualizer.showFurni(furniId, WiredSelectionVisualizer._selectionShader);
    }

    public static hide(furniId: number): void {
        WiredSelectionVisualizer.hideFurni(furniId, WiredSelectionVisualizer._selectionShader);
        WiredSelectionVisualizer.hideFurni(furniId, WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static showSecondary(furniId: number): void {
        WiredSelectionVisualizer.showFurni(furniId, WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static hideSecondary(furniId: number): void {
        WiredSelectionVisualizer.hideFurni(furniId, WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static clearSelectionShaderFromFurni(furniIds: number[]): void {
        for (const furniId of furniIds) WiredSelectionVisualizer.hideFurni(furniId, WiredSelectionVisualizer._selectionShader);
    }

    public static applySelectionShaderToFurni(furniIds: number[]): void {
        for (const furniId of furniIds) WiredSelectionVisualizer.showFurni(furniId, WiredSelectionVisualizer._selectionShader);
    }

    public static clearSecondarySelectionShaderFromFurni(furniIds: number[]): void {
        for (const furniId of furniIds) WiredSelectionVisualizer.hideFurni(furniId, WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static applySecondarySelectionShaderToFurni(furniIds: number[]): void {
        for (const furniId of furniIds) WiredSelectionVisualizer.showFurni(furniId, WiredSelectionVisualizer._secondarySelectionShader);
    }

    public static clearAllSelectionShaders(): void {
        WiredSelectionVisualizer._intended.clear();

        const roomEngine = GetRoomEngine();
        const roomId = roomEngine.activeRoomId;

        if (roomId < 0) return;

        const roomObjects = [
            ...roomEngine.getRoomObjects(roomId, RoomObjectCategory.FLOOR),
            ...roomEngine.getRoomObjects(roomId, RoomObjectCategory.WALL),
            ...roomEngine.getRoomObjects(roomId, RoomObjectCategory.UNIT)
        ];

        for (const roomObject of roomObjects) {
            WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._selectionShader);
            WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._secondarySelectionShader);
            WiredSelectionVisualizer.clearSelectionShader(roomObject, WiredSelectionVisualizer._variableHighlightShader);
        }
    }

    public static applyVariableHighlightToObjects(objects: Array<{ category: number; objectId: number }>): void {
        for (const object of objects) {
            WiredSelectionVisualizer.remember(object.category, object.objectId, WiredSelectionVisualizer._variableHighlightShader);
            WiredSelectionVisualizer.applySelectionShader(
                WiredSelectionVisualizer.getRoomObjectByCategory(object.objectId, object.category),
                WiredSelectionVisualizer._variableHighlightShader
            );
        }
    }

    public static clearVariableHighlightFromObjects(objects: Array<{ category: number; objectId: number }>): void {
        for (const object of objects) {
            WiredSelectionVisualizer.forget(object.category, object.objectId, WiredSelectionVisualizer._variableHighlightShader);
            WiredSelectionVisualizer.clearSelectionShader(
                WiredSelectionVisualizer.getRoomObjectByCategory(object.objectId, object.category),
                WiredSelectionVisualizer._variableHighlightShader
            );
        }
    }

    private static getRoomObject(objectId: number): IRoomObject {
        const roomEngine = GetRoomEngine();

        return roomEngine.getRoomObject(roomEngine.activeRoomId, objectId, RoomObjectCategory.FLOOR);
    }

    private static getRoomObjectByCategory(objectId: number, category: number): IRoomObject {
        const roomEngine = GetRoomEngine();

        return roomEngine.getRoomObject(roomEngine.activeRoomId, objectId, category);
    }

    private static applySelectionShader(roomObject: IRoomObject, filter: WiredFilter): void {
        if (!roomObject) return;

        const visualization = roomObject.visualization as IRoomObjectSpriteVisualization;

        if (!visualization) return;

        let changed = false;

        for (const sprite of visualization.sprites) {
            if (sprite.blendMode === 'add') continue;

            const filters = sprite.filters || [];

            if (filters.includes(filter)) continue;

            // A new list goes through the sprite's setter, which marks the sprite for a redraw.
            sprite.filters = [...filters, filter];
            changed = true;
        }

        // The room canvas only redraws an object whose visualization reports a change.
        if (changed) visualization.updateSpriteCounter++;
    }

    private static clearSelectionShader(roomObject: IRoomObject, filter: WiredFilter): void {
        if (!roomObject) return;

        const visualization = roomObject.visualization as IRoomObjectSpriteVisualization;

        if (!visualization) return;

        let changed = false;

        for (const sprite of visualization.sprites) {
            if (!sprite.filters || !sprite.filters.includes(filter)) continue;

            sprite.filters = sprite.filters.filter((current) => current !== filter);
            changed = true;
        }

        if (changed) visualization.updateSpriteCounter++;
    }
}
