import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createLounge } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [profile, setProfile] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLounge({
        name,
        description,
        profile: profile ?? undefined,
        banner: banner ?? undefined,
      });
      navigate('/lounge');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Lounge</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Profile Image</label>
          <input type="file" onChange={(e) => setProfile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block mb-1">Banner Image</label>
          <input type="file" onChange={(e) => setBanner(e.target.files?.[0] || null)} />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default AdminPage;
