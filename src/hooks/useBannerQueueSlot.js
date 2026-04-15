import { useEffect, useState } from 'react';
import {
  getBannerQueueState,
  releaseBannerSlot,
  requestBannerSlot,
  subscribeBannerQueue
} from '../utils/bannerQueueManager';

const useBannerQueueSlot = (slotId, enabled) => {
  const [queueState, setQueueState] = useState(getBannerQueueState());

  useEffect(() => {
    const unsubscribe = subscribeBannerQueue(() => {
      setQueueState(getBannerQueueState());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!enabled || !slotId) return undefined;

    requestBannerSlot(slotId);

    return () => {
      releaseBannerSlot(slotId);
    };
  }, [slotId, enabled]);

  return Boolean(enabled && slotId && queueState.activeSlotId === slotId);
};

export default useBannerQueueSlot;
