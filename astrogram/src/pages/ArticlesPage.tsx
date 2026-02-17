import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/Layout/PageContainer';
import { fetchPublishedArticles, type Article } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublishedArticles(page, limit)
      .then((data) => {
        if (cancelled) return;
        setArticles(data.articles);
        setTotal(data.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.substring(0, 160) ?? '';
  };

  return (
    <PageContainer size="standard" className="py-8 text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Articles</h1>

      {error && (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading articles...</p>
      ) : articles.length === 0 ? (
        <p className="text-gray-400">No articles published yet.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className="block rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden hover:border-gray-500 transition-colors"
            >
              {article.coverImageUrl && (
                <img
                  src={article.coverImageUrl}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {article.title}
                </h2>
                <p className="text-gray-400 text-sm mb-3">
                  {article.excerpt || stripHtml(article.body)}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {article.author && (
                    <div className="flex items-center gap-2">
                      {article.author.avatarUrl && (
                        <img
                          src={article.author.avatarUrl}
                          alt={article.author.username}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      )}
                      <span>{article.author.username}</span>
                    </div>
                  )}
                  {article.publishedAt && (
                    <span>
                      {formatDistanceToNow(new Date(article.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-gray-600 text-sm text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border border-gray-600 text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </PageContainer>
  );
};

export default ArticlesPage;
