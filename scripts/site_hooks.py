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
