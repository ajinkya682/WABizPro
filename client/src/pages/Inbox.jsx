import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import socketService from "../services/socket.service";
import useAuthStore from "../store/authStore";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Users,
} from "lucide-react";

const Inbox = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api
      .get("/inbox/conversations")
      .then((res) => setConversations(res.data.conversations))
      .catch(console.error);

    const socket = socketService.connect(user?.businessId);
    if (socket) {
      const handleIncomingMessage = (msg) => {
        setConversations((prev) => {
          const contactId = msg.contactId?._id || msg.contactId;
          const idx = prev.findIndex((c) => c.contactId?._id === contactId);
          if (idx === -1) return prev; // Need to fetch new conv if not exists
          const newConvs = [...prev];
          newConvs[idx] = {
            ...newConvs[idx],
            lastMessage: msg,
            lastMessageAt: msg.createdAt || new Date().toISOString(),
            unreadCount:
              activeConv?.contactId?._id !== contactId
                ? (newConvs[idx].unreadCount || 0) + 1
                : newConvs[idx].unreadCount || 0,
          };
          return newConvs.sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt || 0) -
              new Date(a.lastMessageAt || a.updatedAt || 0),
          );
        });

        if (activeConv?.contactId?._id === contactId) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      socket.on("receive_message", handleIncomingMessage);
      socket.on("new_message", ({ message }) => handleIncomingMessage(message));
      socket.on("message_sent", ({ message }) => handleIncomingMessage(message));
      socket.on("message_status_update", (data) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.messageId === data.messageId ||
            m.waMessageId === data.waMessageId ||
            m.waMessageId === data.messageId
              ? { ...m, status: data.status }
              : m,
          ),
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("receive_message");
        socket.off("new_message");
        socket.off("message_sent");
        socket.off("message_status_update");
      }
    };
  }, [activeConv, user?.businessId]);

  useEffect(() => {
    if (activeConv) {
      api
        .get(`/inbox/conversations/${activeConv._id}`)
        .then((res) => {
          setMessages(res.data.messages);
          if (activeConv.unreadCount > 0) {
            setConversations((prev) =>
              prev.map((c) =>
                c._id === activeConv._id ? { ...c, unreadCount: 0 } : c,
              ),
            );
          }
        })
        .catch(console.error);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    try {
      const res = await api.post(`/inbox/conversations/${activeConv._id}/reply`, {
        text: inputText,
      });
      setMessages((prev) => [...prev, res.data.message]);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === activeConv._id
            ? {
                ...conversation,
                lastMessage: res.data.message,
                lastMessageAt: res.data.message.createdAt,
              }
            : conversation
        )
      );
      setInputText("");
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full flex bg-white border border-border rounded-xl shadow-sm overflow-hidden min-h-[600px]">
      {/* Sidebar - Conversations */}
      <div className="w-1/3 border-r border-border flex flex-col bg-white min-w-[300px]">
        <div className="p-3 bg-gray-50 border-b border-border flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
            {user?.name?.[0] || "U"}
          </div>
          <div className="flex gap-3 text-gray-500">
            <MoreVertical className="cursor-pointer" size={20} />
          </div>
        </div>

        <div className="p-2 border-b border-border">
          <div className="bg-gray-100 rounded-lg flex items-center px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary focus-within:shadow-sm">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent border-none outline-none w-full text-sm py-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations
            .filter(
              (c) =>
                c.contactId?.name
                  ?.toLowerCase()
                  .includes(search.toLowerCase()) ||
                c.contactId?.phone?.includes(search),
            )
            .map((conv) => (
              <div
                key={conv._id}
                onClick={() => setActiveConv(conv)}
                className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition border-b border-border last:border-0 ${activeConv?._id === conv._id ? "bg-gray-100" : ""}`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white mr-3">
                  {conv.contactId?.name?.[0] || <Users size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-medium text-text-primary truncate">
                      {conv.contactId?.name || conv.contactId?.phone}
                    </h4>
                    <span className="text-xs text-text-secondary">
                      {conv.lastMessage?.createdAt
                        ? formatTime(conv.lastMessage.createdAt)
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-text-secondary truncate flex-1">
                      {conv.lastMessage?.direction === "outbound" && (
                        <span className="mr-1 text-blue-500">✓✓</span>
                      )}
                      {conv.lastMessage?.content?.text ||
                        (conv.lastMessage?.type === "template"
                          ? "Template message"
                          : "Started conversation")}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-[#EFEAE2]">
          <div className="h-16 bg-gray-50 border-b border-border px-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white mr-3">
                {activeConv.contactId?.name?.[0] || "C"}
              </div>
              <div>
                <h3 className="font-medium text-text-primary">
                  {activeConv.contactId?.name || activeConv.contactId?.phone}
                </h3>
                <p className="text-xs text-text-secondary">
                  {activeConv.contactId?.phone}
                </p>
              </div>
            </div>
            <MoreVertical className="text-gray-500 cursor-pointer" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 background-whatsapp">
            <div className="text-center mb-4">
              <span className="bg-[#FFEECD] text-[#54656F] text-xs px-3 py-1.5 rounded-lg shadow-sm">
                Messages are end-to-end encrypted. No one outside of this chat,
                not even WhatsApp, can read or listen to them.
              </span>
            </div>
            {messages.map((msg, i) => {
              const out = msg.direction === "outbound";
              return (
                <div
                  key={i}
                  className={`flex ${out ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm relative text-[14.5px] ${out ? "bg-[#D9FDD3] rounded-tr-none" : "bg-white rounded-tl-none"}`}
                  >
                    {out && (
                      <div className="absolute top-0 -right-2 w-0 h-0 border-[8px] border-transparent border-t-[#D9FDD3] border-l-[#D9FDD3]"></div>
                    )}
                    {!out && (
                      <div className="absolute top-0 -left-2 w-0 h-0 border-[8px] border-transparent border-t-white border-r-white"></div>
                    )}

                    <div className="text-[#111B21] whitespace-pre-wrap">
                      {msg.content?.text || "Message content"}
                    </div>
                    <div className="flex justify-end items-center gap-1 mt-1">
                      <span className="text-[10px] text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                      {out && (
                        <span
                          className={`text-[12px] ${msg.status === "read" ? "text-blue-500" : "text-gray-400"}`}
                        >
                          {msg.status === "sent" ||
                          msg.status === "delivered" ||
                          msg.status === "read"
                            ? "✓✓"
                            : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
            <button className="text-gray-500 hover:text-gray-700 p-2">
              <Paperclip size={24} />
            </button>
            <form
              onSubmit={handleSend}
              className="flex-1 flex bg-white rounded-xl overflow-hidden shadow-sm items-center pr-2"
            >
              <input
                type="text"
                placeholder="Type a message"
                className="w-full bg-transparent border-none outline-none px-4 py-2.5"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="text-primary hover:text-primary/80 disabled:text-gray-300 p-2"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] text-center p-8">
          <div className="w-64 h-64 bg-[url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png')] bg-contain bg-no-repeat bg-center mb-6 opacity-50"></div>
          <h2 className="text-3xl font-light text-[#41525d] mb-4">
            WhatsApp Web Clone
          </h2>
          <p className="text-[#667781] text-sm">
            Send and receive messages without keeping your phone online.
            <br />
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
        </div>
      )}
    </div>
  );
};
export default Inbox;
