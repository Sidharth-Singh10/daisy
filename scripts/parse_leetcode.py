import json
import re
import sys
from pathlib import Path

ROW = re.compile(
    r"^  (.+?) +https://leetcode\.com/problems/([a-z0-9\-]+)/ +(Easy|Medium|Hard)( +\[PREMIUM\])?$"
)
TOPIC = re.compile(r"^([\w& /-]+) \((\d+)\)$")


def parse(path: Path):
    topics, cur = [], None
    for line in path.read_text().splitlines():
        line = line.rstrip()
        if not line or line.startswith("NeetCode 150 ->"):
            continue
        m = TOPIC.match(line)
        if m and not line.startswith(" "):
            cur = m.group(1)
            topics.append({"topic": cur, "problems": []})
            continue
        r = ROW.match(line)
        if r and cur:
            topics[-1]["problems"].append(
                {
                    "title": r.group(1).strip(),
                    "url": f"https://leetcode.com/problems/{r.group(2)}/",
                    "slug": r.group(2),
                    "difficulty": r.group(3),
                    "premium": bool(r.group(4)),
                }
            )
    return topics


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("neetcode150_leetcode_links.txt")
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("app/src/data/neetcode150.json")
    topics = parse(src)
    total = sum(len(t["problems"]) for t in topics)
    premium = sum(p["premium"] for t in topics for p in t["problems"])
    assert total == 150, f"expected 150 problems, parsed {total}"
    meta = {"total": total, "topics": len(topics), "premium": premium}
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps({"topics": topics, "meta": meta}, indent=1))
    print(f"wrote {dst}: {total} problems, {len(topics)} topics, {premium} premium")


if __name__ == "__main__":
    main()