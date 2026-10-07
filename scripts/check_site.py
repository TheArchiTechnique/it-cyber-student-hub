"""Crawl built local links and fragments, including the GitHub project subpath."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, urljoin
import json
import re
import yaml

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
CONFIG = yaml.safe_load((ROOT / 'mkdocs.yml').read_text())
BASE = CONFIG['site_url']
BASE_URL = urlsplit(BASE)


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = set()
        self.links = []
        self.umami_scripts = []
        self.h1 = 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'h1':
            self.h1 += 1
        if tag == 'script' and attrs.get('src') == 'https://cloud.umami.is/script.js':
            self.umami_scripts.append(attrs)
        for key in ('href', 'src'):
            if key in attrs:
                self.links.append(attrs[key])


pages = {p.resolve(): Page(p) for p in SITE.rglob('*.html')}
errors = []
count = 0
for source, page in pages.items():
    relative = source.relative_to(SITE).as_posix()
    source_url = BASE + (relative[:-10] if relative.endswith('index.html') else relative)
    if relative != '404.html':
        if len(page.umami_scripts) != 1:
            errors.append(f'{relative}: expected one Umami tracking script, found {len(page.umami_scripts)}')
        else:
            tracker = page.umami_scripts[0]
            expected = {
                'data-website-id': '69ab1f0a-0887-424d-a103-f0c287dc4271',
                'data-domains': 'thearchitechnique.github.io',
                'data-exclude-search': 'true',
                'data-exclude-hash': 'true',
                'data-do-not-track': 'true',
            }
            for name, value in expected.items():
                if tracker.get(name) != value:
                    errors.append(f'{relative}: invalid Umami tracking attribute {name}')
        # A card must remain a real list item across Markdown engines.
        source_path = ROOT / 'README.md' if relative == 'index.html' else ROOT / 'docs' / (relative[:-10] + 'README.md' if relative.endswith('index.html') else relative)
        if not source_path.exists() and relative.endswith('/index.html'):
            source_path = ROOT / 'docs' / (relative[:-11] + '.md')
        if source_path.exists() and source_path.name == 'README.md':
            expected_cards = len(re.findall(r'^- \[', source_path.read_text(), re.M))
            content = source.read_text().split('<div class="hub-page', 1)[1].split('</div>', 1)[0]
            if content.count('<li>') != expected_cards:
                errors.append(f'{relative}: Markdown list/card structure changed')
    if re.fullmatch(r'practice/pbqs/[^/]+/[^/]+/app/index\\.html', relative):
        runtime = source.read_text()
        for marker in ('certification', 'overview', 'home'):
            if f'data-pbq-nav="{marker}"' not in runtime:
                errors.append(f'{relative}: missing PBQ navigation target {marker}')
    if page.h1 != 1:
        errors.append(f'{relative}: expected one page heading, found {page.h1}')
    for link in page.links:
        if not link or link.startswith(('mailto:', 'data:', 'javascript:')):
            continue
        target_url = urlsplit(urljoin(source_url, link))
        if target_url.netloc != BASE_URL.netloc:
            continue
        if not target_url.path.startswith(BASE_URL.path):
            errors.append(f'{relative}: escapes project subpath: {link}')
            continue
        dest = SITE / unquote(target_url.path[len(BASE_URL.path):])
        if dest.is_dir():
            dest /= 'index.html'
        dest = dest.resolve()
        if not dest.is_file():
            errors.append(f'{relative}: missing {link}')
        elif target_url.fragment and dest in pages and unquote(target_url.fragment) not in pages[dest].ids:
            errors.append(f'{relative}: missing fragment {link}')
        count += 1
search = json.loads((SITE / 'search/search_index.json').read_text())
indexed = {d['location'].split('#')[0] for d in search['docs']}
for p in pages:
    rel = p.relative_to(SITE).as_posix()
    if rel == '404.html':
        continue
    # Interactive PBQ runtimes are copied static HTML, not MkDocs content pages.
    # Their Markdown landing pages are indexed; the app HTML itself is not.
    if '/app/' in rel:
        continue
    location = rel[:-10] if rel.endswith('index.html') else rel
    if location not in indexed:
        errors.append(f'{rel}: absent from search index')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Passed: {len(pages)} HTML pages; {count} local links/assets/fragments; search index coverage and project subpath.')
