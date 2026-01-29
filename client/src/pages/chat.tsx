import { useState, useRef, useEffect } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatMutation = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");

    chatMutation.mutate(
      { query: userMsg.content },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.answer, sources: data.sources },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sorry, I encountered an error processing your request." },
          ]);
        },
      }
    );
  };

  return (
    <LayoutShell>
      <div className="h-[calc(100vh-140px)] flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl font-display font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">Ask anything about your knowledge base</p>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-sm">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">How can I help you?</h3>
                <p className="max-w-md text-muted-foreground">
                  I've analyzed your documents. Ask me specific questions, request summaries, or find details instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-4 animate-fade-in",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                      msg.role === "user" ? "bg-primary text-white" : "bg-emerald-500 text-white"
                    )}>
                      {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                    </div>

                    {/* Bubble */}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl p-4 shadow-sm",
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white border border-border/50 rounded-tl-none"
                    )}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {/* Sources Section */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/30">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                            <BookOpen size={12} /> Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((source, i) => (
                              <div key={i} className="text-xs bg-secondary/50 px-2 py-1 rounded border border-border/50 truncate max-w-[200px]" title={source.content}>
                                File ID: {source.documentId} (Score: {Math.round(source.score * 100)}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading State */}
                {chatMutation.isPending && (
                  <div className="flex gap-4 animate-fade-in">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Bot size={20} />
                    </div>
                    <div className="bg-white border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-background/50 border-t border-border/50 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="flex gap-3 relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="h-14 pl-4 pr-14 rounded-xl bg-white shadow-sm border-2 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-base"
                disabled={chatMutation.isPending}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10 absolute right-2 top-2 rounded-lg shadow-md hover:scale-105 transition-transform"
                disabled={!query.trim() || chatMutation.isPending}
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </LayoutShell>
  );
}
