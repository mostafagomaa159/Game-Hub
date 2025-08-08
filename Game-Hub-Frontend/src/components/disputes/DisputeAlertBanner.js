import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useSocket } from "../context/SocketContext";
import Countdown from "./Countdown";

const DisputeAlertBanner = ({ trade, currentUser }) => {
  const [showBanner, setShowBanner] = useState(() => {
    const dismissed = localStorage.getItem(`banner-dismissed-${trade._id}`);
    return dismissed !== "true";
  });
  const [disputeDetails, setDisputeDetails] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    if (!trade?.dispute) return;

    const isParticipant =
      String(trade.buyer._id) === String(currentUser._id) ||
      String(trade.seller._id) === String(currentUser._id);
    const isOtherParty =
      isParticipant &&
      !trade.dispute.reports?.some(
        (r) => String(r.reporter) === String(currentUser._id)
      );

    if (isOtherParty && trade.dispute.status === "open") {
      setShowBanner(true);
      setDisputeDetails({
        reportedBy:
          trade.dispute.reports?.[0]?.role === "buyer"
            ? trade.buyer
            : trade.seller,
        expiresAt: trade.dispute.expiresAt,
      });
    }
  }, [trade, currentUser]);

  useEffect(() => {
    if (!socket) return;

    const handleDisputeCreated = (data) => {
      if (data.tradeId === String(trade._id)) {
        setShowBanner(true);
        localStorage.removeItem(`banner-dismissed-${trade._id}`);
      }
    };

    socket.on("dispute:created", handleDisputeCreated);
    socket.on("error", (err) => console.error("Socket error:", err));

    return () => {
      socket.off("dispute:created", handleDisputeCreated);
      socket.off("error");
    };
  }, [socket, trade?._id]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(`banner-dismissed-${trade._id}`, "true");
  };

  if (!showBanner || !disputeDetails) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-yellow-800">
            ⚠️ Dispute Reported by {disputeDetails.reportedBy.name}
          </h4>
          <p className="text-yellow-700">
            You have <Countdown targetDate={disputeDetails.expiresAt} /> to
            respond.
          </p>
          <p className="text-sm mt-2">
            {String(trade.seller._id) === String(currentUser._id)
              ? "If you don't respond, funds may be returned to the buyer."
              : "If you don't respond, funds may be released to the seller."}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-800"
          aria-label="Dismiss alert"
        >
          ×
        </button>
      </div>
    </div>
  );
};

DisputeAlertBanner.propTypes = {
  /* ... */
};

export default DisputeAlertBanner;
