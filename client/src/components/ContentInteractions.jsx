import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaThumbsUp, FaThumbsDown, FaComment, FaTrashCan, FaRightToBracket, FaUserPlus, FaCrown } from 'react-icons/fa6';
import { FiSend } from 'react-icons/fi';
import userApi from '../api/userClient.js';
import { useUserAuth } from '../contexts/UserAuthContext.jsx';
import { formatNumber } from '../lib/format.js';

/**
 * Like / dislike + comments block for a song or video.
 *
 * - Public visitors see a prompt to log in / create an account.
 * - Logged-in users without an active subscription see a subscribe prompt.
 * - Subscribers get the full like/dislike toggle and comment thread.
 *
 * All writes go through the Express API; the backend verifies the Supabase
 * JWT and the active subscription — the UI never decides access.
 */
export default function ContentInteractions({ contentType, contentId }) {
  const { isAuthenticated, isSubscribed, subscription, session } = useUserAuth();
  const userId = session?.user?.id;

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionsLoading, setReactionsLoading] = useState(true);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showComments, setShowComments] = useState(false);

  const loadReactions = useCallback(async () => {
    setReactionsLoading(true);
    try {
      const res = await userApi.get(`/reactions/${contentType}/${contentId}`);
      setLikes(res.data.data.likes || 0);
      setDislikes(res.data.data.dislikes || 0);
      setUserReaction(res.data.data.user_reaction || null);
    } catch {
      // keep the last known counts
    } finally {
      setReactionsLoading(false);
    }
  }, [contentType, contentId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await userApi.get(`/comments/${contentType}/${contentId}`);
      setComments(res.data.data || []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [contentType, contentId]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments, loadComments]);

  const toggleReaction = async (reaction) => {
    setActionError('');
    try {
      const res = await userApi.post('/reactions', {
        content_type: contentType,
        content_id: contentId,
        reaction,
      });
      setUserReaction(res.data.reaction || null);
      setLikes((l) => Math.max(0, l + (res.data.reaction === 'like' ? 1 : userReaction === 'like' ? -1 : 0)));
      setDislikes((d) => Math.max(0, d + (res.data.reaction === 'dislike' ? 1 : userReaction === 'dislike' ? -1 : 0)));
    } catch (err) {
      if (err.response?.status === 403) {
        setActionError('An active subscription is required to like or dislike.');
      } else if (err.response?.status === 401) {
        setActionError('Please log in to like or dislike.');
      } else {
        setActionError(err.response?.data?.message || 'Could not update your reaction.');
      }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    setCommentError('');
    const value = text.trim();
    if (!value) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    if (value.length > 1000) {
      setCommentError('Comment must be 1000 characters or fewer.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await userApi.post('/comments', {
        content_type: contentType,
        content_id: contentId,
        comment: value,
      });
      setComments((list) => [res.data.data, ...list]);
      setText('');
    } catch (err) {
      if (err.response?.status === 403) {
        setCommentError('An active subscription is required to comment.');
      } else {
        setCommentError(err.response?.data?.message || 'Could not post your comment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteOwnComment = async (id) => {
    setActionError('');
    try {
      await userApi.delete(`/comments/${id}`);
      setComments((list) => list.filter((c) => c.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not delete the comment.');
    }
  };

  const authorName = (c) => c.author_display_name || c.author_email?.split('@')[0] || 'Member';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-night-800">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Login or Create Account to interact</p>
          <div className="flex gap-2">
            <Link to="/login" className="btn-primary !px-4 !py-2 !text-xs">
              <FaRightToBracket className="h-3.5 w-3.5" /> Log In
            </Link>
            <Link to="/register" className="btn-outline !px-4 !py-2 !text-xs border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
              <FaUserPlus className="h-3.5 w-3.5" /> Create Account
            </Link>
          </div>
        </div>
      ) : !isSubscribed ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Subscribe to interact with songs and videos
            {subscription.status === 'pending' ? ' — your payment is awaiting approval.' : ''}
          </p>
          <Link to="/subscribe" className="btn-primary !px-4 !py-2 !text-xs">
            <FaCrown className="h-3.5 w-3.5" /> Subscribe
          </Link>
        </div>
      ) : (
        <>
          {/* Reaction row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleReaction('like')}
              aria-pressed={userReaction === 'like'}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                userReaction === 'like'
                  ? 'bg-royal-gradient text-night shadow-glow-royal'
                  : 'bg-white text-slate-600 hover:text-royal-500 dark:bg-night-700 dark:text-slate-300'
              }`}
            >
              <FaThumbsUp className="h-4 w-4" />
              {formatNumber(likes)}
            </button>
            <button
              type="button"
              onClick={() => toggleReaction('dislike')}
              aria-pressed={userReaction === 'dislike'}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                userReaction === 'dislike'
                  ? 'bg-red-500 text-white shadow'
                  : 'bg-white text-slate-600 hover:text-red-500 dark:bg-night-700 dark:text-slate-300'
              }`}
            >
              <FaThumbsDown className="h-4 w-4" />
              {formatNumber(dislikes)}
            </button>

            <button
              type="button"
              onClick={() => setShowComments((s) => !s)}
              aria-expanded={showComments}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-gold dark:bg-night-700 dark:text-slate-300"
            >
              <FaComment className="h-4 w-4" />
              {formatNumber(comments.length)}
            </button>
          </div>

          {actionError && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-500">{actionError}</p>}

          {reactionsLoading && <p className="mt-3 text-xs text-slate-400">Loading reactions…</p>}

          {/* Comments */}
          {showComments && (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
              <form onSubmit={submitComment} className="flex items-start gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1000}
                  placeholder="Share your thoughts…"
                  aria-label="Write a comment"
                  className="input flex-1 !py-2.5"
                />
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  aria-label="Post comment"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-night transition hover:brightness-110 disabled:opacity-50"
                >
                  <FiSend className="h-4 w-4" />
                </button>
              </form>
              {commentError && <p className="mt-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-500">{commentError}</p>}

              <ul className="mt-4 space-y-4">
                {commentsLoading ? (
                  <li className="text-xs text-slate-400">Loading comments…</li>
                ) : comments.length === 0 ? (
                  <li className="text-sm text-slate-400">No comments yet — be the first!</li>
                ) : (
                  comments.map((c) => (
                    <li key={c.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{authorName(c)}</p>
                        <span className="text-[11px] text-slate-400">
                          {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{' '}
                          {new Date(c.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">{c.comment}</p>
                      {c.user_id === userId && (
                        <button
                          type="button"
                          onClick={() => deleteOwnComment(c.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 transition hover:text-red-500"
                        >
                          <FaTrashCan className="h-3 w-3" /> Delete
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
