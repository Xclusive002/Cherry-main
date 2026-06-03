import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Plus, Upload, MessageCircle } from 'lucide-react';
import { authAPI, contentAPI, creatorAPI, CreatorDetail, roomAPI } from '../services/api';
import { ContentCard } from '../components/ContentCard';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useStore } from '../store';

export const ProfilePage: React.FC = () => {
  const [creatorData, setCreatorData] = useState<CreatorDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingContent, setSubmittingContent] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [contentForm, setContentForm] = useState({
    title: '',
    description: '',
    content_type: 'video',
    price: '0',
    source_url: '',
    story_text: '',
    age_restricted: true,
    video_file: null as File | null,
    image_file: null as File | null,
    thumbnail: null as File | null,
  });
  const [roomForm, setRoomForm] = useState({
    title: '',
    description: '',
    price: '0',
    is_active: true,
  });
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  const loadProfile = async () => {
    setLoading(true);
    try {
      const current = await authAPI.getCurrentUser();
      if (!current.is_authenticated) {
        navigate('/auth');
        return;
      }
      setUser(current);
      if (current.is_creator) {
        const data = await creatorAPI.getMe();
        setCreatorData(data);
      } else {
        setCreatorData(null);
      }
    } catch (error) {
      console.error('Unable to load profile', error);
      setMessage('Unable to load your profile. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleContentInput = (field: string, value: string | boolean | File | null) => {
    setContentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRoomInput = (field: string, value: string | boolean) => {
    setRoomForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateContent = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSubmittingContent(true);

    try {
      const formData = new FormData();
      formData.append('title', contentForm.title);
      formData.append('description', contentForm.description);
      formData.append('content_type', contentForm.content_type);
      formData.append('price', contentForm.price || '0');
      formData.append('age_restricted', contentForm.age_restricted ? 'true' : 'false');
      if (contentForm.source_url) {
        formData.append('source_url', contentForm.source_url);
      }
      if (contentForm.story_text) {
        formData.append('story_text', contentForm.story_text);
      }
      if (contentForm.video_file) {
        formData.append('video_file', contentForm.video_file);
      }
      if (contentForm.image_file) {
        formData.append('image_file', contentForm.image_file);
      }
      if (contentForm.thumbnail) {
        formData.append('thumbnail', contentForm.thumbnail);
      }

      const item = await contentAPI.create(formData);
      setMessage(`Content "${item.title}" created successfully.`);
      setContentForm({
        title: '',
        description: '',
        content_type: 'video',
        price: '0',
        source_url: '',
        story_text: '',
        age_restricted: true,
        video_file: null,
        image_file: null,
        thumbnail: null,
      });
      loadProfile();
    } catch (error) {
      console.error('Failed to create content', error);
      setMessage('Unable to create content. Please check your inputs and try again.');
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setCreatingRoom(true);

    try {
      await roomAPI.create({
        title: roomForm.title,
        description: roomForm.description,
        price: Number(roomForm.price || 0),
        is_active: roomForm.is_active,
      });
      setMessage('Private room created successfully.');
      setRoomForm({ title: '', description: '', price: '0', is_active: true });
      loadProfile();
    } catch (error) {
      console.error('Failed to create room', error);
      setMessage('Unable to create room. Please try again.');
    } finally {
      setCreatingRoom(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      {loading && <LoadingOverlay />}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">My Creator Profile</h1>
        <p className="text-text-secondary mt-2">
          Manage your creator page, published content, room experiences, and performance metrics.
        </p>
      </motion.div>

      {message && (
        <div className="glass rounded-3xl border border-white/10 p-4 text-sm text-white mb-6">
          {message}
        </div>
      )}

      {!creatorData ? (
        <div className="glass rounded-3xl border border-white/10 p-8 space-y-4">
          <h2 className="text-2xl font-semibold">Creator profile not available</h2>
          <p className="text-text-secondary">
            Your account is not currently set up as a creator. Visit your settings to become a creator and start uploading premium content.
          </p>
          <Link to="/settings" className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 text-white font-semibold hover:bg-primary/90 transition">
            <Plus className="w-4 h-4" /> Become a creator
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <div className="glass rounded-3xl border border-white/10 p-8 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{creatorData.creator.display_name}</h2>
                  <p className="text-text-secondary">@{creatorData.creator.username}</p>
                </div>
                <div className="rounded-3xl bg-secondary/70 px-5 py-3 text-sm text-text-secondary">
                  Creator since your account registration.
                </div>
              </div>

              <p className="text-text-secondary leading-relaxed">{creatorData.creator.bio || 'Share your story, pricing and premium content here for your followers.'}</p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Followers</p>
                  <p className="mt-3 text-3xl font-bold text-white">{creatorData.creator.total_followers}</p>
                </div>
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Published content</p>
                  <p className="mt-3 text-3xl font-bold text-white">{creatorData.creator.total_contents}</p>
                </div>
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Monthly subscriber price</p>
                  <p className="mt-3 text-3xl font-bold text-white">₦{creatorData.creator.subscription_price.toFixed(2)}</p>
                </div>
                <div className="rounded-3xl bg-[#111827] p-5">
                  <p className="text-sm text-text-secondary">Total earned</p>
                  <p className="mt-3 text-3xl font-bold text-white">₦{creatorData.performance?.total_earned.toFixed(2) ?? '0.00'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-secondary/70 p-5">
                  <p className="text-sm text-text-secondary">Paid content sales</p>
                  <p className="mt-3 text-3xl font-bold text-white">{creatorData.performance?.total_content_sales ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-secondary/70 p-5">
                  <p className="text-sm text-text-secondary">Room memberships</p>
                  <p className="mt-3 text-3xl font-bold text-white">{creatorData.performance?.total_room_sales ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/10 p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Upload new content</h3>
                  <p className="text-text-secondary text-sm">Add video, image, story, or leak content with pricing controls.</p>
                </div>
              </div>
              <form onSubmit={handleCreateContent} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={contentForm.title}
                    onChange={(e) => handleContentInput('title', e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                    placeholder="Title"
                  />
                  <select
                    value={contentForm.content_type}
                    onChange={(e) => handleContentInput('content_type', e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="story">Story</option>
                    <option value="leak">Leak</option>
                  </select>
                </div>

                <textarea
                  value={contentForm.description}
                  onChange={(e) => handleContentInput('description', e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none resize-none h-24 focus:border-primary"
                  placeholder="Description"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={contentForm.price}
                    onChange={(e) => handleContentInput('price', e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                    placeholder="Price (0 for free)"
                  />
                  <label className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white">
                    <input
                      type="checkbox"
                      checked={contentForm.age_restricted}
                      onChange={(e) => handleContentInput('age_restricted', e.target.checked)}
                      className="h-5 w-5 accent-primary"
                    />
                    Age restricted
                  </label>
                </div>

                {(contentForm.content_type === 'video' || contentForm.content_type === 'leak') && (
                  <div className="grid gap-3">
                    <label className="text-sm text-text-secondary">Video file</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleContentInput('video_file', e.target.files?.[0] || null)}
                      className="w-full text-sm text-white"
                    />
                  </div>
                )}

                {contentForm.content_type === 'image' && (
                  <div className="grid gap-3">
                    <label className="text-sm text-text-secondary">Image file</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleContentInput('image_file', e.target.files?.[0] || null)}
                      className="w-full text-sm text-white"
                    />
                  </div>
                )}

                {contentForm.content_type === 'story' && (
                  <textarea
                    value={contentForm.story_text}
                    onChange={(e) => handleContentInput('story_text', e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none resize-none h-32 focus:border-primary"
                    placeholder="Story text"
                  />
                )}

                <div className="grid gap-4">
                  <input
                    value={contentForm.source_url}
                    onChange={(e) => handleContentInput('source_url', e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                    placeholder="Source URL (optional)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleContentInput('thumbnail', e.target.files?.[0] || null)}
                    className="w-full text-sm text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingContent}
                  className="w-full rounded-3xl bg-primary px-5 py-4 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingContent ? 'Uploading content…' : 'Upload content'}
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Published content</h2>
                <span className="text-sm text-text-secondary">{creatorData.contents.length} items</span>
              </div>
              {creatorData.contents.length === 0 ? (
                <div className="glass rounded-3xl border border-white/10 p-8 text-text-secondary">
                  No published content yet. Start by uploading your first piece.
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {creatorData.contents.map((item, index) => (
                    <ContentCard key={item.id} item={item} index={index} />
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-3xl border border-white/10 p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Create a private room</h3>
                  <p className="text-text-secondary text-sm">Add a private space for subscribers and fans.</p>
                </div>
              </div>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <input
                  value={roomForm.title}
                  onChange={(e) => handleRoomInput('title', e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="Room title"
                />
                <textarea
                  value={roomForm.description}
                  onChange={(e) => handleRoomInput('description', e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none resize-none h-24 focus:border-primary"
                  placeholder="Room description"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={roomForm.price}
                  onChange={(e) => handleRoomInput('price', e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="Price (0 for free)"
                />
                <label className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white">
                  <input
                    type="checkbox"
                    checked={roomForm.is_active}
                    onChange={(e) => handleRoomInput('is_active', e.target.checked)}
                    className="h-5 w-5 accent-primary"
                  />
                  Room is active and accepting members
                </label>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="w-full rounded-3xl bg-primary px-5 py-4 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingRoom ? 'Creating room…' : 'Create room'}
                </button>
              </form>
            </div>
          </div>

          <div className="glass rounded-3xl border border-white/10 p-8 space-y-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Your creator operations</h2>
            </div>
            <p className="text-text-secondary">Use this page to monitor your published materials and add new creator experiences.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/settings" className="rounded-3xl border border-white/10 bg-secondary/70 px-5 py-4 text-sm font-semibold text-white text-center hover:border-primary transition">
                Update creator preferences
              </Link>
              <Link to="/creators" className="rounded-3xl border border-white/10 bg-secondary/70 px-5 py-4 text-sm font-semibold text-white text-center hover:border-primary transition">
                Browse other creators
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
