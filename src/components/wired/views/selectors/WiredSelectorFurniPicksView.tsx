import { FC, useCallback } from 'react';
import { WiredFurniType } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';

export const WiredSelectorFurniPicksView: FC<{}> = () => {
    const { setIntParams = null } = useWired();

    const save = useCallback(() => {
        setIntParams([]);
    }, [setIntParams]);

    return (
        <WiredSelectorBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID}
            save={save}
            hideDelay={true}
            cardStyle={{ width: 400 }}
         />
    );
};
