import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { cleanText, isEmail } from '../middleware/validate.js';

const PAYMENT_TYPES = ['subscription', 'track_buy', 'event_ticket'];
const PAYMENT_METHODS = ['mobile_money', 'card'];
const DEFAULT_METHODS = ['mobile_money', 'card'];

const SUBSCRIPTION_PRICE = Number(process.env.SUBSCRIPTION_PRICE) || 5000;
const SUBSCRIPTION_DAYS = Number(process.env.SUBSCRIPTION_DAYS) || 30;

function makeAccessToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function readPaymentSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('payment_methods, momo_number, momo_merchant_code, subscription_price')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data || {};
}

const methodsOf = (row) =>
  Array.isArray(row.payment_methods) && row.payment_methods.length > 0 ? row.payment_methods : DEFAULT_METHODS;

/** GET /api/payments/settings — public: active gateways + public payout details. */
export const getPaymentSettings = asyncHandler(async (req, res) => {
  const settings = await readPaymentSettings();
  return res.json({
    success: true,
    data: {
      payment_methods: methodsOf(settings),
      momo_number: settings.momo_number || '',
      subscription_price: Number(settings.subscription_price) || SUBSCRIPTION_PRICE,
    },
  });
});

/** POST /api/payments/checkout — guest checkout, no login required. */
export const checkout = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 200).toLowerCase();
  const phone = cleanText(req.body.phone, 50) || null;
  const paymentMethod = cleanText(req.body.payment_method, 30);
  const paymentType = cleanText(req.body.payment_type, 30);
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
    amount = Number(settings.subscription_price) || SUBSCRIPTION_PRICE;
  } else if (paymentType === 'track_buy') {
    if (!itemId) return res.status(400).json({ success: false, message: 'A track is required for this purchase.' });
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id, title, price, is_free')
      .eq('id', itemId)
      .maybeSingle();
    if (songError || !song) return res.status(404).json({ success: false, message: 'Track not found.' });
    if (song.is_free || Number(song.price) <= 0) {
      return res.status(400).json({ success: false, message: 'This track is free to listen.' });
    }
    amount = Number(song.price);
    itemTitle = song.title;
  } else if (paymentType === 'event_ticket') {
    if (!itemId) return res.status(400).json({ success: false, message: 'An event is required for this purchase.' });
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, ticket_price')
      .eq('id', itemId)
      .maybeSingle();
    if (eventError || !event) return res.status(404).json({ success: false, message: 'Event not found.' });
    amount = Number(event.ticket_price) || 0;
    itemTitle = event.title;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ success: false, message: 'Invalid amount.' });
  }

  const accessToken = makeAccessToken();
  const expiresAt =
    paymentType === 'subscription'
      ? new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null;

  // No live gateway credentials are wired up yet, so the payment is recorded
  // as completed immediately (simulated gateway confirmation).
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      payer_email: email,
      payer_phone: phone,
      payment_method: paymentMethod,
      amount,
      type: paymentType,
      item_id: itemId,
      access_token: accessToken,
      expires_at: expiresAt,
      status: 'completed',
    })
    .select()
    .single();

  if (insertError) {
    return res.status(500).json({ success: false, message: insertError.message });
  }

  return res.status(201).json({
    success: true,
    message: 'Payment successful.',
    payment: {
      id: payment.id,
      amount: Number(payment.amount),
      type: payment.type,
      item_title: itemTitle,
      method: payment.payment_method,
    },
    access_token: payment.access_token,
    expires_at: payment.expires_at,
  });
});

/** POST /api/songs/:id/verify-access — guest playback authorization check. */
export const verifyAccess = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 200).toLowerCase();
  const token = cleanText(req.body.access_token, 300);

  const { data: song, error } = await supabase
    .from('songs')
    .select('id, is_free, price')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error || !song) return res.status(404).json({ success: false, message: 'Track not found.' });

  if (song.is_free === true || Number(song.price || 0) <= 0) {
    return res.json({ success: true, allowed: true, reason: 'free' });
  }

  if (!isEmail(email) || !token) {
    return res.json({ success: true, allowed: false, reason: 'none' });
  }

  // (b) active subscription for this email + token
  const { data: subscription, error: subError } = await supabase
    .from('payments')
    .select('id')
    .eq('type', 'subscription')
    .eq('payer_email', email)
    .eq('access_token', token)
    .eq('status', 'completed')
    .gt('expires_at', new Date().toISOString())
    .limit(1);
  if (subError) return res.status(500).json({ success: false, message: subError.message });
  if (subscription && subscription.length > 0) {
    return res.json({ success: true, allowed: true, reason: 'subscription' });
  }

  // (c) direct purchase of this track
  const { data: purchase, error: purchaseError } = await supabase
    .from('payments')
    .select('id')
    .eq('type', 'track_buy')
    .eq('payer_email', email)
    .eq('item_id', song.id)
    .eq('status', 'completed')
    .limit(1);
  if (purchaseError) return res.status(500).json({ success: false, message: purchaseError.message });
  if (purchase && purchase.length > 0) {
    return res.json({ success: true, allowed: true, reason: 'purchase' });
  }

  return res.json({ success: true, allowed: false, reason: 'none' });
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

/** GET /api/admin/metrics — revenue, combined views/plays and subscribers. */
export const getMetrics = asyncHandler(async (req, res) => {
  const [playsRes, viewsRes, revenueRes, subscribersRes] = await Promise.all([
    supabase.from('songs').select('play_count'),
    supabase.from('videos').select('view_count'),
    supabase.from('payments').select('amount, type').eq('status', 'completed'),
    supabase.from('payments').select('*').eq('type', 'subscription').order('created_at', { ascending: false }).limit(200),
  ]);

  const err = [playsRes, viewsRes, revenueRes, subscribersRes].find((r) => r.error);
  if (err) return res.status(500).json({ success: false, message: err.error.message });

  const totalPlays = (playsRes.data || []).reduce((sum, row) => sum + (row.play_count || 0), 0);
  const totalViews = (viewsRes.data || []).reduce((sum, row) => sum + (row.view_count || 0), 0);

  let totalRevenue = 0;
  let subscriptionRevenue = 0;
  for (const row of revenueRes.data || []) {
    const amount = Number(row.amount) || 0;
    totalRevenue += amount;
    if (row.type === 'subscription') subscriptionRevenue += amount;
  }

  const now = new Date().toISOString();
  const subscribers = (subscribersRes.data || []).map((row) => ({
    id: row.id,
    payer_email: row.payer_email,
    payer_phone: row.payer_phone,
    payment_method: row.payment_method,
    amount: Number(row.amount),
    expires_at: row.expires_at,
    created_at: row.created_at,
    status: row.expires_at && row.expires_at > now ? 'active' : 'expired',
  }));

  return res.json({
    success: true,
    data: {
      totalPlays,
      totalViews,
      totalPlaysViews: totalPlays + totalViews,
      totalRevenue,
      subscriptionRevenue,
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
      subscription_price: Number(settings.subscription_price) || SUBSCRIPTION_PRICE,
    },
  });
});

/** PUT /api/admin/settings/payment-methods — enable/disable gateways + MoMo payout details. */
export const updatePaymentMethods = asyncHandler(async (req, res) => {
  const rawMethods = Array.isArray(req.body.payment_methods) ? req.body.payment_methods : [];
  const methods = rawMethods.filter((m) => PAYMENT_METHODS.includes(m));
  if (methods.length === 0) {
    return res.status(400).json({ success: false, message: 'Select at least one payment method.' });
  }

  let subscriptionPrice = Number(req.body.subscription_price);
  if (!Number.isFinite(subscriptionPrice) || subscriptionPrice < 0) {
    subscriptionPrice = SUBSCRIPTION_PRICE;
  }

  const { data, error } = await supabase
    .from('settings')
    .upsert(
      {
        id: 1,
        payment_methods: methods,
        momo_number: cleanText(req.body.momo_number, 50) || null,
        momo_merchant_code: cleanText(req.body.momo_merchant_code, 100) || null,
        subscription_price: subscriptionPrice,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('payment_methods, momo_number, momo_merchant_code, subscription_price')
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Payment settings updated.', data });
});

/** PUT /api/admin/songs/:id/pricing — set track price + free toggle. */
export const updateTrackPricing = asyncHandler(async (req, res) => {
  const isFree = req.body.is_free === true || req.body.is_free === 'true';
  let price = Number(req.body.price);
  if (!Number.isFinite(price) || price < 0) price = 0;
  if (isFree) price = 0;

  const { data, error } = await supabase
    .from('songs')
    .update({ price, is_free: isFree, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id, title, price, is_free, play_count')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Track pricing updated.', data });
});

/** PUT /api/admin/events/:id/pricing — set event ticket price. */
export const updateEventPricing = asyncHandler(async (req, res) => {
  let price = Number(req.body.ticket_price);
  if (!Number.isFinite(price) || price < 0) price = 0;

  const { data, error } = await supabase
    .from('events')
    .update({ ticket_price: price, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id, title, ticket_price, event_date')
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, message: 'Event pricing updated.', data });
});
