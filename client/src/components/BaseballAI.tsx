import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Input, ScrollArea } from "@/components/ui";
import { useChat, useConversations } from "@/hooks/use-chat";
import { MessageSquare, Send, Loader2, Plus, User, Bot } from "lucide-react";

export function BaseballAI() {
  const { conversations, createConversation } = useConversations();
  const [activeId, setActiveId] = useState<number | null>(null);
  const { conversation, sendMessage, isSending, streamingMessage } = useChat(activeId || undefined);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages, streamingMessage]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    let targetId = activeId;
    if (!targetId) {
      const newConv = await createConversation("Baseball Advice");
      targetId = newConv.id;
      setActiveId(targetId);
    }

    sendMessage(input);
    setInput("");
  };

  return (
    <Card className="flex flex-col h-[600px] border-primary/20 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-card/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold uppercase tracking-wider text-white">Baseball AI Mentor</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => { setActiveId(null); setInput(""); }}
          className="text-muted-foreground hover:text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeId && !isSending && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-8">
            <div className="p-4 bg-primary/10 rounded-full">
              <Bot className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ask your Mentor anything</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Get instant advice on mechanics, mindset, or recruiting.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                "How can I increase my exit velocity?",
                "What's a good pre-game mental routine?",
                "How do I start talking to college scouts?"
              ].map((q) => (
                <Button 
                  key={q} 
                  variant="outline" 
                  className="text-left justify-start h-auto py-3 text-xs whitespace-normal"
                  onClick={() => {
                    setInput(q);
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {conversation?.messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg flex gap-3 ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'
            }`}>
              <div className="shrink-0 mt-1">
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3 rounded-lg flex gap-3 bg-white/10 text-white">
              <div className="shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-card/50">
        <div className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="bg-black/40 border-white/10 focus:border-primary/50"
            disabled={isSending}
          />
          <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </Card>
  );
}
