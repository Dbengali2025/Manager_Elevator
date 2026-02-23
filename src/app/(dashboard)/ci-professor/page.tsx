"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  deleteConversation,
} from "@/actions/chat";
import type { Conversation, Message } from "@/db/types";

// ---------------------------------------------------------------------------
// Starter questions
// ---------------------------------------------------------------------------

const STARTER_QUESTIONS = [
  "What is the CI Done Right formula?",
  "How do I run a Waste WAR Battle?",
  "How do I document my CI wins?",
];

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-skyBlue"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <path d="M8 9h8M8 13h4" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v5h5" />
      <path d="M3 8a9 9 0 1018 0 9 9 0 00-18 0" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ProfessorAvatar() {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy text-white">
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7l7-4 7 4-7 4-7-4z" />
        <path d="M3 7v5c0 2 3.5 4 7 4s7-2 7-4V7" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-start gap-md">
      <ProfessorAvatar />
      <div className="rounded-lg rounded-tl-none bg-white px-md py-sm shadow-sm border border-paleGray">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-charcoal/40 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-charcoal/40 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-charcoal/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-md ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-mintGreen text-navy font-semibold text-caption">
          U
        </div>
      ) : (
        <ProfessorAvatar />
      )}
      <div
        className={`max-w-[90%] sm:max-w-[75%] rounded-lg px-md py-sm shadow-sm ${
          isUser
            ? "bg-skyBlue text-white rounded-tr-none"
            : "bg-white text-charcoal rounded-tl-none border border-paleGray"
        }`}
      >
        <p className="text-body whitespace-pre-wrap">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1 h-4 ml-0.5 bg-charcoal/60 animate-pulse align-text-bottom" />
          )}
        </p>
        {!isStreaming && (
          <p
            className={`text-[11px] mt-xs ${
              isUser ? "text-white/60" : "text-charcoal/40"
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse space-y-md text-center">
        <div className="h-12 w-12 rounded-full bg-paleGray mx-auto" />
        <div className="h-4 w-48 bg-paleGray rounded mx-auto" />
        <div className="h-3 w-64 bg-paleGray rounded mx-auto" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CIProfessorPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, streamingContent, scrollToBottom]);

  // Load conversations on mount
  const fetchConversations = useCallback(async () => {
    const result = await getConversations();
    if (result.success && result.data) {
      setConversations(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
  const fetchMessages = useCallback(async (conversationId: string) => {
    const result = await getMessages(conversationId);
    if (result.success && result.data) {
      setMessages(result.data);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, fetchMessages]);

  // Start a new chat
  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInputValue("");
    setHistoryOpen(false);
    inputRef.current?.focus();
  }, []);

  // Select a conversation from history
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setHistoryOpen(false);
  }, []);

  // Delete a conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      setDeleteConfirmId(null);
    },
    [activeConversationId]
  );

  // Send a message with streaming AI response
  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? inputValue).trim();
      if (!content || isSending) return;

      setInputValue("");
      setIsSending(true);
      setChatError(null);

      let conversationId = activeConversationId;

      // Create a new conversation if needed
      if (!conversationId) {
        const title =
          content.length > 50 ? content.substring(0, 50) + "..." : content;
        const result = await createConversation(title);
        if (!result.success || !result.data) {
          setIsSending(false);
          setChatError("Failed to create conversation. Please try again.");
          return;
        }
        conversationId = result.data.id;
        setActiveConversationId(conversationId);
        setConversations((prev) => [result.data!, ...prev]);
      }

      // Add user message optimistically
      const optimisticUserMsg: Message = {
        id: `temp-user-${Date.now()}`,
        conversation_id: conversationId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      // Save user message
      const userResult = await sendMessage(conversationId, "user", content);

      if (userResult.success && userResult.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticUserMsg.id ? userResult.data! : m))
        );
      }

      // Build conversation history for context
      const history = messages
        .filter((m) => !m.id.startsWith("temp-"))
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Start streaming AI response
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            conversationId,
            history,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get AI response");
        }

        if (!res.body) {
          throw new Error("No response stream available");
        }

        // Read the SSE stream
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep last incomplete line in buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              // Skip unparseable SSE data
            }
          }
        }

        // Streaming complete — save assistant message and add to messages
        setIsStreaming(false);
        setStreamingContent("");

        if (fullContent) {
          const assistantResult = await sendMessage(
            conversationId,
            "assistant",
            fullContent
          );

          if (assistantResult.success && assistantResult.data) {
            setMessages((prev) => [...prev, assistantResult.data!]);
          } else {
            // Still show the message even if save fails
            setMessages((prev) => [
              ...prev,
              {
                id: `temp-ai-${Date.now()}`,
                conversation_id: conversationId,
                role: "assistant" as const,
                content: fullContent,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        setIsStreaming(false);
        setStreamingContent("");
        setChatError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }

      setIsSending(false);
      inputRef.current?.focus();
    },
    [inputValue, isSending, activeConversationId, messages]
  );

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 150) + "px";
    },
    []
  );

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-128px)]">
        <LoadingSkeleton />
      </div>
    );
  }

  const isEmptyState = !activeConversationId && messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-128px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-md">
        <div>
          <h1 className="font-heading text-h1 text-charcoal">CI Professor</h1>
          <p className="text-body text-charcoal/60">
            Your AI-powered continuous improvement guide
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {/* Chat History toggle */}
          <div className="relative">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="flex items-center gap-xs rounded-md border border-paleGray bg-white px-md py-sm min-h-[44px] text-body text-charcoal hover:bg-paleGray/50 transition-colors"
            >
              <HistoryIcon />
              <span className="hidden sm:inline">History</span>
              {conversations.length > 0 && (
                <span className="ml-xs inline-flex h-5 w-5 items-center justify-center rounded-full bg-skyBlue text-white text-[11px] font-medium">
                  {conversations.length}
                </span>
              )}
              <ChevronDownIcon />
            </button>

            {/* History dropdown */}
            {historyOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setHistoryOpen(false)}
                />
                <div className="absolute right-0 top-full mt-xs z-20 w-72 rounded-lg bg-white shadow-lg border border-paleGray overflow-hidden">
                  <div className="p-sm border-b border-paleGray">
                    <p className="text-caption font-semibold text-charcoal/60 uppercase tracking-wider px-sm">
                      Recent Conversations
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <p className="p-md text-body text-charcoal/40 text-center">
                        No conversations yet
                      </p>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`flex items-center justify-between px-md py-sm hover:bg-paleGray/50 cursor-pointer group ${
                            conv.id === activeConversationId
                              ? "bg-skyBlue/10"
                              : ""
                          }`}
                        >
                          <button
                            className="flex-1 text-left truncate text-body text-charcoal"
                            onClick={() => handleSelectConversation(conv.id)}
                          >
                            {conv.title}
                          </button>
                          {deleteConfirmId === conv.id ? (
                            <div className="flex items-center gap-xs ml-sm">
                              <button
                                onClick={() => handleDeleteConversation(conv.id)}
                                className="text-[11px] text-error font-medium hover:underline"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[11px] text-charcoal/40 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(conv.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 ml-sm text-charcoal/30 hover:text-error transition-all"
                              aria-label="Delete conversation"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* New Chat button */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-xs rounded-md bg-navy px-md py-sm min-h-[44px] text-body text-white hover:bg-navy/90 transition-colors"
          >
            <PlusIcon />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col rounded-lg bg-white shadow-sm border border-paleGray overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-lg space-y-lg">
          {isEmptyState ? (
            /* Empty state with starter questions */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ChatBubbleIcon />
              <h2 className="font-heading text-h2 text-charcoal mt-md">
                Ask the CI Professor
              </h2>
              <p className="text-body text-charcoal/60 mt-xs max-w-md">
                Get answers about continuous improvement methodology, the CI
                Done Right formula, and how to advance your career through CI
                mastery.
              </p>

              {/* Starter questions */}
              <div className="mt-xl space-y-sm w-full max-w-lg">
                {STARTER_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSend(question)}
                    disabled={isSending}
                    className="w-full text-left rounded-lg border border-paleGray px-md py-sm min-h-[44px] text-body text-charcoal hover:bg-skyBlue/5 hover:border-skyBlue/30 transition-colors disabled:opacity-50"
                  >
                    <span className="text-skyBlue mr-sm">&rarr;</span>
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && streamingContent && (
                <MessageBubble
                  message={{
                    id: "streaming",
                    conversation_id: "",
                    role: "assistant",
                    content: streamingContent,
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}
              {isSending && !isStreaming && <TypingIndicator />}
              {chatError && (
                <div className="flex justify-center">
                  <div className="rounded-lg bg-error/10 border border-error/20 px-md py-sm text-body text-error max-w-md text-center">
                    {chatError}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-paleGray p-md">
          <div className="flex items-end gap-sm">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask the CI Professor a question..."
              rows={1}
              disabled={isSending}
              className="flex-1 resize-none rounded-lg border border-paleGray px-md py-sm text-body text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-skyBlue focus:border-skyBlue disabled:opacity-50 disabled:bg-paleGray/30"
              style={{ maxHeight: "150px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isSending}
              className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-lg bg-navy text-white hover:bg-navy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
          <p className="text-[11px] text-charcoal/30 mt-xs text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
