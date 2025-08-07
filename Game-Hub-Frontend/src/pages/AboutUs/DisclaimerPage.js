import React, { useState } from "react";
import {
  AlertTriangle,
  Gamepad,
  Shield,
  WifiOff,
  Globe,
  Lock,
  Server,
} from "lucide-react"; // Icons from Lucide

const disclaimers = [
  {
    question: "Unofficial Tool",
    answer:
      "This application is an unofficial tool created by fans of online MMORPG games.",
    icon: <Gamepad className="inline-block mr-2 w-5 h-5" />,
  },
  {
    question: "No Affiliation with Any Games",
    answer:
      "It is not affiliated with, endorsed, or sponsored by any games of its developers or publishers.",
    icon: <Shield className="inline-block mr-2 w-5 h-5" />,
  },
  {
    question: "Trademarks and Game Content",
    answer:
      "All trademarks and game content remain the property of their respective owners.",
    icon: <Globe className="inline-block mr-2 w-5 h-5" />,
  },
  {
    question: "No Connection to Game Servers",
    answer:
      "This app does not connect to game servers or access user accounts. It only provides a platform for players to communicate and exchange information at their own discretion.",
    icon: <WifiOff className="inline-block mr-2 w-5 h-5" />,
  },
  {
    question: "Use at Your Own Risk",
    answer:
      "Use of this app is entirely at your own risk. The creators of this app are not responsible for any losses, scams, or actions taken by third parties.",
    icon: (
      <AlertTriangle className="inline-block mr-2 w-5 h-5 text-yellow-500" />
    ),
  },
  {
    question: "Compliance with Game Terms",
    answer:
      "By using this app, you agree to comply with the Terms of Service of the games you play, and acknowledge that this platform is independently operated.",
    icon: <Lock className="inline-block mr-2 w-5 h-5" />,
  },
  {
    question: "Server Listings Disclaimer",
    answer:
      "Please note: This app is not affiliated with any game server. All server names are listed by users for reference only.",
    icon: <Server className="inline-block mr-2 w-5 h-5" />,
  },
];

const DisclaimerPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">⚠️ Disclaimer</h1>

      <div className="space-y-4">
        {disclaimers.map((item, index) => (
          <div
            key={index}
            className="border border-gray-400 dark:border-gray-600 rounded-lg"
          >
            <button
              onClick={() => toggle(index)}
              className="w-full text-left p-4 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center"
            >
              {item.icon}
              {item.question}
            </button>
            {openIndex === index && (
              <div className="p-4 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisclaimerPage;
