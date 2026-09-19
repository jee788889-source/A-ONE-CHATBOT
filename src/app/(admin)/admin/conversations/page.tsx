"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessagesSquare,
  Search,
  Send,
  User,
  Phone,
  Clock,
  Check,
  CheckCheck,
  MapPin,
  ShoppingBag,
  Sparkles,
  Bot,
  AlertCircle,
  RefreshCw,
  UserCheck,
  PlusCircle,
  Shield,
  Zap,
  CreditCard,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ itemName: string; quantity: number; unitPrice: number }>;
}

interface Conversation {
  id: string;
  customerId: string;
  customerPhone: string;
  customerName?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  totalOrders?: number;
  totalSpent?: number;
  recentOrders?: RecentOrder[];
  channel: string;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessageContent?: string;
}

interface Message {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "STAFF" | "SYSTEM";
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
}

export default function ConversationsInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // 1. Fetch conversations list
  async function loadConversations() {
    try {
      let url = "/api/admin/conversations?";
      if (statusFilter !== "ALL") url += `status=${statusFilter}&`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setConversations(data.conversations || []);
        if (!selectedConvId && data.conversations?.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }

  // 2. Fetch messages for active conversation
  async function loadMessages(convId: string) {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/messages?conversationId=${convId}`);
      const data = await res.json();
      if (data.ok) {
        const rawList = data.messages || [];
        const seen = new Set<string>();
        const uniqueMessages = rawList.filter((m: Message) => {
          if (!m.id) return true;
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        setMessages(uniqueMessages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
      const interval = setInterval(() => loadMessages(selectedConvId), 6000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send Staff Reply via WhatsApp Cloud API
  async function handleSendReply(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedConvId || sending) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText("");

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedConvId, content }),
      });
      const data = await res.json();
      if (data.ok && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) {
            return prev;
          }
          return [...prev, data.message];
        });
        // Also ensure mode is PENDING (Human takeover) when staff manually replies
        if (selectedConv && selectedConv.status !== "PENDING") {
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedConvId ? { ...c, status: "PENDING" } : c))
          );
        }
      } else if (!data.ok) {
        alert("Failed to send message: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSending(false);
    }
  }

  // 4. Toggle AI Takeover vs Resume
  async function handleToggleTakeover(targetStatus: "PENDING" | "OPEN") {
    if (!selectedConv || togglingStatus) return;
    setTogglingStatus(true);

    try {
      const res = await fetch("/api/admin/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedConv.id, status: targetStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConv.id ? { ...c, status: targetStatus } : c))
        );
      }
    } catch (err) {
      console.error("Takeover toggle error:", err);
    } finally {
      setTogglingStatus(false);
    }
  }

  function handleQuickReply(text: string) {
    setReplyText(text);
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <MessagesSquare className="size-6 text-emerald-400" />
            WhatsApp Operations Inbox
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Live multi-staff customer chat, instant human takeover, and automated AI handoff.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadConversations();
            if (selectedConvId) loadMessages(selectedConvId);
          }}
          className="border-neutral-800 bg-neutral-900 text-neutral-300 text-xs h-8"
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* 3-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
        {/* LEFT PANE: Conversation List (3.5 cols) */}
        <Card className="md:col-span-4 lg:col-span-3.5 bg-neutral-900/80 border-neutral-800 flex flex-col min-h-0">
          <CardHeader className="p-3 border-b border-neutral-800 space-y-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phone or name..."
                className="pl-8 bg-neutral-950 border-neutral-800 text-xs h-8 text-neutral-200 placeholder:text-neutral-600"
              />
            </div>
            {/* Status Tabs */}
            <div className="flex gap-1">
              {[
                { key: "ALL", label: "ALL" },
                { key: "OPEN", label: "AI ACTIVE" },
                { key: "PENDING", label: "HUMAN" },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition ${
                    statusFilter === st.key
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </CardHeader>

          {/* Conversation list */}
          <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-neutral-800/60 scroll-slim">
            {loadingList && conversations.length === 0 && (
              <p className="p-8 text-center text-xs text-neutral-500">Loading chats...</p>
            )}
            {!loadingList && conversations.length === 0 && (
              <p className="p-8 text-center text-xs text-neutral-500">No conversations found.</p>
            )}
            {conversations.map((c, cIdx) => {
              const isSelected = c.id === selectedConvId;
              const isHumanHandling = c.status === "PENDING";

              return (
                <button
                  key={c.id ? `${c.id}-${cIdx}` : `conv-${cIdx}`}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full p-3 text-left transition-colors flex items-start gap-2.5 ${
                    isSelected ? "bg-neutral-800/80 border-l-2 border-amber-500" : "hover:bg-neutral-800/30"
                  }`}
                >
                  <div className="size-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                    {c.customerName ? c.customerName.charAt(0).toUpperCase() : <Phone className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-neutral-100 truncate">
                        {c.customerName || c.customerPhone}
                      </p>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {c.lastMessageContent || "..."}
                    </p>
                    <div className="flex items-center justify-between gap-1.5 mt-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                          isHumanHandling
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {isHumanHandling ? "👤 Human Active" : "🤖 AI Active"}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="size-4 rounded-full bg-amber-500 text-neutral-950 font-black text-[9px] flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* MIDDLE PANE: Active Chat Thread & Reply (5.5 cols) */}
        <Card className="md:col-span-8 lg:col-span-5.5 bg-neutral-900/90 border-neutral-800 flex flex-col min-h-0">
          {selectedConv ? (
            <>
              {/* Chat Header with Human Takeover Controls */}
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                    WA
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      {selectedConv.customerName || selectedConv.customerPhone}
                      {selectedConv.status === "PENDING" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                          👤 HUMAN ACTIVE
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-mono">{selectedConv.customerPhone}</p>
                  </div>
                </div>

                {/* Handoff Toggle Button */}
                <div className="flex items-center gap-2">
                  {selectedConv.status === "PENDING" ? (
                    <Button
                      size="sm"
                      onClick={() => handleToggleTakeover("OPEN")}
                      disabled={togglingStatus}
                      className="h-8 text-[11px] bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 font-bold"
                    >
                      <Bot className="size-3.5 mr-1.5" />
                      RESUME AI
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleToggleTakeover("PENDING")}
                      disabled={togglingStatus}
                      className="h-8 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold"
                    >
                      <UserCheck className="size-3.5 mr-1.5" />
                      TAKE OVER CHAT
                    </Button>
                  )}
                </div>
              </div>

              {/* Message Thread History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-slim bg-neutral-950/20">
                {loadingMessages && messages.length === 0 && (
                  <p className="text-center text-xs text-neutral-500 py-12">Loading messages...</p>
                )}
                {messages.map((m, idx) => {
                  const isUser = m.role === "USER";
                  const isAssistant = m.role === "ASSISTANT";
                  const isStaff = m.role === "STAFF";

                  return (
                    <div
                      key={m.id ? `${m.id}-${idx}` : `msg-${idx}`}
                      className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {isUser && <span className="text-[10px] font-bold text-neutral-400">Customer</span>}
                        {isAssistant && (
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                            <Bot className="size-3" /> A-ONE AI Bot
                          </span>
                        )}
                        {isStaff && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <UserCheck className="size-3" /> Restaurant Staff
                          </span>
                        )}
                        <span className="text-[9px] text-neutral-600">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {!isUser && (
                          <span className="text-[9px] text-neutral-500">
                            {m.status === "READ" ? (
                              <CheckCheck className="size-3 text-cyan-400 inline" />
                            ) : (
                              <Check className="size-3 inline" />
                            )}
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-neutral-800 text-neutral-100 rounded-tl-sm border border-neutral-700/60"
                            : isAssistant
                            ? "bg-amber-500/10 text-amber-100 border border-amber-500/20 rounded-tr-sm"
                            : "bg-emerald-600 text-white rounded-tr-sm shadow-emerald-950/50"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="px-3 pt-2 pb-1 border-t border-neutral-800 bg-neutral-950/40 flex items-center gap-1.5 overflow-x-auto scroll-slim">
                <button
                  type="button"
                  onClick={() => handleQuickReply("Assalam-o-Alaikum! Main A-ONE Restaurant team se baat kar raha hoon. Main aap ki kya madad kar sakta hoon?")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 whitespace-nowrap"
                >
                  👋 Staff Salam
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Aap ka order kitchen mein prepare ho raha hai aur jald delivery ke liye dispatch hoga. 🛵")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 whitespace-nowrap"
                >
                  🍳 Kitchen Update
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Aap ki payment verify ho gayi hai. Shukriya! ✅")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 whitespace-nowrap"
                >
                  💳 Payment Received
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply("Baraye meherbani apna mukammal delivery address share kar dein.")}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 whitespace-nowrap"
                >
                  📍 Ask Address
                </button>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 bg-neutral-950/60 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedConv.status === "PENDING"
                      ? "Type reply to customer (Staff Direct WhatsApp Mode)..."
                      : "Type reply (Sending will automatically activate Human mode)..."
                  }
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-emerald-500/50 h-10"
                />
                <Button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-4 shrink-0 shadow-md shadow-emerald-600/20"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs">
              <MessagesSquare className="size-10 mb-2 stroke-[1.5]" />
              Select a conversation to start chatting.
            </div>
          )}
        </Card>

        {/* RIGHT PANE: Customer Context & Real Order History (3 cols) */}
        <Card className="hidden lg:flex lg:col-span-3 bg-neutral-900/80 border-neutral-800 flex-col min-h-0">
          <CardHeader className="p-3.5 border-b border-neutral-800">
            <CardTitle className="text-xs font-bold text-white flex items-center gap-1.5">
              <User className="size-3.5 text-amber-500" />
              Customer Profile & History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 space-y-4 flex-1 overflow-y-auto scroll-slim text-xs">
            {selectedConv ? (
              <>
                {/* Profile Card */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-white">
                      {selectedConv.customerName || "Customer (WhatsApp)"}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                        selectedConv.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {selectedConv.status === "PENDING" ? "Human Handling" : "AI Active"}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-neutral-400 font-mono text-[11px]">
                    <Phone className="size-3 text-amber-500" />
                    {selectedConv.customerPhone}
                  </p>
                  {selectedConv.customerAddress && (
                    <p className="flex items-start gap-1.5 text-neutral-400 text-[11px]">
                      <MapPin className="size-3 text-amber-500 shrink-0 mt-0.5" />
                      <span>{selectedConv.customerAddress}</span>
                    </p>
                  )}
                  {selectedConv.customerNotes && (
                    <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg mt-1">
                      Note: {selectedConv.customerNotes}
                    </p>
                  )}
                </div>

                {/* Customer Orders History */}
                <div className="space-y-2">
                  <p className="font-bold uppercase tracking-wider text-neutral-400 text-[10px] flex items-center justify-between">
                    <span>Recent Orders</span>
                    <span>{selectedConv.recentOrders?.length || 0} total</span>
                  </p>

                  <div className="space-y-2">
                    {selectedConv.recentOrders && selectedConv.recentOrders.length > 0 ? (
                      selectedConv.recentOrders.map((ord, ordIdx) => (
                        <div
                          key={ord.id ? `${ord.id}-${ordIdx}` : `ord-${ordIdx}`}
                          className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-400 text-[11px]">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[10px] font-bold text-white">
                              Rs. {ord.total?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-neutral-400">
                              {ord.status}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase ${
                                ord.paymentStatus === "PAID"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : ord.paymentStatus === "PENDING_VERIFICATION"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {ord.items?.map((it) => `${it.quantity}x ${it.itemName}`).join(", ")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-neutral-500 text-center py-2">
                        No previous orders recorded.
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Actions */}
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <p className="font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
                    Direct Actions
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open(`https://wa.me/${selectedConv.customerPhone.replace(/\+/g, "")}`, "_blank");
                    }}
                    className="w-full text-xs justify-start border-neutral-800 bg-neutral-950 text-neutral-200"
                  >
                    <ExternalLink className="size-3.5 mr-2 text-emerald-400" />
                    Open in WhatsApp App
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-neutral-500 text-center py-8">No customer selected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
