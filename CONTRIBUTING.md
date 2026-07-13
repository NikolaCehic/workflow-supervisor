# Contributing To Workflow Supervisor

Thank you for helping make supervised agent work more reliable without making ordinary work more expensive.

Version 1.0 deliberately reduces the product to one discoverable `workflow-supervisor` skill with three routes: `direct`, `tracked`, and `delegated`. Contributions should strengthen that product instead of restoring the eight-skill structure from 0.x.

## Before Opening A Pull Request

- Use [GitHub issues](https://github.com/NikolaCehic/workflow-supervisor/issues) to discuss breaking contracts, new adapters, new commands, security-sensitive behavior, or substantial product changes.
- Small fixes, tests, and documentation corrections can go directly to a pull request.
- Use the process in [SECURITY.md](SECURITY.md) for vulnerabilities. Do not open a public proof of concept.
- Use [SUPPORT.md](SUPPORT.md) for installation and usage questions.

## Product Constraints

Keep these boundaries explicit:

- One installed skill is the public discovery surface.
- `direct` is the default and adds no workflow state.
- `tracked` adds one compact ledger only when resumability or multiple bounded outcomes justify it.
- `delegated` adds one compact worker contract and one validated result only when independence, isolation, specialist capability, or safe parallelism earns the cost.
- Codex and Claude Code are the supported automated delegation targets.
- `generic` is Markdown installation or export only. It is not an automated delegation adapter.
- Model instructions and post-run guards are not operating-system security boundaries.
- External, destructive, credentialed, paid, publication, deployment, and scope-expanding actions require explicit authority.
- Context and runtime overhead must be measured. More ceremony is not automatically more reliable.

A proposal for another provider or workflow layer should include a maintained command contract, a real test strategy, failure normalization, permission behavior, and measured value over native model capabilities.

## Development Setup

Node.js 22 or newer is required; use Node 22 as the minimum contributor baseline.

```sh
git clone https://github.com/NikolaCehic/workflow-supervisor.git
cd workflow-supervisor
npm install
npm run validate
```

The package has no runtime service to start. Exercise the CLI directly:

```sh
node ./bin/workflow-skills.mjs --help
node ./bin/workflow-skills.mjs context-budget --profile direct
node ./bin/workflow-skills.mjs context-budget --profile tracked
node ./bin/workflow-skills.mjs context-budget --profile delegated
```

Live delegation tests require an installed and authenticated Codex or Claude Code CLI. Do not put credentials in fixtures, command arguments, snapshots, issue reports, or pull requests.

## Making A Change

1. Confirm the behavior or contract that should change.
2. Add a focused test that can fail for the defect or unsupported behavior.
3. Make the smallest coherent implementation change.
4. Update user-facing documentation when a command, contract, support boundary, migration, or failure mode changes.
5. Measure affected context profiles when skill or reference text changes.
6. Run the complete validation suite.

Prefer deterministic local fixtures over paid or credentialed tests. A mock should assert the real adapter command, stdin, structured-output, exit, timeout, and guard behavior rather than merely returning a successful object.

## Required Checks

Run before submitting:

```sh
npm run validate
git diff --check
node ./bin/workflow-skills.mjs context-budget --profile direct
node ./bin/workflow-skills.mjs context-budget --profile tracked
node ./bin/workflow-skills.mjs context-budget --profile delegated
npm pack --dry-run
```

If the change affects delegation, installation, filesystem guards, schema or contract parsing, or supported Node versions, add and run the relevant packed-consumer, adversarial, and cross-version checks. State any check you could not run and why.

## Pull Request Expectations

A pull request should explain:

- the user-visible problem and why it belongs in the product
- the chosen behavior and alternatives rejected
- compatibility or migration impact
- context-budget and performance impact
- security and authority-boundary impact
- tests and concrete evidence
- checks that were skipped or require maintainer infrastructure

Keep unrelated cleanup out of the same pull request. Preserve user changes in a dirty worktree. Never commit tokens, credentials, personal data, generated `.workflow/` state, or local agent configuration.

Substantial AI-assisted contributions are welcome, but the contributor remains responsible for every line, source license, test result, and claim. Disclose material generated content in the pull request and verify it independently.

## Compatibility And Releases

Version 1.0 intentionally breaks parts of 0.x. Read [the v1 migration guide](docs/migrating-to-v1.md) before changing installed skill layout or delegation contracts.

Only maintainers cut releases. A merged version change, Git tag, GitHub release, and npm publication are distinct operations. Do not claim that a version is available from npm until the registry reports it.

By submitting a contribution, you agree that it may be distributed under the repository's [MIT License](LICENSE).
