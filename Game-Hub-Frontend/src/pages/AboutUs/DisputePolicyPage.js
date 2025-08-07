import React, { useState } from "react";

const disputeSections = [
  {
    title: "📝 Overview",
    content:
      "We aim to protect both buyers and sellers by offering a fair and transparent dispute resolution system.",
  },
  {
    title: "❗ When to Open a Dispute",
    content: `• You paid but didn't receive the item/account.\n• You received a different item than what was listed.\n• Seller/buyer stopped communicating after payment.`,
  },
  {
    title: "📤 How to Start a Dispute",
    content:
      'Go to the relevant transaction and click "Open Dispute". You’ll be asked to submit video or screenshot evidence within 24 hours.',
  },
  {
    title: "📹 Evidence Requirements",
    content: `• Show the full chat and trade process clearly.\n• Include usernames, timestamps, and item/account delivery.\n• Video evidence is preferred and must be unedited.`,
  },
  {
    title: "🔍 Admin Review Process",
    content:
      "Our admin team will investigate and deliver a verdict within 48 hours. We may request additional proof before making a final decision.\n\nOur decision is final and cannot be appealed.",
  },
];

const DisputePolicyPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">⚖️ Dispute Policy</h1>

      <div className="space-y-4 text-lg">
        {disputeSections.map((section, index) => (
          <div
            key={index}
            className="border border-gray-400 dark:border-gray-600 rounded-lg"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full text-left p-4 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {section.title}
            </button>
            {openIndex === index && (
              <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap">
                <p>{section.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisputePolicyPage;
