export function createAuthFreshnessGuard() {
  let sessionGeneration = 0;
  let sessionToken = null;
  let entitlementGeneration = 0;

  const captureSession = () => ({ sessionGeneration, sessionToken });
  const isSessionCurrent = (ticket) => Boolean(
    ticket
    && ticket.sessionGeneration === sessionGeneration
    && ticket.sessionToken === sessionToken
  );

  return {
    captureSession,
    isSessionCurrent,
    beginSession(nextToken) {
      sessionGeneration += 1;
      sessionToken = nextToken || null;
      entitlementGeneration += 1;
      return captureSession();
    },
    beginEntitlement(token) {
      entitlementGeneration += 1;
      return { sessionGeneration, sessionToken: token || null, entitlementGeneration };
    },
    isEntitlementCurrent(ticket) {
      return Boolean(
        ticket
        && ticket.sessionGeneration === sessionGeneration
        && ticket.sessionToken === sessionToken
        && ticket.entitlementGeneration === entitlementGeneration
      );
    },
  };
}
