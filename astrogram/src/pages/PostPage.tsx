import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

import PostCard, { type PostCardProps } from '../components/PostCard/PostCard'
import PostSkeleton                     from '../components/PostCard/PostSkeleton'
import Comments                         from '../components/Comments/Comments'
import CommentsSkeleton                 from '../components/Comments/CommentsSkeleton'
import { apiFetch }                     from '../lib/api'

interface FullPost extends PostCardProps {
  // you can extend with other fields like comments array if you have them
//   commentsCount: number
}

const PostPage: React.FC = () => {
  const { id }     = useParams<{ id: string }>()
  const nav        = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [post, setPost]       = useState<FullPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Redirect unauthenticated users to signup
  useEffect(() => {
    if (!authLoading && !user) {
      nav('/signup', { replace: true })
    }
  }, [authLoading, user, nav])

  useEffect(() => {
    if (!id) {
      nav('/')
      return
    }

    setLoading(true)
    apiFetch(`/posts/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()

        // massage into PostCardProps shape:
        const p: FullPost = {
          id:         data.id,
          username:   data.username,
          avatarUrl:  data.avatarUrl,
          imageUrl:   data.imageUrl!,
          caption:    data.body,
          timestamp:  data.timestamp,
          stars:      data.stars,
          comments:   data.comments,
          shares:     data.shares,
          likedByMe: data.likedByMe,
          authorId: data.authorId
        }
        setPost(p)
      })
      .catch(err => {
        console.error(err)
        setError('Could not load post.')
      })
      .finally(() => setLoading(false))
  }, [id, nav])

  if (loading) {
    return (
      <div className="w-full py-4 flex justify-center min-h-screen bg-gray-900 px-2">
        <div className="w-full max-w-3xl px-0 sm:px-2 space-y-4">
          <PostSkeleton />
          <CommentsSkeleton />
        </div>
      </div>
    )
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }
  if (!post) {
    return <div className="p-8 text-center">Post not found.</div>
  }

  return (
    <div className="w-full py-4 flex justify-center min-h-screen bg-gray-900 px-2">
      <div className="w-full max-w-3xl px-0 sm:px-2">
        <PostCard {...post} />
        <Comments postId={post.id} />
      </div>
    </div>
  )
}

export default PostPage
