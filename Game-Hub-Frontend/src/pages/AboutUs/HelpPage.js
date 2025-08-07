import React, { useState } from "react";

const helpSections = [
  {
    title: "🆘 Need Immediate Help?",
    content: `If you're facing a problem with your order, trade, or account, please use the in-platform support tools for the fastest response:

- Click the 🟦 “Help” button in the bottom-right corner.
- Open a live chat session with our support agents.
- Or submit a ticket through the Help Center form.`,
  },
  {
    title: "📹 Didn’t Receive Your Item?",
    content: `If you paid but didn’t get your in-game item:

- Go to your active chat with the seller.
- Click 🟥 "Item Not Received".
- This will start a dispute where both sides must provide video proof.`,
  },
  {
    title: "🔐 Account Issues",
    content: `Forgot your password or can’t access your account? Use the Password Reset feature on the login page. For locked accounts or suspicious activity, contact support via live chat or email.`,
  },
  {
    title: "📤 Uploading Video Evidence",
    content: `During disputes, you must provide video evidence. Make sure it:

- Shows the full screen and entire trade process.
- Clearly displays usernames, server names, and item transfer.
- Is uploaded to Google Drive, Dropbox, or YouTube (unlisted).`,
  },
  {
    title: "📧 Still Need Help?",
    content: `If you didn’t find what you need here, feel free to reach out directly:

- Email us at support@yourdomain.com
- Or message us on Live Chat (available 24/7)`,
  },
];

const HelpPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">📖 Help Center</h1>

      <div className="space-y-4">
        {helpSections.map((section, index) => (
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

export default HelpPage;
