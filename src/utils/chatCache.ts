import type { QueryClient } from '@tanstack/react-query';
import type { ChatMessage, User } from '../api/types';

export type ChatMessagesCache = {
  messages: ChatMessage[];
  pinned: Array<{ messageId: string; body: string; pinnedAt: string }>;
};

export function chatQueryKey(conversationId: string) {
  return ['chat', conversationId] as const;
}

export function buildOptimisticMessage(user: User, body: string, tempId: string): ChatMessage {
  return {
    id: tempId,
    body,
    senderId: user.id,
    sender: {
      id: user.id,
      name: user.name,
      photoUrl: user.photoUrl,
    },
    replyToId: null,
    replyTo: null,
    createdAt: new Date().toISOString(),
  };
}

export function appendChatMessage(
  qc: QueryClient,
  conversationId: string,
  message: ChatMessage,
) {
  qc.setQueryData<ChatMessagesCache>(chatQueryKey(conversationId), (old) => {
    if (!old) {
      return { messages: [message], pinned: [] };
    }
    if (old.messages.some((m) => m.id === message.id)) return old;
    return { ...old, messages: [...old.messages, message] };
  });
}

export function replaceOptimisticChatMessage(
  qc: QueryClient,
  conversationId: string,
  tempId: string,
  serverMessage: ChatMessage,
) {
  qc.setQueryData<ChatMessagesCache>(chatQueryKey(conversationId), (old) => {
    if (!old) {
      return { messages: [serverMessage], pinned: [] };
    }
    const withoutTemp = old.messages.filter((m) => m.id !== tempId);
    const withoutDup = withoutTemp.filter((m) => m.id !== serverMessage.id);
    return { ...old, messages: [...withoutDup, serverMessage] };
  });
}

export function removeChatMessage(qc: QueryClient, conversationId: string, messageId: string) {
  qc.setQueryData<ChatMessagesCache>(chatQueryKey(conversationId), (old) => {
    if (!old) return old;
    return { ...old, messages: old.messages.filter((m) => m.id !== messageId) };
  });
}
