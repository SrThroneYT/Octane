import { FC, useCallback, useEffect, useState } from 'react';
import { LocalizeText } from '../../../../api';
import { Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredSelectorBaseView } from './WiredSelectorBaseView';
import { Checkbox } from '../../../../common/Checkbox';

/** Official UsersByName: TextAreaParam(140, -1, 20, -1, 1000), at most 20 lines of 1000 characters in all. */
export const MAX_NAMES_LENGTH = 1000;
export const MAX_NAMES_LINES = 20;

/** Official: the names are stored joined with TAB (the server also reads newlines). */
export const encodeNames = (text: string) => text.replace(/\r\n|\r|\n/g, '\t');
export const decodeNames = (stored: string) => (stored ?? '').replace(/\t/g, '\n');

/** Caps what was typed as the official text area does: 1000 characters, 20 lines. */
export const limitNamesText = (text: string) => text.slice(0, MAX_NAMES_LENGTH).split(/\r\n|\r|\n/).slice(0, MAX_NAMES_LINES).join('\n');

export const WiredSelectorUsersByNameView: FC<{}> = () => {
    const [namesText, setNamesText] = useState('');
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);
    const { trigger = null, setIntParams = null, setStringParam = null, setSelectorOptions = null } = useWired();

    useEffect(() => {
        if (!trigger) return;

        setNamesText(decodeNames(trigger.stringData || ''));
        setFilterExisting(trigger.isFilter ?? false);
        setInvert(trigger.isInvert ?? false);
    }, [trigger]);

    const save = useCallback(() => {
        setStringParam(encodeNames(namesText));
        setIntParams([]);
        setSelectorOptions({ filter: filterExisting, invert });
    }, [namesText, filterExisting, invert, setStringParam, setIntParams]);

    return (
        <WiredSelectorBaseView hasSpecialInput={true} requiresFurni={0} save={save} hideDelay={true} cardStyle={{ width: 400 }}>
            <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                    <Text bold>{LocalizeText('wiredfurni.params.enter_names')}</Text>
                    <textarea
                        className="form-control form-control-sm octane-wired__resizable-textarea"
                        maxLength={MAX_NAMES_LENGTH}
                        value={namesText}
                        onChange={(event) => setNamesText(limitNamesText(event.target.value))}
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
