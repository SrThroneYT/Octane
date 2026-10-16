import { DeleteMentionComposer, MarkMentionsReadComposer, RequestMentionsComposer } from '@octane/renderer';
import { IMentionEntry, SendMessageComposer } from '../../api';
import { getMentionsStatus, getUnreadCount, markAllRead, markRead, removeMention, setMentionsStatus } from './mentionsStore';

/** How long the list may take before the panel says it did not come. */
export const MENTIONS_REQUEST_TIMEOUT_MS = 8000;

const pending: { timer: ReturnType<typeof setTimeout> | null } = { timer: null };

/** Asks the server for the list once; asking again while it is on its way does nothing. */
export const requestMentions = (): void => {
    if (getMentionsStatus() === 'loading') return;

    setMentionsStatus('loading');
    SendMessageComposer(new RequestMentionsComposer());

    if (pending.timer) clearTimeout(pending.timer);

    pending.timer = setTimeout(() => {
        pending.timer = null;

        if (getMentionsStatus() === 'loading') setMentionsStatus('error');
    }, MENTIONS_REQUEST_TIMEOUT_MS);
};

export const markMentionRead = (mention: IMentionEntry): void => {
    if (mention.read) return;

    markRead(mention.mentionId);
    SendMessageComposer(new MarkMentionsReadComposer(1, mention.mentionId));
};

export const markAllMentionsRead = (): void => {
    if (getUnreadCount() === 0) return;

    markAllRead();
    SendMessageComposer(new MarkMentionsReadComposer(0, 0));
};

export const deleteMention = (mention: IMentionEntry): void => {
    SendMessageComposer(new DeleteMentionComposer(mention.mentionId));
    removeMention(mention.mentionId);
};
