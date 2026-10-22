import { FC } from 'react';
import { localizeWithFallback, SanitizeHtml } from '../../api';

/**
 * `infoContainer`: what the guild is. The official trading text explains moving collectibles from a
 * MetaMask wallet, which this hotel has no use for, so only the description is shown.
 */
export const CollectiblesInfoTabView: FC = () => (
    <div className="octane-collectibles-info" data-testid="collectibles-info">
        <div className="octane-collectibles-info-title">{localizeWithFallback('collectibles.info.title', 'Info')}</div>
        <div
            className="octane-collectibles-info-text"
            dangerouslySetInnerHTML={{
                __html: SanitizeHtml(
                    localizeWithFallback(
                        'collectibles.info.description',
                        'The Collectors Guild is a hub where collectors can view and manage their Collector XP, collectibles and Relics.'
                    )
                )
            }}
        />
    </div>
);
