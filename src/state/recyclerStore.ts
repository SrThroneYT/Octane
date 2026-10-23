import type { GroupItem } from '../api';
import { createOctaneStore } from './createOctaneStore';

interface RecyclerState {
    /** Set by the open recycler page: puts the next recyclable furni of a group into a free slot. */
    offerGroup: ((group: GroupItem) => boolean) | null;
    setOfferGroup: (offerGroup: ((group: GroupItem) => boolean) | null) => void;
}

/**
 * AIR RecyclerModel.running, shared between the catalog's recycler page and the inventory: while the page is open the
 * inventory stays open when a furni is taken out to place, and a double-clicked furni goes into the Furnimatic. A furni
 * being placed (from the inventory) or moved (in the room) goes into a slot when it is let go over the slots.
 */
export const useRecyclerStore = createOctaneStore<RecyclerState>()((set) => ({
    offerGroup: null,
    setOfferGroup: (offerGroup) => set({ offerGroup })
}));
