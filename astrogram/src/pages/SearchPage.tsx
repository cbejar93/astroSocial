import React, { useEffect, useState } from 'react';
import { search, SearchResponse } from '../lib/api';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setError(null);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await search(query, page);
        setResults(data);
      } catch (err) {
        setError((err as Error).message);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, page]);

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
    <div className="max-w-xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search..."
          className="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
      </div>

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
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev || loading}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPage;

