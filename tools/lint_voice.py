"""Check that narration text says exactly what should be spoken, before any TTS run.
george (26 Nov): "Mt. Gox" was read as a sentence end; be clear about exactly what we want said.
TTS engines guess at abbreviations, digits, symbols and acronyms, so write them out as spoken:
  "Mt. Gox" -> "Mount Gox" (or "M T Gox"), "3.5%" -> "three point five percent", "1939" -> "nineteen
  thirty-nine", "NASA" -> "nasa" via pronounce, "Dr." -> "Doctor", "vs" -> "versus".
Names and odd words: add a phonetic spelling to script.json "pronounce" {"Gox": "gocks"}; words listed
there are not flagged. Errors exit 1; pipeline/tts.py runs this first (VOICE_LINT=0 skips it).
Usage: python3 tools/lint_voice.py EP_DIR [EP_DIR ...]"""
import json, re, sys

ABBR = r"(?:Mt|Mr|Mrs|Ms|Dr|St|Jr|Sr|Prof|Gen|Col|Capt|Lt|Sgt|Gov|Sen|Rep|Rev|Fr|Ft|Mtn|Ave|Rd|Blvd|No|Nos|vs|etc|approx|est|dept|Inc|Ltd|Co|Corp|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|ft|lb|lbs|oz|km|cm|mm|kg|mph|min|sec|hr|hrs)"
RULES = [
    ('error', re.compile(rf"\b{ABBR}\.(?=\s|$)"), 'abbreviation with a period: the voice may stop the sentence there; write the word out'),
    ('error', re.compile(r"\b(?:e\.g|i\.e|a\.m|p\.m|U\.S|U\.K|D\.C)\.?", re.I), 'dotted abbreviation: write out what should be said'),
    ('error', re.compile(r"\b[A-Z]\.\s?(?=[A-Z][a-z]|[A-Z]\.)"), 'initial with a period (e.g. "J. R."): write it as spoken'),
    ('error', re.compile(r"\.\s+[a-z]"), 'period followed by a lowercase word: probably an abbreviation, the voice will pause'),
    ('error', re.compile(r"\d+(?:[.,:]\d+)*"), 'digits: write numbers, years, decimals and times as words'),
    ('error', re.compile(r"[%$£€&@#/+=°×~^<>|\\]"), 'symbol: write it as a word (percent, dollars, and, degrees...)'),
    ('warn', re.compile(r"\b[A-Z]{2,}s?\b"), 'all-caps word: an acronym is read letter-by-letter or guessed; spell it out or add it to "pronounce" (ignore if it is emphasis)'),
]

def lint(ep):
    s = json.load(open(f'{ep}/script.json'))
    ok = {w.lower() for w in s.get('pronounce', {})}
    n_err = 0
    for i, b in enumerate(s.get('beats', [])):
        for ln in b.get('lines', []):
            t = ln.get('text', '')
            for lvl, rx, why in RULES:
                for m in rx.finditer(t):
                    word = re.findall(r"[\w']+", t[max(0, m.start() - 12):m.end() + 12])
                    if any(w.lower() in ok for w in re.findall(r"[\w']+", m.group(0))): continue
                    n_err += lvl == 'error'
                    print(f'{ep} beat {i} {lvl.upper()}: "{m.group(0).strip()}" in "...{t[max(0, m.start() - 25):m.end() + 25]}..." -> {why}')
    return n_err

if __name__ == '__main__':
    errs = sum(lint(e.rstrip('/')) for e in sys.argv[1:])
    print(f'{errs} error(s)'); sys.exit(1 if errs else 0)
