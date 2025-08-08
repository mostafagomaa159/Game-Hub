import React from "react";

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
  userAlreadyConfirmed,
  bothConfirmed,
  modalRef,
  hasConfirmed,
}) => {
  if (!selectedPost) return null;

  const buyerId = selectedPost.buyer?._id || selectedPost.buyer;
  const ownerId = selectedPost.owner?._id || selectedPost.owner;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-darkCard text-black dark:text-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
      >
        <button
          onClick={() => setSelectedPostId(null)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-2">{selectedPost.description}</h2>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-300">
          Server: {selectedPost.server}
        </p>
        <p className="mb-2 text-yellow-500 font-semibold">
          {selectedPost.price} Coins
        </p>
        <p
          className={`text-sm font-semibold ${
            selectedPost.avaliable ? "text-green-600" : "text-red-500"
          }`}
        >
          {selectedPost.avaliable ? "✔️ Available" : "❌ Not Available"}
        </p>

        {selectedPost.owner && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Seller: {selectedPost.owner.name || "Unknown"}
          </p>
        )}

        {/* Trade Buttons */}
        {selectedPost.tradeStatus === "pending" &&
          (isOwner || isBuyer) &&
          !userAlreadyConfirmed() && (
            <>
              <button
                onClick={handleConfirmTrade}
                disabled={isProcessing}
                className={`mt-4 w-full py-2 rounded-xl text-white ${
                  isProcessing
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Confirm Trade
              </button>

              <button
                onClick={handleCancelTrade}
                disabled={isProcessing}
                className={`mt-2 w-full py-2 rounded-xl text-white ${
                  isProcessing
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Cancel Trade
              </button>

              {hasConfirmed && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="mt-3 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  Report
                </button>
              )}
            </>
          )}

        {/* Show confirmation status */}
        {selectedPost.tradeStatus === "pending" &&
          isOwner &&
          buyerId &&
          selectedPost.tradeConfirmations?.includes(buyerId) && (
            <p className="mt-3 text-green-500 font-semibold">
              ✅ Buyer has confirmed the trade.
            </p>
          )}

        {selectedPost.tradeStatus === "pending" &&
          isBuyer &&
          ownerId &&
          selectedPost.tradeConfirmations?.includes(ownerId) && (
            <p className="mt-3 text-green-500 font-semibold">
              ✅ Seller has confirmed the trade.
            </p>
          )}

        {/* Report button when both confirmed and pending_release */}
        {bothConfirmed(selectedPost) &&
          selectedPost.tradeStatus === "pending_release" && (
            <button
              onClick={() => {
                console.log(
                  "Selected post ID before opening modal:",
                  selectedPost
                );
                setSelectedPostId(selectedPost._id);

                setShowReportModal(true);
              }}
              className="mt-3 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Report
            </button>
          )}

        {/* Buy */}
        {userId && ownerId !== userId && (
          <>
            {selectedPost.avaliable ? (
              <button
                className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleBuy(selectedPost._id)}
                disabled={isProcessing}
              >
                Buy Now
              </button>
            ) : (
              <button
                className="mt-4 w-full py-2 rounded-xl bg-gray-500 text-white cursor-not-allowed"
                disabled
              >
                Not Available
              </button>
            )}
          </>
        )}

        {/* Request */}
        {userId && ownerId !== userId && (
          <button
            className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            onClick={handleToggleRequest}
            disabled={isProcessing}
          >
            {selectedPost.requests?.includes(userId)
              ? "Cancel Request"
              : "Send Request"}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(PostModal);
