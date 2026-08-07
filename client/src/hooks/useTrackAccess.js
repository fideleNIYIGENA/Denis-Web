import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { getCredentials, subscribeCredentials } from '../lib/purchases.js';

/**
 * Determines whether the current visitor may play a track.
 *
 * A track is playable when it is free, OR the visitor has a valid
 * subscription, OR they purchased this exact track (both are verified
 * server-side via /songs/:id/verify-access using the stored credentials).
 */
export default function useTrackAccess(song) {
  const id = song?.id;
  const isFree = !song || song.is_free === true || Number(song.price || 0) <= 0;

  const [allowed, setAllowed] = useState(isFree);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(isFree);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!id || isFree) {
      setAllowed(true);
      setChecking(false);
      setChecked(true);
      return undefined;
    }

    let active = true;
    const creds = getCredentials();
    if (!creds.token || !creds.email) {
      setAllowed(false);
      setChecking(false);
      setChecked(true);
      return undefined;
    }

    setChecking(true);
    api
      .post(`/songs/${id}/verify-access`, { email: creds.email, access_token: creds.token })
      .then((res) => {
        if (active) setAllowed(!!res.data.allowed);
      })
      .catch(() => {
        if (active) setAllowed(false);
      })
      .finally(() => {
        if (active) {
          setChecking(false);
          setChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, [id, isFree, version]);

  // Re-verify whenever the stored credentials change (e.g. after a checkout).
  useEffect(() => subscribeCredentials(() => setVersion((v) => v + 1)), []);

  return { isFree, allowed, checking, checked };
}
