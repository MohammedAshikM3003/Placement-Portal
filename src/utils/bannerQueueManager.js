const listeners = new Set();

let activeSlotId = null;
const waitingSlotIds = [];
const queuedSlotSet = new Set();

const emit = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('❌ [BannerQueue] Listener error:', error);
    }
  });
};

const removeFromWaitingQueue = (slotId) => {
  const index = waitingSlotIds.indexOf(slotId);
  if (index >= 0) {
    waitingSlotIds.splice(index, 1);
  }
};

const promoteNextSlotIfIdle = () => {
  if (activeSlotId || waitingSlotIds.length === 0) return;

  const nextSlot = waitingSlotIds.shift();
  queuedSlotSet.delete(nextSlot);
  activeSlotId = nextSlot;
};

export const subscribeBannerQueue = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getBannerQueueState = () => ({
  activeSlotId,
  waitingSlotIds: [...waitingSlotIds]
});

export const requestBannerSlot = (slotId) => {
  if (!slotId) return false;

  if (activeSlotId === slotId) return true;

  if (!activeSlotId) {
    activeSlotId = slotId;
    emit();
    return true;
  }

  if (!queuedSlotSet.has(slotId)) {
    waitingSlotIds.push(slotId);
    queuedSlotSet.add(slotId);
    emit();
  }

  return false;
};

export const releaseBannerSlot = (slotId) => {
  if (!slotId) return;

  let changed = false;

  if (activeSlotId === slotId) {
    activeSlotId = null;
    changed = true;
  }

  if (queuedSlotSet.has(slotId)) {
    queuedSlotSet.delete(slotId);
    removeFromWaitingQueue(slotId);
    changed = true;
  }

  const previousActiveSlot = activeSlotId;
  promoteNextSlotIfIdle();
  if (activeSlotId !== previousActiveSlot) {
    changed = true;
  }

  if (changed) {
    emit();
  }
};
