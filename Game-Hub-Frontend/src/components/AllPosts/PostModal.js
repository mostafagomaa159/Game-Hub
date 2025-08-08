// src/components/AllPosts/PostModal.js
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
  setReportUrl,
  isOwner,
  isBuyer,
  userAlreadyConfirmed,
  bothConfirmed,
  modalRef,
  hasConfirmed,
}) => {
  const dispute = selectedPost.dispute || {};
  const disputeStatus = dispute.status || "none";

  // Determine if user can report (only buyers or sellers, and if no active dispute or if user not reported yet)
  const userIsParticipant =
    userId &&
    (userId === selectedPost.buyer?._id || userId === selectedPost.seller?._id);

  const userHasReported = dispute.reports?.some(
    (r) => String(r.reporter) === String(userId)
  );

  const canReport =
    userIsParticipant &&
    (disputeStatus === "none" ||
      (disputeStatus === "open" && !userHasReported));

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

        {/* Dispute info */}
        {disputeStatus !== "none" && (
          <div className="my-4 p-3 border rounded bg-yellow-100 dark:bg-yellow-900">
            <p className="font-semibold mb-1">
              Dispute Status:{" "}
              <span className="capitalize">
                {disputeStatus.replace("_", " ")}
              </span>
            </p>

            {dispute.reports?.length > 0 && (
              <div className="mb-2 max-h-24 overflow-y-auto text-sm">
                <p className="font-semibold">Reports:</p>
                <ul className="list-disc ml-5">
                  {dispute.reports.map((report, idx) => (
                    <li key={idx}>
                      <strong>{report.role}:</strong> {report.reason}{" "}
                      <a
                        href={report.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Evidence
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {dispute.adminDecision && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p>
                  Admin decision:{" "}
                  <strong>{dispute.adminDecision.winner}</strong> won the
                  dispute.
                </p>
                <p>Note: {dispute.adminDecision.adminNote || "No notes"}</p>
              </div>
            )}
          </div>
        )}

        {/* Trade Buttons */}
        {selectedPost.tradeStatus === "pending" &&
          (isOwner || isBuyer) &&
          !userAlreadyConfirmed(selectedPost) && (
            <>
              <button
                onClick={handleConfirmTrade}
                disabled={isProcessing || disputeStatus === "open"}
                className={`mt-4 w-full py-2 rounded-xl text-white ${
                  isProcessing || disputeStatus === "open"
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Confirm Trade
              </button>

              <button
                onClick={handleCancelTrade}
                disabled={isProcessing || disputeStatus === "open"}
                className={`mt-2 w-full py-2 rounded-xl text-white ${
                  isProcessing || disputeStatus === "open"
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Cancel Trade
              </button>

              {hasConfirmed && canReport && (
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
          selectedPost.buyer &&
          selectedPost.tradeConfirmations?.includes(
            selectedPost.buyer._id || selectedPost.buyer
          ) && (
            <p className="mt-3 text-green-500 font-semibold">
              ✅ Buyer has confirmed the trade.
            </p>
          )}

        {selectedPost.tradeStatus === "pending" &&
          isBuyer &&
          selectedPost.owner &&
          selectedPost.tradeConfirmations?.includes(
            selectedPost.owner._id || selectedPost.owner
          ) && (
            <p className="mt-3 text-green-500 font-semibold">
              ✅ Seller has confirmed the trade.
            </p>
          )}

        {/* Report button for pending_release with both confirmed */}
        {userId &&
          bothConfirmed(selectedPost) &&
          selectedPost.tradeStatus === "pending_release" && (
            <button
              onClick={() => {
                setReportUrl("");
                setShowReportModal(true);
              }}
              className="mt-3 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Report
            </button>
          )}

        {/* Buy */}
        {userId && selectedPost.owner?._id !== userId && (
          <>
            {selectedPost.avaliable ? (
              <button
                className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleBuy(selectedPost._id)}
                disabled={isProcessing || disputeStatus === "open"}
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
        {userId && selectedPost.owner?._id !== userId && (
          <button
            className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
            onClick={handleToggleRequest}
            disabled={isProcessing || disputeStatus === "open"}
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
