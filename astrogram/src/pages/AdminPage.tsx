import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { createLounge, updateLounge } from '../lib/api';
import AdminAnalyticsDashboard from '../components/AdminAnalyticsDashboard';

interface LoungeState {
  lounge?: {
    id: string;
    name: string;
    description: string;
    bannerUrl: string;
    profileUrl: string;
  };
}


const tabClasses =
  'whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200';

const AdminPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const active: 'lounge' | 'users' | 'posts' | 'analytics' =
    tab === 'users'
      ? 'users'
      : tab === 'posts'
        ? 'posts'
        : tab === 'analytics'
          ? 'analytics'
          : 'lounge';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const location = useLocation();
  const editingLounge = (location.state as LoungeState | undefined)?.lounge;

  useEffect(() => {
    if (editingLounge) {
      setName(editingLounge.name);
      setDescription(editingLounge.description);
      setEditingId(editingLounge.id);
    }
  }, [editingLounge]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    if (profile) form.append('profile', profile);
    if (banner) form.append('banner', banner);
    try {
      if (editingId) {
        await updateLounge(editingId, form);
        setMessage('Lounge updated successfully');
      } else {
        await createLounge(form);
        setMessage('Lounge created successfully');
      }

      setName('');
      setDescription('');
      setProfile(null);
      setBanner(null);

      setEditingId(null);
    } catch (err) {
      console.error(err);
      setMessage('Failed to submit lounge');
    }
  };

  return (
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4 text-gray-200">
        <div className="border-b border-gray-700 mb-4 pt-4">
          <nav className="-mb-px flex justify-center space-x-8" aria-label="Admin tabs">
            <Link
              to="/admin/lounge"
              className={`${tabClasses} ${
                active === 'lounge'
                  ? 'border-brand text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Lounge
            </Link>
            <Link
              to="/admin/users"
              className={`${tabClasses} ${
                active === 'users'
                  ? 'border-brand text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Users
            </Link>
            <Link
              to="/admin/posts"
              className={`${tabClasses} ${
                active === 'posts'
                  ? 'border-brand text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Posts
            </Link>
            <Link
              to="/admin/analytics"
              className={`${tabClasses} ${
                active === 'analytics'
                  ? 'border-brand text-white'
                  : 'border-transparent text-white hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Analytics
            </Link>
          </nav>
        </div>

        {active === 'lounge' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div>{message}</div>}
            <div>
              <label className="block mb-1 text-sm">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Banner Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBanner(e.target.files?.[0] || null)}
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-brand text-white rounded">
              {editingId ? 'Update Lounge' : 'Create Lounge'}
            </button>
          </form>
        )}

        {active === 'users' && <div>User management coming soon.</div>}
        {active === 'posts' && <div>Post moderation coming soon.</div>}
        {active === 'analytics' && <AdminAnalyticsDashboard />}
      </div>
    </div>
  );
};

export default AdminPage;
