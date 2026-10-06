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
.hub-pbq-nav{background:#132f3b;border-bottom:1px solid #365767;color:#fff;font:600 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif}
.hub-pbq-nav-inner{max-width:1440px;margin:0 auto;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px}
.hub-pbq-brand{font-weight:750;letter-spacing:.01em;color:#dce9ee;white-space:nowrap}
.hub-pbq-links{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.hub-pbq-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 11px;border:1px solid #5d7b88;border-radius:7px;color:#fff!important;background:#1b4050;text-decoration:none!important;white-space:nowrap}
.hub-pbq-nav a:hover{background:#28576a}
.hub-pbq-nav a:focus-visible{outline:3px solid #f0b84b;outline-offset:2px}
.hub-pbq-nav a[data-pbq-nav="certification"]{background:#087568;border-color:#249b8c}
.hub-pbq-nav a[data-pbq-nav="certification"]:hover{background:#075f55}
@media(max-width:700px){.hub-pbq-nav-inner{align-items:flex-start;flex-direction:column;padding:8px 14px}.hub-pbq-links{width:100%;justify-content:flex-start}.hub-pbq-nav a{flex:1 1 auto;min-width:130px}}
@media(max-width:460px){.hub-pbq-brand{font-size:12px}.hub-pbq-links{display:grid;grid-template-columns:1fr}.hub-pbq-nav a{width:100%;min-width:0}}
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
        + '<div class="hub-pbq-nav-inner">'
        + '<span class="hub-pbq-brand">IT &amp; Cybersecurity Student Hub</span>'
        + '<div class="hub-pbq-links">'
        + f'<a data-pbq-nav="certification" href="../../">← {label} PBQs</a>'
        + '<a data-pbq-nav="overview" href="../">Activity overview</a>'
        + '<a data-pbq-nav="home" href="../../../../../">Student Hub</a>'
        + '</div></div></nav>'
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
        body_match = re.search(r'<body\b[^>]*>', html, re.I)
        if body_match:
            html = html[:body_match.end()] + nav + html[body_match.end():]
        else:
            html = nav + html
        app.write_text(html)
