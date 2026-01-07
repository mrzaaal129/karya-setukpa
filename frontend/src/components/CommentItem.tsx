
import React from 'react';
import { Comment } from '../types';

interface CommentItemProps {
  comment: Comment;
  isCurrentUser: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isCurrentUser }) => {
  const { authorId, authorName, authorRole, text, timestamp } = comment;

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min ago";
    return "just now";
  };

  return (
    <div className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
      {!isCurrentUser && (
        <img
          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
          src={`https://i.pravatar.cc/50?u=${authorId}`}
          alt={`${authorName}'s avatar`}
        />
      )}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          p-3 rounded-lg max-w-xs
          ${isCurrentUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}
        `}>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm">{isCurrentUser ? 'You' : authorName}</p>
            {!isCurrentUser && <p className="text-xs opacity-70">{authorRole}</p>}
          </div>
          <p className="text-sm">{text}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1">{timeAgo(timestamp)}</p>
      </div>
       {isCurrentUser && (
        <img
          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
          src={`https://i.pravatar.cc/50?u=${authorId}`}
          alt={`${authorName}'s avatar`}
        />
      )}
    </div>
  );
};

export default CommentItem;