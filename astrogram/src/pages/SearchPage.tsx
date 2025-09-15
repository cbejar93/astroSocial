import React, { useState } from 'react';
import { search, type SearchResponse } from '../lib/api';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performSearch(newPage: number) {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await search(query, newPage);
      setResults(data);
      setPage(newPage);
    } catch (err) {
      setError((err as Error).message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(1);
  };

  const hasResults = Boolean(
    results &&
      ((results.users?.results.length ?? 0) > 0 ||
        (results.lounges?.results.length ?? 0) > 0),
  );

  const hasPrev = page > 1;
  const hasNext = Boolean(
    results &&
      ((results.users &&
        results.users.total > results.users.page * results.users.limit) ||
        (results.lounges &&
          results.lounges.total >
            results.lounges.page * results.lounges.limit)),
  );

  return (
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4">
        <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Search</h1>
      <form onSubmit={onSubmit} className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="flex-grow p-2 rounded bg-gray-800 border border-gray-700"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
          disabled={loading}
        >
          Search
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {hasResults && (
        <div className="space-y-6">
          {results?.users?.results.length ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Users</h2>
              <ul className="space-y-2">
                {results.users.results.map((u) => (
                  <li key={u.id} className="flex items-center gap-2">
                    {u.avatarUrl && (
                      <img
                        src={u.avatarUrl}
                        alt={u.username ?? 'user'}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{u.username}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {results?.lounges?.results.length ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Lounges</h2>
              <ul className="space-y-2">
                {results.lounges.results.map((l) => (
                  <li key={l.id} className="flex items-center gap-2">
                    {l.bannerUrl && (
                      <img
                        src={l.bannerUrl}
                        alt={l.name}
                        className="w-8 h-8 rounded"
                      />
                    )}
                    <span>{l.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {results && !hasResults && !loading && <p>No results found</p>}

      {results && (hasPrev || hasNext) && (
        <div className="flex justify-between mt-4">
          <button
            onClick={() => performSearch(page - 1)}
            disabled={!hasPrev || loading}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => performSearch(page + 1)}
            disabled={!hasNext || loading}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;

