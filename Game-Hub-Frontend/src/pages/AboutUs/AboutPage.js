import React, { useState } from "react";

const aboutSections = [
  {
    title: "🎮 Who We Are",
    content:
      "We are a passionate team of gamers and developers who created this marketplace to provide a safe, secure, and fair platform for trading in-game items, currency, and accounts. Our goal is to connect players from all over the world in a trusted trading environment.",
  },
  {
    title: "🚀 Our Mission",
    content:
      "To make online item trading transparent and secure by offering built-in buyer protection, anti-scam tools, and a professional dispute resolution system. We want every user to feel confident while buying or selling game assets.",
  },
  {
    title: "🔐 Trust & Safety",
    content:
      "We’re committed to providing a scam-free environment. All trades are logged, monitored, and protected by our rules and automated moderation tools. User reports are investigated quickly and fairly.",
  },
  {
    title: "🌐 Supported Games",
    content:
      "We support a growing list of online games. Whether you're trading MMO gold, skins, or rare accounts, you’ll find a place here. Let us know if you’d like your favorite game added!",
  },
  {
    title: "📬 Get in Touch",
    content: "Have questions, ideas, or feedback? Contact us through gmail!",
  },
];

const AboutPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">📘 About Us</h1>

      <div className="space-y-4">
        {aboutSections.map((section, index) => (
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

export default AboutPage;
