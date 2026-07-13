# Support

Workflow Supervisor is a maintainer-run open-source project. Community support is best effort and has no guaranteed response time.

Version 1.0 is the supported one-skill line. GitHub releases and npm packages remain separate distribution surfaces, so verify the version reported by the source you installed.

## Supported Product Shape

The supported v1 product is:

- Node.js 22 or newer
- one discoverable `workflow-supervisor` skill
- `direct`, `tracked`, and `delegated` routes
- automated local delegation through Codex and Claude Code
- generic Markdown installation or context export without automated delegation

Workflow Supervisor is not a hosted agent service, daemon, scheduler, queue, operating-system sandbox, model provider, or credential manager. Support cannot guarantee model quality, third-party CLI uptime, account access, or behavior outside the project's documented boundary.

## Where To Ask

Use [GitHub issues](https://github.com/NikolaCehic/workflow-supervisor/issues) for reproducible bugs, installation failures, documentation gaps, compatibility reports, and focused feature proposals.

Before opening an issue:

1. Search existing open and closed issues.
2. Reproduce with the latest relevant GitHub or npm release.
3. Run `workflow-supervisor --version` and `workflow-supervisor doctor --agent <agent>`.
4. Run `workflow-supervisor validate` when using a source checkout or custom installation.
5. Remove secrets and personal data from every command, path, log, dossier, contract, and report.

Use a title prefix to make triage clear, such as `[bug]`, `[install]`, `[compatibility]`, `[docs]`, or `[proposal]`.

## What To Include

A useful report includes:

- expected and actual behavior
- minimal reproduction steps
- Workflow Supervisor version and installation source
- Node.js version and operating system
- Codex or Claude Code version when delegation is involved
- exact command with sensitive values replaced
- exit code and the smallest relevant stdout or stderr excerpt
- whether the workspace was a Git repository and whether it was already dirty
- a minimal contract or fixture when validation is involved

Screenshots are useful only when the problem is visual. Prefer searchable text for terminal errors. Do not attach an entire home directory, repository, environment dump, or credential file.

## Security And Conduct

Do not use a public support issue for vulnerabilities or private conduct reports.

- Follow [SECURITY.md](SECURITY.md) for security reports.
- Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community conduct reports.

## Feature Proposals

Explain the user problem, why native Codex or Claude Code behavior is insufficient, the proposed route or contract impact, expected token and runtime cost, failure behavior, and how the benefit can be tested. Features that add permanent context, duplicate native orchestration, or broaden authority without measurable reliability value are unlikely to be accepted.

## Releases And npm

The repository, a Git tag, a GitHub release, and an npm publication can have different current versions. Check each surface that matters to your installation. A changelog entry or GitHub release does not prove that `npm install workflow-supervisor@<version>` is available.
