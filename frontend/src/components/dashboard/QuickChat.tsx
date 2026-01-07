import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface QuickChatProps {
    advisorName?: string;
}

const QuickChat: React.FC<QuickChatProps> = ({ advisorName = 'Pembimbing' }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim()) return;
        // TODO: Implement actual chat functionality
        alert(`Pesan ke ${advisorName}: ${message}`);
        setMessage('');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Chat Cepat</h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Kirim pesan ke {advisorName}</p>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ketik pesan..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Send size={18} />
                </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">💡 Fitur ini akan tersedia segera</p>
        </div>
    );
};

export default QuickChat;
