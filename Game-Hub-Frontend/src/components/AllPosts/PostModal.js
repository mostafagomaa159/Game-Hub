import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SkeletonCard from "../common/SkeletonCard";

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
  bothConfirmed,
  userAlreadyConfirmed,
  modalRef,
  setSelectedPost,
  onClose,
  loading,
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <SkeletonCard variant="modal" />
      </div>
    );
  }

  const tradeTx = selectedPost.tradeTransaction;
  const buyerReport = tradeTx?.dispute?.buyerReport;
  const sellerReport = tradeTx?.dispute?.sellerReport;
  const buyerId = selectedPost.buyer?._id || selectedPost.buyer;
  const ownerId = selectedPost.owner?._id || selectedPost.owner;

  const currentUserIsBuyer =
    userId && buyerId && String(buyerId) === String(userId);
  const currentUserIsOwner =
    userId && ownerId && String(ownerId) === String(userId);
  const bothConfirmedFlag =
    typeof bothConfirmed === "function" && bothConfirmed(selectedPost);
  const isPending = selectedPost.tradeStatus === "pending";
  const isPendingOrPendingRelease =
    isPending || selectedPost.tradeStatus === "pending_release";
  const alreadyConfirmed =
    typeof userAlreadyConfirmed === "function" && userAlreadyConfirmed();
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
    (selectedPost.tradeStatus === "pending_release" ||
      selectedPost.tradeStatus === "disputed") &&
    (currentUserIsOwner || currentUserIsBuyer);
  const showRequestButton =
    userId && !currentUserIsOwner && (!bothConfirmedFlag || showReportButton);

  const onBuyClick = async () => {
    setShowBuyMessage(true);
    const updated = await handleBuy(selectedPost); // receives updated post
    if (updated) setSelectedPost(updated); // update modal live
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
      navigate("/login");
      return;
    }
    setSelectedPostId(null);
    navigate(`/profile/${ownerId}`);
  };

  let accusedWarning = null;
  if (selectedPost.dispute?.sellerReport && currentUserIsBuyer) {
    accusedWarning = "⚠️ You have been reported by the seller!";
  }
  if (selectedPost.dispute?.buyerReport && currentUserIsOwner) {
    accusedWarning = "⚠️ You have been reported by the buyer!";
  }

  const ReportCard = ({ title, reason, evidenceUrl }) => (
    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col gap-2 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-red-500 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-8-4a1 1 0 00-.993.883L9 7v4a1 1 0 001.993.117L11 11V7a1 1 0 00-1-1zm0 8a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-semibold text-red-600">{title}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-medium">Reason:</span> {reason}
      </p>
      {evidenceUrl && (
        <a
          href={evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 hover:text-blue-800 transition-all duration-200 shadow-sm"
        >
          🔗 View Evidence
        </a>
      )}
    </div>
  );

  const StatusMessage = ({ icon, message, colorClass }) => (
    <p className={`mt-3 font-semibold flex items-center gap-2 ${colorClass}`}>
      {icon} {message}
    </p>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-darkCard text-black dark:text-white rounded-2xl shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto animate-fadeIn"
      >
        {accusedWarning && (
          <div className="sticky top-0 z-20 bg-red-600 text-white font-semibold text-center px-4 py-3 rounded-t-2xl shadow-md">
            {accusedWarning}
          </div>
        )}

        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
          >
            &times;
          </button>

          {/* ===== Dispute / Report Section ===== */}
          {selectedPost.tradeStatus === "disputed" && (
            <div className="mt-3 space-y-4">
              {buyerReport && !sellerReport && currentUserIsOwner && (
                <ReportCard
                  title="Buyer Report"
                  reason={buyerReport.reason}
                  evidenceUrl={buyerReport.evidenceUrl}
                />
              )}
              {sellerReport && !buyerReport && currentUserIsBuyer && (
                <ReportCard
                  title="Seller Report"
                  reason={sellerReport.reason}
                  evidenceUrl={sellerReport.evidenceUrl}
                />
              )}
              {buyerReport && sellerReport && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 shadow-lg border border-yellow-300 animate-fadeIn space-y-3">
                  <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                    ⚖️ Both parties reported
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Admin is reviewing the dispute. You can check the reasons
                    and evidence below.
                  </p>
                  <div className="space-y-3">
                    <ReportCard
                      title="Seller Report"
                      reason={sellerReport.reason}
                      evidenceUrl={sellerReport.evidenceUrl}
                    />
                    <ReportCard
                      title="Buyer Report"
                      reason={buyerReport.reason}
                      evidenceUrl={buyerReport.evidenceUrl}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== Post Content ===== */}
          <h2 className="text-2xl font-bold mb-2">
            {selectedPost.description}
          </h2>
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

          {/* Confirmation / Trade messages */}
          {isPendingOrPendingRelease && (
            <>
              {currentUserIsOwner &&
                buyerId &&
                selectedPost.tradeConfirmations?.includes(buyerId) &&
                !bothConfirmedFlag && (
                  <StatusMessage
                    icon="✅"
                    message="Buyer has confirmed the trade, Chat with him before you Confirm Trade"
                    colorClass="text-red-500"
                  />
                )}
              {currentUserIsBuyer &&
                ownerId &&
                selectedPost.tradeConfirmations?.includes(ownerId) &&
                !bothConfirmedFlag && (
                  <StatusMessage
                    icon="✅"
                    message="Seller has confirmed the trade, Make Sure to Send Request to Him before you Confirm Trade!"
                    colorClass="text-red-500"
                  />
                )}
              {bothConfirmedFlag &&
                (currentUserIsBuyer || currentUserIsOwner) && (
                  <StatusMessage
                    icon="🎉"
                    message="Trade Successful! Feel free to report if there is a problem."
                    colorClass="text-blue-600"
                  />
                )}
            </>
          )}

          {showBuyMessage && (
            <StatusMessage
              icon="⚠️"
              message="Please Don't confirm till you chat with seller and meet with him in-game."
              colorClass="text-red-600"
            />
          )}

          {/* ===== Buttons ===== */}
          <div className="mt-4 space-y-2">
            {showBuyButton && (
              <button
                className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
                  className={`w-full py-2 rounded-xl text-white shadow-md hover:shadow-lg transition-all duration-200 ${
                    isProcessing || confirmDisabled
                      ? "bg-green-400"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  }`}
                >
                  Confirm Trade
                </button>
                <button
                  onClick={onCancelClick}
                  disabled={isProcessing}
                  className={`w-full py-2 rounded-xl text-white shadow-md hover:shadow-lg transition-all duration-200 ${
                    isProcessing
                      ? "bg-red-400"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  }`}
                >
                  Cancel Trade
                </button>
              </>
            )}

            {showReportButton && (
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                Report
              </button>
            )}

            {showRequestButton && (
              <button
                className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
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
    </div>
  );
};

export default React.memo(PostModal);
