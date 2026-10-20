import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { WiredFurniType, WiredSelectionVisualizer } from '../../../../api';
import { useWired } from '../../../../hooks';
import { WiredFurniSelectionSourceRow } from '../WiredFurniSelectionSourceRow';
import { FURNI_SOURCES, sortWiredSourceOptions, WiredSourceOption } from '../WiredSourcesSelector';
import { WiredConditionBaseView } from './WiredConditionBaseView';

const SOURCE_TRIGGER = 0;
const SOURCE_SELECTED = 100;
const SOURCE_SECONDARY_SELECTED = 101;
const FURNI_DELIMITER = ';';

const MATCH_FURNI_SOURCES: WiredSourceOption[] = sortWiredSourceOptions(
    [...FURNI_SOURCES, { value: SOURCE_SECONDARY_SELECTED, label: 'wiredfurni.params.sources.furni.101' }],
    'furni'
);

type SelectionMode = 'primary' | 'secondary';

const parseIds = (data: string): number[] => {
    if (!data || !data.length) return [];

    const ids = new Set<number>();

    for (const part of data.split(/[;,\t]/)) {
        const trimmed = part.trim();
        if (!trimmed.length) continue;

        const value = parseInt(trimmed, 10);
        if (!isNaN(value) && value > 0) ids.add(value);
    }

    return Array.from(ids);
};

const serializeIds = (ids: number[]): string => {
    if (!ids || !ids.length) return '';

    return ids.filter((id) => id > 0).join(FURNI_DELIMITER);
};

export const WiredConditionFurniIsOfTypeView: FC = () => {
    const [matchSource, setMatchSource] = useState<number>(SOURCE_TRIGGER);
    const [compareSource, setCompareSource] = useState<number>(SOURCE_TRIGGER);
    const [primaryFurniIds, setPrimaryFurniIds] = useState<number[]>([]);
    const [secondaryFurniIds, setSecondaryFurniIds] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('primary');

    const highlightedIds = useRef<number[]>([]);

    // Official layout: the picks are the types to match (our secondary set), the furni checked come from the
    // official source slot, the quantifier in its slot (the base view's); ours follow: [type source] and the furni
    // checked as picks in the string.
    const { trigger = null, furniIds = [], setFurniIds, setIntParams, setStringParam, setAllowsFurni, setSourceTypes } = useWired();

    // AIR tints by pick list: the first slot's picks (source 100, AIR stuffIds) the first tint, the second slot's
    // (source 101, AIR stuffIds2) the blue one. Ours carry the 101 types in stuffIds and the 100 picks in the
    // string, so the tint follows the source, not our wire list.
    const syncHighlights = useCallback((nextPrimaryIds: number[], nextSecondaryIds: number[]) => {
        highlightedIds.current = WiredSelectionVisualizer.showPickLists(highlightedIds.current, nextPrimaryIds, nextSecondaryIds);
    }, []);

    const switchSelection = useCallback(
        (mode: SelectionMode) => {
            const canEditPrimary = matchSource === SOURCE_SELECTED || compareSource === SOURCE_SELECTED;
            const canEditSecondary = matchSource === SOURCE_SECONDARY_SELECTED || compareSource === SOURCE_SECONDARY_SELECTED;

            if (mode === 'primary' && !canEditPrimary) return;
            if (mode === 'secondary' && !canEditSecondary) return;

            const nextPrimaryIds = selectionMode === 'primary' ? [...furniIds] : [...primaryFurniIds];
            const nextSecondaryIds = selectionMode === 'secondary' ? [...furniIds] : [...secondaryFurniIds];

            setPrimaryFurniIds(nextPrimaryIds);
            setSecondaryFurniIds(nextSecondaryIds);
            setSelectionMode(mode);
            setFurniIds([...(mode === 'primary' ? nextPrimaryIds : nextSecondaryIds)]);
        },
        [selectionMode, furniIds, matchSource, compareSource, primaryFurniIds, secondaryFurniIds, setFurniIds]
    );

    useEffect(() => {
        if (!trigger) return;

        const nextPrimaryIds = parseIds(trigger.stringData);
        const nextSecondaryIds = [...(trigger.selectedItems ?? [])];
        const nextMatchSource = trigger.furniSourceTypes?.[0] ?? (nextPrimaryIds.length ? SOURCE_SELECTED : SOURCE_TRIGGER);
        const nextCompareSource = trigger.intData.length >= 1 ? trigger.intData[0] : SOURCE_SECONDARY_SELECTED;

        setMatchSource(nextMatchSource);
        setCompareSource(nextCompareSource);
        setPrimaryFurniIds(nextPrimaryIds);
        setSecondaryFurniIds(nextSecondaryIds);
        setSelectionMode('primary');
        setFurniIds([...nextPrimaryIds]);
    }, [trigger, setFurniIds]);

    useEffect(() => {
        if (selectionMode === 'primary') setPrimaryFurniIds(furniIds);
        else setSecondaryFurniIds(furniIds);
    }, [furniIds, selectionMode]);

    useEffect(() => {
        syncHighlights(primaryFurniIds, secondaryFurniIds);
    }, [primaryFurniIds, secondaryFurniIds, syncHighlights]);

    useEffect(() => {
        WiredSelectionVisualizer.setEditingPickList(selectionMode === 'secondary' ? 2 : 1);
    }, [selectionMode]);

    useEffect(() => {
        const canEditPrimary = matchSource === SOURCE_SELECTED || compareSource === SOURCE_SELECTED;
        const canEditSecondary = matchSource === SOURCE_SECONDARY_SELECTED || compareSource === SOURCE_SECONDARY_SELECTED;

        if (selectionMode === 'primary' && !canEditPrimary && canEditSecondary) {
            switchSelection('secondary');
            return;
        }

        if (selectionMode === 'secondary' && !canEditSecondary && canEditPrimary) {
            switchSelection('primary');
            return;
        }

        const canEditCurrent = selectionMode === 'primary' ? canEditPrimary : canEditSecondary;

        setAllowsFurni(canEditCurrent ? WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE : WiredFurniType.STUFF_SELECTION_OPTION_NONE);
    }, [selectionMode, matchSource, compareSource, switchSelection, setAllowsFurni]);

    useEffect(() => {
        return () => {
            WiredSelectionVisualizer.setEditingPickList(1);

            if (!highlightedIds.current.length) return;

            WiredSelectionVisualizer.clearSelectionShaderFromFurni(highlightedIds.current);
            WiredSelectionVisualizer.clearSecondarySelectionShaderFromFurni(highlightedIds.current);
            highlightedIds.current = [];
        };
    }, []);

    const save = useCallback(() => {
        const nextPrimaryIds = selectionMode === 'primary' ? [...furniIds] : [...primaryFurniIds];
        const nextSecondaryIds = selectionMode === 'secondary' ? [...furniIds] : [...secondaryFurniIds];

        setPrimaryFurniIds(nextPrimaryIds);
        setSecondaryFurniIds(nextSecondaryIds);

        // The picks sent are the types; the furni checked as picks travel in the string.
        setFurniIds(compareSource === SOURCE_SECONDARY_SELECTED ? [...nextSecondaryIds] : []);
        // Keep the live picks and the selection mode together if the window stays open.
        setSelectionMode('secondary');
        setIntParams([compareSource]);
        setStringParam(matchSource === SOURCE_SELECTED ? serializeIds(nextPrimaryIds) : '');
        setSourceTypes({ furni: [matchSource], users: [] });
    }, [selectionMode, furniIds, primaryFurniIds, matchSource, compareSource, secondaryFurniIds, setFurniIds, setIntParams, setStringParam, setSourceTypes]);

    const selectionLimit = trigger?.maximumItemSelectionCount ?? 0;

    return (
        <WiredConditionBaseView
            hasSpecialInput={true}
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_OR_BY_TYPE}
            save={save}
            selectionPreview={
                <div className="flex flex-col gap-2">
                    <WiredFurniSelectionSourceRow
                        title="wiredfurni.params.sources.furni.title.match.0"
                        options={MATCH_FURNI_SOURCES}
                        value={matchSource}
                        selectionKind="primary"
                        selectionActive={selectionMode === 'primary'}
                        selectionCount={primaryFurniIds.length}
                        selectionLimit={selectionLimit}
                        selectionEnabledValues={[SOURCE_SELECTED]}
                        onChange={setMatchSource}
                        onSelectionActivate={() => switchSelection('primary')}
                    />
                    <WiredFurniSelectionSourceRow
                        title="wiredfurni.params.sources.furni.title.match.1"
                        options={MATCH_FURNI_SOURCES}
                        value={compareSource}
                        selectionKind="secondary"
                        selectionActive={selectionMode === 'secondary'}
                        selectionCount={secondaryFurniIds.length}
                        selectionLimit={selectionLimit}
                        selectionEnabledValues={[SOURCE_SECONDARY_SELECTED]}
                        onChange={setCompareSource}
                        onSelectionActivate={() => switchSelection('secondary')}
                    />
                </div>
            }
        />
    );
};
