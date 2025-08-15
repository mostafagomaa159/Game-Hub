import React, { useState } from "react";

const contactSections = [
  {
    title: "🕓 Support Hours",
    content: "Our support team is available 24/7 through live chat and email.",
  },
  {
    title: "💬 Live Chat",
    content:
      "For instant assistance, click on the “Help” icon at the bottom-right of the screen to connect with a support agent.",
  },
  {
    title: "📧 Email Support",
    content: `You can reach us anytime via email:

• General Support: Game-HubPro@gmail.com  
`,
  },
  {
    title: "📍 Company Info",
    content: `Online Marketplace Inc.  
34 Virtual Trade Ave,  
Gaming City, GC 10101`,
  },
];

const ContactPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-center">📞 Contact Us</h1>

      <div className="space-y-4">
        {contactSections.map((section, index) => (
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

export default ContactPage;
