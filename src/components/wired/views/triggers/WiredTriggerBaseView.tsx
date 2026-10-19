import { FC, PropsWithChildren, ReactNode } from 'react';
import { WiredFurniType } from '../../../../api';
import { WiredBaseView } from '../WiredBaseView';

export interface WiredTriggerBaseViewProps {
    hasSpecialInput: boolean;
    requiresFurni: number;
    save: () => void;
    validate?: () => boolean;
    footer?: ReactNode;
    footerCollapsible?: boolean;
    selectionPreview?: ReactNode;
    /** Official: some elements open wider. */
    widthModifier?: number;
}

export const WiredTriggerBaseView: FC<PropsWithChildren<WiredTriggerBaseViewProps>> = (props) => {
    const {
        requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_NONE,
        save = null,
        validate = null,
        hasSpecialInput = false,
        children = null,
        footer = null,
        footerCollapsible = true,
        selectionPreview = null,
        widthModifier = 1
    } = props;

    const onSave = () => save && save();

    return (
        <WiredBaseView
            hasSpecialInput={hasSpecialInput}
            requiresFurni={requiresFurni}
            save={onSave}
            validate={validate}
            wiredType="trigger"
            footer={footer}
            footerCollapsible={footerCollapsible}
            selectionPreview={selectionPreview}
            widthModifier={widthModifier}
        >
            {children}
        </WiredBaseView>
    );
};
