import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Lock, Sparkles } from 'lucide-react';
import { useAgentChat, type ChatMessage } from '../hooks/useAgentChat';

interface AgentChatPanelProps {
  agentTokenId: string;
  agentName: string;
  agentImage?: string;
  serviceUrl?: string;
}

export default function AgentChatPanel({ agentTokenId, agentName, agentImage, serviceUrl }: AgentChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isStreaming, error, sendMessage, clearMessages } = useAgentChat(agentTokenId, serviceUrl);

  // Mock subscription state
  const [isSubscribed] = useState(true); // Always true for now (mocked)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#F06718] hover:bg-[#E05608] text-white shadow-lg shadow-[#F06718]/20 flex items-center justify-center transition-colors"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-50 w-[520px] max-w-[calc(100vw-48px)] h-[780px] max-h-[calc(100vh-48px)] bg-[#0C0C0C] border border-[#1F1F1F] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F] bg-[#111111]">
              <div className="flex items-center gap-3">
                {agentImage ? (
                  <img src={agentImage} alt={agentName} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#F06718]/10 flex items-center justify-center">
                    <Sparkles size={14} className="text-[#F06718]" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-[#E0E0E0]">{agentName}</h3>
                  <span className="text-xs text-[#606060]">AI Agent</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#606060] hover:text-[#E0E0E0] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Subscription Gate (mocked) */}
            {!isSubscribed ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F06718]/10 flex items-center justify-center mb-4">
                  <Lock size={20} className="text-[#F06718]" />
                </div>
                <h4 className="text-[#E0E0E0] font-semibold mb-2">Premium Feature</h4>
                <p className="text-[#808080] text-sm mb-4">
                  Subscribe to chat with {agentName} and get personalized insights about its strategy.
                </p>
                <button className="px-4 py-2 bg-[#F06718] hover:bg-[#E05608] text-white rounded-lg text-sm font-medium transition-colors">
                  Subscribe — $0.01/message
                </button>
                <p className="text-[#606060] text-xs mt-2">Powered by x402 protocol</p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Sparkles size={24} className="mx-auto text-[#333333] mb-3" />
                      <p className="text-[#606060] text-sm">
                        Ask {agentName} about its strategy, risk approach, or market outlook.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {[
                          'What is your strategy?',
                          'What risk level are you?',
                          'How do you work?',
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                            className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#222222] text-xs text-[#808080] hover:text-[#E0E0E0] hover:border-[#333333] transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <ChatBubble key={`${msg.role}-${i}`} message={msg} agentName={agentName} agentImage={agentImage} />
                  ))}

                  {isStreaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
                    <div className="flex items-center gap-2 text-[#606060] text-xs">
                      <Loader2 size={12} className="animate-spin" />
                      <span>{agentName} is thinking...</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-[#1F1F1F] bg-[#111111]">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Ask ${agentName}...`}
                      disabled={isStreaming}
                      maxLength={2000}
                      className="flex-1 bg-[#0C0C0C] border border-[#222222] rounded-lg px-3 py-2 text-sm text-[#E0E0E0] placeholder-[#606060] focus:outline-none focus:border-[#F06718]/50 disabled:opacity-50 transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isStreaming}
                      className="p-2 rounded-lg bg-[#F06718] hover:bg-[#E05608] disabled:opacity-30 disabled:hover:bg-[#F06718] text-white transition-colors"
                    >
                      {isStreaming ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                  <p className="text-[#606060] text-[10px] mt-1.5 text-center">
                    AI responses may be inaccurate. Agent cannot execute trades via chat.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatBubble({ message, agentName, agentImage }: { message: ChatMessage; agentName: string; agentImage?: string }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        agentImage ? (
          <img src={agentImage} alt={agentName} className="w-6 h-6 rounded-md object-cover flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#F06718]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={10} className="text-[#F06718]" />
          </div>
        )
      )}

      {/* Message */}
      <div
        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#F06718] text-white rounded-br-sm'
            : 'bg-[#1A1A1A] text-[#E0E0E0] border border-[#222222] rounded-bl-sm'
        }`}
      >
        {message.content || (
          <span className="inline-flex items-center gap-1 text-[#606060]">
            <Loader2 size={10} className="animate-spin" />
            Thinking...
          </span>
        )}
      </div>
    </div>
  );
}
