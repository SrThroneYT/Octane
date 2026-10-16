import { GetRoomEngine, RoomEngineTriggerWidgetEvent, RoomObjectCategory, RoomObjectVariable } from '@octane/renderer';
import { useState } from 'react';
import { IPhotoData } from '../../../../api';
import { useOctaneEvent } from '../../../events';
import { useFurniRemovedEvent } from '../../engine';
import { useRoom } from '../../useRoom';

/** A photo's stored data, or null when it is not valid JSON (a broken item must not stop the viewer). */
export const parsePhotoData = (data: string): IPhotoData | null => {
    if (!data) return null;

    try {
        const parsed = JSON.parse(data);

        return parsed && typeof parsed === 'object' ? (parsed as IPhotoData) : null;
    } catch {
        return null;
    }
};

const useFurnitureExternalImageWidgetState = () => {
    const [objectId, setObjectId] = useState(-1);
    const [category, setCategory] = useState(-1);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(-1);
    const [currentPhotos, setCurrentPhotos] = useState<IPhotoData[]>([]);
    // The wall item behind each photo, in the same order: report and remove act on the one shown.
    const [currentObjectIds, setCurrentObjectIds] = useState<number[]>([]);
    const { roomSession = null } = useRoom();

    const onClose = () => {
        setObjectId(-1);
        setCategory(-1);
        setCurrentPhotoIndex(-1);
        setCurrentPhotos([]);
        setCurrentObjectIds([]);
    };

    useOctaneEvent<RoomEngineTriggerWidgetEvent>(RoomEngineTriggerWidgetEvent.REQUEST_EXTERNAL_IMAGE, (event) => {
        const roomObject = GetRoomEngine().getRoomObject(event.roomId, event.objectId, event.category);
        const roomTotalImages = GetRoomEngine().getRoomObjects(roomSession?.roomId, RoomObjectCategory.WALL);

        if (!roomObject) return;

        const datas: IPhotoData[] = [];
        const objectIds: number[] = [];

        roomTotalImages.forEach((object) => {
            if (object.type !== 'external_image_wallitem_poster_small') return null;

            const jsonData = parsePhotoData(object.model.getValue<string>(RoomObjectVariable.FURNITURE_DATA));

            if (!jsonData) return null;

            datas.push(jsonData);
            objectIds.push(object.id);
        });

        setObjectId(event.objectId);
        setCategory(event.category);
        setCurrentPhotos(datas);
        setCurrentObjectIds(objectIds);

        // The photo that was clicked: by its wall item first, then by its photo id.
        let index = objectIds.indexOf(event.objectId);

        if (index < 0) {
            const roomObjectPhotoData = parsePhotoData(roomObject.model.getValue<string>(RoomObjectVariable.FURNITURE_DATA));

            index = roomObjectPhotoData ? datas.findIndex((data) => data.u === roomObjectPhotoData.u) : -1;
        }

        setCurrentPhotoIndex(Math.max(0, index));
    });

    useFurniRemovedEvent(objectId !== -1 && category !== -1, (event) => {
        if (event.id !== objectId || event.category !== category) return;

        onClose();
    });

    return { objectId, currentPhotoIndex, setCurrentPhotoIndex, currentPhotos, currentObjectIds, onClose };
};

export const useFurnitureExternalImageWidget = useFurnitureExternalImageWidgetState;
