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
  {
    question: "⚠️ How to do safe trade?",
    answer:
      "🔴 Buyer : Send Chat Request and Buy Now, you will find your request at My Requests Section send Message to Seller \n\n🟡 Seller : will get 2 options Confirm Trade / Cancel Trade he have to choose from , also will get Chat Request from the buyer at Request Section\n\n🔴🟡 Seller and Buyer : Have to Chat together in Website chat you both have to mention your chars name , arrange a meeting date to trade item in-game\n\n🔴🟡 Seller and Buyer : When you both are in-game and ready to Trade the item , you both have to Start a video screen recorder , this video should show your both chars name , then you both have to go Click Confirm Trade Button in Website, once you both Confirm Buyer Coins will be detucted and there will be 24h till Seller get the coins into his balance\n\n🔴🟡 Seller and Buyer : if you traded the item fine so no1 have to report\n\n🟡 Seller : you will get your coins into your account within 24h if there is no reports\n\n🔴 Buyer : if seller didn't give you the item in-game there is report option that you share your recorded video URL,you have to do it within 24h, if we don't recieve from you any report so Coins will go to Seller! ,make sure to upload it into Youtbue and make it Public , so we can review it, \n\n🟡 Seller : if you got reported by the buyer so you will have to defend yourself by submitting your report with URL video within 24h\n\n🏧 Transaction will be appending till admin review both Reports and decide to who go Coins",
  },
  {
    question: "💰 Deposit Fees",
    answer: (
      <>
        When depositing money to buy{" "}
        <span className="font-bold text-blue-600">Coins</span>, users may incur
        fees charged by their{" "}
        <span className="font-semibold text-green-600">bank</span> or{" "}
        <span className="font-semibold text-yellow-600">PayPal</span>.
        <span className="font-bold text-purple-600">
          The website owner does not pay any fees
        </span>{" "}
        for deposits, Coins will arrive into your bank account within 3-5 work
        days after admin approvement,if you choose paypal payment will arrive
        way faster after admin approvement
      </>
    ),
  },
  {
    question: "🏧 Withdraw Fees",
    answer: (
      <>
        When withdrawing funds from the website, users may incur fees charged by
        their <span className="font-semibold text-green-600">bank</span> or{" "}
        <span className="font-semibold text-yellow-600">PayPal</span>.
        <span className="font-bold text-purple-600">
          The website owner does not pay any withdrawal fees.
        </span>
        for withdraws Money will arrive to your bank account within 3-5 work
        days after admin approvement,if you choose paypal payment will arrive
        way faster after admin approvement
      </>
    ),
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
