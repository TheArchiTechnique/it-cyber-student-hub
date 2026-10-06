"""Check repository Markdown links, GitBook coverage, and current scope."""
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import markdown
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]


class Links(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.targets = []
        self.ids = set()
        self.feed(markdown.markdown(text, extensions=['fenced_code', 'tables', 'toc']))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        key = 'href' if tag == 'a' else 'src' if tag == 'img' else None
        if key and key in attrs:
            self.targets.append(attrs[key])


sources = sorted([*ROOT.glob('*.md'), *ROOT.glob('maintenance/*.md'), *ROOT.glob('docs/**/*.md')])
parsed = {p.resolve(): Links(p.read_text()) for p in sources}
errors = []
count = 0
for source, document in parsed.items():
    for href in document.targets:
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        target = (source.parent / unquote(url.path)).resolve() if url.path else source
        if not target.is_file():
            errors.append(f'{source.relative_to(ROOT)}: missing {href}')
        elif url.fragment and target in parsed and unquote(url.fragment) not in parsed[target].ids:
            errors.append(f'{source.relative_to(ROOT)}: missing anchor {href}')
        count += 1
summary_paths = re.findall(r'\]\(([^)]+)\)', (ROOT / 'SUMMARY.md').read_text())
expected = {str(p.relative_to(ROOT)) for p in sources if p == ROOT / 'README.md' or (p.is_relative_to(ROOT / 'docs') and not p.is_relative_to(ROOT / 'docs/assets'))}
if set(summary_paths) != expected or len(summary_paths) != len(set(summary_paths)):
    errors.append('SUMMARY.md must include every student page exactly once.')
vendors = {p.name for p in (ROOT / 'docs/certifications').iterdir() if p.is_dir()}
if vendors != {'comptia'}:
    errors.append('Phase 1 must contain only the CompTIA vendor.')
ascii_pages = {str(p.relative_to(ROOT)) for p in sources if '```text' in p.read_text() and str(p.relative_to(ROOT)) in expected}
allowed = {'README.md'} | {str(p.relative_to(ROOT)) for p in ROOT.glob('docs/certifications/comptia/*/README.md')}
if ascii_pages != allowed:
    errors.append('ASCII headers must occur only on Home and the five certification pages.')
# Standalone PBQ apps must provide explicit navigation out of the activity.
pbq_apps = sorted(ROOT.glob('docs/practice/pbqs/*/*/app/index.html'))
for app in pbq_apps:
    html = app.read_text()
    for marker in ('certification', 'overview', 'home'):
        matches = re.findall(rf'data-pbq-nav=["\\']{marker}["\\']', html)
        if len(matches) != 1:
            errors.append(f'{app.relative_to(ROOT)}: expected one data-pbq-nav="{marker}" link, found {len(matches)}')

if errors:
    raise SystemExit('\n'.join(errors))
print(f'Passed: {count} local Markdown links; {len(expected)} student pages covered once in GitBook; {len(pbq_apps)} PBQ apps include exit navigation; Phase 1 scope and headers.')
