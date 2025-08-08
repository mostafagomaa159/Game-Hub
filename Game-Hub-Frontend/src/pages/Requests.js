// FULL UPDATED Requests.js WITH RESPONSIVE CHAT + EMOJI PICKER
import axios from "../api/axiosInstance";
import { MessageCircle, Smile } from "lucide-react";
import Modal from "react-modal";
import socket from "../utils/socket";

import React, { useEffect, useRef, useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const Button = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded ${className}`}>
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-gray-800 p-4 rounded shadow">{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

const SkeletonCard = () => (
  <div className="bg-gray-700 p-4 rounded shadow animate-pulse h-48">
    <div className="h-6 bg-gray-600 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-600 rounded w-2/3 mb-2"></div>
    <div className="flex gap-2 mt-4">
      <div className="h-8 w-20 bg-gray-600 rounded"></div>
      <div className="h-8 w-20 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const ChatSkeleton = () => (
  <div className="flex flex-col gap-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse flex justify-start">
        <div className="bg-gray-600 rounded px-4 py-2 w-3/4 h-6"></div>
      </div>
    ))}
  </div>
);

const Requests = () => {
  const [view, setView] = useState("incoming");
  const [requests, setRequests] = useState([]);
  const [chatOpenId, setChatOpenId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [user, setUser] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userRes = await axios.get("/users/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(userRes.data);

        const route = view === "incoming" ? "/my-requests" : "/me/sent-trades";
        const res = await axios.get(route);
        setRequests(res.data);
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.on("typing", ({ sender }) => {
      setTypingUser(sender);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
      }, 2000);
    });

    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
    };
  }, [view]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = async (id) => {
    if (chatOpenId === id || !id) {
      setChatOpenId(null);
      setMessages([]);
      return;
    }

    setChatOpenId(id);
    setMessages([]);
    setMessagesLoading(true);
    socket.emit("joinRoom", { roomId: id });

    try {
      const res = await axios.get(`/chat/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setMessages(
        res.data.map((m) => ({
          message: m.message,
          senderId: typeof m.sender === "object" ? m.sender._id : m.sender,
          senderName: typeof m.sender === "object" ? m.sender.name : m.sender,
          createdAt: m.createdAt,
          status: m.status,
        }))
      );

      socket.emit("markAsSeen", {
        roomId: id,
        userId: user._id,
      });
    } catch (e) {
      console.error("Failed to load chat", e);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    socket.on("messagesSeen", ({ roomId }) => {
      if (chatOpenId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user._id ? { ...msg, status: "seen" } : msg
          )
        );
      }
    });
  }, [chatOpenId, user]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !user) return;

    const messageData = {
      roomId: chatOpenId,
      message: inputMessage,
      sender: user._id,
    };

    socket.emit("sendMessage", messageData);
    setInputMessage("");
  };

  const handleConfirm = async (id) => {
    try {
      const res = await axios.patch(`/${id}/confirm`);
      alert("Request confirmed");
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, ...res.data } : r))
      );
    } catch (err) {
      console.error("Confirm error", err);
    }
  };

  const handleCancel = async (itemId) => {
    try {
      await axios.post(`/newpost/${itemId}/cancel-trade`);
      alert("Request cancelled");
      setRequests((prev) => prev.filter((r) => r.item._id !== itemId));
    } catch (err) {
      console.error("Cancel error", err);
    }
  };

  return (
    <div className="p-6 bg-blue-1000 min-h-screen text-white">
      <div className="flex gap-4 mb-6">
        <Button
          className={`${view === "incoming" ? "bg-green-600" : "bg-gray-700"}`}
          onClick={() => setView("incoming")}
        >
          Requests
        </Button>
        <Button
          className={`${view === "sent" ? "bg-blue-600" : "bg-gray-700"}`}
          onClick={() => setView("sent")}
        >
          My Requests
        </Button>
      </div>

      {/* className="p-4 max-w-5xl mx-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white rounded-md shadow-md" */}
      <h1 className="text-xl font-bold mb-4 p-4 max- mx-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white rounded-md shadow-md">
        {view === "incoming" ? "Incoming Requests" : "My Sent Requests"}
      </h1>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center text-gray-400 text-lg mt-10">
          <div className="text-4xl animate-bounce mb-2">📭</div>
          No {view === "incoming" ? "incoming" : "sent"} requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <Card key={req._id}>
              <CardContent>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">
                    {view === "incoming"
                      ? `Buyer: ${req.buyer.name}`
                      : `Seller: ${req.seller.name}`}
                  </h2>
                  <MessageCircle
                    className="cursor-pointer"
                    onClick={() => toggleChat(req._id)}
                  />
                </div>
                <p className="mt-2">
                  <strong>Description:</strong> {req.item.description}
                </p>
                <p>
                  <strong>Price:</strong> {req.price} coins
                </p>
                <p>
                  <strong>Server:</strong> {req.item.server}
                </p>

                {view === "incoming" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleConfirm(req._id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleCancel(req.item._id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <Modal
                  isOpen={chatOpenId === req._id}
                  onRequestClose={() => toggleChat(null)}
                  className="bg-white rounded-md w-full sm:w-[95%] md:w-[80%] lg:w-[60%] xl:w-[50%] max-w-[800px] h-[90vh] sm:h-[80vh] mx-auto mt-4 flex flex-col"
                  overlayClassName="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center"
                >
                  <div className="relative flex flex-col flex-1">
                    <button
                      onClick={() => toggleChat(null)}
                      className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-xl z-50"
                      aria-label="Close chat"
                    >
                      &times;
                    </button>

                    {/* Chat Header */}
                    <div className="bg-gray-900 text-white text-lg font-semibold px-4 py-2 rounded-t">
                      Chat with{" "}
                      {view === "incoming" ? req.buyer.name : req.seller.name}
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-3 bg-gray-800 text-white">
                      {messagesLoading ? (
                        <ChatSkeleton />
                      ) : (
                        messages.map((msg, index) => {
                          const isOwn =
                            msg.senderId === user._id ||
                            msg.senderName === user.name;

                          return (
                            <div
                              key={index}
                              className={`mb-2 ${
                                isOwn ? "text-right" : "text-left"
                              }`}
                            >
                              <span className="block text-sm text-gray-400">
                                {msg.senderName || msg.sender}
                              </span>
                              <div className="inline-block bg-gray-700 p-2 rounded max-w-[85%] sm:max-w-xs relative text-white">
                                <span>{msg.message}</span>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                                  <span>{formatTime(msg.createdAt)}</span>
                                  {isOwn && (
                                    <>
                                      {msg.status === "seen" ? (
                                        <span className="text-blue-400">
                                          ✔✔
                                        </span>
                                      ) : msg.status === "delivered" ? (
                                        <span className="text-white">✔✔</span>
                                      ) : (
                                        <span className="text-green-500">
                                          ✔️
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {typingUser && (
                        <div className="text-sm italic text-gray-400 mb-2">
                          {typingUser} is typing...
                        </div>
                      )}
                      <div ref={messageEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="flex items-center gap-2 border-t border-gray-700 p-2 bg-gray-900 relative flex-wrap">
                      {showEmojiPicker && (
                        <div className="absolute bottom-14 left-0 z-50 max-h-[300px] overflow-y-auto">
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji) =>
                              setInputMessage((prev) => prev + emoji.native)
                            }
                            theme="dark"
                            previewPosition="none"
                          />
                        </div>
                      )}
                      <input
                        className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 min-w-[120px]"
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => {
                          setInputMessage(e.target.value);
                          socket.emit("typing", {
                            roomId: chatOpenId,
                            sender: user.name,
                          });
                        }}
                      />
                      <button
                        className="text-gray-300 hover:text-white flex-shrink-0"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile size={22} />
                      </button>
                      <button
                        onClick={sendMessage}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex-shrink-0"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </Modal>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
