import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "bin", "workflow-skills.mjs");

function tempDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `workflow-upgrade-${label}-`));
}

function run(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
}

function hashFileEntry(file) {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch (error) {
    if (error.code === "ENOENT") return "MISSING";
    throw error;
  }
  const mode = (stat.mode & 0o7777).toString(8).padStart(4, "0");
  if (stat.isSymbolicLink()) return `LINK:${mode}:${fs.readlinkSync(file)}`;
  if (stat.isDirectory()) return `DIRECTORY:${mode}`;
  const content = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  return `FILE:${mode}:${content}`;
}

function hashDir(root) {
  const entries = new Map([[".", hashFileEntry(root)]]);
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(root, full).replaceAll(path.sep, "/");
      entries.set(relative, hashFileEntry(full));
      if (entry.isDirectory()) visit(full);
    }
  }
  visit(root);
  const hash = crypto.createHash("sha256");
  for (const [relative, fingerprint] of [...entries].sort(([left], [right]) => left.localeCompare(right))) {
    hash.update(relative);
    hash.update("\0");
    hash.update(fingerprint);
    hash.update("\0");
  }
  return hash.digest("hex");
}

function legacyFileHashDir(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  visit(root);
  const hash = crypto.createHash("sha256");
  for (const file of files.sort()) {
    hash.update(path.relative(root, file));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const publishedLegacyNames = [
  "acceptance-matrix", "dossier-builder", "loop-policy", "source-corpus",
  "work-unit", "worker-roles", "workflow-docs", "workflow-supervisor",
];
const publishedLegacySummaries = {
  "workflow-supervisor": "coordinate open-ended agent loops and bind Codex goals when appropriate",
  "source-corpus": "rank and reconcile sources when source authority affects safe next action",
  "work-unit": "decompose broad objectives into bounded units",
  "dossier-builder": "create a delegation contract for one already-bounded work unit",
  "worker-roles": "separate implementer, verifier, repair, documentation, reviewer, and solo-mode responsibilities",
  "acceptance-matrix": "create formal evidence-mapped acceptance criteria",
  "loop-policy": "define retries, parallel safety, approval gates, and goal binding policy",
  "workflow-docs": "create durable workflow-state or documentation-production artifacts",
};

function publishedLegacyContext(version, target) {
  const summaries = { ...publishedLegacySummaries };
  if (version === "0.1.0") summaries["dossier-builder"] = "create a handoff contract for one already-bounded work unit";
  const skillLines = publishedLegacyNames.map((name) => `- \`$${name}\`: ${summaries[name]}.`);
  if (version === "0.1.0") {
    return `# Workflow Skill Pack for codex

Installed skills:

\`${target}\`

Use these skills explicitly for supervised, long-running, or handoff-heavy workflows:

${skillLines.join("\n")}

Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable handoff is explicitly needed.
`;
  }
  return `# Workflow Skill Pack for codex

Installed skills:

\`${target}\`

Use these skills explicitly for supervised, long-running, or delegation-heavy workflows:

${skillLines.join("\n")}

Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable continuation state is explicitly needed.

In Git-backed codebases, keep workflow state local: ensure \`.workflow/\` is listed in \`.gitignore\` before creating workflow artifacts, and do not stage or publish \`.workflow/\` unless the user explicitly makes it a deliverable.
`;
}

function seedPublishedLegacyProject(version) {
  const project = tempDir(`published-${version}`);
  const target = path.join(project, ".agents", "skills");
  fs.mkdirSync(target, { recursive: true });
  const skills = publishedLegacyNames.map((name) => {
    const directory = path.join(target, name);
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, "SKILL.md"), `---\nname: ${name}\ndescription: frozen ${version} migration fixture\n---\n`);
    return { name, checksum: legacyFileHashDir(directory) };
  });
  const manifest = {
    package: "workflow-supervisor",
    version,
    agent: "codex",
    scope: "project",
    project,
    target,
    installedAt: "2026-01-01T00:00:00.000Z",
    ...(version === "0.1.0" ? {} : {
      workflowGitignore: {
        file: path.join(project, ".gitignore"),
        entry: ".workflow/",
        changed: true,
        alreadyPresent: false,
        dryRun: false,
      },
    }),
    skills,
  };
  fs.writeFileSync(path.join(target, ".workflow-skills-install.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), publishedLegacyContext(version, target));
  if (version !== "0.1.0") fs.writeFileSync(path.join(project, ".gitignore"), ".workflow/\n");
  return { project, target };
}

function seedLegacyInstall(target, { drift = false, orphan = false } = {}) {
  const installed = run(["install", "--agent", "generic", "--target", target], path.dirname(target));
  assert.equal(installed.status, 0, installed.stderr);
  const legacy = path.join(target, "workflow-docs");
  fs.mkdirSync(legacy);
  fs.writeFileSync(path.join(legacy, "SKILL.md"), "---\nname: workflow-docs\ndescription: legacy\n---\n");
  const manifestPath = path.join(target, ".workflow-skills-install.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.version = "0.3.0";
  if (!orphan) manifest.skills.push({ name: "workflow-docs", checksum: hashDir(legacy) });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const summaries = {
    "workflow-supervisor": "route explicitly requested supervised work through the smallest safe profile without creating unnecessary workers or goals",
    "workflow-docs": "create durable workflow-state or documentation-production artifacts",
  };
  const lines = manifest.skills.map(({ name }) => `- \`$${name}\`: ${summaries[name]}.`);
  fs.writeFileSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), `# Workflow Skill Pack

Installed skills:

\`${manifest.target}\`

Use these skills only when explicitly invoked for supervised, long-running, or delegation-heavy workflows:

${lines.join("\n")}

Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable continuation state is explicitly needed.

In Git-backed codebases, keep workflow state local. Add \`.workflow/\` to \`.gitignore\` only when local mutation is authorized; otherwise keep state inline or use an already-ignored location. Do not stage or publish \`.workflow/\` unless the user explicitly makes it a deliverable.
`);
  if (drift) fs.appendFileSync(path.join(legacy, "SKILL.md"), "local user change\n");
  return { legacy, manifestPath };
}

test("upgrade atomically collapses an unchanged legacy install to one v1 skill", () => {
  const target = path.join(tempDir("clean"), "skills");
  const { legacy, manifestPath } = seedLegacyInstall(target);
  const result = run(["upgrade", "--agent", "generic", "--target", target], path.dirname(target));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Removed legacy skills: workflow-docs/);
  assert.equal(fs.existsSync(legacy), false);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.version, "1.0.0");
  assert.deepEqual(manifest.skills.map((skill) => skill.name), ["workflow-supervisor"]);
  assert.equal(run(["doctor", "--agent", "generic", "--target", target, "--require-pass"], path.dirname(target)).status, 0);
});

test("upgrade dry-run reports legacy removal without mutating the install", () => {
  const target = path.join(tempDir("dry"), "skills");
  const { legacy, manifestPath } = seedLegacyInstall(target);
  const before = fs.readFileSync(manifestPath);
  const result = run(["upgrade", "--agent", "generic", "--target", target, "--dry-run"], path.dirname(target));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would remove legacy skills: workflow-docs/);
  assert.equal(fs.existsSync(legacy), true);
  assert.deepEqual(fs.readFileSync(manifestPath), before);
});

test("upgrade protects modified and orphan legacy skills unless force is explicit", () => {
  const driftTarget = path.join(tempDir("drift"), "skills");
  const drift = seedLegacyInstall(driftTarget, { drift: true });
  let result = run(["upgrade", "--agent", "generic", "--target", driftTarget], path.dirname(driftTarget));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /local changes/);
  assert.equal(fs.existsSync(drift.legacy), true);

  result = run(["upgrade", "--agent", "generic", "--target", driftTarget, "--force"], path.dirname(driftTarget));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(drift.legacy), false);

  const orphanTarget = path.join(tempDir("orphan"), "skills");
  const orphan = seedLegacyInstall(orphanTarget, { orphan: true });
  result = run(["upgrade", "--agent", "generic", "--target", orphanTarget], path.dirname(orphanTarget));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not owned/);
  assert.equal(fs.existsSync(orphan.legacy), true);
  const doctor = JSON.parse(run(["doctor", "--agent", "generic", "--target", orphanTarget], path.dirname(orphanTarget)).stdout);
  assert.equal(doctor.status, "BLOCKED");
  assert.ok(doctor.errors.some((error) => /orphan legacy skill/.test(error)));
});

test("published v0.1.0 and v0.2.0 project manifests migrate with frozen checksum and context semantics", async (t) => {
  for (const version of ["0.1.0", "0.2.0"]) {
    await t.test(version, () => {
      const { project, target } = seedPublishedLegacyProject(version);
      const before = fs.readFileSync(path.join(target, ".workflow-skills-install.json"));
      const dryRun = run(["upgrade", "--agent", "codex", "--scope", "project", "--project", project, "--dry-run"], project);
      assert.equal(dryRun.status, 0, dryRun.stderr);
      assert.deepEqual(fs.readFileSync(path.join(target, ".workflow-skills-install.json")), before);

      const upgraded = run(["upgrade", "--agent", "codex", "--scope", "project", "--project", project], project);
      assert.equal(upgraded.status, 0, upgraded.stderr);
      const manifest = JSON.parse(fs.readFileSync(path.join(target, ".workflow-skills-install.json"), "utf8"));
      assert.equal(manifest.version, "1.0.0");
      assert.deepEqual(manifest.skills.map(({ name }) => name), ["workflow-supervisor"]);
      assert.match(fs.readFileSync(path.join(project, ".gitignore"), "utf8"), /# workflow-supervisor: managed \.workflow\/; gitignore-existed=(?:true|false)\n\.workflow\//);
      const doctor = run(["doctor", "--agent", "codex", "--scope", "project", "--project", project, "--require-pass"], project);
      assert.equal(doctor.status, 0, doctor.stderr);

      const removed = run(["uninstall", "--agent", "codex", "--scope", "project", "--project", project], project);
      assert.equal(removed.status, 0, removed.stderr);
      const remainingIgnore = fs.existsSync(path.join(project, ".gitignore")) ? fs.readFileSync(path.join(project, ".gitignore"), "utf8") : "";
      assert.doesNotMatch(remainingIgnore, /\.workflow\//);
    });
  }
});

function runAsync(args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

test("concurrent installs serialize without corrupting the manifest", async () => {
  const root = tempDir("concurrent");
  const target = path.join(root, "skills");
  const args = ["install", "--agent", "generic", "--target", target];
  const results = await Promise.all([runAsync(args, root), runAsync(args, root), runAsync(args, root)]);
  for (const result of results) assert.equal(result.status, 0, result.stderr);

  const manifest = JSON.parse(fs.readFileSync(path.join(target, ".workflow-skills-install.json"), "utf8"));
  assert.deepEqual(manifest.skills.map((skill) => skill.name), ["workflow-supervisor"]);
  const doctor = run(["doctor", "--agent", "generic", "--target", target, "--require-pass"], root);
  assert.equal(doctor.status, 0, doctor.stderr);
});
