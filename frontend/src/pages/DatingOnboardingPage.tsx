import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { datingAPI } from '../services/api';
import LocationSelect from '../components/LocationSelect';
import PhotoUploadPremium from '../components/PhotoUploadPremium';

export const DatingOnboardingPage: React.FC = () => {
  const user = useStore((state) => state.user);
  const navigate = useNavigate();
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [interests, setInterests] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [photo3, setPhoto3] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.is_authenticated) {
      navigate('/auth');
      return;
    }

    if (user.profile) {
      setGender(user.profile.dating_gender || '');
      setAge(user.profile.dating_age?.toString() || '');
      setLocation(user.profile.dating_location || '');
      setLookingFor(user.profile.dating_looking_for || '');
      setInterests(user.profile.dating_interests || '');
      setPublicProfile(user.profile.dating_profile_public ?? true);
    }
  }, [user, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('dating_gender', gender);
      formData.append('dating_age', age);
      formData.append('dating_location', location);
      formData.append('dating_looking_for', lookingFor);
      formData.append('dating_interests', interests);
      formData.append('dating_profile_public', publicProfile ? 'true' : 'false');
      if (photo1) formData.append('dating_photo_1', photo1);
      if (photo2) formData.append('dating_photo_2', photo2);
      if (photo3) formData.append('dating_photo_3', photo3);

      await datingAPI.updateProfile(formData);
      setMessage('Cherry profile saved. You can now start swiping!');
      navigate('/dating/discover');
    } catch (error: unknown) {
      console.error('Failed to save profile', error);
      const apiError = (error as any)?.response?.data?.error;
      setMessage(apiError || 'Could not save your dating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-12">
      {loading && <LoadingOverlay />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Cherry Onboarding</h1>
        <p className="text-text-secondary mt-2">Build your dating profile so Cherry can match you with people who are looking for love.</p>
      </motion.div>

      {message && (
        <div className="glass rounded-3xl border border-white/10 p-4 text-sm text-white mb-6">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass rounded-3xl border border-white/10 p-8 space-y-6">
        <div>
          <label className="block text-sm text-text-secondary mb-2">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Age</label>
            <input
              type="number"
              min="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="Age"
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Location</label>
            <LocationSelect
              value={
                location
                  ? (() => {
                      const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
                      if (parts.length > 1) {
                        return { country: parts[parts.length - 1], state: parts.slice(0, -1).join(', ') };
                      }
                      return { country: parts[0] };
                    })()
                  : undefined
              }
              onChange={(v) => {
                const countryName = v?.country || '';
                const stateName = v?.state || '';
                setLocation(stateName ? `${stateName}, ${countryName}` : countryName);
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Looking for</label>
          <select
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
          >
            <option value="">Select an option</option>
            <option value="long_term">Long term</option>
            <option value="short_term">Short term</option>
            <option value="casual">Casual</option>
            <option value="friendship">Friendship</option>
            <option value="friends_with_benefits">Friends with benefits</option>
            <option value="something_else">Something else</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Interests</label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full rounded-3xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none resize-none h-28 focus:border-primary"
            placeholder="Hobbies, passions, favorite activities"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex justify-center">
            <PhotoUploadPremium label="Photo 1" onFile={(f) => setPhoto1(f)} />
          </div>
          <div className="flex justify-center">
            <PhotoUploadPremium label="Photo 2" onFile={(f) => setPhoto2(f)} />
          </div>
          <div className="flex justify-center">
            <PhotoUploadPremium label="Photo 3" onFile={(f) => setPhoto3(f)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="publicProfile"
            type="checkbox"
            checked={publicProfile}
            onChange={(e) => setPublicProfile(e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-secondary/70 text-primary focus:ring-primary"
          />
          <label htmlFor="publicProfile" className="text-sm text-text-secondary">
            Make my Cherry profile discoverable by other members
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-3 text-white font-semibold hover:bg-primary/90 transition"
        >
          Save profile
        </button>
      </form>
    </div>
  );
};
