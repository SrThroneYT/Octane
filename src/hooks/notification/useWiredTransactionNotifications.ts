import { WiredRewardResultMessageEvent, WiredTradeErrorEvent, WiredTransactionFailEvent, WiredTransactionSuccessEvent } from '@octane/renderer';
import { LocalizeText, NotificationAlertType, NotificationBubbleType } from '../../api';
import { WIRED_TRADE_ERROR_ICON, wiredTradeErrorMessage } from '../../api/inventory/WiredTradingUtilities';
import { wiredRewardResultAlert } from '../../api/wired/WiredRewardResult';
import { useMessageEvent } from '../events';
import { receiveWiredReward } from '../rooms/widgets/wiredRewardStore';

type SimpleAlert = (message: string, type?: string, clickUrl?: string, clickUrlText?: string, title?: string) => void;
type ShowSingleBubble = (message: string, type: string, imageUrl?: string, internalLink?: string) => void;

/** The bubbles and alerts of the wired transactions, trades and rewards. */
export const useWiredTransactionNotifications = (simpleAlert: SimpleAlert, showSingleBubble: ShowSingleBubble) => {
    // AIR notifications onWiredTransactionFail: fail text with the localized reason (ported from Volt, GPL-3.0).
    useMessageEvent<WiredTransactionFailEvent>(WiredTransactionFailEvent, (event) => {
        const parser = event.getParser();

        showSingleBubble(
            LocalizeText(
                'wired_transactions.notification.fail',
                ['reason'],
                [LocalizeText(`wired_transactions.notification.fail.${ parser.failureReason }`)],
            ),
            NotificationBubbleType.INFO,
        );
    });

    // WiredTradeError: a refused trade action, with AIR's trading error icon (e.g. 5, more than the requirements ask).
    useMessageEvent<WiredTradeErrorEvent>(WiredTradeErrorEvent, (event) => {
        const parser = event.getParser();

        showSingleBubble(wiredTradeErrorMessage(parser.tradeErrorId, LocalizeText), NotificationBubbleType.INFO, WIRED_TRADE_ERROR_ICON);
    });

    // WiredTransactionSuccess. AIR RewardNotificationController keeps every reward under its own id: one that opens by
    // itself opens its popup (FurnitureWiredChestRewardView) now, the others get the click-to-popup text whose link
    // opens that reward, not whichever came last.
    useMessageEvent<WiredTransactionSuccessEvent>(WiredTransactionSuccessEvent, (event) => {
        const parser = event.getParser();
        const rewardLink = receiveWiredReward(parser);
        const key = `wired_transactions.notification.success.${ parser.successType }`;

        showSingleBubble(LocalizeText(rewardLink ? `${ key }.click_to_popup` : key), NotificationBubbleType.INFO, null, rewardLink);
    });

    useMessageEvent<WiredRewardResultMessageEvent>(WiredRewardResultMessageEvent, (event) => {
        // Official: a product, a badge, or a refusal with its reason; no reason is dropped.
        const { titleKey, bodyKey } = wiredRewardResultAlert(event.getParser().reason);

        simpleAlert(LocalizeText(bodyKey), NotificationAlertType.DEFAULT, null, null, LocalizeText(titleKey));
    });
};
