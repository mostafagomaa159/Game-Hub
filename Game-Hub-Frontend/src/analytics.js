// src/analytics.js
import ReactGA from "react-ga4";

export const GA_MEASUREMENT_ID = "G-ZPV0E9BR2E";

export function initGA() {
  ReactGA.initialize(GA_MEASUREMENT_ID, { debug_mode: true });
}
