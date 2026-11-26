"""Fetch recorded sound effects that are free to use without attribution (CC0 / public domain) for
set videos. Runs on GitHub Actions (.github/workflows/sfx.yml); Claude sessions can't reach these hosts.

Sources:
  - Wikimedia Commons audio files whose licence is CC0 or public domain (checked per file).
  - Kenney CC0 sound packs (zip link scraped from the asset page).
  - OpenGameArt entries filtered to CC0.
Keywords come from sfx-keywords.txt (one "folder: search words" per line), so any thread can add
what its video needs. Output: OUT/<folder>/*.(ogg|wav|flac|mp3) + OUT/manifest.json, all converted
to 48 kHz mono 16-bit wav (ffmpeg) with the original kept out to save space.
Usage: python3 tools/fetch_sfx.py [OUT]"""
import io, json, os, re, subprocess, sys, time, urllib.parse, urllib.request, zipfile
OUT = sys.argv[1] if len(sys.argv) > 1 else 'sfx'
UA = {'User-Agent': 'world-of-how-sfx-fetch/1.0 (CC0 sound effects for an educational channel)'}
PACE = float(os.environ.get('SFX_PACE', '1.5'))   # seconds between Commons downloads (it rate-limits bursts)
DEADLINE = time.time() + 60 * float(os.environ.get('SFX_MINUTES', '55'))   # stop searching in time to publish
man = []; seen = set(); total = [0]; MAX_FILE = 25 * 2**20; MAX_LEN = 90  # seconds

def get(url, binary=True, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                b = r.read(); return b if binary else b.decode('utf-8', 'replace')
        except Exception as e:
            print('  retry', k, url[:120], e)
            if getattr(e, 'code', 0) == 429:   # Commons rate limit: honour Retry-After, back off hard
                ra = (getattr(e, 'headers', None) or {}).get('Retry-After') or ''
                time.sleep(min(120, int(ra)) if ra.isdigit() else 20 + k * 30)
            else: time.sleep(2 + k * 3)
    return None

def slug(s): return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')[:60]

def save(folder, name, data, src, lic, author=''):
    if not data or len(data) > MAX_FILE or os.path.basename(name).startswith('._'): return False
    key = (folder, slug(name))
    if key in seen: return False
    seen.add(key)
    d = os.path.join(OUT, folder); os.makedirs(d, exist_ok=True)
    tmp = os.path.join(d, '_in' + os.path.splitext(name)[1].lower()); open(tmp, 'wb').write(data)
    out = os.path.join(d, slug(os.path.splitext(name)[0]) + '.wav')
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-t', str(MAX_LEN), '-ac', '1', '-ar', '48000', '-sample_fmt', 's16', out])
    os.remove(tmp)
    if r.returncode or not os.path.exists(out) or os.path.getsize(out) < 2000:
        if os.path.exists(out): os.remove(out)
        return False
    total[0] += os.path.getsize(out)
    man.append({'file': os.path.relpath(out, OUT), 'folder': folder, 'source': src, 'license': lic, 'author': author})
    print('saved', os.path.relpath(out, OUT), os.path.getsize(out) // 1024, 'KB', lic); return True

# ---------------- Wikimedia Commons ----------------
CAPI = 'https://commons.wikimedia.org/w/api.php'
OK_LIC = re.compile(r'^(cc0|cc-zero|public domain|pd\b|pd-)', re.I)
def commons(folder, q, n):
    got = 0; cont = ''
    for _ in range(3):
        url = (f'{CAPI}?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=50&gsrsearch='
               + urllib.parse.quote(f'filetype:audio {q}') + cont
               + '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|Artist|UsageTerms')
        j = get(url, False)
        if not j: return got
        j = json.loads(j)
        for p in sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0)):
            ii = (p.get('imageinfo') or [{}])[0]; md = ii.get('extmetadata', {})
            lic = (md.get('LicenseShortName') or {}).get('value', '')
            if not OK_LIC.match(lic.strip()): continue
            if ii.get('size', 0) > MAX_FILE: continue
            words = [w[:5] for w in re.findall(r'[a-z]+', q.lower()) if len(w) > 2]
            if words and not any(w in p['title'].lower() for w in words): continue   # search is fuzzy: keep files named for the sound
            if time.time() > DEADLINE: return got
            time.sleep(PACE)
            if save(folder, p['title'].split(':', 1)[-1], get(ii['url']), ii.get('descriptionurl', ii['url']), lic,
                     re.sub('<[^>]+>', '', (md.get('Artist') or {}).get('value', ''))[:120]):
                got += 1
                if got >= n: return got
        c = j.get('continue')
        if not c: return got
        cont = '&gsroffset=' + str(c.get('gsroffset', ''))
    return got

# ---------------- Kenney (CC0) ----------------
def kenney(slug_):
    html = get(f'https://kenney.nl/assets/{slug_}', False) or ''
    links = re.findall(r'["\'(]([^"\'()\s]+?\.zip)["\')]', html)
    if not links: print('kenney: no zip link for', slug_); return
    z = get(urllib.parse.urljoin('https://kenney.nl/', links[0]))
    try:
        with zipfile.ZipFile(io.BytesIO(z)) as zf:
            for nm in zf.namelist():
                if nm.lower().endswith(('.ogg', '.wav', '.mp3', '.flac')):
                    save(f'kenney_{slug(slug_)}', os.path.basename(nm), zf.read(nm), f'https://kenney.nl/assets/{slug_}', 'CC0', 'Kenney')
    except Exception as e: print('kenney zip fail', slug_, e)

# ---------------- OpenGameArt (CC0 only) ----------------
OGA = 'https://opengameart.org'
def oga(folder, q, n):
    url = f'{OGA}/art-search-advanced?keys={urllib.parse.quote(q)}&field_art_type_tid%5B%5D=13&field_art_licenses_tid%5B%5D=4&sort_by=count&sort_order=DESC'
    pages = list(dict.fromkeys(re.findall(r'href="(/content/[a-z0-9\-]+)"', get(url, False) or '')))[:n]
    for page in pages:
        html = get(OGA + page, False) or ''
        lic = re.findall(r'field-name-field-art-licenses.*?</div>\s*</div>', html, re.S)
        if not lic or 'CC0' not in lic[0] or re.search(r'CC-BY|GPL|OGA-BY', lic[0]): continue
        for fu in dict.fromkeys(re.findall(r'href="(https://opengameart\.org/sites/default/files/[^"]+\.(?:ogg|wav|mp3|flac|zip))"', html)):
            data = get(fu)
            if not data: continue
            if fu.endswith('.zip'):
                try:
                    with zipfile.ZipFile(io.BytesIO(data)) as zf:
                        for nm in [x for x in zf.namelist() if x.lower().endswith(('.ogg', '.wav', '.mp3', '.flac'))][:12]:
                            save(folder, os.path.basename(nm), zf.read(nm), OGA + page, 'CC0')
                except Exception as e: print('oga zip fail', fu, e)
            else: save(folder, urllib.parse.unquote(os.path.basename(fu)), data, OGA + page, 'CC0')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for s in ['impact-sounds', 'rpg-audio', 'interface-sounds', 'casino-audio', 'sci-fi-sounds', 'digital-audio', 'music-jingles']:
        kenney(s)   # first: no rate limit, so these always arrive
    kw = [l.split(':', 1) for l in open(os.environ.get('SFX_KEYWORDS', 'sfx-keywords.txt')) if ':' in l and not l.startswith('#')]
    for folder, qs in kw:
        folder = slug(folder)
        for q in [x.strip() for x in qs.split('|') if x.strip()]:
            got = commons(folder, q, 4)
            print(f'[{folder}] commons "{q}": {got}', flush=True)
        if time.time() < DEADLINE: oga(folder, qs.split('|')[0].strip(), 2)
    json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    by = {}
    for m in man: by[m['folder']] = by.get(m['folder'], 0) + 1
    print(json.dumps(by, indent=1)); print('total', len(man), 'files', total[0] // 2**20, 'MB')
