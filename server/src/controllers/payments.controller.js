import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cleanText, isEmail } from '../middleware/validate.js';

const PAYMENT_TYPES = ['subscription', 'track_buy', 'event_ticket'];
const PAYMENT_METHODS = ['mobile_money', 'card'];
const CURRENCIES = ['RWF', 'USD'];
const DEFAULT_METHODS = ['mobile_money', 'card'];

const SUBSCRIPTION_DAYS = Number(process.env.SUBSCRIPTION_DAYS) || 30;
const DEFAULT_PRICE_RWF = Number(process.env.SUBSCRIPTION_PRICE_RWF) || 5000;
const DEFAULT_PRICE_USD = Number(process.env.SUBSCRIPTION_PRICE_USD) || 5;

function makeAccessToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function readPaymentSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('payment_methods, momo_number, momo_merchant_code, subscription_price_rwf, subscription_price_usd')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data || {};
}

const methodsOf = (row) =>
  Array.isArray(row.payment_methods) && row.payment_methods.length > 0 ? row.payment_methods : DEFAULT_METHODS;

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Derive the display status of a subscription row from its expiry. */
function subscriptionStatus(row, now = new Date().toISOString()) {
  if (row.status === 'pending') return 'pending';
  if (row.status === 'rejected') return 'rejected';
  const isExpired = row.expires_at && row.expires_at <= now;
  return isExpired ? 'expired' : 'active';
}

/** GET /api/payments/settings — public: active gateways + payout instructions + subscription prices. */
export const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await readPaymentSettings();
  return res.json({
    success: true,
    data: {
      payment_methods: methodsOf(settings),
      momo_number: settings.momo_number || '',
      momo_merchant_code: settings.momo_merchant_code || '',
      subscription_price_rwf: toNumber(settings.subscription_price_rwf, DEFAULT_PRICE_RWF),
      subscription_price_usd: toNumber(settings.subscription_price_usd, DEFAULT_PRICE_USD),
    },
  });
});

/**
 * POST /api/payments/checkout — guest checkout, no login required.
 * Creates a PENDING transaction. The admin must verify receipt of funds and
 * approve it before the buyer's email is unlocked.
 */
export const checkout = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 200).toLowerCase();
  const phone = cleanText(req.body.phone, 50) || null;
  const paymentMethod = cleanText(req.body.payment_method, 30);
  const paymentType = cleanText(req.body.payment_type, 30);
  const currency = cleanText(req.body.currency, 10).toUpperCase();
  const itemId = req.body.item_id ? cleanText(req.body.item_id, 100) : null;

  if (!isEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }
  if (!PAYMENT_TYPES.includes(paymentType)) {
    return res.status(400).json({ success: false, message: 'Invalid payment type.' });
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method.' });
  }
  if (!CURRENCIES.includes(currency)) {
    return res.status(400).json({ success: false, message: 'Invalid currency.' });
  }

  let settings;
  try {
    settings = await readPaymentSettings();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  const enabled = methodsOf(settings);
  if (!enabled.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'This payment method is currently unavailable.' });
  }
  if (paymentMethod === 'mobile_money' && !phone) {
    return res.status(400).json({ success: false, message: 'A phone number is required for Mobile Money.' });
  }

  // Amount is always computed server-side so clients can never underpay.
  let amount = 0;
  let itemTitle = null;
  if (paymentType === 'subscription') {
    amount = currency === 'USD'
      ? toNumber(settings.subscription_price_usd, DEFAULT_PRICE_USD)
      : toNumber(settings.subscription_price_rwf, DEFAULT_PRICE_RWF);
  } else if (paymentType === 'track_buy') {
    if (!itemId) return res.status(400).json({ success: false, message: 'A track is required for this purchase.' });
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id, title, price_rwf, price_usd, is_free')
      .eq('id', itemId)
      .maybeSingle();
    if (songError || !song) return res.status(404).json({ success: false, message: 'Track not found.' });
    if (song.is_free === true) {
      return res.status(400).json({ success: false, message: 'This track is free to listen.' });
    }
    amount = currency === 'USD' ? toNumber(song.price_usd) : toNumber(song.price_rwf);
    itemTitle = song.title;
  } else if (paymentType === 'event_ticket') {
    if (!itemId) return res.status(400).json({ success: false, message: 'An event is required for this purchase.' });
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, ticket_price_rwf, ticket_price_usd')
      .eq('id', itemId)
      .maybeSingle();
    if (eventError || !event) return res.status(404).json({ success: false, message: 'Event not found.' });
    amount = currency === 'USD' ? toNumber(event.ticket_price_usd) : toNumber(event.ticket_price_rwf);
    itemTitle = event.title;
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: `This item has no price set in ${currency}. Please choose the other currency.`,
    });
  }

  // Duplicate prevention: one active/pending subscription per email. A pending
  // or non-expired completed subscription blocks a second checkout for the
  // same address (an expired or rejected one allows a fresh purchase).
  if (paymentType === 'subscription') {
    const { data: existingSubs, error: subsError } = await supabase
      .from('payments')
      .select('id, status, expires_at')
      .eq('payer_email', email)
      .eq('type', 'subscription')
      .order('created_at', { ascending: false })
      .limit(20);
    if (subsError) return res.status(500).json({ success: false, message: subsError.message });

    const now = new Date().toISOString();
    for (const sub of existingSubs || []) {
      if (sub.status === 'pending') {
        return res.status(409).json({
          success: false,
          message: 'You already have a subscription awaiting admin approval.',
        });
      }
      if (sub.status === 'completed' && sub.expires_at && sub.expires_at > now) {
        return res.status(409).json({
          success: false,
          message: 'You already have an active subscription.',
        });
      }
    }
  }

  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      payer_email: email,
      payer_phone: phone,
      payment_method: paymentMethod,
      amount,
      currency,
      type: paymentType,
      item_id: itemId,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    // Unique-violation on the one-pending-subscription-per-email index.
    if (insertError.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'You already have a subscription awaiting admin approval.',
      });
    }
    return res.status(500).json({ success: false, message: insertError.message });
  }

  return res.status(201).json({
    success: true,
    status: 'pending',
    message: 'Payment submitted for admin review.',
    payment: {
      id: payment.id,
      amount: Number(payment.amount),
      currency: payment.currency,
      type: payment.type,
      item_title: itemTitle,
      method: payment.payment_method,
    },
  });
});

/**
 * POST /api/payments/verify-email — email-based playback verification.
 * Returns whether the given email may listen to the requested track.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 200).toLowerCase();
  const trackId = cleanText(req.body.track_id, 100);

  if (!isEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }
  if (!trackId) {
    return res.status(400).json({ success: false, message: 'A track id is required.' });
  }

  const { data: song, error: songError } = await supabase
    .from('songs')
    .select('id, is_free, price_rwf, price_usd')
    .eq('id', trackId)
    .maybeSingle();
  if (songError || !song) return res.status(404).json({ success: false, message: 'Track not found.' });

  if (song.is_free === true || (toNumber(song.price_rwf) <= 0 && toNumber(song.price_usd) <= 0)) {
    return res.json({ valid: true, status: 'completed', message: 'This track is free to listen.' });
  }

  const { data: rows, error } = await supabase
    .from('payments')
    .select('id, type, item_id, status, expires_at')
    .eq('payer_email', email)
    .in('status', ['completed', 'pending'])
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: error.message });

  const now = new Date().toISOString();
  let hasPending = false;

  for (const row of rows || []) {
    if (row.status === 'completed') {
      const isActiveSubscription = row.type === 'subscription' && row.expires_at && row.expires_at > now;
      const isTrackPurchase = row.type === 'track_buy' && row.item_id === trackId;
      if (isActiveSubscription || isTrackPurchase) {
        return res.json({ valid: true, status: 'completed' });
      }
    } else if (row.status === 'pending') {
      const relevant = row.type === 'subscription' || (row.type === 'track_buy' && row.item_id === trackId);
      if (relevant) hasPending = true;
    }
  }

  if (hasPending) {
    return res.json({
      valid: false,
      status: 'pending',
      message: 'Your payment is awaiting admin approval.',
    });
  }

  return res.json({ valid: false, status: 'unpaid', message: 'No approved payment found for this email.' });
});

/** POST /api/songs/:id/play — increment play counter. */
export const incrementPlay = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.rpc('increment_song_play', { song_id: req.params.id });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, play_count: data });
});

/** POST /api/videos/:id/view — increment view counter. */
export const incrementView = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.rpc('increment_video_view', { video_id: req.params.id });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, view_count: data });
});

/**
 * GET /api/admin/payments/pending — pending submissions awaiting admin review.
 */
export const getPendingPayments = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('id, payer_email, payer_phone, amount, currency, payment_method, type, item_id, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({
    success: true,
    data: (data || []).map((row) => ({ ...row, amount: Number(row.amount) })),
  });
});

/**
 * PUT /api/admin/payments/:id/approve — mark as completed, mint access token,
 * set subscription expiry.
 */
export const approvePayment = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('payments')
    .select('id, type, status')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ success: false, message: findError.message });
  if (!existing) return res.status(404).json({ success: false, message: 'Payment not found.' });
  if (existing.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending payments can be approved.' });
  }

  const expiresAt =
    existing.type === 'subscription'
      ? new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'completed', access_token: makeAccessToken(), expires_at: expiresAt })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Payment approved and email unlocked.', data });
});

/**
 * PUT /api/admin/payments/:id/reject — mark as rejected.
 */
export const rejectPayment = asyncHandler(async (req, res) => {
  const { data: existing, error: findError } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) return res.status(500).json({ success: false, message: findError.message });
  if (!existing) return res.status(404).json({ success: false, message: 'Payment not found.' });
  if (existing.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending payments can be rejected.' });
  }

  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'rejected' })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Payment rejected.', data });
});

/**
 * GET /api/admin/metrics — plays/views and separate RWF/USD revenue breakdowns.
 */
export const getMetrics = asyncHandler(async (req, res) => {
  const [playsRes, viewsRes, revenueRes, subscribersRes] = await Promise.all([
    supabase.from('songs').select('play_count'),
    supabase.from('videos').select('view_count'),
    supabase.from('payments').select('amount, currency, type').eq('status', 'completed'),
    supabase.from('payments').select('*').eq('type', 'subscription').order('created_at', { ascending: false }).limit(200),
  ]);

  const err = [playsRes, viewsRes, revenueRes, subscribersRes].find((r) => r.error);
  if (err) return res.status(500).json({ success: false, message: err.error.message });

  const totalPlays = (playsRes.data || []).reduce((sum, row) => sum + (row.play_count || 0), 0);
  const totalViews = (viewsRes.data || []).reduce((sum, row) => sum + (row.view_count || 0), 0);

  let revenueRwf = 0;
  let revenueUsd = 0;
  for (const row of revenueRes.data || []) {
    const amount = Number(row.amount) || 0;
    if (row.currency === 'USD') revenueUsd += amount;
    else revenueRwf += amount;
  }

  const now = new Date().toISOString();
  const subscribers = (subscribersRes.data || []).map((row) => {
    const isExpired = row.expires_at && row.expires_at <= now;
    const status =
      row.status === 'pending'
        ? 'pending'
        : row.status === 'rejected'
          ? 'rejected'
          : isExpired
            ? 'expired'
            : 'active';
    return {
      id: row.id,
      payer_email: row.payer_email,
      payer_phone: row.payer_phone,
      payment_method: row.payment_method,
      amount: Number(row.amount),
      currency: row.currency,
      expires_at: row.expires_at,
      created_at: row.created_at,
      status,
    };
  });

  return res.json({
    success: true,
    data: {
      totalPlays,
      totalViews,
      totalPlaysViews: totalPlays + totalViews,
      revenueRwf,
      revenueUsd,
      subscribers,
    },
  });
});

/** GET /api/admin/settings/payment-methods — current admin payment config. */
export const getAdminPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await readPaymentSettings();
  return res.json({
    success: true,
    data: {
      payment_methods: methodsOf(settings),
      momo_number: settings.momo_number || '',
      momo_merchant_code: settings.momo_merchant_code || '',
      subscription_price_rwf: toNumber(settings.subscription_price_rwf, DEFAULT_PRICE_RWF),
      subscription_price_usd: toNumber(settings.subscription_price_usd, DEFAULT_PRICE_USD),
    },
  });
});

/** PUT /api/admin/settings/payment-methods — enable/disable gateways + payout details + subscription prices. */
export const updatePaymentMethods = asyncHandler(async (req, res) => {
  const rawMethods = Array.isArray(req.body.payment_methods) ? req.body.payment_methods : [];
  const methods = rawMethods.filter((m) => PAYMENT_METHODS.includes(m));
  if (methods.length === 0) {
    return res.status(400).json({ success: false, message: 'Select at least one payment method.' });
  }

  const subscriptionPriceRwf = toNumber(req.body.subscription_price_rwf, DEFAULT_PRICE_RWF);
  const subscriptionPriceUsd = toNumber(req.body.subscription_price_usd, DEFAULT_PRICE_USD);

  const { data, error } = await supabase
    .from('settings')
    .upsert(
      {
        id: 1,
        payment_methods: methods,
        momo_number: cleanText(req.body.momo_number, 50) || null,
        momo_merchant_code: cleanText(req.body.momo_merchant_code, 100) || null,
        subscription_price_rwf: subscriptionPriceRwf,
        subscription_price_usd: subscriptionPriceUsd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('payment_methods, momo_number, momo_merchant_code, subscription_price_rwf, subscription_price_usd')
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Payment settings updated.', data });
});

/** PUT /api/admin/songs/:id/pricing — set dual-currency track prices + free toggle. */
export const updateTrackPricing = asyncHandler(async (req, res) => {
  const isFree = req.body.is_free === true || req.body.is_free === 'true';
  const priceRwf = isFree ? 0 : toNumber(req.body.price_rwf);
  const priceUsd = isFree ? 0 : toNumber(req.body.price_usd);

  const { data, error } = await supabase
    .from('songs')
    .update({ price_rwf: priceRwf, price_usd: priceUsd, is_free: isFree, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id, title, price_rwf, price_usd, is_free, play_count')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Track pricing updated.', data });
});

/** PUT /api/admin/events/:id/pricing — set dual-currency event ticket prices. */
export const updateEventPricing = asyncHandler(async (req, res) => {
  const ticketPriceRwf = toNumber(req.body.ticket_price_rwf);
  const ticketPriceUsd = toNumber(req.body.ticket_price_usd);

  const { data, error } = await supabase
    .from('events')
    .update({
      ticket_price_rwf: ticketPriceRwf,
      ticket_price_usd: ticketPriceUsd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select('id, title, ticket_price_rwf, ticket_price_usd, event_date')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Event pricing updated.', data });
});

/**
 * GET /api/admin/subscribers?search=query
 * Combined subscriber list:
 *  - newsletter signups from the `subscribers` table (source: 'newsletter'), and
 *  - paid subscriptions from the `payments` table (source: 'subscription'),
 *    deduped by email keeping the most recent / active record per address.
 * Filters by email OR phone using case-insensitive ILIKE matching.
 */
export const getSubscribers = asyncHandler(async (req, res) => {
  const raw = (cleanText(req.query.search, 200) || '').trim().toLowerCase();
  const search = raw.replace(/[^\w@.+\s-]/g, '');
  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 1000);

  // 1) Newsletter signups.
  let newsletterQuery = supabase.from('subscribers').select('id, email, created_at', { count: 'exact' });
  if (search) newsletterQuery = newsletterQuery.or(`email.ilike.%${search}%`);

  // 2) Paid subscription payments.
  let paymentQuery = supabase
    .from('payments')
    .select(
      'id, payer_email, payer_phone, payment_method, amount, currency, status, expires_at, created_at',
      { count: 'exact' }
    )
    .eq('type', 'subscription');
  if (search) paymentQuery = paymentQuery.or(`payer_email.ilike.%${search}%,payer_phone.ilike.%${search}%`);

  const [newsletterRes, paymentRes] = await Promise.all([
    newsletterQuery.order('created_at', { ascending: false }).limit(limit),
    paymentQuery.order('created_at', { ascending: false }).limit(limit),
  ]);
  if (newsletterRes.error) return res.status(500).json({ success: false, message: newsletterRes.error.message });
  if (paymentRes.error) return res.status(500).json({ success: false, message: paymentRes.error.message });

  const subscribers = [];

  for (const row of newsletterRes.data || []) {
    subscribers.push({
      id: row.id,
      email: row.email,
      phone: null,
      source: 'newsletter',
      status: 'active',
      amount: null,
      currency: null,
      payment_method: null,
      created_at: row.created_at,
    });
  }

  // Rows arrive newest-first. Keep the newest non-rejected subscription per
  // email so the list shows unique paid subscribers (most recent / active record).
  const now = new Date().toISOString();
  const byEmail = new Map();
  for (const row of paymentRes.data || []) {
    const existing = byEmail.get(row.payer_email);
    if (!existing) {
      byEmail.set(row.payer_email, row);
    } else if (existing.status === 'rejected' && row.status !== 'rejected') {
      byEmail.set(row.payer_email, row);
    }
  }

  for (const row of byEmail.values()) {
    subscribers.push({
      id: row.id,
      email: row.payer_email,
      phone: row.payer_phone || null,
      source: 'subscription',
      status: subscriptionStatus(row, now),
      amount: Number(row.amount),
      currency: row.currency,
      payment_method: row.payment_method,
      created_at: row.created_at,
    });
  }

  subscribers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Exact total across both sources so the admin sees the real subscriber
  // count even when the returned page is truncated by `limit`. Subscription
  // rows are unique per email (the schema cleanup enforces one per address).
  const total = (newsletterRes.count || 0) + (paymentRes.count || 0);

  return res.json({ success: true, count: subscribers.length, total, data: subscribers });
});

/** DELETE /api/admin/subscribers/:id?source=newsletter — remove a subscriber record. */
export const deleteSubscriber = asyncHandler(async (req, res) => {
  const source = req.query.source === 'newsletter' ? 'newsletter' : 'subscription';
  const { id } = req.params;

  if (source === 'newsletter') {
    const { data: existing, error: findError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (findError) return res.status(500).json({ success: false, message: findError.message });
    if (!existing) return res.status(404).json({ success: false, message: 'Subscriber not found.' });

    const { error } = await supabase.from('subscribers').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.json({ success: true, message: 'Subscriber deleted successfully' });
  }

  const { data: existing, error: findError } = await supabase
    .from('payments')
    .select('id, type')
    .eq('id', id)
    .maybeSingle();
  if (findError) return res.status(500).json({ success: false, message: findError.message });
  if (!existing) return res.status(404).json({ success: false, message: 'Subscriber not found.' });
  if (existing.type !== 'subscription') {
    return res.status(400).json({ success: false, message: 'Only subscription records can be deleted here.' });
  }

  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Subscriber deleted successfully' });
});
