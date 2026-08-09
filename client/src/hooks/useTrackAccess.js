import { useCallback, useState } from 'react';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';

/**
 * Subscription-based access gate for music.
 *
 * Access rules (enforced in the UI and on the API):
 *  - FREE content (`is_free === true`) plays for everyone, no login needed.
 *  - PREMIUM content (`is_free === false`) requires a signed-in user with an
 *    active subscription. Otherwise the caller shows the premium prompt.
 *
 * `requestPlay()` starts playback when access is allowed, or opens the
 * premium gate when the visitor is not logged in / not subscribed.
 */
export default function useTrackAccess(song) {
  const { isAuthenticated, isSubscribed } = useUserAuth();
  const id = song?.id;

  const premium = song?.is_free === false;
  const allowed = !premium || (isAuthenticated && isSubscribed);
  const locked = premium && !allowed;

  const [gateOpen, setGateOpen] = useState(false);
  const [playSignal, setPlaySignal] = useState(0);

  const requestPlay = useCallback(() => {
    if (allowed) {
      setPlaySignal((n) => n + 1);
    } else {
      setGateOpen(true);
    }
  }, [allowed]);

  return {
    premium,
    locked,
    gateOpen,
    setGateOpen,
    playSignal,
    requestPlay,
  };
}
