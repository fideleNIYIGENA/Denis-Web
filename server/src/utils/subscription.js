import { supabase } from '../config/supabase.js';

/**
 * Subscription status for a public user, derived from the existing `payments`
 * table (the project's subscription ledger — no duplicate subscription table).
 *
 * Status mapping (payment.status + expires_at):
 *   - completed & not expired  -> 'active'
 *   - pending                  -> 'pending'  (awaiting admin approval)
 *   - completed & expired      -> 'expired'
 *   - rejected                 -> 'cancelled'
 *   - no subscription          -> 'inactive'
 *
 * Preference order when multiple rows exist (e.g. an old expired sub plus a
 * fresh pending one): active > pending > expired > cancelled > inactive.
 */

function toRow(row) {
  if (!row) return null;
  return {
    payment_id: row.id,
    status: row.status,
    amount: Number(row.amount) || 0,
    currency: row.currency || 'RWF',
    started_at: row.created_at || null,
    expires_at: row.expires_at || null,
  };
}

export async function getUserSubscription(user) {
  const email = (user?.email || '').toLowerCase();
  const userId = user?.id;

  const select = 'id, payer_email, amount, currency, status, expires_at, created_at';
  const order = { ascending: false };

  // Registered users are matched by user_id; guests/pre-existing payments are
  // matched by payer_email. Results are merged and de-duplicated by id.
  const rows = [];
  if (userId) {
    const { data, error } = await supabase
      .from('payments')
      .select(select)
      .eq('type', 'subscription')
      .eq('user_id', userId)
      .order('created_at', order)
      .limit(50);
    if (error) throw error;
    rows.push(...(data || []));
  }
  const { data, error } = await supabase
    .from('payments')
    .select(select)
    .eq('type', 'subscription')
    .eq('payer_email', email)
    .order('created_at', order)
    .limit(50);
  if (error) throw error;
  rows.push(...(data || []));

  const byId = new Map();
  for (const row of rows) byId.set(row.id, row);
  const unique = [...byId.values()];

  if (unique.length === 0) {
    return { status: 'inactive', payment_id: null, amount: 0, currency: 'RWF', started_at: null, expires_at: null };
  }

  const now = Date.now();

  const active = unique.find(
    (r) => r.status === 'completed' && r.expires_at && new Date(r.expires_at).getTime() > now
  );
  if (active) return { status: 'active', ...toRow(active) };

  const pending = unique.find((r) => r.status === 'pending');
  if (pending) return { status: 'pending', ...toRow(pending) };

  const expired = unique.find((r) => r.status === 'completed');
  if (expired) return { status: 'expired', ...toRow(expired) };

  const cancelled = unique.find((r) => r.status === 'rejected');
  if (cancelled) return { status: 'cancelled', ...toRow(cancelled) };

  return { status: 'inactive', payment_id: null, amount: 0, currency: 'RWF', started_at: null, expires_at: null };
}
