import React, { useState } from "react";

const privacySections = [
  {
    title: "📌 What We Collect",
    content:
      "We respect your privacy. This app collects only minimal data required to operate — such as your email or username when signing in.",
  },
  {
    title: "🔐 No Sensitive Data",
    content:
      "We do not collect, store, or share any sensitive personal information like ID documents, phone numbers, or addresses.",
  },
  {
    title: "🗂️ Uploaded Content",
    content:
      "Any content you upload — such as item listings or chat messages — is stored securely using trusted Firebase services.",
  },
  {
    title: "🚫 No Selling or Sharing",
    content:
      "We do not sell or share your information with any third parties. Your data is used solely to support your experience on our platform.",
  },
  {
    title: "💬 Private Messaging",
    content:
      "If you choose to contact other users, your communication remains private and is not monitored by us.",
  },
  // {
  //   title: "🗑️ Account/Data Deletion",
  //   content:
  //     "You can request to delete your account or data at any time by contacting us at: your-support-email",
  // },
  {
    title: "📅 Policy Updates",
    content:
      "This privacy policy may be updated from time to time. Please revisit this page periodically to stay informed of any changes.",
  },
];

const PrivacyPolicyPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">🔒 Privacy Policy</h1>

      <div className="space-y-4 text-lg">
        {privacySections.map((section, index) => (
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

export default PrivacyPolicyPage;
