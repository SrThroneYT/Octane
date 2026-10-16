import { GetRoomEngine, RoomControllerLevel, RoomObjectCategory } from '@octane/renderer';
import { FC } from 'react';
import { GetConfigurationValue, isSafeExternalUrl, LocalizeText, ReportType } from '../../../../api';
import { OctaneCardContentView, OctaneCardHeaderView, OctaneCardView } from '../../../../common';
import { useFurnitureExternalImageWidget, useHelp, useNotification, useRoom } from '../../../../hooks';
import { CameraWidgetShowPhotoView } from '../../../camera/views/CameraWidgetShowPhotoView';

export const FurnitureExternalImageView: FC<{}> = (props) => {
    const {
        objectId = -1,
        currentPhotoIndex = -1,
        setCurrentPhotoIndex = null,
        currentPhotos = null,
        currentObjectIds = [],
        onClose = null
    } = useFurnitureExternalImageWidget();
    const { report = null } = useHelp();
    const { roomSession = null } = useRoom();
    const { showConfirm = null } = useNotification();

    if (objectId === -1 || currentPhotoIndex === -1) return null;

    const photo = currentPhotos?.[currentPhotoIndex] ?? null;
    const photoObjectId = currentObjectIds[currentPhotoIndex] ?? objectId;
    // Official: the remove button needs room owner rights (controller level 4) or more.
    const canRemove = !!roomSession && (roomSession.isRoomOwner || roomSession.controllerLevel >= RoomControllerLevel.ROOM_OWNER);

    // Official: the report names the photographer (creator id, else the owner), not the reporter.
    const onReport = () => {
        if (!photo) return;

        report(ReportType.PHOTO, {
            extraData: photo.w,
            roomId: roomSession?.roomId ?? 0,
            reportedUserId: Number(photo.s ?? photo.oi ?? 0),
            roomObjectId: photoObjectId
        });
    };

    const onRemove = () => {
        if (!roomSession || !showConfirm) return;

        showConfirm(
            LocalizeText('inventory.remove.external_image_wallitem_body'),
            () => {
                GetRoomEngine().deleteRoomObject(photoObjectId, RoomObjectCategory.WALL);
                onClose();
            },
            null,
            LocalizeText('inventory.remove.external_image_wallitem_delete'),
            null,
            LocalizeText('inventory.remove.external_image_wallitem_header')
        );
    };

    const handleOpenFullPhoto = () => {
        const photoUrl = (photo?.w ?? '').replace('_small.png', '.png');
        if (photoUrl && isSafeExternalUrl(photoUrl)) {
            window.open(photoUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <OctaneCardView
            isResizable={false}
            className="octane-external-image-widget min-w-0 max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)]"
            uniqueKey="photo-viewer"
            theme="primary-slim"
        >
            <OctaneCardHeaderView
                headerText={LocalizeText('camera.interface.title')}
                isGalleryPhoto={true}
                onCloseClick={onClose}
                onReportPhoto={onReport}
            />
            <OctaneCardContentView>
                <CameraWidgetShowPhotoView
                    currentIndex={currentPhotoIndex}
                    currentPhotos={currentPhotos}
                    onClick={handleOpenFullPhoto}
                    onIndexChange={setCurrentPhotoIndex}
                />
                {canRemove && (
                    <div className="flex justify-end">
                        <button className="octane-external-image-widget__remove" type="button" onClick={onRemove}>
                            {LocalizeText('inventory.remove.external_image_wallitem_delete')}
                        </button>
                    </div>
                )}
            </OctaneCardContentView>
        </OctaneCardView>
    );
};
