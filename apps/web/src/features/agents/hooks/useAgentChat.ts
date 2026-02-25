import { useState, useCallback, useRef } from 'react';
import { Endpoints } from '../../../configs/endpoints';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UseAgentChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAgentChat(agentTokenId: string, serviceUrl?: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isStreaming) return;

    setError(null);

    // Add user message immediately
    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Add empty assistant message that we'll stream into
    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const body: { message: string; contextId?: string } = { message: trimmed };
      if (contextIdRef.current) {
        body.contextId = contextIdRef.current;
      }

      const overrideBase = import.meta.env.VITE_AGENT_SERVICE_URL_OVERRIDE;
      const baseUrl = overrideBase
        ? `${overrideBase}/${agentTokenId}`
        : serviceUrl || `${Endpoints.agent}/${agentTokenId}`;
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            // Save contextId from first response
            if (parsed.contextId && !contextIdRef.current) {
              contextIdRef.current = parsed.contextId;
            }

            // Handle error event
            if (parsed.error) {
              setError(parsed.error);
              setMessages((prev) => prev.slice(0, -1)); // Remove empty assistant msg
              break;
            }

            // Handle streaming token
            if (parsed.token) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.token };
                }
                return updated;
              });
            }

            // Handle done event — replace with full response for consistency
            if (parsed.done && parsed.fullResponse) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: parsed.fullResponse };
                }
                return updated;
              });
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      // Remove the empty assistant message on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [agentTokenId, serviceUrl, isStreaming]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    contextIdRef.current = null;
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
