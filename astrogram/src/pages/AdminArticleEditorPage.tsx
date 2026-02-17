import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../components/Layout/PageContainer';
import ArticleEditor from '../components/Articles/ArticleEditor';
import {
  createArticle,
  updateArticle,
  fetchAdminArticleById,
  type Article,
} from '../lib/api';

const AdminArticleEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<Article | null>(null);

  // Load existing article for editing
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchAdminArticleById(id)
      .then((article) => {
        if (cancelled) return;
        setExisting(article);
        setTitle(article.title);
        setSlug(article.slug);
        setSlugManual(true);
        setExcerpt(article.excerpt ?? '');
        setBody(article.body);
        setStatus(article.status);
        if (article.coverImageUrl) setCoverPreview(article.coverImageUrl);
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
  }, [id]);

  // Auto-generate slug from title
  useEffect(() => {
    if (slugManual) return;
    const generated = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
    setSlug(generated);
  }, [title, slugManual]);

  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setCoverImage(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    },
    [],
  );

  const handleSubmit = async (submitStatus: 'DRAFT' | 'PUBLISHED') => {
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append('title', title);
    form.append('body', body);
    form.append('slug', slug);
    form.append('status', submitStatus);
    if (excerpt) form.append('excerpt', excerpt);
    if (coverImage) form.append('coverImage', coverImage);

    try {
      if (isEditing && id) {
        await updateArticle(id, form);
      } else {
        await createArticle(form);
      }
      navigate('/admin/articles');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing && !existing) {
    return (
      <PageContainer size="standard" className="py-8 text-gray-200">
        <p className="text-gray-400">Loading article...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="standard" className="py-8 text-gray-200">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Article' : 'New Article'}
      </h1>

      {error && (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block mb-1 text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            placeholder="Article title"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block mb-1 text-sm font-medium">Slug</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
              className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 text-white"
              placeholder="article-slug"
            />
            {slugManual && (
              <button
                type="button"
                onClick={() => setSlugManual(false)}
                className="px-3 py-2 text-sm rounded border border-gray-600 text-gray-300 hover:text-white"
              >
                Auto
              </button>
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Excerpt (optional)
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            placeholder="Brief summary of the article"
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block mb-1 text-sm font-medium">Cover Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/tiff"
            onChange={handleCoverChange}
            className="text-sm text-gray-400"
          />
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="mt-2 max-h-48 rounded-lg object-cover"
            />
          )}
        </div>

        {/* Body Editor */}
        <div>
          <label className="block mb-1 text-sm font-medium">Content</label>
          <ArticleEditor
            onChange={setBody}
            initialContent={existing?.body ?? ''}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading || !title || !body}
            className="px-4 py-2 rounded border border-gray-600 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isEditing ? 'Save as Draft' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={loading || !title || !body}
            className="px-4 py-2 rounded bg-brand text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {isEditing
              ? status === 'PUBLISHED'
                ? 'Update'
                : 'Publish'
              : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="px-4 py-2 rounded text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminArticleEditorPage;
