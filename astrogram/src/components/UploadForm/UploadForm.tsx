import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useNavigate } from 'react-router-dom'


const UploadForm: React.FC = () => {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const navigate = useNavigate()


  // preview URL
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (f && !f.type.startsWith('image/')) {
      setError('Only image files are allowed.')
      setFile(null)
      return
    }
    setError(null)
    setFile(f)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!caption.trim()) {
      setCaptionError('Caption is required')
      return
    }
    setCaptionError(null)
    setLoading(true)

    try {
      const form = new FormData()
      form.append('body', caption)
      if (file) form.append('image', file)

      const res = await apiFetch('/posts', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Upload failed')
      }

      await res.json()

      navigate('/', { replace: true })


      // reset form
      setCaption('')
      setFile(null)
      setPreview(null)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-gray-800 rounded-xl space-y-6"
    >
      <h2 className="text-xl font-semibold text-center text-gray-100">
        Share a New Post
      </h2>

      {/* Caption */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Caption
        </label>
        <textarea
          rows={3}
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value)
            if (captionError && e.target.value.trim()) setCaptionError(null)
          }}
          placeholder="Describe your image..."
          className="w-full px-4 py-2 bg-gray-700 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-gray-100"
        />
        {captionError && (
          <p className="mt-1 text-sm text-red-500">{captionError}</p>
        )}
      </div>

      {/* File upload */}
      <div>
        <label
          htmlFor="post-image"
          className="
            flex flex-col items-center justify-center
            border-2 border-dashed border-gray-600
            hover:border-teal-400 p-6 rounded-lg
            cursor-pointer bg-gray-700 hover:bg-gray-600
            transition text-gray-200
          "
        >
          <UploadCloud className="w-8 h-8 mb-2" />
          <span className="text-sm">
            {file ? 'Change image' : 'Click to upload image'}
          </span>

          {file && (
            <span className="mt-2 text-xs truncate">{file.name}</span>
          )}

          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-4 w-24 h-24 object-cover rounded-lg"
            />
          )}

          <input
            id="post-image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded-md mt-4">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition
    ${loading
            ? 'bg-brand-light cursor-not-allowed'
            : 'bg-brand hover:bg-brand-dark'}
  `}
      >
        {loading ? (
          <span className="inline-flex items-center">
            <UploadCloud className="w-5 h-5 animate-pulse" />
            <span className="ml-2">
              Uploading<span className="ml-1 animate-pulse">...</span>
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center">
            <UploadCloud className="w-5 h-5" />
            <span>Upload Post</span>
          </span>
        )}
      </button>
    </form>
  )
}

export default UploadForm

