import { useCallback, useState } from 'react';
import api from '../api/client.js';
import { getPayerEmail, setPayerEmail } from '../lib/purchases.js';

const isPaid = (song) =>
  !!song && song.is_free !== true && (Number(song.price_rwf || 0) > 0 || Number(song.price_usd || 0) > 0);

/**
 * Email-based access gate for paid tracks.
 *
 * - `requestPlay()`: free tracks play immediately; paid tracks run the email
 *   verification flow (prompt for email → POST /payments/verify-email →
 *   completed / pending / unpaid).
 * - After a successful verification the track is unlocked on this device and
 *   playback is triggered automatically via the returned `playSignal`.
 * - `verifyOpen` / `checkoutOpen` drive the VerifyModal / CheckoutModal that
 *   the calling card renders.
 */
export default function useTrackAccess(song) {
  const id = song?.id;
  const paid = isPaid(song);

  const [allowed, setAllowed] = useState(!paid);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [playSignal, setPlaySignal] = useState(0);

  const openVerify = useCallback((message = '') => {
    setPendingMessage(message);
    setVerifyOpen(true);
  }, []);

  const unlockAndPlay = useCallback(() => {
    setAllowed(true);
    setPlaySignal((n) => n + 1);
  }, []);

  const verify = useCallback(
    async (email) => {
      const { data } = await api.post('/payments/verify-email', { email, track_id: id });
      return data;
    },
    [id]
  );

  const requestPlay = useCallback(async () => {
    if (!paid) {
      unlockAndPlay();
      return;
    }
    const email = getPayerEmail();
    if (!email) {
      openVerify();
      return;
    }
    try {
      const data = await verify(email);
      if (data.valid) {
        setPayerEmail(email);
        unlockAndPlay();
      } else if (data.status === 'pending') {
        openVerify(data.message || 'Your payment is awaiting admin approval.');
      } else {
        setCheckoutOpen(true);
      }
    } catch {
      openVerify();
    }
  }, [paid, verify, openVerify, unlockAndPlay]);

  return {
    paid,
    allowed,
    locked: paid && !allowed,
    verifyOpen,
    pendingMessage,
    checkoutOpen,
    playSignal,
    openVerify,
    setCheckoutOpen,
    verify,
    unlockAndPlay,
    requestPlay,
  };
}
