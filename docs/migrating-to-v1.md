# Migrating To Workflow Supervisor v1

Workflow Supervisor 1.0 is the one-skill release. This guide covers the breaking changes from 0.x and the supported upgrade path.

The GitHub release and npm publication are separate distribution events. Before upgrading a production or shared workflow, verify that the source you install from actually reports `1.0.0`; a GitHub tag does not prove that npm has been updated.

## Why v1 Is Smaller

The 0.x pack exposed eight discoverable skills and a large dossier contract. That made strict workflows expressive, but it also made skill catalogs, routing, installation, and worker prompts larger than most tasks justified.

V1 keeps one discoverable skill and loads detail only for the selected route:

| Route | Use it for | Additional context or state |
|---|---|---|
| `direct` | One model can safely complete and verify the task now. | None. |
| `tracked` | Several bounded outcomes or work that must survive a pause. | One compact ledger. |
| `delegated` | Work where independent reasoning, isolation, specialist capability, or safe parallelism adds value. | One compact worker contract and one validated result. |

The default is `direct`. Invoking Workflow Supervisor no longer means that a ledger, dossier, role graph, or worker must be created.

## Breaking Changes At A Glance

| 0.x | v1 | Migration |
|---|---|---|
| Eight installed skills | One `workflow-supervisor` skill | Remove companion-skill invocations and install only the supervisor. |
| `lean_work_unit_runner` | `tracked` | Keep one compact ledger only when it earns its cost. |
| `strict_full_workflow` | `delegated`, `tracked`, or `direct` | Choose based on whether an independent worker is actually needed. |
| `planning_only` | `direct` or `tracked` | Plan in the current session; track only a resumable multi-outcome plan. |
| `DossierV1` | Compact `DelegationContractV1` | Rebuild generated contracts; do not mechanically rename the schema. |
| Skill-list selection during install or export | Profile selection | Select `direct`, `tracked`, or `delegated`; the profile chooses required references. |
| One invocation spelling assumed across hosts | Host-native explicit invocation | Use `$workflow-supervisor` in Codex, `/workflow-supervisor` for a direct Claude skill, or `/workflow-supervisor:workflow-supervisor` for the Claude plugin. |
| Generic target treated like an agent integration | Generic Markdown export only | Do not automate delegation through `generic`. |
| Node.js 18 baseline | Node.js 22 or newer | Upgrade CI, development, and consumer environments before adopting v1. |

## Replace Companion Skills

The removed 0.x discovery names are:

- `$acceptance-matrix`
- `$dossier-builder`
- `$loop-policy`
- `$source-corpus`
- `$work-unit`
- `$worker-roles`
- `$workflow-docs`

Keep the one supervisor, using the host-native invocation above. Move essential requirements into the task, one tracked ledger, or one delegated contract. Do not copy every old companion prompt into the supervisor; that recreates the context cost v1 is designed to remove.

Typical replacements:

| Old invocation | v1 replacement |
|---|---|
| `$work-unit` plus `$workflow-docs` for a bounded backlog | `tracked` route with one ledger |
| `$dossier-builder` plus `$worker-roles` for a worker | `delegated` route with one contract |
| `$acceptance-matrix` for ordinary direct work | Direct verification in the final result |
| `$acceptance-matrix` for delegated work | Structured acceptance rows in the delegation contract |
| `$loop-policy` for a simple failed check | One bounded repair and rerun |
| `$source-corpus` for ordinary repository inputs | Name controlling inputs directly in the task or contract |

## Route Migration

Do not map every old strict run to `delegated`.

1. Choose `direct` when the current model can complete and verify the work safely.
2. Choose `tracked` when the work needs bounded progress or resume state but not an independent worker.
3. Choose `delegated` only when independence, isolation, specialist capability, or safe parallelism materially improves the outcome.

Publication, credentials, destructive actions, production changes, external communication, and scope expansion still require explicit authority. A route never creates that authority.

## Contract Migration

`DossierV1` has many required orchestration and prompt fields. V1 replaces it with a compact delegated-worker contract. Contracts are strict JSON, reject unknown fields, and are limited to 64 KiB:

```json
{
  "schema": "DelegationContractV1",
  "unit": "U1",
  "role": "implementer",
  "objective": "Implement the bounded behavior.",
  "authority": {
    "grants": ["Modify the declared write scope."],
    "source": ["User request in the supervising task."]
  },
  "inputs": ["path/to/controlling-source.md"],
  "write_scope": ["src/feature.js", "tests/feature.test.js"],
  "expected_effect": "mutation_required",
  "acceptance": [
    {
      "id": "A1",
      "outcome": "The documented behavior is observable.",
      "evidence": ["Focused automated test."]
    }
  ],
  "checks": ["npm test -- --test-name-pattern feature"],
  "stop_conditions": ["Required authority or input is missing."]
}
```

Conceptual field mapping:

| `DossierV1` field | Compact contract field or action |
|---|---|
| `work_unit` | `unit` |
| `worker_role` | `role` |
| `objective` | `objective` |
| `authority` and `authority_source` | `authority.grants` and `authority.source` |
| `source_corpus` and `must_read` | `inputs` |
| `allowed_surfaces` | `write_scope` |
| `acceptance_matrix` | Structured `acceptance` rows with stable IDs, outcomes, and evidence |
| `required_commands_or_evidence` | `checks` |
| `stop_gates` | `stop_conditions` |
| worker names, display-role aliases, duplicated report-schema names, prompt text, and required empty sections | Remove |

Choose `expected_effect` explicitly:

- `mutation_required` when PASS requires a governed change
- `mutation_allowed` when a change is permitted but not required
- `read_only` for verification and other non-mutating work; `write_scope` must be empty

Validate a contract before launch with `workflow-supervisor validate-contract <path> --json`. The v1 CLI also accepts a valid `DossierV1` through `--dossier` or `--dossier-text`, converts it to the compact contract, and emits a deprecation warning. Treat that as a transition path, not a permanent format.

Worker output now crosses two validation layers. Codex and Claude Code receive `worker-result-transport-v1.schema.json`, a provider-intersection carrier whose fields are all required. Empty optional strings are normalized away, then the CLI applies the stricter canonical `WorkerResultV1` runtime rules for bounds, paths, uniqueness, status semantics, and exact acceptance coverage. Custom integrations must not treat provider-schema acceptance as final validation.

## Adapter And Export Compatibility

Automated delegation remains intentionally limited to local Codex and Claude Code CLIs. Test the installed CLI versions with the v1 diagnostics before relying on delegation.

The repository root is a Codex plugin through `.codex-plugin/plugin.json`. For Claude Code, the repository root is a marketplace through `.claude-plugin/marketplace.json`; its entry points to the actual plugin in `plugins/claude`. Direct Claude skill installs use `/workflow-supervisor`, while marketplace plugin installs use `/workflow-supervisor:workflow-supervisor`.

The Claude one-shot adapter disables skills and configured MCP servers but deliberately avoids `--bare`, which would bypass normal OAuth/keychain authentication. This preserves the expected authentication path; it does not guarantee that settings, hooks, or `CLAUDE.md` are absent.

`generic` remains useful for installing or exporting Markdown instructions to another environment. It does not gain a worker transport, permission mapping, structured-output guarantee, or mutation isolation. Build custom automation outside Workflow Supervisor unless and until a provider has a maintained adapter contract and tests.

## Upgrade Sequence

Automatic manifest migration supports the published Codex and Claude Code installs from `0.1.0` through `0.3.0`. Versions `0.1.0` through `0.2.0` used a different directory checksum, `0.1.0` used an older generated context, and pre-v1 project installs did not record whether `.gitignore` already existed. V1 verifies each format with its frozen rules before replacing it. Where old provenance cannot distinguish an absent `.gitignore` from an empty one, uninstall conservatively leaves an empty file rather than deleting it.

### Clean up v0.1.0 OpenCode and HermesAgent copies

Only `0.1.0` could install native copies for OpenCode and HermesAgent. V1 no longer supports those adapters, so `upgrade --agent all` intentionally means the current Codex and Claude Code targets and cannot remove `.opencode/skills` or `.hermes/skills`.

Before upgrading a `0.1.0` install that used `--agent all`:

1. Back up `.opencode/skills` and `.hermes/skills`, including their manifests and `WORKFLOW_SKILL_PACK.md` files.
2. Inspect each `.workflow-skills-install.json`. Continue only when it names package `workflow-supervisor`, version `0.1.0`, and the expected retired agent (`opencode` or `hermesagent`). Stop and preserve the directory if it contains intentional changes or unrelated skills.
3. While the exact old CLI is still available, remove each retired project target:

   ```bash
   npx --yes workflow-supervisor@0.1.0 uninstall --agent opencode --scope project --project /absolute/path/to/project
   npx --yes workflow-supervisor@0.1.0 uninstall --agent hermesagent --scope project --project /absolute/path/to/project
   ```

   For a user-scope `0.1.0` install, use the same commands with `--scope user` and omit `--project`.

The `0.1.0` uninstaller predates v1 ownership and drift protections. It removes the old eight named skill directories directly, so the backup and manifest review are mandatory. Do not use `--force`, `rm -rf`, or the pinned uninstaller on a directory whose ownership or local changes are uncertain.

Then continue with the supported Codex/Claude migration:

1. Record the current package version and installation source.
2. Save intentional local customizations outside installed skill directories.
3. Upgrade Node.js and CI to version 22 or newer.
4. Verify that the selected distribution source reports `1.0.0`.
5. Run `workflow-supervisor upgrade --agent <codex|claude-code> --scope <user|project> [--project <path>]` for each existing install. The command atomically removes unchanged legacy companion skills and installs the one-skill pack.
6. If upgrade reports locally modified or orphaned legacy skills, preserve intentional customizations and resolve them explicitly. Use `--force` only after reviewing what will be replaced or removed.
7. Replace old skill invocations and route names.
8. Rebuild delegated contracts instead of reusing `DossierV1` files.
9. Run package validation, context-budget checks, adapter diagnostics, and a non-destructive sample for each target agent.
10. If using a native plugin, verify the host-specific invocation and distribution surface instead of assuming the CLI-managed skill path was upgraded.

Do not delete customized installed files until they are backed up. Do not assume a GitHub release has also been published to npm.

## Migration Acceptance Checklist

- Only `workflow-supervisor` is discoverable in each intended install scope.
- No retired `0.1.0` Workflow Supervisor copies remain under `.opencode/skills` or `.hermes/skills`; uncertain or customized copies are preserved for manual review.
- No prompt, `AGENTS.md`, `CLAUDE.md`, script, or CI job invokes a removed companion skill.
- Every workflow chooses `direct`, `tracked`, or `delegated` proportionally.
- Tracked work uses at most one compact ledger unless a documented product requirement says otherwise.
- Delegated work uses the contract accepted by the installed v1 CLI.
- Codex and Claude Code delegation diagnostics pass where those adapters are used.
- Codex uses `$workflow-supervisor`; direct Claude skills use `/workflow-supervisor`; Claude marketplace plugins use `/workflow-supervisor:workflow-supervisor`.
- Generic exports are not treated as automated delegation.
- Context budgets remain within the package's declared profile limits.
- The full validation suite passes on Node.js 22 or newer.
- The installed package source reports `1.0.0`; a repository changelog alone is not accepted as proof.
- The GitHub release assets include the tarball, `SHA256SUMS`, `sbom.cdx.json`, and `provenance.intoto.json`; npm remains unclaimed until `npm view workflow-supervisor version` reports v1.
