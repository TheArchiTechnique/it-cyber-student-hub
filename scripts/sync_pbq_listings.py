"""Generate portable certification PBQ listings from the authoritative catalog."""
import argparse
import json
from pathlib import Path, PurePosixPath
import posixpath
import re

import yaml

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- BEGIN GENERATED PBQ LISTINGS -->'
END = '<!-- END GENERATED PBQ LISTINGS -->'
NAV_START = '  # BEGIN GENERATED PBQ NAVIGATION'
NAV_END = '  # END GENERATED PBQ NAVIGATION'


def replace_block(content, start, end, body):
    """Require one explicit boundary pair; never replace unrelated page content."""
    if content.count(start) != 1 or content.count(end) != 1:
        raise ValueError(f'Expected one {start} / {end} pair')
    before, rest = content.split(start)
    _, after = rest.split(end)
    return before + start + '\n' + body.rstrip() + '\n' + end + after


def selected(data, certification, relevance):
    return sorted((a for a in data['activities'] if a['status'] == 'published'
                   and any(s['certification'] == certification and s['relevance'] == relevance
                           for s in a['certificationAssociations'])),
                  key=lambda a: (a['title'].casefold(), a['id']))


def inline(text):
    """Keep catalog prose literal and on one Markdown line."""
    return re.sub(r'([\\`*_\[\]<>])', r'\\\1', ' '.join(text.split()))


def render_listings(data, certification, source, overview=False):
    heading = '###' if overview else '##'
    lines = ['', '## Published PBQ Practice', ''] if overview else ['']
    direct = selected(data, certification, 'direct')
    foundational = selected(data, certification, 'foundational')
    if not direct and not foundational:
        return '\n'.join(lines + ['No PBQs published yet.', '']) + '\n'
    for relevance, title, activities in (
        ('direct', 'Direct Certification Practice', direct),
        ('foundational', 'Foundational Practice', foundational),
    ):
        if relevance == 'foundational' and not activities:
            continue
        lines.extend([f'{heading} {title}', ''])
        if not activities:
            lines.extend(['No direct certification PBQs published yet.', ''])
            continue
        if relevance == 'foundational':
            lines.extend(['Related activities that build supporting skills for this certification.', ''])
        for activity in activities:
            path = posixpath.relpath(activity['activityPath'] + 'README.md',
                                    str(PurePosixPath(source).parent))
            lines.extend([f'- [{inline(activity["title"])}]({path})', '',
                          f'    {inline(activity["description"])}', ''])
    return '\n'.join(lines) + '\n'


def render_navigation(data):
    """Register each canonical overview once, under its primary certification."""
    groups = [{'Overview': 'practice/pbqs/README.md'}]
    for cert, metadata in data['certifications'].items():
        activities = sorted((a for a in data['activities']
                             if a['status'] == 'published' and a['primaryCertification'] == cert),
                            key=lambda a: (a['title'].casefold(), a['id']))
        value = metadata['pbqIndexPath']
        if activities:
            value = [{'Overview': value}] + [{a['title']: a['activityPath'] + 'README.md'} for a in activities]
        groups.append({metadata['title']: value})
    nav = yaml.safe_dump([{'PBQs': groups}], sort_keys=False, allow_unicode=True, width=120)
    return '\n'.join('  ' + line for line in nav.rstrip().splitlines()) + '\n'


def generated_files(data, root=ROOT):
    files = {}
    for cert, metadata in data['certifications'].items():
        for field in ('overviewPath', 'pbqIndexPath'):
            source = metadata[field]
            path = root / 'docs' / source
            files[path] = replace_block(path.read_text(), START, END,
                                        render_listings(data, cert, source, field == 'overviewPath'))
    nav = root / 'mkdocs.yml'
    files[nav] = replace_block(nav.read_text(), NAV_START, NAV_END, render_navigation(data))
    return files


def listing_errors(data, root=ROOT):
    try:
        return [f'{path.relative_to(root)}: generated PBQ listings are stale; run python scripts/sync_pbq_listings.py'
                for path, expected in generated_files(data, root).items() if path.read_text() != expected]
    except (OSError, ValueError) as error:
        return [f'Cannot generate PBQ listings: {error}']


def main():
    # Import here so the validator can also check generated output without a cycle.
    from check_pbq_catalog import CATALOG, metadata_errors
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail on drift without writing files.')
    args = parser.parse_args()
    data = json.loads((ROOT / CATALOG).read_text())
    errors = metadata_errors(data)
    if errors:
        raise SystemExit('\n'.join(errors))
    if args.check:
        errors = listing_errors(data)
        if errors:
            raise SystemExit('\n'.join(errors))
        print('Catalog-generated PBQ listings and navigation are current.')
    else:
        for path, content in generated_files(data).items():
            if path.read_text() != content:
                path.write_text(content)
                print(f'Updated {path.relative_to(ROOT)}')
        print('Run python scripts/sync_navigation.py to update GitBook navigation.')


if __name__ == '__main__':
    main()
