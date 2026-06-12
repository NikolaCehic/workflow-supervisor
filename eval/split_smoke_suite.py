from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "smoke-prompts.md"
PROMPTS = ROOT / "smoke-prompts-only.md"
KEY = ROOT / "smoke-answer-key.md"


def main():
    source = SOURCE.read_text().splitlines()
    prompts = ["# Smoke Prompts Only", "", "Use these for fresh-thread forward tests. Do not include the answer key.", ""]
    key = ["# Smoke Answer Key", "", "Evaluator-only expected skills, metrics, and behaviors.", ""]
    current = None
    prompt_lines = []
    key_lines = []

    def flush():
        if current:
            prompts.extend([current, ""])
            prompts.extend(prompt_lines)
            prompts.append("")
            key.extend([current, ""])
            key.extend(key_lines)
            key.append("")

    for line in source:
        if line.startswith("## S"):
            flush()
            current = line
            prompt_lines = []
            key_lines = []
            continue
        if current is None:
            continue
        if line.startswith("Prompt:"):
            prompt_lines.append(line)
        elif line.startswith("Expected skills:") or line.startswith("Evil metrics:") or line.startswith("Expected behavior:"):
            key_lines.append(line)
        elif key_lines and line:
            key_lines.append(line)

    flush()
    PROMPTS.write_text("\n".join(prompts).rstrip() + "\n")
    KEY.write_text("\n".join(key).rstrip() + "\n")
    print(f"Wrote {PROMPTS}")
    print(f"Wrote {KEY}")


if __name__ == "__main__":
    main()
