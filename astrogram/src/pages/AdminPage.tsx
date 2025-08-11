import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createLounge } from '../lib/api';

const tabClasses =
  'whitespace-nowrap py-2 px-1 border-b-2 font-bold text-sm hover:no-underline transition-colors duration-200';

const AdminPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const active: 'lounge' | 'users' | 'posts' =
    tab === 'users' ? 'users' : tab === 'posts' ? 'posts' : 'lounge';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', name);
    form.append('description', description);
    if (profile) form.append('profile', profile);
    if (banner) form.append('banner', banner);
    try {
      await createLounge(form);
      setMessage('Lounge created successfully');
      setName('');
      setDescription('');
      setProfile(null);
      setBanner(null);
    } catch (err) {
      console.error(err);
      setMessage('Failed to create lounge');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto text-gray-200">
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
          <button
            type="submit"
            className="px-4 py-2 bg-brand text-white rounded"
          >
            Create Lounge
          </button>
        </form>
      )}

      {active === 'users' && <div>User management coming soon.</div>}
      {active === 'posts' && <div>Post moderation coming soon.</div>}
    </div>
  );
};

export default AdminPage;
