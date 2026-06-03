import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Play, Users, MessageCircle, Sparkles as SparkleIcon } from 'lucide-react';
import { creatorAPI, roomAPI, contentAPI, chatAPI, CreatorDetail } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useStore } from '../store';
import { CardSkeleton } from '../components/Skeletons';

export const CreatorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [creatorData, setCreatorData] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const user = useStore((state) => state.user);

  const fetchCreator = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await creatorAPI.getById(parseInt(id, 10));
      setCreatorData(data);
    } catch (err) {
      console.error('Failed to load creator:', err);
      setError('Unable to load creator details right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.is_authenticated || !creatorData) {
      navigate('/auth');
      return;
    }

    setActionLoading('subscribe');
    setMessage(null);
    try {
      const payment = await creatorAPI.initializePaystackSubscription(
        creatorData.creator.id,
        creatorData.creator.subscription_price,
        true,
      );
      const authorizationUrl = payment?.data?.authorization_url || payment?.authorization_url;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
        return;
      }

      const response = await creatorAPI.subscribe(creatorData.creator.id);
      setMessage(response.message || 'Subscription active — you can now access subscriber-only creator messages.');
      await fetchCreator();
    } catch (err) {
      console.error(err);
      const axiosError = err as AxiosError<any>;
      setMessage(axiosError.response?.data?.error || 'Unable to subscribe right now.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageCreator = async () => {
    if (!user?.is_authenticated || !creatorData) {
      navigate('/auth');
      return;
    }

    setActionLoading('message');
    try {
      await chatAPI.startChat(creatorData.creator.id);
      navigate('/chats');
    } catch (error) {
      setMessage('Unable to start a chat at the moment.');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCreator();
  }, [id]);

  const handleFollow = async () => {
    if (!user?.is_authenticated) {
      navigate('/auth');
      return;
    }

    if (!creatorData) return;

    setActionLoading('follow');
    try {
      await creatorAPI.follow(creatorData.creator.id);
      setMessage('You are now following this creator.');
    } catch (error) {
      setMessage('Please sign in to follow creators.');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchase = async (contentId: number, price: number) => {
    if (!user?.is_authenticated) {
      navigate('/auth');
      return;
    }

    if (price <= 0) {
      navigate(`/watch/${contentId}`);
      return;
    }

    setActionLoading('purchase');
    setMessage(null);
    try {
      const response = await contentAPI.purchase(contentId);
      setMessage(response.message || 'Purchase complete. Refresh to see purchase status.');
      await fetchCreator();
    } catch (err) {
      console.error(err);
      const axiosError = err as AxiosError<any>;
      setMessage(axiosError.response?.data?.error || 'Unable to purchase content right now.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    if (!user?.is_authenticated) {
      navigate('/auth');
      return;
    }

    setActionLoading('join');
    try {
      await roomAPI.join(roomId);
      setMessage('You joined the private room successfully.');
    } catch (error) {
      setMessage('Unable to join the room right now.');
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        <LoadingOverlay />
        <CardSkeleton count={2} />
      </div>
    );
  }

  if (!creatorData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-text-secondary">
        Creator not found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {error && (
          <div className="glass rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{creatorData.creator.display_name}</h1>
          <p className="text-text-secondary">@{creatorData.creator.username}</p>
          <p className="mt-2 text-sm text-text-secondary">
            Creator subscription: <span className="font-semibold text-white">₦{creatorData.creator.subscription_price.toFixed(2)}/mo</span>
            {creatorData.creator.is_subscribed && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Subscribed</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFollow}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Users className="w-5 h-5" />
            {actionLoading === 'follow' ? 'Following…' : 'Follow'}
          </button>
          <button
            onClick={handleSubscribe}
            disabled={actionLoading !== null || creatorData.creator.is_subscribed}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:border-primary hover:text-primary transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLoading === 'subscribe' ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Subscribing…
              </span>
            ) : creatorData.creator.is_subscribed ? (
              <span className="inline-flex items-center gap-2">
                <SparkleIcon className="w-5 h-5 text-primary" /> Subscribed
              </span>
            ) : (
              <>
                <SparkleIcon className="w-5 h-5" /> Subscribe
              </>
            )}
          </button>
          <button
            onClick={handleMessageCreator}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary/80 px-5 py-3 font-semibold text-white hover:bg-secondary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLoading === 'message' ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Messaging…
              </span>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" /> Message creator
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className="glass rounded-xl border border-white/10 p-4 text-sm text-white">
          {message}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl border border-white/10 p-6"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">About the creator</h2>
            <p className="text-text-secondary">{creatorData.creator.bio || 'No bio yet.'}</p>
          </div>
          <div className="rounded-3xl bg-[#111827] p-4 space-y-3">
            <p className="text-sm text-text-secondary">Followers</p>
            <p className="text-3xl font-bold text-white">{creatorData.creator.total_followers}</p>
            <p className="text-sm text-text-secondary">Published pieces</p>
            <p className="text-3xl font-bold text-white">{creatorData.creator.total_contents}</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Creator content</h2>
          <Link
            to="/bookmarks"
            className="text-sm text-primary hover:text-primary/80 transition"
          >
            View bookmarked content
          </Link>
        </div>

        {creatorData.contents.length === 0 ? (
          <div className="glass rounded-3xl border border-white/10 p-8 text-text-secondary">
            This creator has not published any content yet.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {creatorData.contents.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl border border-white/10 overflow-hidden"
              >
                <div className="relative aspect-video bg-[#111827]">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                      <Play className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    <span className="text-sm text-text-secondary">{item.content_type}</span>
                  </div>
                  <p className="text-text-secondary text-sm line-clamp-2">{item.description || 'No description available.'}</p>
                  <div className="flex items-center justify-between gap-3 text-sm text-text-secondary">
                    <span>{new Date(item.publish_date).toLocaleDateString()}</span>
                    <span>{item.price > 0 ? `₦${item.price}` : 'Free'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePurchase(item.id, item.price)}
                    disabled={actionLoading !== null || (item.price > 0 && item.has_purchased)}
                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading === 'purchase'
                      ? 'Processing purchase…'
                      : item.price > 0
                      ? item.has_purchased
                        ? 'Purchased'
                        : 'Buy Content'
                      : 'Access Content'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Private rooms</h2>
          <p className="text-text-secondary text-sm">Join private creator spaces if available.</p>
        </div>
        {creatorData.rooms.length === 0 ? (
          <div className="glass rounded-3xl border border-white/10 p-8 text-text-secondary">
            No private rooms are available at the moment.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {creatorData.rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl border border-white/10 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{room.title}</h3>
                    <p className="text-text-secondary text-sm">{room.description}</p>
                  </div>
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-4 text-sm text-text-secondary">
                  <span>{room.member_count} members</span>
                  <span>{room.is_active ? 'Open' : 'Closed'}</span>
                  <span>{room.price > 0 ? `₦${room.price}` : 'Free to join'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={actionLoading !== null}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === 'join' ? 'Joining room…' : 'Join Room'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
