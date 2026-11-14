import { useEffect, type ReactNode } from 'react';
import { isUnsafeNavigationTarget } from './navigationGuard.mjs';

type NavigationSecurityBoundaryProps = {
  children: ReactNode;
};

/**
 * Capture native and React Router link clicks before a router handler can
 * interpret a malformed URL. The diagnostic intentionally contains no URL,
 * query string or user-controlled value.
 */
export default function NavigationSecurityBoundary({ children }: NavigationSecurityBoundaryProps) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      const href = anchor?.getAttribute('href');
      // A generated export (Blob/data URL) is a download, not SPA navigation.
      // Let the browser's download handling run while still guarding anchors
      // that would navigate to an unsafe target.
      if (anchor?.hasAttribute('download')) return;
      if (!href || !isUnsafeNavigationTarget(href)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn('[navigation-security] blocked unsafe navigation target');
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return children;
}
