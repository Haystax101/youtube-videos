"""Experiment assignment and scoring for the daily Shorts.

  python3 pipeline/experiments.py assign 3      # arms for today's 3 Shorts (balanced, least-used first)
  python3 pipeline/experiments.py report        # score every variable's arms -> episodes/experiments-report.md

Registry: writing/experiments.json. Each script.json records its arms in experiment.vars;
older episodes are read from their script fields (style, speed, voices, music, ending_cta).
"""
import json, random, statistics, sys, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "episodes"
REG = json.loads((ROOT / "writing/experiments.json").read_text())


def script_vars(s):
    """the arms a script used, from experiment.vars with fallbacks for older episodes"""
    e = s.get("experiment") or {}
    v = dict(e.get("vars") or {})
    music = s.get("music") if isinstance(s.get("music"), dict) else {}
    v.setdefault("style", s.get("style", "cartoon"))
    v.setdefault("music", music.get("mood", "pluck"))
    v.setdefault("speed", s.get("speed", 1.08))
    v.setdefault("narrator", (s.get("voices") or {}).get("narrator", "am_michael"))
    v.setdefault("ending_cta", e.get("ending_cta", "shenanigans"))
    v.setdefault("ending", e.get("ending", "dies"))
    v.setdefault("look", s.get("look", "flat"))  # episodes before 2026-11-26 were rendered flat
    v.setdefault("character_poly", (s.get("character") or {}).get("poly", "low"))
    return v


def episodes():
    for d in sorted(EPISODES.glob("[0-9][0-9][0-9]-*")):
        f = d / "script.json"
        if f.exists(): yield d.name, json.loads(f.read_text())


def assign(n):
    counts = {k: {str(a): 0 for a in t["arms"]} for k, t in REG["active"].items()}
    for _, s in episodes():
        v = script_vars(s)
        for k in counts:
            a = str(v.get(k))
            if a in counts[k]: counts[k][a] += 1
    rnd = random.Random(dt.date.today().toordinal())
    out = [{} for _ in range(n)]
    for k, t in REG["active"].items():
        arms = sorted(t["arms"], key=lambda a: (counts[k][str(a)], rnd.random()))
        for i in range(n): out[i][k] = arms[i % len(arms)]
    for i, o in enumerate(out): print(f"Short {i + 1}: {json.dumps(o)}")
    return out


def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None


def report():
    an = json.loads((EPISODES / "analytics.json").read_text())
    now = dt.datetime.now(dt.timezone.utc)
    rows = []
    scripts = dict(episodes())
    for vid, r in an.get("videos", {}).items():
        s = scripts.get(r["episode"])
        if not s: continue
        t = r.get("totals") or {}
        views = num(t.get("views")) or num((r.get("public") or {}).get("viewCount"))
        ret = r.get("retention") or []
        r3 = next((x[1] for x in ret if x[0] >= 0.1), None)  # share still watching ~10% in (~3 s of a 30 s Short)
        rows.append(dict(ep=r["episode"], vars=script_vars(s), views=views, avgpct=num(t.get("averageViewPercentage")),
                         subs=(num(t.get("subscribersGained")) or 0) * 1000 / views if views else None,
                         comments=(num(t.get("comments")) or 0) * 1000 / views if views else None, r3=r3))
    def med(xs):
        xs = [x for x in xs if x is not None]; return round(statistics.median(xs), 1) if xs else "-"
    lines = [f"# Experiment report ({now:%Y-%m-%d %H:%M} UTC, {len(rows)} videos with analytics)", "",
             f"Rules: judge an arm after {REG['rules']['min_per_arm']} videos at least {REG['rules']['min_age_hours']} h old; "
             f"winner needs {int(REG['rules']['win_margin'] * 100)}% better median on the primary metric without losing on views.", ""]
    allvars = list(REG["active"]) + [k for k in REG["content_vars"] if not k.startswith("_")]
    for k in allvars:
        lines += [f"## {k}" + (" (active test)" if k in REG["active"] else ""), "",
                  "| arm | n | median views | median avg % viewed | median subs/1k | median comments/1k | median kept at 10% |", "|---|---|---|---|---|---|---|"]
        arms = {}
        for r in rows: arms.setdefault(str(r["vars"].get(k, "?")), []).append(r)
        for a, rs in sorted(arms.items(), key=lambda kv: -len(kv[1])):
            lines.append(f"| {a} | {len(rs)} | {med([r['views'] for r in rs])} | {med([r['avgpct'] for r in rs])} | "
                         f"{med([r['subs'] for r in rs])} | {med([r['comments'] for r in rs])} | {med([r['r3'] for r in rs])} |")
        lines.append("")
    (EPISODES / "experiments-report.md").write_text("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "assign": assign(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
    elif len(sys.argv) > 1 and sys.argv[1] == "report": report()
    else: sys.exit(__doc__)
