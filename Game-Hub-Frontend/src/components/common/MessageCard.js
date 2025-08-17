import React from "react";
import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

const iconMap = {
  info: (
    <InformationCircleIcon className="w-5 h-5 text-blue-500 dark:text-blue-300" />
  ),
  success: (
    <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-300" />
  ),
  warning: (
    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-300" />
  ),
  error: <XCircleIcon className="w-5 h-5 text-red-500 dark:text-red-300" />,
};

const MessageCard = ({
  sender,
  message,
  type = "info",
  timestamp,
  evidenceUrl,
}) => {
  const typeColors = {
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    success: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300",
    warning:
      "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    error: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  const colorClass = typeColors[type] || typeColors.info;

  return (
    <div
      className={`p-3 rounded-xl shadow-sm border-l-4 border-gray-300 dark:border-gray-700 ${colorClass} transition-all duration-200 hover:scale-[1.02]`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          {iconMap[type]}
          <span className="font-semibold">{sender}</span>
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {timestamp}
          </span>
        )}
      </div>
      <p className="text-sm">{message}</p>
      {evidenceUrl && (
        <a
          href={evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Evidence"
          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg text-sm font-medium
               text-white bg-gradient-to-r from-blue-500 to-blue-600
               hover:from-blue-600 hover:to-blue-700
               dark:bg-gradient-to-r dark:from-blue-700 dark:to-blue-800
               dark:hover:from-blue-800 dark:hover:to-blue-900
               transition-all duration-200 shadow-md hover:shadow-lg"
        >
          🔗 View Evidence
        </a>
      )}
    </div>
  );
};

export default React.memo(MessageCard);
