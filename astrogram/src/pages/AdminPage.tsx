import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  createLounge,
  updateLounge,
  fetchAdminUsers,
  type AdminUserSummary,
} from '../lib/api';
import AdminAnalyticsDashboard from '../components/AdminAnalyticsDashboard';
import { useAuth } from '../hooks/useAuth';

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
  const { user } = useAuth();
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
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLimit] = useState(20);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const location = useLocation();
  const editingLounge = (location.state as LoungeState | undefined)?.lounge;

  useEffect(() => {
    if (editingLounge) {
      setName(editingLounge.name);
      setDescription(editingLounge.description);
      setEditingId(editingLounge.id);
    }
  }, [editingLounge]);

  useEffect(() => {
    let isMounted = true;
    if (active !== 'users') {
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      setUsersError('Admin access required.');
      return;
    }
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const data = await fetchAdminUsers(usersPage, usersLimit);
        if (!isMounted) return;
        setAdminUsers(data.results);
        setUsersTotal(data.total);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : 'Unable to load users.';
        setUsersError(message);
      } finally {
        if (isMounted) {
          setUsersLoading(false);
        }
      }
    };
    void loadUsers();
    return () => {
      isMounted = false;
    };
  }, [active, user, usersLimit, usersPage]);


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
      <div className="w-full max-w-none px-0 sm:px-6 text-gray-200">
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

        {active === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">All Users</h2>
                <p className="text-sm text-gray-400">
                  {usersTotal === 0 ? 'No users found.' : `${usersTotal} total users`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                  disabled={usersPage <= 1 || usersLoading}
                  className="px-3 py-1 rounded border border-gray-600 text-sm text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {usersPage} of {Math.max(1, Math.ceil(usersTotal / usersLimit))}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setUsersPage((prev) =>
                      prev < Math.ceil(usersTotal / usersLimit) ? prev + 1 : prev,
                    )
                  }
                  disabled={
                    usersLoading || usersPage >= Math.ceil(usersTotal / usersLimit)
                  }
                  className="px-3 py-1 rounded border border-gray-600 text-sm text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            {usersError && (
              <div className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                {usersError}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700 text-sm">
                <thead className="bg-gray-800/60 text-left text-gray-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Profile</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/40">
                  {usersLoading && (
                    <tr>
                      <td className="px-4 py-6 text-gray-400" colSpan={4}>
                        Loading users...
                      </td>
                    </tr>
                  )}
                  {!usersLoading && adminUsers.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-gray-400" colSpan={4}>
                        No users to display.
                      </td>
                    </tr>
                  )}
                  {!usersLoading &&
                    adminUsers.map((adminUser) => (
                      <tr key={adminUser.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={adminUser.avatarUrl || '/defaultPfp.png'}
                              alt={adminUser.username || 'User avatar'}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-semibold text-white">
                                {adminUser.username || 'Unknown user'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {adminUser.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-200">{adminUser.role}</td>
                        <td className="px-4 py-3 text-gray-200">
                          {adminUser.profileComplete ? 'Complete' : 'Incomplete'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(adminUser.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {active === 'posts' && <div>Post moderation coming soon.</div>}
        {active === 'analytics' && <AdminAnalyticsDashboard />}
      </div>
    </div>
  );
};

export default AdminPage;
