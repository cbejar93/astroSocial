// src/pages/CompleteProfilePage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
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
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-800 p-6 rounded-xl space-y-6"
      >
      <h2 className="text-xl font-semibold text-center">Complete Your Profile</h2>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
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
          className="w-full px-4 py-2 rounded bg-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-teal-400 outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Use {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters: letters, numbers, periods, or underscores.
        </p>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>

      {/* Styled file upload */}
      <div>
        <label
          htmlFor="avatar"
          className="
            flex flex-col items-center justify-center
            border-2 border-dashed border-gray-600
            hover:border-teal-400 p-6 rounded-lg
            cursor-pointer bg-gray-700 hover:bg-gray-600
            transition
          "
        >
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-400">
            {selectedFile ? "Change" : "Click to upload"} profile picture
          </span>

          {selectedFile && (
            <span className="mt-2 text-xs text-gray-300 truncate">
              {selectedFile.name}
            </span>
          )}

          {previewUrl && (
            <img
              src={previewUrl}
              alt="avatar preview"
              className="mt-4 w-20 h-20 object-cover rounded-full"
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
        className={`
          w-full py-2 rounded text-white font-medium transition
          ${loading ? "bg-brand-light cursor-not-allowed" : "bg-brand hover:bg-brand-dark"}
        `}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center">
            Saving<span className="ml-1 animate-pulse">...</span>
          </span>
        ) : (
          "Save Profile"
        )}
      </button>
      </form>
    </div>
  );
};

export default CompleteProfilePage;
