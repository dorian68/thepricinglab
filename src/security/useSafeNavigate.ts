import { useCallback } from 'react';
import { useNavigate, type NavigateFunction, type NavigateOptions, type To } from 'react-router-dom';
import { isUnsafeNavigationTarget } from './navigationGuard.mjs';

function targetToString(target: To): string {
  if (typeof target === 'string') return target;
  return `${target.pathname ?? ''}${target.search ?? ''}${target.hash ?? ''}`;
}

/** A guarded useNavigate drop-in for all programmatic SPA navigation. */
export function useSafeNavigate(): NavigateFunction {
  const navigate = useNavigate();

  const safeNavigate = useCallback((target: To | number, options?: NavigateOptions) => {
    if (typeof target === 'number') return navigate(target);
    if (isUnsafeNavigationTarget(targetToString(target))) {
      console.warn('[navigation-security] blocked unsafe programmatic navigation target');
      return;
    }
    return navigate(target, options);
  }, [navigate]);

  return safeNavigate as NavigateFunction;
}
