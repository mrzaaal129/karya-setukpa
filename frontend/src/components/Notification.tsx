
import React from 'react';
import { ExclamationIcon } from './icons';

interface NotificationProps {
  message: string | null;
}

const Notification: React.FC<NotificationProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 shadow-lg border border-yellow-200" role="alert">
        <ExclamationIcon className="flex-shrink-0 inline w-5 h-5 mr-3"/>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Notification;