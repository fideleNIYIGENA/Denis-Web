import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/dashboard/stats — aggregate counts used by the admin dashboard.
 * Uses count: 'exact', head: true so only counts are transferred.
 */
export const getStats = asyncHandler(async (req, res) => {
  const tables = ['songs', 'videos', 'gallery', 'events', 'news', 'messages'];

  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) return res.status(500).json({ success: false, message: error.message });
    counts[table] = count || 0;
  }

  const { count: unread, error: unreadError } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  if (unreadError) return res.status(500).json({ success: false, message: unreadError.message });

  const { data: recentMessages, error: recentError } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  if (recentError) return res.status(500).json({ success: false, message: recentError.message });

  // Real account count from public.profiles, which mirrors Supabase Auth
  // (a trigger creates a profile row for every signup). Never hardcoded.
  const { count: totalAccounts, error: accountsError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (accountsError) return res.status(500).json({ success: false, message: accountsError.message });

  return res.json({
    success: true,
    data: {
      totalSongs: counts.songs,
      totalVideos: counts.videos,
      totalGallery: counts.gallery,
      totalEvents: counts.events,
      totalNews: counts.news,
      totalMessages: counts.messages,
      totalAccounts: totalAccounts || 0,
      unreadMessages: unread || 0,
      recentMessages: recentMessages || [],
    },
  });
});
