import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "bin", "workflow-skills.mjs");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-skills-"));
const projectTemp = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-skills-project-"));

function run(args) {
  return execFileSync("node", [bin, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

run(["validate"]);
const list = run(["list"]);
if (!list.includes("workflow-supervisor") || !list.includes("workflow-docs")) {
  throw new Error("list output missing expected skills");
}
run(["install", "--agent", "generic", "--target", temp, "--dry-run"]);
run(["install", "--agent", "generic", "--target", temp]);
for (const name of ["workflow-supervisor", "source-corpus", "work-unit", "dossier-builder", "worker-roles", "acceptance-matrix", "loop-policy", "workflow-docs"]) {
  const skillPath = path.join(temp, name, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    throw new Error(`missing installed skill: ${skillPath}`);
  }
}
const contextPath = path.join(temp, "WORKFLOW_SKILL_PACK.md");
if (!fs.existsSync(contextPath)) {
  throw new Error("missing installed context file");
}
const contextOut = path.join(temp, "AGENTS.md");
run(["emit-context", "--agent", "generic", "--target", temp, "--out", contextOut]);
if (!fs.existsSync(contextOut)) {
  throw new Error("emit-context did not write output");
}
run(["install", "--agent", "all", "--scope", "project", "--project", projectTemp]);
for (const target of [
  path.join(projectTemp, ".agents", "skills"),
  path.join(projectTemp, ".claude", "skills"),
  path.join(projectTemp, ".opencode", "skills"),
  path.join(projectTemp, ".hermes", "skills"),
]) {
  if (!fs.existsSync(path.join(target, ".workflow-skills-install.json"))) {
    throw new Error(`missing install manifest: ${target}`);
  }
  if (!fs.existsSync(path.join(target, "workflow-supervisor", "SKILL.md"))) {
    throw new Error(`missing project installed supervisor: ${target}`);
  }
}
run(["uninstall", "--agent", "generic", "--target", temp]);
if (fs.existsSync(path.join(temp, "workflow-supervisor"))) {
  throw new Error("uninstall did not remove generic skill");
}
console.log(`Smoke tests passed in ${temp} and ${projectTemp}`);
