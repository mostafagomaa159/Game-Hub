// src/pages/Requests.js
import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import { MessageCircle } from "lucide-react";
import Modal from "react-modal";

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
  const [requests, setRequests] = useState([]);
  const [chatOpenId, setChatOpenId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("/my-requests");
        setRequests(res.data);
      } catch (err) {
        console.error("Fetch requests error", err);
      }
    };
    fetchRequests();
  }, []);

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

  const toggleChat = (id) => {
    setChatOpenId(chatOpenId === id ? null : id);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-3xl mb-4">Incoming Requests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((req) => (
          <Card key={req._id} className="bg-gray-900 text-white shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Buyer: {req.buyer.name}</h2>
                <MessageCircle
                  className="cursor-pointer"
                  onClick={() => toggleChat(req._id)}
                />
              </div>
              <p className="mt-2">
                <strong>Item:</strong> {req.item.description}
              </p>
              <p>
                <strong>Price:</strong> {req.price} coins
              </p>
              <p>
                <strong>Server:</strong> {req.item.server}
              </p>
              <p>
                <strong>Payment:</strong> PayPal {/* Placeholder */}
              </p>
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
              {/* Chat Modal */}
              <Modal
                isOpen={chatOpenId === req._id}
                onRequestClose={() => toggleChat(null)}
                className="bg-white p-4 rounded-md w-1/2 mx-auto mt-20"
                overlayClassName="fixed inset-0 bg-black bg-opacity-70"
              >
                <h2 className="text-black text-xl font-bold mb-2">
                  Chat with {req.buyer.name}
                </h2>
                <p className="text-black">[TODO: Add chat system here]</p>
                <button
                  className="mt-4 bg-gray-800 text-white px-4 py-2 rounded"
                  onClick={() => toggleChat(null)}
                >
                  Close
                </button>
              </Modal>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Requests;
