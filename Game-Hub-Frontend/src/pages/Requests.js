import axios from "../api/axiosInstance";
import { MessageCircle } from "lucide-react";
import Modal from "react-modal";
import { io } from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";

const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:3001", {
  withCredentials: true,
});

const Button = ({ children, onClick, className }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded ${className}`}>
    {children}
  </button>
);

const Card = ({ children }) => (
  <div className="bg-gray-800 p-4 rounded shadow">{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

const Requests = () => {
  const [view, setView] = useState("incoming");
  const [requests, setRequests] = useState([]);
  const [chatOpenId, setChatOpenId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [user, setUser] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
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
          status: m.status, // ✅ include status from DB so ✔️✔✔ appear correctly
        }))
      );

      socket.emit("markAsSeen", {
        roomId: id,
        userId: user._id,
      });
    } catch (e) {
      console.error("Failed to load chat", e);
    }
  };
  socket.on("messagesSeen", ({ roomId, seenBy }) => {
    // Optional: Only update if current chat is open
    if (chatOpenId === roomId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.senderId === user._id ? { ...msg, status: "seen" } : msg
        )
      );
    }
  });

  const sendMessage = () => {
    // Don't send empty message or if user not loaded
    if (!inputMessage.trim() || !user) return;

    // Prepare the message payload for the backend
    const messageData = {
      roomId: chatOpenId,
      message: inputMessage,
      sender: user._id, // This goes to MongoDB (ObjectId expected)
    };

    // Send to server using socket.io
    socket.emit("sendMessage", messageData);

    // Clear the input box
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

      <h1 className="text-3xl mb-4">
        {view === "incoming" ? "Incoming Requests" : "My Sent Requests"}
      </h1>

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
                className="bg-white p-4 rounded-md w-1/2 mx-auto mt-20"
                overlayClassName="fixed inset-0 bg-black bg-opacity-70"
              >
                <div className="relative flex flex-col h-[500px] sm:h-[600px]">
                  <button
                    onClick={() => toggleChat(null)}
                    className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-xl"
                    aria-label="Close chat"
                  >
                    &times;
                  </button>
                  <div className="bg-gray-900 text-white text-lg font-semibold px-4 py-2 rounded-t">
                    Chat with{" "}
                    {view === "incoming" ? req.buyer.name : req.seller.name}
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 bg-gray-800 text-white">
                    {messages.map((msg, index) => {
                      const isOwn =
                        msg.sender === user._id || msg.senderName === user.name;

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

                          <div className="inline-block bg-gray-700 p-2 rounded max-w-xs relative text-white">
                            <span>{msg.message}</span>

                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                                <span>{formatTime(msg.createdAt)}</span>
                                {isOwn && (
                                  <>
                                    {msg.status === "seen" ? (
                                      <span className="text-blue-400">✔✔</span>
                                    ) : msg.status === "delivered" ? (
                                      <span className="text-white">✔✔</span>
                                    ) : (
                                      <span className="text-green-500">✔️</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {typingUser && (
                      <div className="text-sm italic text-gray-400 mb-2">
                        {typingUser} is typing...
                      </div>
                    )}
                    <div ref={messageEndRef} />
                  </div>

                  <div className="flex border-t border-gray-700 p-2 bg-gray-900">
                    <input
                      className="flex-1 px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400"
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
                      onClick={sendMessage}
                      className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
    </div>
  );
};

export default Requests;
