import React, { useState } from "react";

const terms = [
  {
    icon: "🔞",
    question: "1. Age Requirement",
    answer: "You must be at least 16 years old to use this application.",
  },
  {
    icon: "🛡️",
    question: "2. Responsibility for Content",
    answer:
      "You are responsible for all content you post. Do not post illegal, offensive, or misleading information.",
  },
  {
    icon: "🎮",
    question: "3. App Purpose",
    answer:
      "This app is for listing and discussing in-game items only. We do not support or process any in-game transactions.",
  },
  {
    icon: "💸",
    question: "4. Real Money Transactions",
    answer:
      "Any real money transactions are done at your own risk. We do not act as a middleman and are not liable for disputes.",
  },
  {
    icon: "🚫",
    question: "5. Fraud and Abuse",
    answer:
      "Users who engage in fraud, spam, or abuse will be banned without notice.",
  },
  {
    icon: "🗑️",
    question: "6. Removal Rights",
    answer:
      "We reserve the right to remove any listings or users that violate these terms or the spirit of fair use.",
  },
];

const TermsOfUsePage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">📜 Terms of Use</h1>

      <div className="space-y-4">
        {terms.map((term, index) => (
          <div
            key={index}
            className="border border-gray-400 dark:border-gray-600 rounded-lg"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full text-left p-4 font-semibold flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="text-2xl">{term.icon}</span>
              <span>{term.question}</span>
            </button>
            {openIndex === index && (
              <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <p>{term.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsOfUsePage;
