import React from 'react';

interface SessionExpiredModalProps {
  onClose: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ onClose }) => {
  const handleRefresh = () => {
    onClose();

    try {
      if (typeof window !== 'undefined' && typeof window.location.reload === 'function') {
        window.location.reload();
      } else {
        window.location.href = '/signup';
      }
    } catch {
      window.location.href = '/signup';
    }

    window.location.reload();

  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-sm w-full text-center">
        <p className="text-lg">Your session has expired.</p>
        <div className="flex justify-center gap-4">

          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Refresh
          </button>

          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Dismiss</button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
