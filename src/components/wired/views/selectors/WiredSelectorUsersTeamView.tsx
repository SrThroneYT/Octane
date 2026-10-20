import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredIconRadioGroup } from '../WiredMoveIconRadios';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';
import { Checkbox } from '../../../../common/Checkbox';

// Official: "any team" on a row of its own, then the teams 1-4 in 2 columns.
const TEAM_TYPES = [1, 2, 3, 4];

export const WiredSelectorUsersTeamView: FC<{}> = () => {
    const [teamType, setTeamType] = useState(0);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);
    const { trigger = null, setIntParams = null, setSelectorOptions = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        const params = trigger.intData;

        setTeamType(params.length > 0 ? params[0] : 0);
        setFilterExisting(trigger.isFilter ?? false);
        setInvert(trigger.isInvert ?? false);
    }, [trigger]);

    const save = useCallback(() => {
        setIntParams([teamType]);
        setSelectorOptions({ filter: filterExisting, invert });
    }, [teamType, filterExisting, invert, setIntParams]);

    return (
        <WiredSelectorBaseView hasSpecialInput={true} requiresFurni={0} save={save} hideDelay={true} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.team')}</Text>
                    <WiredIconRadioGroup
                        columns={2}
                        name="usersTeamSelector"
                        options={[
                            { value: 0, label: LocalizeText('wiredfurni.params.team.any'), newLine: true },
                            ...TEAM_TYPES.map((value) => ({ value, label: LocalizeText(`wiredfurni.params.team.${value}`) }))
                        ]}
                        value={teamType}
                        onChange={setTeamType}
                    />
                </div>

                <hr className="m-0 bg-dark" />

                <Text bold>{LocalizeText('wiredfurni.params.selector_options_selector')}</Text>

                <label className="flex items-center gap-2">
                    <Checkbox checked={filterExisting} onCheckedChange={(nextChecked) => setFilterExisting(nextChecked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.0')}</Text>
                </label>

                <label className="flex items-center gap-2">
                    <Checkbox checked={invert} onCheckedChange={(nextChecked) => setInvert(nextChecked)} />
                    <Text small>{LocalizeText('wiredfurni.params.selector_option.1')}</Text>
                </label>
            </div>
        </WiredSelectorBaseView>
    );
};
