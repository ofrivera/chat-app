"use client";

import { useState, useEffect, useRef } from 'react';
import { Menu, Send, PlusCircle, Trash2 } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { streamMessage, ChatMessage, Chat, createNewChat } from '../actions/stream-messages';
import { readStreamableValue } from 'ai/rsc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ModelDisplay } from '@/components/ModelDisplay';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChats = async () => {
      const savedChats = localStorage.getItem('chats');
      if (savedChats) {
        const parsedChats: Chat[] = JSON.parse(savedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id);
        } else {
          await createNewDefaultChat();
        }
      } else {
        await createNewDefaultChat();
      }
    };
    initializeChats();
  }, []);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const createNewDefaultChat = async () => {
    const newChat = await createNewChat();
    setChats([newChat]);
    setCurrentChatId(newChat.id);
  };

  const createChat = async () => {
    const newChat = await createNewChat();
    setChats(prevChats => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const handleSend = async () => {
    if (!message.trim() || !currentChatId) return;

    const newMessage: ChatMessage = { id: Date.now(), role: 'user', content: message };

    setChats((prevChats) => prevChats.map((chat) =>
      chat.id === currentChatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
    ));
    setMessage('');

    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) return;

    const { output } = await streamMessage([...currentChat.messages, newMessage]);

    setStreamingMessage({ id: Date.now(), role: 'assistant', content: '' });

    let fullResponse = '';
    for await (const delta of readStreamableValue(output)) {
      fullResponse += delta;
      setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
    }

    const assistantMessage: ChatMessage = { id: Date.now(), role: 'assistant', content: fullResponse };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
            ...chat,
            messages: [...chat.messages, assistantMessage]
          }
          : chat
      )
    );
    setStreamingMessage(null);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        setCurrentChatId(null);
        createNewDefaultChat();
      }
    }
  };

  const renderMessages = () => {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) return null;

    return (
      <>
        {currentChat.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[70%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
              <p className="font-semibold">{msg.role === 'user' ? 'You' : 'AI'}</p>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {streamingMessage && (
          <div key="streaming" className="flex justify-start">
            <div className="bg-gray-700 p-3 rounded-lg max-w-[70%]">
              <p className="font-semibold">AI (typing...)</p>
              <p>{streamingMessage.content}</p>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex">
      {sidebarOpen && (
        <div className="w-[300px] bg-gray-800 p-4 relative">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 left-4 text-2xl focus:outline-none"
          >
            <Menu />
          </button>
          <button
            onClick={createChat}
            className="absolute top-4 right-4 text-2xl focus:outline-none"
          >
            <PlusCircle />
          </button>
          <h2 className="text-xl font-semibold mt-12 mb-4">Chats</h2>
          <div className="space-y-2">
            {chats.map((chat, index) => (
              <div
                key={chat.id}
                className={`p-2 rounded cursor-pointer flex items-center justify-between group ${chat.id === currentChatId ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
              >
                <div
                  className="flex items-center flex-grow"
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  <span className="mr-2 text-sm text-gray-400">{index + 1}</span>
                  <span>{chat.name}</span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the chat.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteChat(chat.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl focus:outline-none"
            >
              <Menu />
            </button>
          )}
          <ModelDisplay />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="max-w-[800px] w-full p-4 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {renderMessages()}
              <div ref={messagesEndRef} />
            </div>
            <div className="relative">
              <TextareaAutosize
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-gray-700 text-white rounded-lg py-2 pl-4 pr-12 resize-none"
                minRows={1}
                maxRows={5}
              />
              <button
                onClick={handleSend}
                className="absolute right-2 bottom-2 text-white p-2 rounded-full bg-blue-500 hover:bg-blue-600 focus:outline-none"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
