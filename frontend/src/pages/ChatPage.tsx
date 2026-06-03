import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Send } from 'lucide-react';
import { chatAPI, ChatMessage, ChatThread } from '../services/api';
import { LoadingOverlay } from '../components/LoadingOverlay';

export const ChatPage: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const loadThreads = async () => {
      try {
        setLoading(true);
        const threadData = await chatAPI.getThreads();
        setThreads(threadData);
        if (threadData.length > 0) {
          setSelectedThreadId(threadData[0].id);
        }
      } catch (error) {
        console.error('Unable to load chats', error);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThreadId === null) {
      setMessages([]);
      return;
    }

    const loadThread = async () => {
      try {
        setLoading(true);
        const result = await chatAPI.getThread(selectedThreadId);
        setMessages(result.messages);
      } catch (error) {
        console.error('Unable to load conversation', error);
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [selectedThreadId]);

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId);

  const handleSend = async () => {
    if (!selectedThreadId || !draft.trim()) {
      return;
    }

    try {
      setSending(true);
      const message = await chatAPI.sendMessage(selectedThreadId, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Creator Chats</h1>
            <p className="text-text-secondary mt-2">Pick a creator conversation and send a message directly.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-secondary/50 px-4 py-3 text-sm text-text-secondary">
            <MessageCircle className="w-5 h-5 text-primary" />
            {threads.length} active thread{threads.length === 1 ? '' : 's'}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="glass rounded-3xl border border-white/10 p-5">
          <h2 className="text-xl font-semibold mb-4">Your threads</h2>
          {loading && !threads.length ? (
            <div className="space-y-3">
              <div className="h-16 rounded-2xl bg-secondary/60 animate-pulse" />
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-text-secondary">
              <p className="mb-4">No chat history yet.</p>
              <p>Visit a creator and tap "Message creator" to begin a new conversation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selectedThreadId === thread.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-secondary/70 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{thread.other.username}</p>
                      <p className="text-sm text-text-secondary">{thread.messages_count} messages</p>
                    </div>
                    <span className="text-xs uppercase tracking-[.2em] text-primary">{thread.other.username}</span>
                  </div>
                  {thread.last_message && (
                    <p className="mt-3 text-sm text-text-secondary line-clamp-2">{thread.last_message.text}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative glass rounded-3xl border border-white/10 p-5 min-h-[520px]">
          {selectedThread ? (
            <>
              <div className="flex items-center justify-between mb-6 gap-3">
                <div>
                  <p className="text-sm text-text-secondary uppercase tracking-[.2em]">Chat with</p>
                  <h2 className="text-2xl font-semibold">{selectedThread.other.username}</h2>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-2 text-xs text-text-secondary">Updated {new Date(selectedThread.updated_at).toLocaleDateString()}</span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[42rem] pb-4">
                {loading && selectedThreadId ? <LoadingOverlay small /> : null}
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl p-4 ${message.sender.username === selectedThread.other.username ? 'bg-secondary/80 text-white' : 'bg-primary/10 text-white'}`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[.2em] text-text-secondary mb-2">
                      <span>{message.sender.username}</span>
                      <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{message.text}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-secondary/70 p-4">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full resize-none rounded-3xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-primary"
                />
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center gap-2 rounded-3xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 p-10 text-center text-text-secondary">
              <ArrowRight className="mb-4 h-10 w-10 text-primary" />
              <h3 className="text-xl font-semibold text-white">Select a chat to open the conversation</h3>
              <p className="mt-3">When you message a creator, your entire thread will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
