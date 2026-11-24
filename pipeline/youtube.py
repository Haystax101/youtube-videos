"""YouTube posting and analytics for the channel, using only the public REST APIs.

Credentials come from environment variables (never commit them):
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
Uploading is off unless YT_UPLOAD_ENABLED=1 (Google keeps API uploads private until
the API project passes YouTube's audit, so leave it off until george says it passed).

Usage:
  python3 pipeline/youtube.py check
  python3 pipeline/youtube.py upload EP --title T --description D --tags a,b,c [--publish-at ISO] [--privacy public|private|unlisted]
  python3 pipeline/youtube.py stats            # refresh episodes/analytics.json for every uploaded episode
                                               # (also links hand uploads to episodes by slug words in the title)
  python3 pipeline/youtube.py link EP VIDEO_ID   # link a hand upload whose title/length didn't auto-match
  python3 pipeline/youtube.py comments [N]     # top comments on the latest N videos -> episodes/comments.json

Each uploaded episode gets EP/youtube.json with its videoId, so stats can be joined
back to the episode's script.json "experiment" settings.
"""
import argparse, datetime as dt, json, os, sys
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "episodes"
API = "https://www.googleapis.com/youtube/v3"
ANALYTICS = "https://youtubeanalytics.googleapis.com/v2/reports"


def token():
    missing = [k for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN") if not os.environ.get(k)]
    if missing:
        sys.exit(f"YouTube not configured: missing {', '.join(missing)}")
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": os.environ["YT_CLIENT_ID"], "client_secret": os.environ["YT_CLIENT_SECRET"],
        "refresh_token": os.environ["YT_REFRESH_TOKEN"], "grant_type": "refresh_token"}, timeout=30)
    if r.status_code != 200:
        sys.exit(f"token refresh failed ({r.status_code}): {r.json().get('error_description', r.text)[:200]}")
    return r.json()["access_token"]


def get(url, tok, **params):
    r = requests.get(url, params=params, headers={"Authorization": f"Bearer {tok}"}, timeout=60)
    r.raise_for_status()
    return r.json()


def my_channel(tok):
    ch = get(f"{API}/channels", tok, part="id,snippet,statistics,contentDetails", mine="true")["items"][0]
    return ch


def cmd_check(_):
    tok = token(); ch = my_channel(tok)
    s = ch["statistics"]
    print(f"OK: channel '{ch['snippet']['title']}' ({ch['id']}): {s.get('subscriberCount')} subscribers, "
          f"{s.get('videoCount')} videos, {s.get('viewCount')} views")
    print("uploads enabled" if os.environ.get("YT_UPLOAD_ENABLED") == "1" else "uploads disabled (YT_UPLOAD_ENABLED != 1)")


def cmd_upload(a):
    ep = Path(a.ep).resolve()
    video = ep / "video.mp4"
    if not video.exists():
        sys.exit(f"no video at {video}")
    if os.environ.get("YT_UPLOAD_ENABLED") != "1":
        sys.exit("uploads disabled: set YT_UPLOAD_ENABLED=1 once the API project has passed YouTube's audit")
    tok = token()
    status = {"privacyStatus": a.privacy, "selfDeclaredMadeForKids": False, "containsSyntheticMedia": False}
    if a.publish_at:
        status.update(privacyStatus="private", publishAt=a.publish_at)
    body = {"snippet": {"title": a.title[:100], "description": a.description[:4900],
                        "tags": [t.strip() for t in a.tags.split(",") if t.strip()], "categoryId": "23"},  # Comedy
            "status": status}
    size = video.stat().st_size
    r = requests.post(f"https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                      headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json; charset=UTF-8",
                               "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)},
                      data=json.dumps(body), timeout=60)
    r.raise_for_status()
    with open(video, "rb") as f:
        up = requests.put(r.headers["Location"], data=f, headers={"Content-Type": "video/mp4"}, timeout=1800)
    up.raise_for_status()
    vid = up.json()["id"]
    (ep / "youtube.json").write_text(json.dumps({
        "videoId": vid, "url": f"https://youtu.be/{vid}", "uploadedAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "title": body["snippet"]["title"], "privacy": status["privacyStatus"], "publishAt": a.publish_at}, indent=1))
    print(f"uploaded https://youtu.be/{vid}")


def uploaded_episodes():
    for yj in sorted(EPISODES.glob("**/youtube.json")):
        yield yj.parent, json.loads(yj.read_text())


def iso_seconds(d):
    import re
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d)
    return sum(int(x or 0) * k for x, k in zip(m.groups(), (3600, 60, 1)))


def write_link(ep, vid, title, published, how):
    (ep / "youtube.json").write_text(json.dumps({
        "videoId": vid, "url": f"https://youtu.be/{vid}", "uploadedAt": published,
        "title": title, "linkedBy": how}, indent=1))
    print(f"linked {ep.relative_to(EPISODES)} -> https://youtu.be/{vid} ({title}) [{how}]")


def link_manual_uploads(tok, ch):
    """george uploads by hand with his own titles, so those episodes have no youtube.json yet.
    Link each unlinked episode to a channel upload: first by every slug word appearing in the
    title, else by video length (YouTube rounds to whole seconds; must be the only match)."""
    uploads = []
    pl = ch["contentDetails"]["relatedPlaylists"]["uploads"]
    for it in get(f"{API}/playlistItems", tok, part="snippet,contentDetails", playlistId=pl, maxResults=50)["items"]:
        published = it["contentDetails"].get("videoPublishedAt", "")
        if published >= "2026-11-24":  # Gary Tries It started then; older uploads are other formats
            uploads.append({"id": it["contentDetails"]["videoId"], "title": it["snippet"]["title"], "published": published})
    if uploads:
        det = {v["id"]: v for v in get(f"{API}/videos", tok, part="contentDetails", id=",".join(u["id"] for u in uploads))["items"]}
        for u in uploads:
            u["secs"] = iso_seconds(det[u["id"]]["contentDetails"]["duration"]) if u["id"] in det else -99
    taken = {yt["videoId"] for _, yt in uploaded_episodes()}
    pending = []
    for tl in sorted(EPISODES.glob("*/timeline.json")):
        ep = tl.parent
        if (ep / "youtube.json").exists():
            continue
        words = [w for w in ep.name.split("-")[1:] if len(w) > 2]
        hit = next((u for u in uploads if u["id"] not in taken and words and all(w in u["title"].lower() for w in words)), None)
        if hit:
            write_link(ep, hit["id"], hit["title"], hit["published"], "title-match (uploaded by hand)"); taken.add(hit["id"])
        else:
            pending.append((ep, json.loads(tl.read_text())["duration"]))
    for ep, dur in pending:
        cands = [u for u in uploads if u["id"] not in taken and abs(u["secs"] - dur) <= 1.0]
        others = [e for e, d in pending if e != ep and abs(d - dur) <= 1.0 and not (e / "youtube.json").exists()]
        if len(cands) == 1 and not others:
            u = cands[0]; write_link(ep, u["id"], u["title"], u["published"], "length-match (uploaded by hand)"); taken.add(u["id"])


def cmd_link(a):
    """manually link an episode to a video: youtube.py link episodes/NNN-slug VIDEO_ID"""
    tok = token(); ep = Path(a.ep).resolve()
    v = get(f"{API}/videos", tok, part="snippet", id=a.video)["items"][0]
    write_link(ep, a.video, v["snippet"]["title"], v["snippet"]["publishedAt"], "manual")


def cmd_stats(_):
    tok = token(); ch = my_channel(tok)
    link_manual_uploads(tok, ch)
    today = dt.date.today().isoformat()
    out = {"fetchedAt": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "channel": ch["statistics"], "videos": {}}
    for ep, yt in uploaded_episodes():
        vid = yt["videoId"]
        start = (yt.get("uploadedAt") or "2026-01-01")[:10]
        row = {"episode": str(ep.relative_to(EPISODES))}
        try:
            v = get(f"{API}/videos", tok, part="statistics,contentDetails,status", id=vid)["items"]
            if v:
                row["public"] = v[0]["statistics"]; row["privacy"] = v[0]["status"]["privacyStatus"]
            rep = get(ANALYTICS, tok, ids="channel==MINE", startDate=start, endDate=today, filters=f"video=={vid}",
                      metrics="views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained")
            if rep.get("rows"):
                row["totals"] = dict(zip([h["name"] for h in rep["columnHeaders"]], rep["rows"][0]))
            ret = get(ANALYTICS, tok, ids="channel==MINE", startDate=start, endDate=today, filters=f"video=={vid}",
                      dimensions="elapsedVideoTimeRatio", metrics="audienceWatchRatio,relativeRetentionPerformance")
            row["retention"] = [[r[0], round(r[1], 3), round(r[2], 3)] for r in ret.get("rows", [])]
        except requests.HTTPError as e:
            row["error"] = f"{e.response.status_code}: {e.response.text[:200]}"
        script = ep / "script.json"
        if script.exists():
            s = json.loads(script.read_text()); row["experiment"] = s.get("experiment"); row["title"] = s.get("title")
        out["videos"][vid] = row
    (EPISODES / "analytics.json").write_text(json.dumps(out, indent=1))
    print(f"wrote episodes/analytics.json ({len(out['videos'])} videos)")
    for vid, r in out["videos"].items():
        t = r.get("totals", {})
        print(f"  {r['episode']}: views={t.get('views')} avg%={t.get('averageViewPercentage')} avgDur={t.get('averageViewDuration')}s subs+={t.get('subscribersGained')}")


def cmd_comments(a):
    tok = token(); out = {}
    for ep, yt in list(uploaded_episodes())[-a.n:]:
        try:
            res = get(f"{API}/commentThreads", tok, part="snippet", videoId=yt["videoId"], order="relevance", maxResults=50, textFormat="plainText")
            out[str(ep.relative_to(EPISODES))] = [
                {"text": c["snippet"]["topLevelComment"]["snippet"]["textDisplay"][:300],
                 "likes": c["snippet"]["topLevelComment"]["snippet"]["likeCount"]} for c in res.get("items", [])]
        except requests.HTTPError as e:
            out[str(ep.relative_to(EPISODES))] = {"error": e.response.status_code}
    (EPISODES / "comments.json").write_text(json.dumps(out, indent=1))
    print(f"wrote episodes/comments.json ({sum(len(v) for v in out.values() if isinstance(v, list))} comments)")


if __name__ == "__main__":
    p = argparse.ArgumentParser(); sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check").set_defaults(f=cmd_check)
    u = sub.add_parser("upload"); u.add_argument("ep"); u.add_argument("--title", required=True)
    u.add_argument("--description", default=""); u.add_argument("--tags", default="")
    u.add_argument("--publish-at"); u.add_argument("--privacy", default="public", choices=["public", "private", "unlisted"])
    u.set_defaults(f=cmd_upload)
    sub.add_parser("stats").set_defaults(f=cmd_stats)
    lk = sub.add_parser("link"); lk.add_argument("ep"); lk.add_argument("video"); lk.set_defaults(f=cmd_link)
    c = sub.add_parser("comments"); c.add_argument("n", nargs="?", type=int, default=5); c.set_defaults(f=cmd_comments)
    a = p.parse_args(); a.f(a)
