import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../components/Layout/PageContainer';
import { fetchArticleBySlug, type Article } from '../lib/api';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

const ArticleDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    fetchArticleBySlug(slug)
      .then((data) => {
        if (!cancelled) setArticle(data);
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
  }, [slug]);

  if (loading) {
    return (
      <PageContainer size="narrow" className="py-8 text-gray-200">
        <p className="text-gray-400">Loading article...</p>
      </PageContainer>
    );
  }

  if (error || !article) {
    return (
      <PageContainer size="narrow" className="py-8 text-gray-200">
        <div className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error || 'Article not found.'}
        </div>
        <Link
          to="/articles"
          className="inline-flex items-center gap-1 mt-4 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={14} /> Back to articles
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow" className="py-8 text-gray-200">
      <Link
        to="/articles"
        className="inline-flex items-center gap-1 mb-6 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft size={14} /> Back to articles
      </Link>

      {article.coverImageUrl && (
        <img
          src={article.coverImageUrl}
          alt={article.title}
          className="w-full max-h-80 object-cover rounded-xl mb-6"
        />
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
        {article.title}
      </h1>

      <div className="flex items-center gap-3 mb-8 text-sm text-gray-400">
        {article.author && (
          <div className="flex items-center gap-2">
            {article.author.avatarUrl && (
              <img
                src={article.author.avatarUrl}
                alt={article.author.username}
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            <span>{article.author.username}</span>
          </div>
        )}
        {article.publishedAt && (
          <span>{format(new Date(article.publishedAt), 'MMMM d, yyyy')}</span>
        )}
      </div>

      <div
        className="prose-article"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />
    </PageContainer>
  );
};

export default ArticleDetailPage;
