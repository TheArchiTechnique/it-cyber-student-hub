"""Render the canonical root README and keep repository-relative links portable."""
from pathlib import Path
import os
import re
from urllib.parse import unquote
from mkdocs.structure.files import File

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r'(!?\[[^\]]*\]\()([^\s)]+)(\))')


def on_files(files, config):
    files.append(File.generated(config, 'README.md', content=(ROOT / 'README.md').read_text()))
    return files


def on_page_markdown(markdown, page, config, files):
    # Only the homepage lives outside docs/. No second maintained homepage exists.
    source = ROOT / 'README.md' if page.file.src_uri == 'README.md' else ROOT / 'docs' / page.file.src_uri
    destination_dir = (ROOT / 'docs' / page.file.src_uri).parent

    def rewrite(match):
        target, separator, anchor = match[2].partition('#')
        if not target or ':' in target or target.startswith('/'):
            return match[0]
        resolved = (source.parent / unquote(target)).resolve()
        if resolved == ROOT / 'README.md':
            resolved = ROOT / 'docs' / 'README.md'
        else:
            try:
                resolved.relative_to(ROOT / 'docs')
            except ValueError:
                return match[0]
        relative = os.path.relpath(resolved, destination_dir).replace(os.sep, '/')
        return match[1] + relative + (separator + anchor if separator else '') + match[3]

    return LINK.sub(rewrite, markdown)


PBQ_NAV_STYLE = """<style>
.hub-pbq-nav{position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px;background:#132f3bf2;border:1px solid #597581;border-radius:12px;box-shadow:0 8px 28px #071a2440;font:600 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif}
.hub-pbq-nav a{display:inline-flex;align-items:center;min-height:38px;padding:9px 12px;border:1px solid #6f8b96;border-radius:8px;color:#fff!important;background:#1d4352;text-decoration:none!important;white-space:nowrap}
.hub-pbq-nav a:hover{background:#28576a}
.hub-pbq-nav a:focus-visible{outline:3px solid #f0b84b;outline-offset:2px}
.hub-pbq-nav a[data-pbq-nav="certification"]{background:#087568;border-color:#249b8c}
.hub-pbq-nav a[data-pbq-nav="certification"]:hover{background:#075f55}
@media(max-width:560px){.hub-pbq-nav{left:10px;right:10px;bottom:10px;justify-content:center}.hub-pbq-nav a{flex:1 1 auto;justify-content:center;padding:8px 9px;font-size:12px}}
</style>"""

CERTIFICATION_LABELS = {
    'a-plus-core-1': 'A+ Core 1',
    'a-plus-core-2': 'A+ Core 2',
    'network-plus': 'Network+',
    'security-plus': 'Security+',
    'cysa-plus': 'CySA+',
}


def _certification_label(slug):
    return CERTIFICATION_LABELS.get(slug, slug.replace('-', ' ').title())


def _pbq_nav(certification):
    label = _certification_label(certification)
    return (
        PBQ_NAV_STYLE
        + '<nav class="hub-pbq-nav" aria-label="Student Hub navigation" data-pbq-nav-container>'
        + f'<a data-pbq-nav="certification" href="../../">← {label} PBQs</a>'
        + '<a data-pbq-nav="overview" href="../">Activity overview</a>'
        + '<a data-pbq-nav="home" href="../../../../../">Student Hub</a>'
        + '</nav>'
    )


def on_post_build(config):
    """Give every standalone PBQ a reliable way back into the Student Hub."""
    site = Path(config['site_dir'])
    pbq_root = site / 'practice' / 'pbqs'
    if not pbq_root.exists():
        return

    for app in pbq_root.glob('*/*/app/index.html'):
        html = app.read_text()
        if 'data-pbq-nav-container' in html:
            continue
        relative = app.relative_to(pbq_root)
        certification = relative.parts[0]
        nav = _pbq_nav(certification)
        if '</body>' in html:
            html = html.replace('</body>', nav + '</body>', 1)
        else:
            html += nav
        app.write_text(html)
