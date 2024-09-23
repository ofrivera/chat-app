import React, { useState } from 'react';
import { Send } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatProps {
    messages: Array<{ role: string; content: string; id: number }>;
    onSendMessage: (message: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`p-3 rounded-lg max-w-[70%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                            <p className="font-semibold">{msg.role === 'user' ? 'You' : 'AI'}</p>
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-700 p-4">
                <div className="flex items-center">
                    <TextareaAutosize
                        className="flex-1 bg-gray-800 text-white rounded-lg p-2 mr-2 resize-none"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    />
                    <button onClick={handleSend} className="bg-blue-600 text-white rounded-full p-2">
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};