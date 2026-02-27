import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { useAgentChat, type ChatMessage } from '../hooks/useAgentChat';
import { useAgentSubscription, type SubscriptionTier } from '../hooks/useAgentSubscription';

interface AgentChatPanelProps {
  agentTokenId: string;
  agentName: string;
  agentImage?: string;
  serviceUrl?: string;
}

const TIER_STYLES: Record<string, { badge: string; button: string; border: string }> = {
  free:       { badge: 'bg-green-500/10 text-green-400',   button: 'bg-green-600 hover:bg-green-700',   border: 'border-green-500/20' },
  basic:      { badge: 'bg-blue-500/10 text-blue-400',     button: 'bg-blue-600 hover:bg-blue-700',     border: 'border-blue-500/20' },
  pro:        { badge: 'bg-[#F06718]/10 text-[#F06718]',   button: 'bg-[#F06718] hover:bg-[#E05608]',   border: 'border-[#F06718]/30' },
  enterprise: { badge: 'bg-purple-500/10 text-purple-400', button: 'bg-purple-700 hover:bg-purple-800', border: 'border-purple-500/20' },
};

function getTierStyle(tierId: string) {
  return TIER_STYLES[tierId] ?? TIER_STYLES.basic;
}

export default function AgentChatPanel({ agentTokenId, agentName, agentImage, serviceUrl }: AgentChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [subscribingTierId, setSubscribingTierId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { wallets } = useWallets();

  // Payment must use the embedded (Privy) wallet — it is both the payer and the subscriber identity.
  // External wallets (SIWE, injected) cannot be used: we cannot safely bind an arbitrary
  // WALLET-ADDRESS header to an external signer without the subscriber co-signing.
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address;

  const {
    subscription,
    tiers,
    isSubscribed,
    requiresSubscription,
    isLoading: isLoadingSubscription,
    isSubscribing,
    subscribeError,
    subscribe,
    clearSubscribeError,
  } = useAgentSubscription(agentTokenId, serviceUrl, walletAddress);

  const { messages, isStreaming, error, sendMessage } = useAgentChat(
    agentTokenId,
    serviceUrl,
    walletAddress,
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSubscribe = useCallback(async (tierId: string) => {
    if (!embeddedWallet) return;
    setSubscribingTierId(tierId);
    clearSubscribeError();
    try {
      await subscribe(tierId, embeddedWallet.address, () => embeddedWallet.getEthereumProvider());
    } catch {
      // error stored in subscribeError
    } finally {
      setSubscribingTierId(null);
    }
  }, [embeddedWallet, subscribe, clearSubscribeError]);

  const handleClose = () => {
    setIsOpen(false);
    clearSubscribeError();
  };

  return (
    <>
      {/* Floating Chat Bubble */}
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
              <div className="flex items-center gap-3 min-w-0">
                {agentImage ? (
                  <img src={agentImage} alt={agentName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#F06718]/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-[#F06718]" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#E0E0E0] truncate">{agentName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#606060]">AI Agent</span>
                    {isSubscribed && subscription && (
                      <>
                        <span className="text-[#404040]">·</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTierStyle((subscription.tier as any).id ?? '').badge}`}>
                          {(subscription.tier as any).name}
                        </span>
                        <span className="text-xs text-[#606060]">
                          {subscription.chats_remaining} chats left
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#606060] hover:text-[#E0E0E0] transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            {(isLoadingSubscription || (!isSubscribed && requiresSubscription)) ? (
              <SubscriptionGate
                agentName={agentName}
                embeddedWallet={embeddedWallet}
                tiers={tiers}
                isLoading={isLoadingSubscription}
                isSubscribing={isSubscribing}
                subscribingTierId={subscribingTierId}
                subscribeError={subscribeError}
                onSubscribe={handleSubscribe}
              />
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
                        {['What is your strategy?', 'What risk level are you?', 'How do you work?'].map((suggestion) => (
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
                      {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
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

// ─── Subscription Gate ────────────────────────────────────────────────────────

interface SubscriptionGateProps {
  agentName: string;
  embeddedWallet: { address: string } | undefined;
  tiers: SubscriptionTier[];
  isLoading: boolean;
  isSubscribing: boolean;
  subscribingTierId: string | null;
  subscribeError: string | null;
  onSubscribe: (tierId: string) => void;
}

function SubscriptionGate({
  agentName,
  embeddedWallet,
  tiers,
  isLoading,
  isSubscribing,
  subscribingTierId,
  subscribeError,
  onSubscribe,
}: SubscriptionGateProps) {
  if (!embeddedWallet) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F06718]/10 flex items-center justify-center mb-4">
          <Lock size={20} className="text-[#F06718]" />
        </div>
        <h4 className="text-[#E0E0E0] font-semibold mb-2">Embedded Wallet Required</h4>
        <p className="text-[#808080] text-sm">
          Subscription payments require an embedded wallet. Sign in with email or social login to get one.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#606060]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="w-10 h-10 rounded-full bg-[#F06718]/10 flex items-center justify-center mx-auto mb-3">
          <Lock size={18} className="text-[#F06718]" />
        </div>
        <h4 className="text-[#E0E0E0] font-semibold">Subscribe to Chat</h4>
        <p className="text-[#606060] text-xs mt-1">
          Choose a plan to start chatting with {agentName}
        </p>
      </div>

      {/* Tiers */}
      {tiers.length === 0 ? (
        <p className="text-center text-[#606060] text-sm">No subscription plans available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isSubscribing={isSubscribing}
              isThisTierSubscribing={subscribingTierId === tier.id}
              onSubscribe={onSubscribe}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {subscribeError && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-xs">{subscribeError}</p>
        </div>
      )}

      <p className="text-[#505050] text-[10px] text-center">
        Payments settled on-chain via x402 · USDC on Base Sepolia
      </p>
    </div>
  );
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isSubscribing,
  isThisTierSubscribing,
  onSubscribe,
}: {
  tier: SubscriptionTier;
  isSubscribing: boolean;
  isThisTierSubscribing: boolean;
  onSubscribe: (id: string) => void;
}) {
  const style = getTierStyle(tier.id);
  const isPro = tier.id === 'pro';

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-[#111111] p-3 ${style.border} ${isPro ? 'ring-1 ring-[#F06718]/30' : ''}`}
    >
      {isPro && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#F06718] text-white text-[10px] font-semibold">
          Popular
        </span>
      )}

      {/* Tier name + price */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${style.badge}`}>
            {tier.name}
          </span>
        </div>
        <p className="text-[#E0E0E0] font-bold text-lg leading-tight">{tier.price}</p>
        <p className="text-[#606060] text-[11px]">{tier.duration_days} days · {tier.chat_limit} chats</p>
      </div>

      {/* Features */}
      <ul className="space-y-1 mb-3 flex-1">
        {(tier.features ?? []).slice(0, 3).map((f, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <CheckCircle2 size={11} className="text-[#606060] flex-shrink-0 mt-0.5" />
            <span className="text-[#808080] text-[11px] leading-tight">{f}</span>
          </li>
        ))}
      </ul>

      {/* Subscribe button */}
      <button
        onClick={() => onSubscribe(tier.id)}
        disabled={isSubscribing}
        className={`w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 ${style.button}`}
      >
        {isThisTierSubscribing ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            Signing...
          </>
        ) : (
          tier.price === '$0' ? 'Get Free' : 'Subscribe'
        )}
      </button>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message, agentName, agentImage }: { message: ChatMessage; agentName: string; agentImage?: string }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        agentImage ? (
          <img src={agentImage} alt={agentName} className="w-6 h-6 rounded-md object-cover flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#F06718]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={10} className="text-[#F06718]" />
          </div>
        )
      )}
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
