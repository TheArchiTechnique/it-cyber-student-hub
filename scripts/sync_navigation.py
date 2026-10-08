"""Generate GitBook navigation from the MkDocs navigation; --check detects drift."""
from pathlib import Path
import argparse
import yaml
if __package__:
    from .content_visibility import Availability
else:
    from content_visibility import Availability

ROOT = Path(__file__).resolve().parents[1]


def summary(availability=None):
    availability = availability or Availability(ROOT)
    nav = availability.navigation(yaml.safe_load((availability.root / 'mkdocs.yml').read_text())['nav'])
    lines = ['# Summary', '']

    def visit(items, depth=0):
        for item in items:
            for title, value in item.items():
                if isinstance(value, list):
                    first = next(iter(value[0].values()))
                    lines.append(f'{"  " * depth}- [{title}](docs/{first})')
                    visit(value[1:], depth + 1)
                else:
                    path = value if value == 'README.md' else 'docs/' + value
                    lines.append(f'{"  " * depth}- [{title}]({path})')
    visit(nav)
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    target = ROOT / 'SUMMARY.md'
    availability = Availability(ROOT)
    expected = summary(availability)
    pages = availability.generated_pages()
    if args.check:
        if not target.exists() or target.read_text() != expected:
            raise SystemExit('SUMMARY.md is out of date. Run: python scripts/sync_navigation.py')
        stale = [str(path.relative_to(ROOT)) for path, text in pages.items() if path.read_text() != text]
        if stale:
            raise SystemExit('Content visibility is out of date: ' + ', '.join(stale) + '. Run: python scripts/sync_navigation.py')
        print('Content visibility and GitBook navigation are current.')
    else:
        target.write_text(expected)
        for path, text in pages.items():
            if path.read_text() != text:
                path.write_text(text)
        print(f'Updated content visibility and SUMMARY.md: {len(availability.visible)} published pages.')
