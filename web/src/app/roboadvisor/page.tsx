'use client';
import MainLayout from '../main-layout';
import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '../../components/MarkdownComponents';

export default function RoboadvisorPage() {
  const [messages, setMessages] = useState<{ id: number; content: string; role: 'user' | 'assistant' }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  // Focus input on initial render
  useEffect(() => {
    // Load chat history
    fetch('/api/chat')
      .then(response => response.json())
      .then(data => {
        if(data.messages) {
          setMessages(data.messages)
        }
      })

    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = { id: Date.now(), content: inputValue, role: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send the message to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser');
      }

      // Create a reader for the response body
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantMessageId = Date.now() + 1;
      let fullText = '';

      // Add an empty assistant message to start appending to
      setMessages(prev => [...prev, { id: assistantMessageId, content: '', role: 'assistant' }]);

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and append to the assistant's message
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Update the assistant's message with the new content
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId ? { ...msg, content: fullText } : msg
          )
        );
      }

      reader.releaseLock();
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev, 
        { id: Date.now() + 2, content: 'Sorry, an error occurred while processing your request.', role: 'assistant' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col max-w-6xl mx-auto h-[96vh] m-4 p-4 bg-white rounded-lg shadow border border-gray-200">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">AI Chat</h1>
          <p className="text-gray-600 mt-2">Ask anything to our AI assistant</p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4" ref={messagesContainerRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`p-4 rounded-lg max-w-[80%] ${message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'}`}
              >
                <div className="font-medium mb-1">
                  {message.role === 'user' ? 'You:' : 'Assistant:'}
                </div>
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </Markdown>
              </div>
            ))}
            {isLoading && (
              <div className="p-4 rounded-lg bg-gray-100 max-w-[80%]">
                <div className="font-medium mb-1">Assistant:</div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-auto">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className={`px-6 py-3 rounded-lg text-white font-medium ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isLoading || !inputValue.trim()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
