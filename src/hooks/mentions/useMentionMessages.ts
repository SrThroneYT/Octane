import { MentionListItem, MentionReceivedEvent, MentionsListEvent } from '@octane/renderer';
import { useCallback, useEffect } from 'react';
import { GetConfigurationValue, GetRoomSession, IMentionEntry, PlaySound } from '../../api';
import { useMessageEvent } from '../events';
import { useNotification } from '../notification/useNotification';
import { requestMentions } from './mentionsRequests';
import { addMention, isMentionsPanelOpen, setMentions } from './mentionsStore';

// Dedicated mention chime served from nitro-assets/sounds/<sample>.mp3.
const MENTION_SOUND_SAMPLE = 'mentions_notification';

const toEntry = (mention: MentionListItem, read: boolean): IMentionEntry => ({
    mentionId: mention.mentionId,
    senderId: mention.senderId,
    senderUsername: mention.senderUsername,
    senderFigure: mention.senderFigure,
    roomId: mention.roomId,
    roomName: mention.roomName,
    message: mention.message,
    mentionType: mention.mentionType,
    timestamp: mention.timestamp,
    read
});

export const useMentionMessages = (): void => {
    const { showMentionBubble } = useNotification();

    const onMentionsList = useCallback((event: MentionsListEvent) => {
        setMentions(event.getParser().mentions.map((mention) => toEntry(mention, mention.read)));
    }, []);

    const onMentionReceived = useCallback(
        (event: MentionReceivedEvent) => {
            if (!GetConfigurationValue<boolean>('mentions_ui.enabled', true)) return;

            const entry = toEntry(event.getParser().mention, false);

            addMention(entry);

            // The panel shows it as it lands, so there is nothing to announce.
            if (isMentionsPanelOpen()) return;

            const inThatRoom = entry.roomId > 0 && GetRoomSession()?.roomId === entry.roomId;

            if (GetConfigurationValue<boolean>('mentions_ui.sound', true)) PlaySound(MENTION_SOUND_SAMPLE);

            // In the room itself the highlighted chat line is the notice; elsewhere a toast says where it came from.
            if (!inThatRoom) showMentionBubble(entry);
        },
        [showMentionBubble]
    );

    useMessageEvent<MentionsListEvent>(MentionsListEvent, onMentionsList);
    useMessageEvent<MentionReceivedEvent>(MentionReceivedEvent, onMentionReceived);

    useEffect(() => {
        if (!GetConfigurationValue<boolean>('mentions_ui.enabled', true)) return;

        requestMentions();
    }, []);
};
