// src/pages/CompleteProfilePage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UploadCloud } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';


const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

const validateUsername = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Username is required';
  }

  if (trimmed.length < USERNAME_MIN_LENGTH || trimmed.length > USERNAME_MAX_LENGTH) {
    return `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`;
  }

  if (!USERNAME_PATTERN.test(trimmed)) {
    return 'Only letters, numbers, periods, and underscores are allowed';
  }

  return null;
};




const CompleteProfilePage: React.FC = () => {
  const navigate        = useNavigate();
  const { refreshUser } = useAuth();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [username, setUsername] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // clean up object URL
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      setImageFile(null);
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }
    setError(null);
    setImageFile(f);
    setSelectedFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationMessage = validateUsername(username);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append('username', username.trim());
      if (imageFile) form.append('avatar', imageFile);
      const res = await apiFetch('/users/me', {
        method: 'PUT',
        body: form,
      });


      if (!res.ok) {
        let message = 'Failed to update profile';
        try {
          const body = await res.json();
          if (Array.isArray(body?.message)) {
            message = body.message[0];
          } else if (body?.message) {
            message = body.message;
          }
        } catch {
          // ignore JSON parse errors and fall back to default message
        }
        throw new Error(message);
      }

      await refreshUser();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 lg:py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-6 rounded-3xl border border-white/10 bg-white/10 px-6 py-8 text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
      >
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">step 02</p>
            <h2 className="text-2xl font-semibold">Complete Your Profile</h2>
            <p className="text-sm text-white/70">Choose a public username and upload an avatar so the community knows it's you.</p>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/80">Username</label>
            <input
              type="text"
              value={username}
              maxLength={USERNAME_MAX_LENGTH}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Choose a username"
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-white placeholder-white/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            />
            <p className="text-xs text-white/60">
              Use {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters: letters, numbers, periods, or underscores.
            </p>
            {error && <p className="text-sm text-rose-300">{error}</p>}
          </div>

          {/* Styled file upload */}
          <div>
            <label
              htmlFor="avatar"
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-6 text-center text-white/80 transition hover:border-white/40 hover:bg-white/10"
            >
              <UploadCloud className="h-10 w-10 text-white/60" />
              <span className="text-sm">
                {selectedFile ? "Change" : "Click to upload"} profile picture
              </span>

              {selectedFile && (
                <span className="text-xs text-white/50">{selectedFile.name}</span>
              )}

              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="avatar preview"
                  className="mt-2 h-20 w-20 rounded-full object-cover ring-2 ring-white/20"
                />
              )}

              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-4 py-2.5 text-base font-semibold shadow-lg shadow-sky-900/40 transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving profile
              </>
            ) : (
              "Save profile"
            )}
          </button>
        </form>
    </div>
  );
};

export default CompleteProfilePage;
