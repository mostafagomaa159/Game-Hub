// src/hooks/usePageTracking.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag || ReactGA) {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname + location.search,
      });
      console.log("GA4 page_view sent for", location.pathname);
    }
  }, [location]);
}
