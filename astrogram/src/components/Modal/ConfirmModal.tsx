import React from 'react';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-sm w-full text-center">
        <p className="text-lg">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
