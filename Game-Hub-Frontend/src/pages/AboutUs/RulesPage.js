import React, { useState } from "react";

const rules = [
  {
    question: "🚫 What are the penalties for scammers?",
    answer:
      "Penalties include:\n\n🟥 First offense: Instant account ban.\n🟥 Second offense: Loss of all wallet balance and permanent blacklist.\n\nWe do not tolerate any form of fraud.",
  },
  {
    question: "🔴 Is trading outside the website allowed?",
    answer:
      "Absolutely not.\n\nAny attempt to trade, communicate, or share payment details outside the website is strictly prohibited.\n\nViolations may lead to account suspension or ban.\n\nAlways trade using the in-platform chat and payment system.",
  },
  {
    question: "💸 How much commission does the platform take?",
    answer:
      "🟡 The platform charges a flat 10% commission from each completed transaction.\n\n🔴 This fee is non-refundable, even in disputes.",
  },
  {
    question: "⚠️ Who is responsible in case of loss or theft?",
    answer:
      "User Responsibility Disclaimer:\n\nAll users are 100% responsible for their trades, accounts, and actions.\n\nThe platform is not responsible for any loss caused by scams or mistakes.\n\n🟡 Always double-check before finalizing a deal.",
  },
];

const RulesPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">
        📏 Marketplace Rules
      </h1>

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div
            key={index}
            className="border border-gray-400 dark:border-gray-600 rounded-lg"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full text-left p-4 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition whitespace-pre-wrap"
            >
              {rule.question}
            </button>
            {openIndex === index && (
              <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap">
                <p>{rule.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RulesPage;
