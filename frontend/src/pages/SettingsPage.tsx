import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Bell, Eye, MessageCircle, UserCheck } from 'lucide-react';
import { authAPI, ProfileSettings, SubscriptionItem, subscriptionAPI } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useStore } from '../store';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const setUser = useStore((state) => state.setUser);
  const user = useStore((state) => state.user);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const current = await authAPI.getCurrentUser();
        setSettings(current.profile || {
          subscription_price: 0,
          allow_direct_messages: true,
          show_profile_public: true,
          hide_followers: false,
          allow_subscriptions: true,
          notification_newsletter: false,
          bio: '',
        });
        const subs = await subscriptionAPI.getAll();
        setSubscriptions(subs);
        if (current.is_authenticated) {
          setUser({
            id: current.id,
            username: current.username,
            is_authenticated: current.is_authenticated,
            is_creator: current.is_creator,
            profile: current.profile,
          });
        }
      } catch (error) {
        console.error('Unable to load settings', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [setUser]);

  const updateField = (field: keyof ProfileSettings, value: string | boolean | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value as any });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await authAPI.updateSettings(settings);
      setMessage('Settings saved.');
      if (user) {
        setUser({ ...user, profile: settings });
      }
    } catch (error) {
      setMessage('Unable to update settings.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {loading && <LoadingOverlay />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
        <p className="text-text-secondary mt-2">Control your creator profile, subscription pricing, and privacy preferences.</p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="glass rounded-3xl border border-white/10 p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Privacy & messaging</h2>
            </div>
            <p className="text-text-secondary">Fine-tune your visibility, message permissions, and newsletter preferences.</p>
          </div>

          {loading || !settings ? (
            <div className="space-y-3">
              <div className="h-14 rounded-3xl bg-secondary/50 animate-pulse" />
              <div className="h-14 rounded-3xl bg-secondary/50 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-4">
                  <Eye className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Public profile</p>
                    <p className="text-sm text-text-secondary">Show your creator page to the community.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.show_profile_public}
                    onChange={(e) => updateField('show_profile_public', e.target.checked)}
                    className="ml-auto h-5 w-5 accent-primary"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-4">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Allow direct messages</p>
                    <p className="text-sm text-text-secondary">Let users start chats with you.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_direct_messages}
                    onChange={(e) => updateField('allow_direct_messages', e.target.checked)}
                    className="ml-auto h-5 w-5 accent-primary"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-4">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Newsletter updates</p>
                  <p className="text-sm text-text-secondary">Receive creator news, offers, and product announcements.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notification_newsletter}
                  onChange={(e) => updateField('notification_newsletter', e.target.checked)}
                  className="ml-auto h-5 w-5 accent-primary"
                />
              </label>

              <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-4">
                <UserCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Hide follower count</p>
                  <p className="text-sm text-text-secondary">Keep your audience size private from visitors.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.hide_followers}
                  onChange={(e) => updateField('hide_followers', e.target.checked)}
                  className="ml-auto h-5 w-5 accent-primary"
                />
              </label>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Profile bio</label>
                <textarea
                  value={settings.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none resize-none h-28 focus:border-primary"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-3xl bg-primary px-5 py-4 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Saving settings…
              </span>
            ) : (
              'Save privacy settings'
            )}
          </button>
          {message && <p className="text-sm text-primary/80">{message}</p>}
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-5">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Subscription control</h2>
                <p className="text-text-secondary text-sm">Creators set their own subscription pricing here.</p>
              </div>
            </div>

            {settings && user?.is_creator ? (
              <div className="space-y-4">
                <label className="block text-sm text-text-secondary">Subscription price</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={settings.subscription_price}
                  onChange={(e) => updateField('subscription_price', parseFloat(e.target.value || '0'))}
                  className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                />
                <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-4">
                  <span className="font-semibold">Accept subscriptions</span>
                  <input
                    type="checkbox"
                    checked={settings.allow_subscriptions}
                    onChange={(e) => updateField('allow_subscriptions', e.target.checked)}
                    className="ml-auto h-5 w-5 accent-primary"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-6 text-text-secondary">
                Creator subscription controls appear here once you sign up as a creator.
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-5">
              <UserCheck className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Your subscriptions</h2>
                <p className="text-text-secondary text-sm">Creators you're currently subscribed to.</p>
              </div>
            </div>

            {subscriptions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-6 text-text-secondary text-center">
                No active subscriptions yet. Subscribe to a creator to unlock premium conversations and content.
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-3xl border border-white/10 bg-secondary/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{subscription.creator.display_name}</p>
                        <p className="text-sm text-text-secondary">@{subscription.creator.username}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">₦{subscription.price.toFixed(2)}/mo</span>
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">Subscribed on {new Date(subscription.subscribed_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
