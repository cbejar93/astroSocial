import React, { useEffect, useState } from 'react';

import { fetchNotifications, type NotificationItem } from '../lib/api';

import { useNotifications } from '../hooks/useNotifications';

const NotificationsPage: React.FC = () => {
  const { refresh } = useNotifications();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        setItems(data);
        refresh();
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  return (
    <div className="w-full py-8 lg:pl-64 flex justify-center">
      <div className="w-full max-w-3xl px-0 sm:px-4 text-gray-200">
      <h1 className="text-xl mb-4">Notifications</h1>
        {loading ? (
          <div>Loading…</div>
        ) : (
        <ul className="space-y-4">
          {items.map((n) => (
            <li key={n.id} className="flex gap-2 border-b border-white/20 pb-2">
              <img
                src={n.actor.avatarUrl ?? '/defaultPfp.png'}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-sm">
                <span className="text-teal-400">@{n.actor.username}</span>{' '}
                {n.type === 'COMMENT'
                  ? 'commented on your post'
                  : n.type === 'POST_LIKE'
                  ? 'liked your post'
                  : 'liked your comment'}
                {n.postId && (
                  <>
                    {' '}
                    <a
                      href={`/posts/${n.postId}`}
                      className="underline text-teal-300 hover:text-teal-200"
                    >
                      View post
                    </a>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};

export default NotificationsPage;
