import { spawn } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];

if (mode === "echo") {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  process.stdout.write(`stdout:${input}`);
  process.stderr.write("stderr:ok");
} else if (mode === "nonzero") {
  process.stdout.write("stdout:nonzero");
  process.stderr.write("stderr:nonzero");
  process.exitCode = 7;
} else if (mode === "sleep") {
  setInterval(() => {}, 10_000);
} else if (mode === "overflow") {
  process.stdout.write("x".repeat(1024 * 1024));
  setInterval(() => {}, 10_000);
} else if (mode === "spawn-delayed-writer") {
  const target = process.argv[3];
  const delayMs = process.argv[4] || "300";
  const writer = spawn(process.execPath, [fileURLToPath(import.meta.url), "delayed-writer", target, delayMs], {
    detached: false,
    stdio: "ignore",
    windowsHide: true,
  });
  writer.unref();
  const armed = `${target}.armed`;
  const deadline = Date.now() + 1_000;
  while (!fs.existsSync(armed) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  if (!fs.existsSync(armed)) throw new Error("delayed writer did not arm");
  process.stdout.write(`spawned:${writer.pid}`);
} else if (mode === "delayed-writer") {
  const target = process.argv[3];
  const delayMs = Number(process.argv[4]);
  fs.writeFileSync(`${target}.armed`, "ready\n");
  setTimeout(() => fs.writeFileSync(target, "descendant survived\n"), delayMs);
} else {
  process.stderr.write(`unknown fixture mode: ${mode}\n`);
  process.exitCode = 64;
}
