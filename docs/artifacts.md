# Artifacts

Workflow Supervisor does not require a document set. Artifacts exist only when they reduce resume risk, provide a machine contract, or preserve evidence for a real consumer.

## Route Defaults

| Route | Default artifact |
|---|---|
| `direct` | None |
| `tracked` | Inline state; optionally one `.workflow/LEDGER.md` |
| `delegated` | One JSON contract per worker; the JSON result may be retained when another step consumes it |

Do not recreate the 0.x catalog of specifications, worker maps, acceptance matrices, decision logs, repair tickets, and publication checklists by default. Add a project-native issue, ADR, runbook, or deliverable only when the user requests it or a downstream workflow requires it.

## Local Workflow Directory

Recommended local names:

```text
.workflow/
  LEDGER.md
  contracts/
    U1-implementer.json
    U1-verifier.json
  reports/
    U1-implementer.json
    U1-verifier.json
```

The CLI does not create these state files for you. Project-scope installation adds `.workflow/` to `.gitignore` when the project does not already ignore it. Keep workflow state untracked unless the user explicitly makes it a deliverable.

## Compact Ledger

Use one ledger only when several outcomes or a pause make resume state valuable.

```yaml
- id: U1
  source: docs/retry-policy.md
  scope: src/retry.js and focused tests
  outcome: retries stop at the documented limit
  check: node --test tests/retry.test.js
  status: active
  changes: []
  evidence: []
  blocker_or_next: implement the bounded change
```

Allowed statuses are `pending`, `active`, `pass`, `fail`, and `blocked`. Keep one active unit unless mutation surfaces are proven disjoint. Before a pause, record the blocker and exact next action; do not copy full transcripts.

## Delegation Contract

New delegated work uses strict JSON `DelegationContractV1`:

```text
.workflow/contracts/<unit>-<role>.json
```

The contract owns objective, authority provenance, inputs, write scope, expected effect, acceptance outcomes, checks, and stop conditions. It does not own the worker prompt or wrapper report fields.

Validate before execution:

```bash
workflow-supervisor validate-contract .workflow/contracts/U1-implementer.json --json
```

`DossierV1` files under `.workflow/dossiers/` are legacy migration inputs. Preserve them only while an existing integration still depends on `validate-dossier` or `delegate --dossier`.

## Worker Result And Report

`WorkerResultV1` is untrusted compact model output. `WorkerReportV1` is the wrapper-normalized result printed to stdout.

If a workflow needs durable evidence, redirect stdout explicitly:

```bash
workflow-supervisor delegate \
  --agent codex \
  --role verifier \
  --unit U1 \
  --cwd . \
  --contract .workflow/contracts/U1-verifier.json \
  > .workflow/reports/U1-verifier.json
```

Shell redirection is owned by the caller, not the delegated worker. The file is opened before the CLI starts and the final JSON is written after the worker mutation snapshot, so it is not worker-mutation evidence. Prefer capturing stdout in the supervising process and persisting it only after checking the exit code and JSON status.

Do not treat a retained JSON report as trusted merely because it exists. Check the command exit code, top-level status, guard warnings, role violations, and the acceptance evidence.

## Install Artifacts

Every managed target contains:

```text
<skill-target>/
  .workflow-skills-install.json
  WORKFLOW_SKILL_PACK.md
  workflow-supervisor/
    SKILL.md
    agents/openai.yaml
    references/
```

The manifest records package version, agent, scope, canonical target, project ownership when applicable, `.workflow/` ignore ownership, installed time, and skill checksum. `doctor` compares the manifest with both installed content and current package source.

Do not edit managed files in place if you expect normal upgrade or uninstall. Back up an intentional customization, then use `--force` only after review.

## Portable Context

`emit-context` produces a standalone Markdown artifact for an agent that cannot discover a skill folder:

```bash
workflow-supervisor emit-context --agent generic --profile direct --out AGENTS.md
```

The selected profile embeds only its route reference. `--include-references` embeds every reference and intentionally increases context size. Generated context grants no authority and does not create an automated worker transport.

## Uninstall Retention

Uninstall removes only manifest-owned install content. For project scope:

- an empty installer-created `.workflow/` directory can be removed
- the installer-added ignore entry can be removed when no other project install needs it
- non-empty `.workflow/` state and its ignore coverage are retained
- pre-existing ignore coverage is never claimed as installer-owned

Review retained state manually. Uninstall does not delete user-authored contracts, ledgers, reports, or deliverables.
