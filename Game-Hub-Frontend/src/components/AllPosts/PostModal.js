// src/components/AllPosts/PostModal.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SkeletonCard from "../common/SkeletonCard";
import MessageCard from "../common/MessageCard";
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
    const updated = await handleBuy(selectedPost);
    if (updated) setSelectedPost(updated);
  };

  const onConfirmClick = () => {
    setConfirmDisabled(true);
    handleConfirmTrade(selectedPost);
  };

  const onCancelClick = () => {
    setConfirmDisabled(false);
    setShowBuyMessage(false);
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

  const renderDisputeMessages = () => {
    const messages = [];

    if (selectedPost.tradeStatus === "disputed") {
      if (buyerReport && !sellerReport && currentUserIsOwner) {
        messages.push(
          <MessageCard
            key="buyer-report"
            sender="Buyer"
            message={`Reported you: ${buyerReport.reason}`}
            type="error"
            timestamp={new Date().toLocaleTimeString()}
            evidenceUrl={buyerReport.evidenceUrl}
          />
        );
      }
      if (sellerReport && !buyerReport && currentUserIsBuyer) {
        messages.push(
          <MessageCard
            key="seller-report"
            sender="Seller"
            message={`Reported you: ${sellerReport.reason}`}
            type="error"
            timestamp={new Date().toLocaleTimeString()}
            evidenceUrl={sellerReport.evidenceUrl}
          />
        );
      }
      if (buyerReport && sellerReport) {
        messages.push(
          <MessageCard
            key="both-report"
            sender="System"
            message="Both parties reported. Admin is reviewing the dispute."
            type="warning"
            timestamp={new Date().toLocaleTimeString()}
          />
        );
        messages.push(
          <MessageCard
            key="seller-report-detail"
            sender="Seller"
            message={`Reported: ${sellerReport.reason}`}
            type="error"
            timestamp={new Date().toLocaleTimeString()}
            evidenceUrl={sellerReport.evidenceUrl}
          />
        );
        messages.push(
          <MessageCard
            key="buyer-report-detail"
            sender="Buyer"
            message={`Reported: ${buyerReport.reason}`}
            type="error"
            timestamp={new Date().toLocaleTimeString()}
            evidenceUrl={buyerReport.evidenceUrl}
          />
        );
      }
    }

    return messages;
  };

  const renderTradeMessages = () => {
    const messages = [];

    if (isPendingOrPendingRelease) {
      if (
        currentUserIsOwner &&
        buyerId &&
        selectedPost.tradeConfirmations?.includes(buyerId) &&
        !bothConfirmedFlag
      ) {
        messages.push(
          <MessageCard
            key="buyer-confirmed"
            sender="System"
            message="Buyer has confirmed the trade, chat with them before you confirm."
            type="warning"
            timestamp={new Date().toLocaleTimeString()}
          />
        );
      }
      if (
        currentUserIsBuyer &&
        ownerId &&
        selectedPost.tradeConfirmations?.includes(ownerId) &&
        !bothConfirmedFlag
      ) {
        messages.push(
          <MessageCard
            key="seller-confirmed"
            sender="System"
            message="Seller has confirmed the trade, make sure to chat before confirming!"
            type="warning"
            timestamp={new Date().toLocaleTimeString()}
          />
        );
      }
      if (bothConfirmedFlag && (currentUserIsBuyer || currentUserIsOwner)) {
        messages.push(
          <MessageCard
            key="trade-success"
            sender="System"
            message="Trade Successful! You can report if there is a problem."
            type="success"
            timestamp={new Date().toLocaleTimeString()}
          />
        );
      }
    }

    if (showBuyMessage) {
      messages.push(
        <MessageCard
          key="buy-warning"
          sender="System"
          message="Don't confirm until you chat with seller in-website."
          type="error"
          timestamp={new Date().toLocaleTimeString()}
        />
      );
    }

    return messages;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 p-4 flex items-start border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex-1 break-words pr-4">
            {selectedPost.description}
          </h2>
          <button
            onClick={onClose}
            className="
      flex-shrink-0 p-1.5 rounded-full 
      bg-gray-100 hover:bg-gray-200 
      dark:bg-gray-800 dark:hover:bg-gray-700
      text-gray-500 hover:text-gray-700 
      dark:text-gray-400 dark:hover:text-gray-200
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      dark:focus:ring-offset-gray-900
      group
      mt-1
    "
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {accusedWarning && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {accusedWarning}
              </p>
            </div>
          )}

          {renderDisputeMessages()}

          {/* Post Content */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">
                <ArrowPathIcon className="w-3 h-3" />
                {selectedPost.server}
              </span>

              <button
                onClick={() => {
                  const profileId =
                    currentUserIsOwner && selectedPost.buyer
                      ? selectedPost.buyer._id
                      : selectedPost.owner._id;
                  handleShowProfile(profileId);
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                {currentUserIsOwner && selectedPost.buyer
                  ? "View Buyer"
                  : "View Seller"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  {selectedPost.price}
                  <span className="text-sm font-normal ml-1">
                    {selectedPost.price === 1 ? "Coin" : "Coins"}
                  </span>
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  isAvailable
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {isAvailable ? (
                  <>
                    <CheckIcon className="w-3 h-3" />
                    Available
                  </>
                ) : (
                  <>
                    <XMarkIcon className="w-3 h-3" />
                    Not Available
                  </>
                )}
              </span>
            </div>

            {selectedPost.owner && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {currentUserIsOwner && selectedPost.buyer
                    ? "Buyer"
                    : "Seller"}
                </p>
                <p className="text-sm font-medium">
                  {currentUserIsOwner && selectedPost.buyer
                    ? selectedPost.buyer.name ||
                      selectedPost.buyer.username ||
                      selectedPost.buyer.email ||
                      "Buyer"
                    : selectedPost.owner.name ||
                      selectedPost.owner.username ||
                      selectedPost.owner.email ||
                      "Seller"}
                </p>
              </div>
            )}

            {renderTradeMessages()}
          </div>
        </div>

        {/* Sticky Footer Buttons */}
        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {showBuyButton && (
            <button
              onClick={onBuyClick}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Buy Now
                </>
              )}
            </button>
          )}

          {showConfirmCancelButtons && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onConfirmClick}
                disabled={isProcessing || confirmDisabled}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                  isProcessing || confirmDisabled
                    ? "bg-green-400 dark:bg-green-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                <CheckIcon className="w-5 h-5" />
                Confirm
              </button>
              <button
                onClick={onCancelClick}
                disabled={isProcessing}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                  isProcessing
                    ? "bg-red-400 dark:bg-red-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                }`}
              >
                <XMarkIcon className="w-5 h-5" />
                Cancel
              </button>
            </div>
          )}

          {showReportButton && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <ShieldExclamationIcon className="w-5 h-5" />
              Report Issue
            </button>
          )}

          {showRequestButton && (
            <button
              onClick={() => handleToggleRequest(selectedPost)}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
              {selectedPost.requests?.includes(userId)
                ? "Cancel Request"
                : "Send Chat Request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PostModal);
