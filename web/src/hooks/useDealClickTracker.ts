import { useActivityTracker } from "./useActivityTracker";

export function useDealClickTracker() {
  const { trackDealClick } = useActivityTracker();
  return { trackAndOpen: trackDealClick };
}
