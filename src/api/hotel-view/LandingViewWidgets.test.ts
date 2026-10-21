import { describe, expect, it } from 'vitest';
import {
    campaignizeAssetUri,
    CONCURRENT_USERS_ACTIVE,
    CONCURRENT_USERS_REDEEM,
    CONCURRENT_USERS_REWARDED,
    getBonusRareProgressPercent,
    getCommunityGoalNeedleFrame,
    getCommunityGoalVsNeedleFrame,
    getConcurrentUsersView,
    getNextLimitedRareMode,
    getSecondsLeft,
    isCommunityGoalLevelLit,
    isPromoArticleButtonVisible,
    PROMO_LINK_INTERNAL,
    PROMO_LINK_NONE,
    PROMO_LINK_URL,
    wrapPromoArticleIndex
} from './LandingViewWidgets';

describe('hotel view live widgets', () => {
    it('moves the community goal needle between the level frames', () => {
        expect(getCommunityGoalNeedleFrame(0, 0)).toBe(0);
        expect(getCommunityGoalNeedleFrame(0, 50)).toBe(4);
        expect(getCommunityGoalNeedleFrame(1, 100)).toBe(16);
        expect(getCommunityGoalNeedleFrame(3, 10)).toBe(23);
        expect(isCommunityGoalLevelLit(16, 2)).toBe(true);
        expect(isCommunityGoalLevelLit(15, 2)).toBe(false);
    });

    it('leans the vs needle towards the leading side', () => {
        expect(getCommunityGoalVsNeedleFrame(0, 0, 10)).toBe(12);
        expect(getCommunityGoalVsNeedleFrame(0, 100, 10)).toBe(16);
        expect(getCommunityGoalVsNeedleFrame(0, 100, -10)).toBe(5);
        expect(getCommunityGoalVsNeedleFrame(-3, 50, -1)).toBe(0);
        expect(getCommunityGoalVsNeedleFrame(3, 50, 1)).toBe(23);
    });

    it('names the meter images after the goal', () => {
        expect(campaignizeAssetUri('https://img/reception/meter_level_1.png', 'lympix')).toBe('https://img/reception/meter_level_1_lympix.png');
        expect(campaignizeAssetUri('https://img/reception/meter_level_1.png', '')).toBe('https://img/reception/meter_level_1.png');
    });

    it('fills the bonus rare bar with the credits already spent', () => {
        expect(getBonusRareProgressPercent(120, 30)).toBe(75);
        expect(getBonusRareProgressPercent(120, 200)).toBe(0);
        expect(getBonusRareProgressPercent(0, 0)).toBe(0);
    });

    it('switches the concurrent users element to the reward once reached', () => {
        expect(getConcurrentUsersView(CONCURRENT_USERS_ACTIVE)).toMatchObject({ achieved: false, polling: true, showRedeemButton: false });
        expect(getConcurrentUsersView(CONCURRENT_USERS_REDEEM)).toMatchObject({ achieved: true, polling: false, showRedeemButton: true });
        expect(getConcurrentUsersView(CONCURRENT_USERS_REWARDED)).toMatchObject({ achieved: true, showRedeemButton: false });
        expect(getConcurrentUsersView(CONCURRENT_USERS_REDEEM).bodyKey).toBe('landing.view.concurrentusers.bodytext.success');
    });

    it('hides the article button without a link and wraps the navigation', () => {
        expect(isPromoArticleButtonVisible(PROMO_LINK_NONE, 'x')).toBe(false);
        expect(isPromoArticleButtonVisible(PROMO_LINK_URL, '')).toBe(false);
        expect(isPromoArticleButtonVisible(PROMO_LINK_INTERNAL, '')).toBe(true);
        expect(wrapPromoArticleIndex(-1, 3)).toBe(2);
        expect(wrapPromoArticleIndex(3, 3)).toBe(0);
    });

    it('shows the next limited rare as a countdown, then as available', () => {
        expect(getNextLimitedRareMode(120, -1)).toBe('countdown');
        expect(getNextLimitedRareMode(-1, 12)).toBe('available');
        expect(getNextLimitedRareMode(-1, -1)).toBe('hidden');
        expect(getSecondsLeft(120, 1000, 31_500)).toBe(90);
        expect(getSecondsLeft(10, 0, 60_000)).toBe(0);
    });
});
