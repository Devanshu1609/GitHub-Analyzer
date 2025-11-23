import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  messages: ChatMessage[];
}

export const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, isLoading, messages }) => {
  const [input, setInput] = useState('');
  const [repoInfo, setRepoInfo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const info = sessionStorage.getItem('repoInfo');
    console.log("Fetched repo info from sessionStorage:", info);
    const summary = info ? JSON.parse(info).summary : null;
    setRepoInfo(summary);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div
      className="fixed flex flex-col bg-white w-4/5"
      style={{ height: '683px', maxHeight: '750px', overflowY: 'auto' }}
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Code Explainer</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">Ask questions about the codebase</p>
      </div>

      {/* Summary Section */}
      {repoInfo && (
        <div className="p-4 border-b border-gray-100 bg-blue-50">
          <h4 className="text-m font-semibold text-blue-700 mb-1">Repository Summary</h4>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{repoInfo}</p>
        </div>
      )}

      <div className="flex-1  p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Start a conversation about the code</p>
            <p className="text-xs text-gray-400 mt-1">Ask questions like "What does this function do?" or "How can I improve this code?"</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'assistant' && (
                <div className="flex-shrink-0">
                  <Bot className="h-6 w-6 text-blue-600 bg-blue-100 rounded-full p-1" />
                </div>
              )}

              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.sender === 'user' && (
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-gray-600 bg-gray-200 rounded-full p-1" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <Bot className="h-6 w-6 text-blue-600 bg-blue-100 rounded-full p-1" />
            </div>
            <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about the code..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};