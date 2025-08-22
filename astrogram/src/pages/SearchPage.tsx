import React, { useState } from 'react';
import { searchAll, SearchResults } from '../lib/api';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchAll(query);
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults({ users: [], lounges: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-4 flex">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users and lounges"
          className="flex-1 p-2 border rounded-l"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-r"
        >
          Search
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {results && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            {results.users.length === 0 && (
              <p className="text-gray-500">No users found</p>
            )}
            <ul className="space-y-2">
              {results.users.map((u) => (
                <li key={u.id} className="flex items-center space-x-2">
                  {u.avatarUrl && (
                    <img
                      src={u.avatarUrl}
                      alt={u.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{u.username}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Lounges</h2>
            {results.lounges.length === 0 && (
              <p className="text-gray-500">No lounges found</p>
            )}
            <ul className="space-y-2">
              {results.lounges.map((l) => (
                <li key={l.id} className="flex items-center space-x-2">
                  {l.profileUrl && (
                    <img
                      src={l.profileUrl}
                      alt={l.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{l.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;

