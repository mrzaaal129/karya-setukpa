
import React, { useState, useRef, useEffect } from 'react';
import { Comment } from '../types';
import { useUser } from '../contexts/UserContext';
import CommentItem from './CommentItem';
import { ChatBubbleIcon, PaperAirplaneIcon } from './icons';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment }) => {
  const { currentUser } = useUser();
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
      <h3 className="font-bold mb-4 flex items-center">
        <ChatBubbleIcon className="w-5 h-5 mr-2" />
        Diskusi & Bimbingan
      </h3>
      <div className="flex-grow space-y-4 pr-2 -mr-2 overflow-y-auto max-h-96">
        {comments.map(comment => (
          <CommentItem 
            key={comment.id}
            comment={comment}
            isCurrentUser={comment.authorId === currentUser.id}
          />
        ))}
        <div ref={commentsEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2 border-t pt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tulis pesan..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          rows={2}
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          disabled={!newComment.trim()}
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;