import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PostModal = ({
  selectedPost,
  setSelectedPostId,
  userId,
  isProcessing,
  handleBuy,
  handleToggleRequest,
  handleConfirmTrade,
  handleCancelTrade,
  setShowReportModal,
  isOwner,
  isBuyer,
  processingIds,
  userAlreadyConfirmed,
  bothConfirmed,
  modalRef,
  hasConfirmed,
}) => {
  const [showBuyMessage, setShowBuyMessage] = useState(false);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedPost) {
      setShowBuyMessage(false);
      setConfirmDisabled(false);
    }
  }, [selectedPost]);

  if (!selectedPost) return null;

  const buyerId = selectedPost.buyer?._id || selectedPost.buyer;
  const ownerId = selectedPost.owner?._id || selectedPost.owner;

  const currentUserIsBuyer = Boolean(
    userId && buyerId && String(buyerId) === String(userId)
  );
  const currentUserIsOwner = Boolean(
    userId && ownerId && String(ownerId) === String(userId)
  );
  const bothConfirmedFlag = Boolean(
    typeof bothConfirmed === "function" && bothConfirmed(selectedPost)
  );
  const isPending = selectedPost.tradeStatus === "pending";
  const isPendingOrPendingRelease =
    isPending || selectedPost.tradeStatus === "pending_release";
  const alreadyConfirmed = Boolean(
    typeof userAlreadyConfirmed === "function" && userAlreadyConfirmed()
  );
  const isAvailable = Boolean(selectedPost.avaliable);

  const showBuyButton =
    userId &&
    !currentUserIsOwner &&
    isAvailable &&
    !bothConfirmedFlag &&
    !currentUserIsBuyer;

  const showConfirmCancelButtons =
    isPending &&
    (currentUserIsOwner || currentUserIsBuyer) &&
    !alreadyConfirmed &&
    !bothConfirmedFlag;

  const showReportButton =
    userId &&
    bothConfirmedFlag &&
    isPendingOrPendingRelease &&
    (currentUserIsOwner || currentUserIsBuyer) &&
    selectedPost.tradeStatus !== "completed"; // <-- prevent report if completed

  const showRequestButton =
    userId && !currentUserIsOwner && (!bothConfirmedFlag || showReportButton);

  const onBuyClick = () => {
    handleBuy(selectedPost._id);
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

  const handleShowProfile = () => {
    if (!localStorage.getItem("token")) {
      // If user not logged in
      navigate("/login");
      return;
    }
    setSelectedPostId(null); // Close modal first

    navigate(`/profile/${ownerId}`);
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
              onClick={handleShowProfile}
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

        {selectedPost.owner && (
          <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-400">
            Seller: {selectedPost.owner.name || "Unknown"}
          </p>
        )}

        {/* Confirmation status messages */}
        {isPendingOrPendingRelease && (
          <>
            {currentUserIsOwner &&
              buyerId &&
              selectedPost.tradeConfirmations?.includes(buyerId) &&
              !bothConfirmedFlag && (
                <p className="mt-3 text-red-500 font-semibold">
                  ✅ Buyer has confirmed the trade, Chat with him before you
                  Confirm Trade
                </p>
              )}

            {currentUserIsBuyer &&
              ownerId &&
              selectedPost.tradeConfirmations?.includes(ownerId) &&
              !bothConfirmedFlag && (
                <p className="mt-3 text-red-500 font-semibold">
                  ✅ Seller has confirmed the trade, Make Sure to Send Request
                  to Him before you Confirm Trade!
                </p>
              )}

            {bothConfirmedFlag &&
              (currentUserIsBuyer || currentUserIsOwner) && (
                <p className="mt-3 text-blue-600 font-semibold">
                  🎉 Trade Successful! Feel free to report if there is a
                  problem.
                </p>
              )}
          </>
        )}

        {/* Show buy message inside modal after clicking Buy */}
        {showBuyMessage && !bothConfirmedFlag && (
          <p className="mt-3 text-red-600 font-semibold">
            ⚠️ Please Don't confirm till you chat with seller and meet with him
            in-game.
          </p>
        )}

        {/* ===== Buttons Section ===== */}
        <div className="mt-4 space-y-2">
          {showBuyButton && (
            <button
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onBuyClick}
              disabled={isProcessing}
            >
              Buy Now
            </button>
          )}

          {showConfirmCancelButtons && (
            <>
              <button
                onClick={onConfirmClick}
                disabled={isProcessing || confirmDisabled}
                className={`w-full py-2 rounded-xl text-white ${
                  isProcessing || confirmDisabled
                    ? "bg-green-400"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Confirm Trade
              </button>

              <button
                onClick={onCancelClick}
                disabled={isProcessing}
                className={`w-full py-2 rounded-xl text-white ${
                  isProcessing ? "bg-red-400" : "bg-red-600 hover:bg-red-700"
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
              disabled={isProcessing}
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

export default React.memo(PostModal);
