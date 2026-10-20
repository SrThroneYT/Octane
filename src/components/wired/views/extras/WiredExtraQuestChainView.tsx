import { FC } from 'react';
import { WiredExtraNamedCodeVariableView } from './WiredExtraNamedCodeVariableView';

/** AIR's quest chain variable (QuestChainVariable): the variable's name and the chain's code (500 characters). */
export const WiredExtraQuestChainView: FC<{}> = () => (
    <WiredExtraNamedCodeVariableView codeTitleKey="wiredfurni.params.variables.quest_chain_name" maxCodeLength={500} />
);
