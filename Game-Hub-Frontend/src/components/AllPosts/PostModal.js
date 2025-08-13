// src/components/AllPosts/PostModal.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../utils/socket";

const PostModal = ({
  selectedPost,
  setSelectedPostId,
  userId,
  processingIds, // <- use Set to track processing
  handleBuy,
  handleToggleRequest,
  handleCancelBuyer,
  handleAcceptBuyer,
  handleConfirmTrade,
  handleCancelTrade,
  setShowReportModal,
  userAlreadyConfirmed,
  bothConfirmed,
  modalRef,
}) => {
  const [showBuyMessage, setShowBuyMessage] = useState(false);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const [buyersState, setBuyersState] = useState([]);
  const navigate = useNavigate();

  // Initialize buyersState whenever selectedPost changes
  useEffect(() => {
    if (!selectedPost) return;
    const buyersWithStatus = (selectedPost.buyers || []).map((b) => ({
      ...b,
      status: "pending",
    }));
    setBuyersState(buyersWithStatus);
    setShowBuyMessage(false);
    setConfirmDisabled(false);
  }, [selectedPost]);

  // Listen for socket updates
  useEffect(() => {
    if (!selectedPost) return;

    const handlePostUpdated = (updatedData) => {
      if (updatedData._id === selectedPost._id) {
        const updatedBuyers = (updatedData.buyers || []).map((b) => {
          const existing = buyersState.find((e) => e._id === b._id);
          return existing ? { ...existing } : { ...b, status: "pending" };
        });
        setBuyersState(updatedBuyers);
      }
    };

    socket.on("postUpdated", handlePostUpdated);
    return () => socket.off("postUpdated", handlePostUpdated);
  }, [selectedPost, buyersState]);

  if (!selectedPost) return null;

  const ownerId = selectedPost.owner?._id || selectedPost.owner;
  const currentUserIsOwner = String(ownerId) === String(userId);
  const currentUserIsActiveBuyer =
    String(selectedPost.activeBuyerId) === String(userId);

  const bothConfirmedFlag =
    typeof bothConfirmed === "function" && bothConfirmed(selectedPost);
  const alreadyConfirmed =
    typeof userAlreadyConfirmed === "function" &&
    userAlreadyConfirmed(selectedPost);

  const isPending = selectedPost.tradeStatus === "pending";
  const isPendingOrPendingRelease =
    isPending || selectedPost.tradeStatus === "pending_release";
  const isAvailable = Boolean(selectedPost.avaliable);

  // Show Buy Now button only if user is not owner and not active buyer
  const showBuyButton =
    userId &&
    !currentUserIsOwner &&
    !currentUserIsActiveBuyer &&
    isAvailable &&
    !bothConfirmedFlag;

  // Show Confirm/Cancel buttons only to active buyer or owner
  const showConfirmCancelButtons =
    isPending &&
    !bothConfirmedFlag &&
    (currentUserIsOwner || currentUserIsActiveBuyer) &&
    !alreadyConfirmed;

  const showReportButton =
    userId && bothConfirmedFlag && isPendingOrPendingRelease;

  const showRequestButton =
    userId && !currentUserIsOwner && (!bothConfirmedFlag || showReportButton);

  const onBuyClick = () => {
    handleBuy(selectedPost);
    setShowBuyMessage(true);
  };

  const onConfirmClick = () => {
    setConfirmDisabled(true);
    handleConfirmTrade(selectedPost);
  };

  const onCancelClick = () => {
    setConfirmDisabled(false);
    handleCancelTrade(selectedPost);
  };

  const handleShowProfile = (profileId) => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    setSelectedPostId(null);
    navigate(`/profile/${profileId}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-darkCard text-black dark:text-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
      >
        <button
          onClick={() => setSelectedPostId(null)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
          aria-label="Close modal"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-2">{selectedPost.description}</h2>

        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Server: {selectedPost.server}
          </p>
          {selectedPost.owner && (
            <button
              onClick={() => handleShowProfile(ownerId)}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Show Profile
            </button>
          )}
        </div>

        <p className="mb-2 text-yellow-500 font-semibold">
          Price: {selectedPost.price}{" "}
          {selectedPost.price === 1 ? "Coin" : "Coins"}
        </p>

        <p
          className={`text-sm font-semibold ${
            isAvailable ? "text-green-600" : "text-red-500"
          }`}
        >
          {isAvailable ? "Available ✔️" : "Not Available ❌"}
        </p>

        {/* Buyers List */}
        {buyersState.length > 0 && (
          <div className="mb-2 text-sm">
            <p className="font-semibold text-purple-600 mb-1">
              Buyers ({buyersState.length}):
            </p>
            <ul className="space-y-1">
              {buyersState.map((b) => (
                <li
                  key={b._id + (b.status || "pending")}
                  className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                >
                  <div>
                    <span className="font-medium">{b.name || "Unknown"}</span>{" "}
                    <span className="text-gray-600 dark:text-gray-300">
                      ({b.email || "N/A"})
                    </span>
                  </div>

                  {/* Owner sees Accept/Cancel for pending buyers */}
                  {currentUserIsOwner && b.status === "pending" && (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleAcceptBuyer(selectedPost, b._id)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                        disabled={processingIds.has(selectedPost._id)}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleCancelBuyer(selectedPost, b._id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                        disabled={processingIds.has(selectedPost._id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {b.status === "accepted" && (
                    <p className="text-green-600 font-semibold text-sm ml-2">
                      Seller accepted! Confirm/cancel trade or send chat
                      request.
                    </p>
                  )}
                  {b.status === "rejected" && (
                    <p className="text-red-600 font-semibold text-sm ml-2">
                      Seller rejected your request. Buy now or send chat request
                      again.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirmation & Trade Messages */}
        {isPendingOrPendingRelease && (
          <>
            {currentUserIsOwner &&
              selectedPost.tradeConfirmations?.some((id) =>
                buyersState.map((b) => b._id).includes(id)
              ) &&
              !bothConfirmedFlag && (
                <p className="mt-3 text-red-500 font-semibold">
                  ✅ A buyer has confirmed the trade. Chat with them before you
                  confirm!
                </p>
              )}

            {currentUserIsActiveBuyer &&
              ownerId &&
              selectedPost.tradeConfirmations?.includes(ownerId) &&
              !bothConfirmedFlag && (
                <p className="mt-3 text-red-500 font-semibold">
                  ✅ Seller has confirmed the trade. Make sure to chat before
                  confirming!
                </p>
              )}

            {bothConfirmedFlag &&
              (currentUserIsActiveBuyer || currentUserIsOwner) && (
                <p className="mt-3 text-blue-600 font-semibold">
                  🎉 Trade Successful! Feel free to report any issues.
                </p>
              )}
          </>
        )}

        {showBuyMessage && (
          <p className="mt-3 text-red-600 font-semibold">
            ⚠️ Please don't confirm until you chat with the seller and meet
            in-game.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {showBuyButton && (
            <button
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onBuyClick}
              disabled={processingIds.has(selectedPost._id)}
            >
              Buy Now
            </button>
          )}

          {showConfirmCancelButtons && (
            <>
              <button
                onClick={onConfirmClick}
                disabled={
                  processingIds.has(selectedPost._id) || confirmDisabled
                }
                className={`w-full py-2 rounded-xl text-white ${
                  processingIds.has(selectedPost._id) || confirmDisabled
                    ? "bg-green-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Confirm Trade
              </button>

              <button
                onClick={onCancelClick}
                disabled={processingIds.has(selectedPost._id)}
                className={`w-full py-2 rounded-xl text-white ${
                  processingIds.has(selectedPost._id)
                    ? "bg-red-400"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Cancel Trade
              </button>
            </>
          )}

          {showReportButton && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Report
            </button>
          )}

          {showRequestButton && (
            <button
              className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              onClick={() => handleToggleRequest(selectedPost)}
              disabled={processingIds.has(selectedPost._id)}
            >
              {selectedPost.requests?.includes(userId)
                ? "Cancel Chat Request"
                : "Send Chat Request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostModal;
