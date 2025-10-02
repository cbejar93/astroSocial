import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import PostCard, { type PostCardProps } from '../components/PostCard/PostCard'
import PostSkeleton                     from '../components/PostCard/PostSkeleton'
import Comments                         from '../components/Comments/Comments'
import CommentsSkeleton                 from '../components/Comments/CommentsSkeleton'
import { apiFetch }                     from '../lib/api'

type FullPost = PostCardProps

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
          ...(data.title ? { title: data.title } : {}),
          avatarUrl:  data.avatarUrl,
          imageUrl:   data.imageUrl,
          // API returns `caption`, not `body`
          caption:    data.caption,
          timestamp:  data.timestamp,
          stars:      data.stars,
          comments:   data.comments,
          shares:     data.shares,
          reposts:    data.reposts,
          likedByMe:  data.likedByMe,
          savedByMe:  data.savedByMe,
          saves:      data.saves,
          repostedByMe: data.repostedByMe,
          authorId:   data.authorId,
          ...(data.repostedBy ? { repostedBy: data.repostedBy } : {}),
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
      <div className="w-full py-8 lg:pl-64 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4 space-y-4">
          <PostSkeleton />
          <CommentsSkeleton />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="w-full py-8 lg:pl-64 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4 text-red-500 text-center">{error}</div>
      </div>
    )
  }
  if (!post) {
    return (
      <div className="w-full py-8 lg:pl-64 flex justify-center">
        <div className="w-full max-w-3xl px-0 sm:px-4 text-center">Post not found.</div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4">
        <PostCard {...post} />
        <Comments postId={post.id} />
      </div>
    </div>
  )
}

export default PostPage
