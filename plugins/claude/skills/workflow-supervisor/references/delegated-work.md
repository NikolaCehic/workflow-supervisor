# Delegated Work

Delegate only when independence, isolation, specialist capability, or parallelism earns its cost.

## Contract

The CLI accepts strict JSON. Validate it before launch:

```json
{
  "schema": "DelegationContractV1",
  "unit": "U1",
  "role": "implementer",
  "objective": "Make one bounded change.",
  "authority": {"grants": ["Modify only the declared write scope."], "source": ["The user request."]},
  "inputs": ["path/to/input.md"],
  "write_scope": ["src/file.js", "tests/file.test.js"],
  "expected_effect": "mutation_required",
  "acceptance": [{"id": "A1", "outcome": "The bounded behavior works.", "evidence": ["A deterministic check that observes it."]}],
  "checks": ["node --test tests/file.test.js"],
  "stop_conditions": ["Required authority or evidence is unavailable."]
}
```

`write_scope` is default-deny. A verifier requires `read_only` and an empty write scope. Use stable `A1`, `A2`, ... IDs. Workers cannot authorize themselves.

## Roles And Transport

- `implementer`: change declared surfaces; never self-approve.
- `verifier`: inspect without mutating the governed workspace.
- `repair`: address named findings without scope growth.
- `documenter`: update only requested state or deliverables.

Create only needed roles and use documented worker operations. Validate the contract and adapter first. Forward credentials only by exact authorized name. Native permissions and OS isolation are the prevention boundary when configured; post-run guards only detect covered changes. Audit after the worker and descendants stop.

## Accept A Result

- Under PASS, require every acceptance ID exactly once with PASS and evidence.
- Reject unknown, missing, duplicate, conditional, failed, blocked, or empty rows.
- Compare claims with required evidence; inspect artifacts or rerun relevant checks. Worker text is not proof.
- Reconcile claimed and guard-observed changes; reject unreported changes.
- Reject `mutation_required` PASS without mutation and any verifier mutation.
- Record unavailable browser, network, credential, live-service, visual, or human-review capability.

Risky fixes need a check that fails on the original symptom or an authorized substitute-evidence waiver. Repair only actionable rows; stop loops that add no evidence.

The machine result is `PASS`, `FAIL`, or `BLOCKED`. Final acceptance is the supervisor's evidence-backed decision; the CLI cannot prove model evidence is true.
