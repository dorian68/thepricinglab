# Frontend Agent Instructions

Follow the root two-agent protocol.

Technical RL priority:
- Treat the backend API and CLI as the source of truth.
- Keep frontend flows aligned with implemented routes and audited tool outputs.
- Do not invent pricing, market-data, or agent results in UI state.

Business Client Mystere priority:
- Evaluate first-run clarity, trust, and willingness to pay.
- Make dense operational screens scannable and repeatable.
- Surface provenance, limitations, and next actions wherever a user relies on agent output.

Production guard:
- Paid or sensitive agent actions must respect backend entitlement, approval, and audit constraints.
