declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const fireAccountCreationConversion = () => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: "AW-17728054478/M2sZCMvPx78bEM7JsoVC",
    transaction_id: "",
  });
};

export {}; // Ensure this file is treated as a module.
