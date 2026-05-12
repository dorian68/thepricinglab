import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Native-like scroll behavior:
 * - PUSH/REPLACE (new navigation): scroll to top
 * - POP (back/forward): let the browser restore the previous scroll position
 * - Hash links (#section): scroll to the target element
 */
const ScrollToTop = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();

  // Disable browser's automatic scroll restoration so we control it,
  // but only for PUSH/REPLACE. For POP we manually restore from sessionStorage.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Save scroll position per history entry before unloading it
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
    };
    window.addEventListener("beforeunload", saveScroll);
    return () => {
      saveScroll();
      window.removeEventListener("beforeunload", saveScroll);
    };
  }, [key]);

  useEffect(() => {
    // Hash navigation -> scroll to anchor
    if (hash) {
      const el = document.getElementById(hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    if (navigationType === "POP") {
      // Restore previous scroll position on back/forward
      const saved = sessionStorage.getItem(`scroll:${key}`);
      const y = saved ? parseInt(saved, 10) : 0;
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      return;
    }

    // PUSH or REPLACE: new page -> top
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollToTop;
