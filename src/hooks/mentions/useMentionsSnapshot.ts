import { IMentionEntry } from '../../api/mentions';
import { MentionsStatus, useMentionsStore } from './mentionsStore';

export const useMentionsSnapshot = (): { mentions: ReadonlyArray<IMentionEntry>; unreadCount: number; status: MentionsStatus } => {
    const mentions = useMentionsStore((state) => state.mentions);
    const unreadCount = useMentionsStore((state) => state.unreadCount);
    const status = useMentionsStore((state) => state.status);

    return { mentions, unreadCount, status };
};
