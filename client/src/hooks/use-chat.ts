import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { authFetch } from "@/lib/queryClient";

export function useChat(conversationId?: number) {
  const queryClient = useQueryClient();
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: conversation, isLoading } = useQuery({
    queryKey: [buildUrl(api.chat.getConversation.path, { id: conversationId || 0 })],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await authFetch(buildUrl(api.chat.getConversation.path, { id: conversationId }));
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error("No conversation ID");

      setIsStreaming(true);
      setStreamingMessage("");

      const response = await authFetch(buildUrl(api.chat.sendMessage.path, { id: conversationId }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingMessage(fullContent);
                }
                if (data.done) {
                  setIsStreaming(false);
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }

      return fullContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.chat.getConversation.path, { id: conversationId || 0 })] });
      setStreamingMessage("");
    },
  });

  return {
    conversation,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending || isStreaming,
    streamingMessage,
  };
}

export function useConversations() {
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: [api.chat.listConversations.path],
    queryFn: async () => {
      const res = await authFetch(api.chat.listConversations.path);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (title?: string) => {
      const res = await authFetch(api.chat.createConversation.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.listConversations.path] });
    },
  });

  return {
    conversations,
    isLoading,
    createConversation: createConversationMutation.mutateAsync,
  };
}
