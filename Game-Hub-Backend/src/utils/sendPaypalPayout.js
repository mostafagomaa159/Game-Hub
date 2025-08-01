// utils/sendPaypalPayout.js
const axios = require("axios");

async function sendPaypalPayout(amount, recipientEmail) {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await axios.post(
    "https://api.sandbox.paypal.com/v1/oauth2/token",
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const accessToken = tokenRes.data.access_token;

  const batchId = "batch-" + Date.now();
  const payoutRes = await axios.post(
    "https://api.sandbox.paypal.com/v1/payments/payouts",
    {
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: "You've received a payment",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: amount.toFixed(2),
            currency: "USD",
          },
          receiver: recipientEmail,
          note: "Withdrawal from your account",
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return payoutRes.data;
}

module.exports = sendPaypalPayout;
