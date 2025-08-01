const paypal = require("@paypal/payouts-sdk");

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  // For live mode use: new paypal.core.LiveEnvironment(...)
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
