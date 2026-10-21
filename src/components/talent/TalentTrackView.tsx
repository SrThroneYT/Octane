import { GetSessionDataManager } from '@octane/renderer';
import { FC, useEffect, useRef } from 'react';
import {
    GetConfigurationValue,
    getAchievementBaseCode,
    getCurrentLevelIndex,
    getTalentLevelImageUrl,
    getTalentProductImageUrl,
    getTalentTrackProgress,
    ITalentLevel,
    ITalentTask,
    ITalentTrack,
    LocalizeBadgeDescription,
    LocalizeBadgeName,
    localizeWithFallback,
    splitTalentTasks,
    TALENT_STATE_ACHIEVED,
    TALENT_STATE_IN_PROGRESS,
    TALENT_STATE_LOCKED,
    TALENT_TRACK_CITIZENSHIP
} from '../../api';
import avatarGlow from '../../assets/images/talent/talent_avatar_glow.png';
import checkMark from '../../assets/images/talent/talent_check_mark_circle.png';
import citizenshipAccomplished from '../../assets/images/talent/talent_citizenship_accomplished.png';
import lockedAchievement from '../../assets/images/talent/talent_locked_achievement.png';
import lockedStripe from '../../assets/images/talent/talent_locked_stripe.png';
import vipReward from '../../assets/images/talent/talent_vip_reward.png';
import { AirModalDialog, LayoutAvatarImageView, LayoutBadgeImageView } from '../../common';
import { BaseButton } from '../../common/BaseButton';
import { LibraryImageView } from '../help/habbo-way/HabboWayPagerView';

export const getTalentTaskTitle = (badgeCode: string): string => LocalizeBadgeName(badgeCode).toUpperCase();

export const getTalentTaskInstruction = (badgeCode: string): string =>
    localizeWithFallback(`badge_instruction_${getAchievementBaseCode(badgeCode)}`, LocalizeBadgeDescription(badgeCode));

interface TalentTrackViewProps {
    track: ITalentTrack;
    onClose: () => void;
    onSelectTask: (task: ITalentTask) => void;
    onOpenTrack: (name: string) => void;
}

const TalentTaskView: FC<{ task: ITalentTask; onSelect: (task: ITalentTask) => void }> = ({ task, onSelect }) => {
    const ongoing = task.state === TALENT_STATE_IN_PROGRESS;
    const progress = task.totalScore > 0 ? Math.min(1, task.currentScore / task.totalScore) : 0;
    const body = (
        <>
            <div className="octane-talent-task__badge">
                {task.state === TALENT_STATE_LOCKED ? <img alt="" src={lockedAchievement} /> : <LayoutBadgeImageView badgeCode={task.badgeCode} />}
            </div>
            <div className="octane-talent-task__copy">
                <div className="octane-talent-task__title">{getTalentTaskTitle(task.badgeCode)}</div>
                <div className="octane-talent-task__description">{getTalentTaskInstruction(task.badgeCode)}</div>
            </div>
            {ongoing && (
                <div className="octane-talent-task__progress">
                    <span style={{ width: `${progress * 100}%` }} />
                </div>
            )}
            {task.state === TALENT_STATE_ACHIEVED && <img alt="" className="octane-talent-task__check" src={checkMark} />}
        </>
    );

    if (ongoing) {
        return (
            <BaseButton className="octane-talent-task is-ongoing" type="button" onClick={() => onSelect(task)}>
                {body}
            </BaseButton>
        );
    }

    return <div className={`octane-talent-task ${task.state === TALENT_STATE_ACHIEVED ? 'is-achieved' : 'is-locked'}`}>{body}</div>;
};

const TalentLevelView: FC<{ trackName: string; level: ITalentLevel; onSelectTask: (task: ITalentTask) => void }> = ({ trackName, level, onSelectTask }) => {
    const library = GetConfigurationValue<string>('image.library.url', '');
    const [top, bottom] = splitTalentTasks(level.tasks);
    const achieved = level.state === TALENT_STATE_ACHIEVED;
    const hasRewards = level.perks.length > 0 || level.products.length > 0;

    return (
        <div className="octane-talent-level" data-state={level.state}>
            <div className="octane-talent-level__head">
                <div>
                    <div className="octane-talent-level__title">{localizeWithFallback(`talent.track.${trackName}.level.${level.level}.title`, '')}</div>
                    <div className="octane-talent-level__description">{localizeWithFallback(`talent.track.${trackName}.level.${level.level}.description`, '')}</div>
                </div>
                <LibraryImageView className="octane-talent-level__illustration" src={getTalentLevelImageUrl(library, trackName, level.level)} />
            </div>
            <div className="octane-talent-level__status">
                <div className={`octane-talent-reward ${achieved ? 'is-achieved' : 'is-locked'}`}>
                    <div className="octane-talent-reward__border">
                        {achieved && <div className="octane-talent-reward__unlocked">{localizeWithFallback('talent.track.common.unlocked', 'UNLOCKED')}</div>}
                        <div className="octane-talent-reward__description">{localizeWithFallback(`talent.track.${trackName}.level.${level.level}.unlock`, '')}</div>
                        {hasRewards && (
                            <div className="octane-talent-reward__list">
                                {level.products.map((product, index) =>
                                    product.vipDays > 0 ? (
                                        <div key={`vip-${index}`} className="octane-talent-reward__item is-vip">
                                            <img alt="" src={vipReward} />
                                            <span>{product.vipDays}</span>
                                        </div>
                                    ) : (
                                        <div key={`product-${index}`} className="octane-talent-reward__item">
                                            <LibraryImageView src={getTalentProductImageUrl(library, product.productCode)} />
                                        </div>
                                    )
                                )}
                                {level.perks.map((perk) => (
                                    <div key={perk} className="octane-talent-reward__item is-perk">
                                        <span className="octane-talent-reward__perk-title">{localizeWithFallback(`perk.${perk}.name`, perk)}</span>
                                        <span>{localizeWithFallback(`perk.${perk}.description`, '')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {!achieved && <img alt="" className="octane-talent-reward__stripe" src={lockedStripe} />}
                    {achieved && <img alt="" className="octane-talent-reward__check" src={checkMark} />}
                </div>
                <div className="octane-talent-level__tasks">
                    {[top, bottom].map((row, index) => (
                        <div key={index} className="octane-talent-level__task-row">
                            {row.map((task) => (
                                <TalentTaskView key={task.id} task={task} onSelect={onSelectTask} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Official TalentTrackController (`talent_track` layout): a panorama of the track's levels, each
 * with its reward and its tasks, over the progress bar with the avatar needle. With citizenship on,
 * the helper track starts on the "citizenship accomplished" pane.
 */
export const TalentTrackView: FC<TalentTrackViewProps> = ({ track, onClose, onSelectTask, onOpenTrack }) => {
    const panoramaRef = useRef<HTMLDivElement>(null);
    const citizenshipEnabled = GetConfigurationValue<boolean>('talent.track.citizenship.enabled', true);
    const progress = getTalentTrackProgress(track.levels);
    const currentLevel = getCurrentLevelIndex(track.levels);
    const figure = GetSessionDataManager().figure;
    const name = track.name;

    // scrollToLevel: the level in progress is scrolled into view when the window opens.
    useEffect(() => {
        const panorama = panoramaRef.current;
        const pane = panorama?.querySelector<HTMLElement>(`[data-level-index="${currentLevel}"]`);

        if (!panorama || !pane || currentLevel === 0) return;

        panorama.scrollLeft = Math.max(0, pane.offsetLeft - 20);
    }, [track, currentLevel]);

    const renderBegin = () => {
        if (citizenshipEnabled && name !== TALENT_TRACK_CITIZENSHIP) {
            return (
                <div className="octane-talent-begin">
                    <div className="octane-talent-begin__title">{localizeWithFallback(`talent.track.${name}.guide.begin.title`, 'Your journey')}</div>
                    <div className="octane-talent-begin__text">{localizeWithFallback(`talent.track.${name}.guide.begin.description`, '')}</div>
                    <div className="octane-talent-begin__badge">
                        <span>{localizeWithFallback(`talent.track.${name}.begin.citizenship`, 'BECOME A CITIZEN')}</span>
                        <img alt="" src={citizenshipAccomplished} />
                    </div>
                    <BaseButton className="octane-habboway__action" type="button" onClick={() => onOpenTrack(TALENT_TRACK_CITIZENSHIP)}>
                        {localizeWithFallback('talent.track.citizenship.button', 'View the citizenship track')}
                    </BaseButton>
                </div>
            );
        }

        return (
            <div className="octane-talent-begin">
                <div className="octane-talent-begin__title">{localizeWithFallback(`talent.track.${name}.begin.title`, '')}</div>
                <div className="octane-talent-begin__text">{localizeWithFallback(`talent.track.${name}.begin.description`, '')}</div>
                <div className="octane-talent-begin__avatar">
                    <span>{localizeWithFallback(`talent.track.${name}.begin.register`, 'REGISTER AT HABBO')}</span>
                    <LayoutAvatarImageView direction={2} figure={figure} />
                    <img alt="" className="octane-talent-begin__check" src={checkMark} />
                </div>
            </div>
        );
    };

    return (
        <AirModalDialog
            className="octane-talent-track"
            subtitle={localizeWithFallback(`talent.track.${name}.frame.subtitle`, 'MY TALENT TRACK')}
            title={localizeWithFallback(`talent.track.${name}.frame.title`, '')}
            width={1000}
            onBackdropClick={onClose}
            onClose={onClose}
        >
            <div ref={panoramaRef} className="octane-talent-track__panorama">
                {renderBegin()}
                {track.levels.map((level, index) => (
                    <div key={level.level} className="octane-talent-track__level" data-level-index={index}>
                        <TalentLevelView level={level} trackName={name} onSelectTask={onSelectTask} />
                    </div>
                ))}
            </div>
            <div className="octane-talent-progress">
                <div className="octane-talent-progress__title">
                    {localizeWithFallback(`talent.track.${name}.progress.title`, localizeWithFallback('talent.track.common.progress.title', 'YOUR PROGRESS'))}
                </div>
                <div className="octane-talent-progress__bar">
                    <div className="octane-talent-progress__achieved" style={{ width: `${progress * 100}%` }} />
                    {track.levels.slice(1).map((level, index) => (
                        <span
                            key={level.level}
                            className={`octane-talent-progress__divider ${(index + 1) / track.levels.length < progress ? 'is-achieved' : ''}`}
                            style={{ left: `${((index + 1) / track.levels.length) * 100}%` }}
                        />
                    ))}
                    <div className="octane-talent-progress__needle" style={{ left: `${progress * 100}%` }}>
                        <img alt="" className="octane-talent-progress__glow" src={avatarGlow} />
                        <LayoutAvatarImageView headOnly direction={2} figure={figure} />
                        <div className="octane-talent-progress__balloon">{localizeWithFallback('talent.track.common.progress.position', 'You are here')}</div>
                    </div>
                </div>
            </div>
        </AirModalDialog>
    );
};
