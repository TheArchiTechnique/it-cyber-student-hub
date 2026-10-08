"""Authoritative publication model for Pages, GitBook and repository navigation.

Only resources seed availability. Categories aggregate resources, never their own
navigation prose. Hidden fragments retain their source for automatic regeneration.
"""
from pathlib import Path, PurePosixPath
import json
import posixpath
import re
from urllib.parse import unquote, urlsplit

import markdown
import yaml

ROOT = Path(__file__).resolve().parents[1]
HIDDEN = re.compile(r'<!-- hub:hidden\n(.*?)\nhub:hidden -->(\n?)', re.S)
LINK = re.compile(r'(?<!!)\[([^\]\n]+)\]\(([^\s)]+)\)')
FRONT = re.compile(r'\A---\n(.*?)\n---\n', re.S)


def canonical(text):
    """Recover dormant source, including any nested generator boundaries."""
    while HIDDEN.search(text):
        text = HIDDEN.sub(lambda m: m[1].replace('&lt;!--', '<!--').replace('--&gt;', '-->').replace('&#32;', ' ').replace('&#9;', '\t') + (m[2] if not m[1].endswith('\n') else ''), text)
    # Generated discovery is output, never publication evidence or dormant source.
    text = re.sub(r'<!-- BEGIN AVAILABLE RESOURCES -->.*?<!-- END AVAILABLE RESOURCES -->\n?', '', text, flags=re.S)
    return text


def hidden(text):
    escaped = text.replace('<!--', '&lt;!--').replace('-->', '--&gt;')
    escaped = re.sub(r'[ \t]+$', lambda m: ''.join('&#32;' if c == ' ' else '&#9;' for c in m[0]), escaped, flags=re.M)
    return '<!-- hub:hidden\n' + escaped + '\nhub:hidden -->'


def split_page(text):
    text = canonical(text)
    match = FRONT.match(text)
    if not match:
        return {}, text, ''
    return yaml.safe_load(match[1]) or {}, text[match.end():], match[0]


def published_markdown(text):
    """Visible output only; never recover dormant navigation for a renderer."""
    text = FRONT.sub('', text, count=1)
    return re.sub(r'<!--.*?-->', '', text, flags=re.S)


def nav_paths(items):
    return [path for item in items for value in item.values()
            for path in (nav_paths(value) if isinstance(value, list) else [value])]


class Availability:
    def __init__(self, root=ROOT, catalog=None):
        self.root = Path(root).resolve()
        self.docs = self.root / 'docs'
        self.pages = {'README.md': self.root / 'README.md'}
        self.pages.update({p.relative_to(self.docs).as_posix(): p
                           for p in sorted(self.docs.rglob('*.md'))
                           if not p.is_relative_to(self.docs / 'assets')})
        self.text = {key: canonical(path.read_text()) for key, path in self.pages.items()}
        self.meta = {}
        self.bodies = {}
        for key, text in self.text.items():
            meta, body, _ = split_page(text)
            hub = meta.get('hub', {})
            if not isinstance(hub, dict) or set(hub) - {'kind', 'status'}:
                raise ValueError(f'{key}: hub metadata supports only kind and status')
            kind = hub.get('kind', 'category')
            status = hub.get('status', 'published')
            if kind not in ('category', 'resource') or status not in ('published', 'placeholder', 'draft', 'unpublished', 'archived'):
                raise ValueError(f'{key}: invalid hub kind/status')
            self.meta[key] = {'kind': kind, 'status': status}
            self.bodies[key] = body
        catalog_path = self.docs / 'assets/data/pbqs.json'
        self.catalog = catalog if catalog is not None else json.loads(catalog_path.read_text()) if catalog_path.exists() else {'activities': [], 'certifications': {}}
        self.app_status = {}
        self.associations = {}
        for activity in self.catalog['activities']:
            key = activity['activityPath'] + 'README.md'
            # The PBQ catalog remains authoritative; no second publication flag.
            if key in self.meta:
                self.meta[key] = {'kind': 'resource', 'status': activity['status']}
            self.app_status[activity['launchPath']] = activity['status'] == 'published'
            if activity['status'] == 'published':
                for assoc in activity['certificationAssociations']:
                    index = self.catalog['certifications'][assoc['certification']]['pbqIndexPath']
                    self.associations.setdefault(index, set()).add(key)
        self.visible = {key for key, meta in self.meta.items()
                        if meta == {'kind': 'resource', 'status': 'published'}} | {'README.md'}
        self.dependencies = {}
        catalog_indexes = {cert['pbqIndexPath'] for cert in self.catalog['certifications'].values()}
        for key, meta in self.meta.items():
            if meta['kind'] != 'category' or meta['status'] not in ('published', 'placeholder'):
                continue
            directory = PurePosixPath(key).parent.as_posix() + '/'
            dependencies = {other for other in self.pages if other != key and other.startswith(directory)}
            dependencies.update(self.associations.get(key, ()))
            # Placeholders cannot become available through their return/related links.
            # PBQ indexes are available through their activities/associations,
            # never through related Labs or other cross-section navigation.
            if meta['status'] == 'published' and key not in catalog_indexes:
                for match in LINK.finditer(self.bodies[key]):
                    if match[1].startswith(('Back to ', 'Return to ')) or match[1] == 'Student Hub':
                        continue
                    target = self.target(key, match[2])
                    if target in self.pages and not self.is_parent(key, target):
                        dependencies.add(target)
            self.dependencies[key] = dependencies
        # A least fixed point prevents navigation cycles from publishing empty hubs.
        while True:
            revealed = {key for key, deps in self.dependencies.items() if deps & self.visible}
            if revealed <= self.visible:
                break
            self.visible.update(revealed)

    def is_parent(self, source, target):
        if target == 'README.md' or target == source:
            return True
        directory = PurePosixPath(target).parent.as_posix() + '/'
        return target.endswith('/README.md') and source.startswith(directory)

    def target(self, source, href):
        url = urlsplit(href)
        if url.scheme or url.netloc or href.startswith('/'):
            return None
        if not url.path:
            return source
        base = self.root if source == 'README.md' else (self.docs / source).parent
        resolved = (base / unquote(url.path)).resolve()
        if resolved == self.root / 'README.md':
            return 'README.md'
        if not resolved.is_relative_to(self.docs):
            return None
        return resolved.relative_to(self.docs).as_posix()

    def available_target(self, source, href):
        target = self.target(source, href)
        if target in self.pages:
            return target in self.visible
        for prefix, available in self.app_status.items():
            if target and target.startswith(prefix):
                return available
        return True  # External educational resources and ordinary assets stay intact.

    def render(self, key, text=None):
        """Keep hidden source in comments; emit the same visible Markdown everywhere."""
        meta, body, front = split_page(self.text[key] if text is None else text)
        # Cards are flat Markdown list items with indented descriptions. Only the
        # navigation card is hidden; instructional lists retain their content.
        card = re.compile(r'^- \[[^\n]+\]\([^\n]+\)[^\n]*\n(?:\n|[ \t]+[^\n]*\n)*', re.M)
        dormant = {}
        def hide(text, comment=False):
            for token, value in reversed(list(dormant.items())):
                text = text.replace(token, value)
            token = f'@@HUB_DORMANT_{len(dormant)}@@'
            dormant[token] = text if comment else hidden(canonical(text))
            return token
        # Existing comments (including placeholder prose and PBQ boundaries) are
        # opaque during link/section filtering.
        body = re.sub(r'<!--.*?-->', lambda m: hide(m[0], comment=True), body, flags=re.S)
        body = card.sub(lambda m: hide(m[0]) + '\n' if any(
            not self.available_target(key, link[2]) for link in LINK.finditer(m[0])) else m[0], body)
        # Inline navigation in prose/footers preserves text but removes unavailable links.
        inline = re.compile(r'( and | · )?(?<!!)\[([^\]\n]+)\]\(([^\s)]+)\)( · )?')
        def filter_inline(match):
            if self.available_target(key, match[3]):
                return match[0]
            # Preserve a separator between surviving links, while dropping a
            # leading separator when the first footer destination is unavailable.
            trailing = match[4] or ''
            if match[1] and trailing:
                return hide(match[0][:-len(trailing)]) + trailing
            return hide(match[0])
        body = inline.sub(filter_inline, body)
        # Hide explicitly marked future-content prose, and sections with no remaining
        # visible body. HTML comments are ignored by both Markdown renderers.
        body = self._empty_sections(body, hide)
        # A self-link to a removed section must disappear with its card.
        visible_body = re.sub(r'@@HUB_DORMANT_\d+@@', '', body)
        html = markdown.markdown(visible_body, extensions=['toc', 'tables', 'fenced_code'])
        ids = set(re.findall(r'\bid="([^"]+)"', html))
        body = card.sub(lambda m: hide(m[0]) + '\n' if any(
            link[2].startswith('#') and unquote(link[2][1:]) not in ids
            for link in LINK.finditer(m[0])) else m[0], body)
        for token, value in reversed(list(dormant.items())):
            body = body.replace(token, value)
        if key.endswith('/README.md') and key in self.visible:
            body = self._add_resources(key, body)
        return front + body

    @staticmethod
    def _empty_sections(body, hide):
        # Process deepest headings first, preserving all canonical source.
        for level in range(6, 1, -1):
            pattern = re.compile(r'^' + '#' * level + r' [^\n]+\n.*?(?=^#{1,' + str(level) + r'} |^\[Back to |\Z)', re.M | re.S)
            def prune(match):
                section = match[0]
                content = section.partition('\n')[2]
                content = re.sub(r'@@HUB_DORMANT_\d+@@', '', content).strip()
                return hide(section) + '\n' if not content else section
            body = pattern.sub(prune, body)
        return body

    def _add_resources(self, key, body):
        """New files become discoverable without editing another navigation surface."""
        start, end = '<!-- BEGIN AVAILABLE RESOURCES -->', '<!-- END AVAILABLE RESOURCES -->'
        body = re.sub(re.escape(start) + r'.*?' + re.escape(end) + r'\n?', '', body, flags=re.S)
        directory = PurePosixPath(key).parent
        linked = {self.target(key, m[2]) for m in LINK.finditer(re.sub(r'<!--.*?-->', '', body, flags=re.S))}
        children = [other for other in sorted(self.visible) if other != key
                    and PurePosixPath(other).parent == directory and other not in linked]
        children += [other for other in sorted(self.visible) if other.endswith('/README.md')
                     and PurePosixPath(other).parent.parent == directory and other not in linked]
        if not children:
            return body
        lines = [start, '', '## Available Resources', '']
        for other in children:
            title = re.search(r'^# (.+)$', self.bodies[other], re.M)
            title = title[1] if title else PurePosixPath(other).stem
            target = posixpath.relpath(other, directory.as_posix())
            if key == 'README.md':
                target = 'docs/' + other
            lines.extend([f'- [{title}]({target})', ''])
        lines.extend([end, ''])
        # Keep the usual parent-navigation footer last.
        footer = re.search(r'^\[Back to .*', body, re.M)
        offset = footer.start() if footer else len(body)
        return body[:offset].rstrip() + '\n\n' + '\n'.join(lines) + '\n' + body[offset:]

    def navigation(self, items):
        """Filter configured navigation and insert newly published pages once."""
        def prune(items):
            result = []
            for item in items:
                for label, value in item.items():
                    if isinstance(value, list):
                        children = prune(value)
                        if children:
                            result.append({label: children})
                    elif value in self.visible or urlsplit(value).scheme:
                        result.append({label: value})
            return result
        nav = prune(items)
        covered = set(nav_paths(nav))
        def insert(items, key):
            directory = PurePosixPath(key).parent
            if key.endswith('/README.md'):
                directory = directory.parent
            for item in items:
                for label, value in list(item.items()):
                    if isinstance(value, list):
                        if insert(value, key):
                            return True
                        overview = next((v for entry in value for v in entry.values() if isinstance(v, str) and v.endswith('README.md')), None)
                        if overview and PurePosixPath(overview).parent == directory:
                            value.append({self.title(key): key})
                            return True
                    elif value.endswith('README.md') and PurePosixPath(value).parent == directory:
                        item[label] = [{'Overview': value}, {self.title(key): key}]
                        return True
            return False
        # Parents first so nested new sections can receive their children.
        for key in sorted(self.visible - covered, key=lambda p: (p.count('/'), p)):
            if not insert(nav, key):
                nav.append({self.title(key): key})
        return nav

    def title(self, key):
        title = re.search(r'^# (.+)$', self.bodies[key], re.M)
        return title[1] if title else PurePosixPath(key).stem

    def generated_pages(self):
        return {path: self.render(key) for key, path in self.pages.items()}
