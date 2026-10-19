import { FC, useEffect, useState } from 'react';
import { LocalizeText, localizeWithFallback, WiredFurniType } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSourcesSelector } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionUserOnFurniWithStateView: FC<{}> = () =>
{
    // As user on furni: the furni and users in the official source slots, our quantifier (0 all, 1 any) is
    // param 0; the required state in the string.
    const { trigger = null, setIntParams = null, setStringParam = null, setSourceTypes = null } = useWired();
    const [ furniSource, setFurniSource ] = useState<number>(() => trigger?.furniSourceTypes?.[0] ?? ((trigger?.selectedItems?.length ?? 0) > 0 ? 100 : 0));
    const [ userSource, setUserSource ] = useState<number>(() => trigger?.userSourceTypes?.[0] ?? 0);
    const [ quantifier, setQuantifier ] = useState<number>(() => (trigger?.intData?.[0] === 1 ? 1 : 0));
    const [ requiredState, setRequiredState ] = useState<string>(() => trigger?.stringData ?? '');

    useEffect(() =>
    {
        if(!trigger) return;

        setFurniSource(trigger.furniSourceTypes?.[0] ?? ((trigger.selectedItems?.length ?? 0) > 0 ? 100 : 0));
        setUserSource(trigger.userSourceTypes?.[0] ?? 0);
        setQuantifier(trigger.intData?.[0] === 1 ? 1 : 0);
        setRequiredState(trigger.stringData ?? '');
    }, [ trigger ]);

    const onChangeFurniSource = (next: number) => setFurniSource(next);

    const save = () =>
    {
        setIntParams([ quantifier ]);
        setSourceTypes({ furni: [ furniSource ], users: [ userSource ] });
        setStringParam(requiredState ?? '');
    };

    const requiresFurni = WiredFurniType.STUFF_SELECTION_OPTION_BY_ID;

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ requiresFurni }
            save={ save }
            footer={ (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                        <Text bold>{ LocalizeText('wiredfurni.params.quantifier_selection') }</Text>
                        { [ 0, 1 ].map(value => (
                            <label key={ value } className="flex items-center gap-1">
                                <input checked={ (quantifier === value) } className="form-check-input" name="userOnFurniWithStateQuantifier" type="radio" onChange={ () => setQuantifier(value) } />
                                <Text>{ LocalizeText(`wiredfurni.params.quantifier.users.${ value }`) }</Text>
                            </label>
                        )) }
                    </div>
                    <WiredSourcesSelector
                        showFurni={ true }
                        showUsers={ true }
                        furniSource={ furniSource }
                        userSource={ userSource }
                        onChangeFurni={ onChangeFurniSource }
                        onChangeUsers={ setUserSource } />
                </div>
            ) }>
            <div className="flex flex-col gap-1">
                <Text bold>{ localizeWithFallback('wiredfurni.params.state', 'State') }</Text>
                <input className="form-control form-control-sm" type="text" value={ requiredState } onChange={ event => setRequiredState(event.target.value) } />
            </div>
        </WiredConditionBaseView>
    );
};
