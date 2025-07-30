import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import PostCard, { type PostCardProps }      from '../components/PostCard/PostCard'
import Comments                           from '../components/Comments/Comments'
import { apiFetch }                     from '../lib/api'

interface FullPost extends PostCardProps {
  // you can extend with other fields like comments array if you have them
//   commentsCount: number
}

const PostPage: React.FC = () => {
  const { id }     = useParams<{ id: string }>()
  const nav        = useNavigate()
  const [post, setPost]       = useState<FullPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

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
          comments:   data.commentsCount,
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
    return <div className="p-8 text-center">Loading post…</div>
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
