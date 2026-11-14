# Reproduce the public code workspace

The product has two repositories. Numerical contract fixtures originally lived
outside both repositories; their reviewed snapshot is now versioned in this
frontend's `fixtures/` directory. These eleven JSON files contain calculator
contracts and numerical golden cases, not textbook extracts or paid lessons.

## Checkout and fixture integrity

Create an empty workspace with this layout:

```text
tpl-workspace/
  WEBSITE/thepricinglab/                 # this repository
  Tools/pricinglibrary_rag_backend/      # backend repository
  fixtures/                             # restored from the reviewed snapshot
```

From the empty workspace, the current paired feature branches can be cloned with:

```shell
git clone --branch codex/2026-11-14-interview-lab https://github.com/dorian68/thepricinglab.git WEBSITE/thepricinglab
git clone --branch codex/2026-11-14-interview-lab https://github.com/dorian68/thepricinglibrary-rag-practice-engine.git Tools/pricinglibrary_rag_backend
cd WEBSITE/thepricinglab
node scripts/smoke_public_checkout.mjs --prepare-fixtures
npm ci
npm run typecheck
```

For an exact historical reproduction, check out the reviewed frontend and
backend commit SHAs instead of moving branch names. Record both SHAs together;
reverting only one application may produce an incompatible API pair. Checkout
into a separate empty workspace when comparing a previous version.

`--prepare-fixtures` checks every snapshot against `fixtures/manifest.json`, then
copies missing files into workspace `fixtures/`. It refuses to overwrite a
different existing contract. Running the script without that flag verifies an
already assembled workspace without writing files. Its path check prevents
accidental restoration outside the documented workspace layout.

When a canonical workspace fixture changes, review it, update the frontend
snapshot and regenerate the manifest's byte count and SHA-256 together. Do not
change a golden case merely to make an implementation pass. Run the corresponding
numerical and cross-runtime tests before committing the new snapshot.

## Public CI scope

`.github/workflows/quality.yml` assembles the same two-repository layout. The
backend checkout uses, in priority order:

1. The manual workflow's `backend_ref` input.
2. The repository variable `TPL_BACKEND_REF`.
3. `codex/2026-11-14-interview-lab`, the paired implementation branch.

Set `TPL_BACKEND_REF` to a reviewed backend commit for a reproducible release.
After integrating the feature, deliberately update that ref/default; do not let
an unrelated backend branch become an implicit dependency. Publish the backend
commit before a frontend CI run that needs its new API or tests. The workflow's
checkout log records the selected commit.

The public gate runs these genuine checks:

- The eleven fixture checksums and the actual backend-source layout.
- Frontend lint, typecheck and high-severity runtime dependency audit.
- Black-Scholes, payoff and yield-curve calculations, including Black-Scholes
  agreement between JavaScript and Python.
- Interview-to-tool context, safe authentication return, readable references,
  English/French fixed offline corrections and independent scenario references.
- The signed interview API tests against temporary SQLite with no private corpus.
- A real production build, bundle budget, bounded public course preview and
  absence of the local admin/testing mechanism in the built artifact.
- A source credential scan that reports file/line metadata without secret values.

Python dependencies are the explicitly pinned slim set in the workflow, tested
for the offline/hash-based mode. Torch, local LLM weights, Docker, external LLM
API keys and PDF-ingestion packages are not required by this gate. The frontend
uses its committed npm lockfile. The runtime audit does not certify development
toolchain dependencies as vulnerability-free.

The build check can also be run locally after `npm run build`:

```shell
node scripts/smoke_public_checkout.mjs --check-build
npm run smoke:local-admin:production
```

## What is deliberately absent from a public checkout

Full private French lessons, the source corpus, local account databases, provider
credentials and commercial product bundles are not included. A missing private
lesson or Starter Kit bundle must remain unavailable; the application must not
replace it with invented paid content or a claimed purchase. The original
English Interview Lab and deterministic calculators can be tested without those
private materials. Local testing access never grants production access.

Public source/offline CI is therefore a code gate, not a commercial release
verdict. Before selling the complete product, the operator still needs the
private lesson quality and entitlement checks, reviewed content rights and legal
identity, verified product artifacts, real deployed identity/payment/webhook and
refund acceptance, deployment/rollback evidence and independent Business Client
Mystère acceptance. These checks must run with their real dependencies and must
not be marked PASS merely because public CI is green.

Do not substitute `npm run audit:technical` for this public gate: that historical
aggregate also expects the wider private product workspace and its delivery
artifacts. Keep using the full aggregate in the appropriate private validation
environment; its additional requirements have not been waived.

## Paired rollback checkpoint

The validated local interview pilot is recorded by the same immutable tag name,
`tpl-interview-pilot-2026-11-14`, in both repositories. Restore that tag in each
repository within a separate workspace, then prepare the fixtures as above. The
tag identifies source code; private content and activity databases are managed
separately. Details and scope are in `docs/INTERVIEW_LAB_CHECKPOINT.json`.
