#!/usr/bin/env python3
"""Turn an outside narration (e.g. an ElevenLabs take) into voice.wav + timeline.json for an episode.

    python3 tools/align_voice.py EP AUDIO [AUDIO ...] [--model DIR] [--out-suffix _x]

AUDIO files (mp3/wav/m4a, in the order given) are joined, then a local speech recogniser
(sherpa-onnx zipformer, model from the k2-fsa GitHub release, no Hugging Face needed) gives word times,
which are matched to the script's words so every beat and word gets real start/end times in the same
timeline.json format pipeline/tts.py writes. Unrecognised words are interpolated between neighbours.

Model: https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-en-2023-06-26.tar.bz2
"""
import sys, os, re, json, argparse, subprocess, difflib, numpy as np, soundfile as sf

SR_OUT, SR_ASR = 24000, 16000


def load(path, sr):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def norm(w): return re.sub(r"[^a-z0-9']", '', w.lower()).replace("'", '')


def segments(a, sr, max_len=22.0, min_sil=0.22):
    """Cut at silences so each piece is under max_len seconds. Returns [(s, e)] in samples."""
    hop = int(0.02 * sr); n = len(a) // hop
    rms = np.sqrt(np.convolve(a[:n * hop].reshape(n, hop).astype(np.float64).__pow__(2).mean(1), np.ones(5) / 5, 'same'))
    thr = max(1e-4, np.percentile(rms, 20) * 2.5, rms.max() * 0.02)
    quiet = rms < thr
    # candidate cut points = centres of quiet runs >= min_sil
    cuts, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if (j - i) * 0.02 >= min_sil: cuts.append(((i + j) // 2, (j - i)))
            i = j
        else: i += 1
    out, start = [], 0
    while start < n:
        lim = start + int(max_len / 0.02)
        if lim >= n: out.append((start * hop, len(a))); break
        cand = [c for c in cuts if start + int(4 / 0.02) < c[0] <= lim]
        cut = max(cand, key=lambda c: (c[1], c[0]))[0] if cand else lim
        out.append((start * hop, cut * hop)); start = cut
    return out


def recognise(a, model):
    import sherpa_onnx
    d = model; pick = lambda p: os.path.join(d, p.replace('.onnx', '.int8.onnx')) if os.path.exists(os.path.join(d, p.replace('.onnx', '.int8.onnx'))) else os.path.join(d, p)
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=pick('encoder-epoch-99-avg-1.onnx'), decoder=pick('decoder-epoch-99-avg-1.onnx'),
                                                         joiner=pick('joiner-epoch-99-avg-1.onnx'), tokens=os.path.join(d, 'tokens.txt'),
                                                         num_threads=os.cpu_count() or 4, decoding_method='greedy_search')
    words = []
    segs = segments(a, SR_ASR)
    for k, (s, e) in enumerate(segs):
        st = rec.create_stream(); st.accept_waveform(SR_ASR, a[s:e]); rec.decode_stream(st)
        r = st.result; t0 = s / SR_ASR
        cur = None
        for tok, ts in zip(r.tokens, r.timestamps):
            if tok[:1] in ('▁', ' ') or cur is None:
                if cur: words.append(cur)
                cur = {'w': tok.lstrip('▁ '), 's': t0 + ts}
            else: cur['w'] += tok
        if cur: words.append(cur)
        print(f'  segment {k + 1}/{len(segs)} {t0:7.1f}s  {len(r.tokens)} tokens', file=sys.stderr)
    for i, w in enumerate(words):
        nxt = words[i + 1]['s'] if i + 1 < len(words) else w['s'] + 0.5
        w['e'] = min(nxt, w['s'] + 0.9)
    return [w for w in words if norm(w['w'])]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('ep'); ap.add_argument('audio', nargs='+')
    ap.add_argument('--model', default=os.environ.get('ASR_MODEL', 'models/sherpa-onnx-zipformer-en-2023-06-26'))
    ap.add_argument('--gap', type=float, default=0.35, help='silence between joined files (s)')
    ap.add_argument('--lead', type=float, default=0.15, help='silence added at the start (s)')
    ap.add_argument('--tail', type=float, default=0.4)
    ap.add_argument('--suffix', default='', help='write voice<suffix>.wav / timeline<suffix>.json')
    o = ap.parse_args()
    script = json.load(open(f'{o.ep}/script.json'))

    parts = []
    for p in o.audio:
        x = load(p, SR_OUT)
        nz = np.where(np.abs(x) > 0.004)[0]                       # trim leading/trailing silence of each file
        if len(nz): x = x[max(0, nz[0] - 480): nz[-1] + 2400]
        parts += [x, np.zeros(int(o.gap * SR_OUT), np.float32)]
    voice = np.concatenate([np.zeros(int(o.lead * SR_OUT), np.float32)] + parts[:-1] + [np.zeros(int(o.tail * SR_OUT), np.float32)])
    pk = np.abs(voice).max()
    if pk > 0.99: voice *= 0.99 / pk
    dur = len(voice) / SR_OUT
    a16 = np.interp(np.arange(int(len(voice) * SR_ASR / SR_OUT)) * SR_OUT / SR_ASR, np.arange(len(voice)), voice).astype(np.float32)

    asr = recognise(a16, o.model)
    sw = [(bi, w) for bi, b in enumerate(script['beats']) for l in b['lines'] for w in l['text'].split()]
    A = [norm(w) for _, w in sw]; Bn = [norm(w['w']) for w in asr]
    sm = difflib.SequenceMatcher(None, A, Bn, autojunk=False)
    t = [None] * len(A)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): t[blk.a + k] = (asr[blk.b + k]['s'], asr[blk.b + k]['e'])
    # near-misses (e.g. names): pair up replaced runs of equal length
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'replace' and i2 - i1 == j2 - j1:
            for k in range(i2 - i1): t[i1 + k] = (asr[j1 + k]['s'], asr[j1 + k]['e'])
    matched = sum(x is not None for x in t)
    # interpolate the rest by syllable-ish weight between known neighbours
    known = [i for i, x in enumerate(t) if x is not None]
    if not known: sys.exit('no words recognised: wrong audio or model?')
    def wgt(w): return max(1, len(re.findall(r'[aeiouy]+', w.lower())))
    i = 0
    while i < len(t):
        if t[i] is None:
            j = i
            while j < len(t) and t[j] is None: j += 1
            a0 = t[i - 1][1] if i > 0 else o.lead
            a1 = t[j][0] if j < len(t) else dur - o.tail
            ws = [wgt(sw[k][1]) for k in range(i, j)]; tot = sum(ws); c = a0
            for k, g in zip(range(i, j), ws):
                d = (a1 - a0) * g / tot; t[k] = (c, c + d); c += d
            i = j
        else: i += 1
    # monotonic clean-up
    last = 0
    for k in range(len(t)):
        s, e = t[k]; s = max(s, last); e = max(e, s + 0.05); t[k] = (s, e); last = s
    beats = []
    for bi, b in enumerate(script['beats']):
        idx = [k for k, (x, _) in enumerate(sw) if x == bi]
        words = [{'w': sw[k][1], 's': round(t[k][0], 3), 'e': round(t[k][1], 3), 'speaker': 'narrator'} for k in idx]
        beats.append({'i': bi, 'start': round(max(0, words[0]['s'] - 0.08), 3) if words else None, 'end': None, 'deathAt': None, 'words': words})
    for bi, b in enumerate(beats):
        b['end'] = beats[bi + 1]['start'] if bi + 1 < len(beats) else round(dur, 3)
    beats[0]['start'] = 0.0 if beats[0]['start'] < 0.3 else beats[0]['start']
    sf.write(f'{o.ep}/voice{o.suffix}.wav', voice, SR_OUT)
    json.dump({'duration': round(dur, 3), 'beats': beats, 'source': 'align_voice', 'matched': round(matched / len(A), 3)},
              open(f'{o.ep}/timeline{o.suffix}.json', 'w'), indent=1)
    print(f'{dur:.1f}s, {len(A)} script words, {len(asr)} heard, {matched / len(A):.1%} matched -> voice{o.suffix}.wav, timeline{o.suffix}.json')
    diff = [(tag, ' '.join(sw[k][1] for k in range(i1, i2)), ' '.join(asr[k]['w'] for k in range(j1, j2))) for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != 'equal']
    big = [d for d in diff if len(d[1].split()) >= 4 or len(d[2].split()) >= 4]
    if big:
        print('Longer differences between script and audio (check these):')
        for tag, a, b in big[:30]: print(f'  {tag}: script "{a[:80]}"  heard "{b[:80].lower()}"')


if __name__ == '__main__':
    main()
