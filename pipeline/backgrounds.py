"""Generate an episode's background images with Cloudflare Workers AI (FLUX.2 klein 4B).

Usage: python3 pipeline/backgrounds.py episodes/<slug> [--force]

Reads script.json "backgrounds": {"key": "prompt", ...} and writes bg/<key>.jpg (768x1344
portrait, or 1344x768 for "format": "landscape"). Existing images are kept unless --force.
script.json "bgStyle" is appended to every prompt so a video's scenes share one look.

Needs CF_ACCOUNT_ID and CF_API_TOKEN in the environment (never print or commit them).
Cost: free daily Workers AI allowance covers ~60 images a day at this size (~156 neurons each).
"""
import base64, json, os, sys, time
from pathlib import Path
import requests
from io import BytesIO
from PIL import Image

MODEL = "@cf/black-forest-labs/flux-2-klein-4b"
DEFAULT_STYLE = ("stylized 3D animated film background, soft cinematic lighting, rich detail, "
                 "warm colours, empty scene with no people and no text")


def generate(prompt, w, h, out):
    acc, tok = os.environ.get("CF_ACCOUNT_ID"), os.environ.get("CF_API_TOKEN")
    if not acc or not tok:
        sys.exit("CF_ACCOUNT_ID / CF_API_TOKEN missing: cannot generate backgrounds")
    url = f"https://api.cloudflare.com/client/v4/accounts/{acc}/ai/run/{MODEL}"
    for attempt in range(4):
        try:
            r = requests.post(url, headers={"Authorization": f"Bearer {tok}"},
                              files={"prompt": (None, prompt), "width": (None, str(w)), "height": (None, str(h))}, timeout=180)
            if r.ok:
                # re-encode smaller: these are committed with the episode
                Image.open(BytesIO(base64.b64decode(r.json()["result"]["image"]))).convert("RGB").save(out, quality=80, optimize=True)
                return
            print(f"  {out.name}: HTTP {r.status_code} {r.text[:200]}")
        except requests.RequestException as e:
            print(f"  {out.name}: {e}")
        time.sleep(10 * (attempt + 1))
    sys.exit(f"failed to generate {out.name}")


def main(ep_dir, force=False):
    ep = Path(ep_dir)
    script = json.loads((ep / "script.json").read_text())
    w, h = (1344, 768) if script.get("format") == "landscape" else (768, 1344)
    style = script.get("bgStyle", DEFAULT_STYLE)
    (ep / "bg").mkdir(exist_ok=True)
    for key, prompt in script.get("backgrounds", {}).items():
        out = ep / "bg" / f"{key}.jpg"
        if out.exists() and not force:
            continue
        t = time.time()
        generate(f"{prompt}, {style}", w, h, out)
        print(f"  {key}.jpg ({time.time() - t:.0f}s)")
    print("backgrounds ready")


if __name__ == "__main__":
    main(sys.argv[1], "--force" in sys.argv)
