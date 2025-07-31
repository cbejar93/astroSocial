// src/pages/CompleteProfilePage.tsx
import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud }             from "lucide-react";
import { apiFetch } from '../lib/api';



const CompleteProfilePage: React.FC = () => {
  const navigate        = useNavigate();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [username,     setUsername]      = useState("");
  const [selectedFile, setSelectedFile]  = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]    = useState<string>("");

  const [file, setFile] = useState<File | null>(null);


  // clean up object URL
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

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
    if (!username.trim()) return setError('Username is required');
    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append('username', username);
      if (imageFile) form.append('avatar', imageFile);

      console.log('before the call');

      const res = await apiFetch('/users/me', {
        method: 'PUT',
        body: form,
      });

      console.log('in the submit');
      console.log(res);

      if (!res.ok) throw new Error('Failed to update profile');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-gray-800 p-6 rounded-xl space-y-6"
    >
      <h2 className="text-xl font-semibold text-center">Complete Your Profile</h2>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
          if(error){
            setError(null)
          }
          }
          }
          placeholder="Choose a username"
          className="w-full px-4 py-2 rounded bg-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-teal-400 outline-none"
        />
         {error && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
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
  );
};

export default CompleteProfilePage;