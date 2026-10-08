"""Validate the authoritative PBQ catalog and generated certification listings."""
import argparse
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
from urllib.parse import unquote, urljoin, urlsplit

import markdown
import yaml

ROOT = Path(__file__).resolve().parents[1]
CATALOG = Path('docs/assets/data/pbqs.json')
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
if __package__:
    from .sync_pbq_listings import listing_errors
    from .content_visibility import Availability, split_page
else:
    from sync_pbq_listings import listing_errors
    from content_visibility import Availability, split_page


class Links(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.navigation = {}
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])
            if 'data-pbq-nav' in attrs:
                self.navigation[attrs['data-pbq-nav']] = attrs['href']


def metadata_errors(data):
    """Schema validation without adding a runtime or dependency to the static site."""
    errors = []

    def fields(value, required, optional, where):
        if not isinstance(value, dict):
            errors.append(f'{where}: expected an object')
            return False
        missing = set(required) - value.keys()
        unknown = value.keys() - set(required) - set(optional)
        if missing or unknown:
            errors.append(f'{where}: missing fields {sorted(missing)}; unknown fields {sorted(unknown)}')
        return not missing

    def text(value):
        return isinstance(value, str) and bool(value.strip())

    def slug(value):
        return isinstance(value, str) and bool(SLUG.fullmatch(value))

    def path(value, suffix):
        return (text(value) and value.startswith(('practice/pbqs/', 'certifications/'))
                and value.endswith(suffix) and '\\' not in value
                and not any(c in value for c in '%?#:')
                and all(part not in ('', '.', '..') for part in value.rstrip('/').split('/')))

    if not fields(data, ('schemaVersion', 'certifications', 'subjects', 'topics', 'activities'), (), 'catalog'):
        return errors
    if type(data['schemaVersion']) is not int or data['schemaVersion'] != 1:
        errors.append('catalog: schemaVersion must be 1')
    for name in ('certifications', 'subjects', 'topics'):
        if not isinstance(data[name], dict) or not data[name]:
            errors.append(f'{name}: expected a nonempty identifier map')
            return errors
        for key, item in data[name].items():
            required = {'certifications': ('title', 'overviewPath', 'pbqIndexPath'),
                        'subjects': ('title',), 'topics': ('title', 'subject')}[name]
            where = f'{name}.{key}'
            if not slug(key):
                errors.append(f'{where}: invalid identifier')
            if not fields(item, required, (), where):
                continue
            if not text(item['title']):
                errors.append(f'{where}: title is required')
            if name == 'topics' and (not slug(item['subject']) or item['subject'] not in data['subjects']):
                errors.append(f'{where}: invalid subject reference')
            if name == 'certifications':
                if (not path(item['overviewPath'], f'/{key}/README.md')
                        or not item['overviewPath'].startswith('certifications/')):
                    errors.append(f'{where}: invalid overviewPath')
                if item['pbqIndexPath'] != f'practice/pbqs/{key}/README.md':
                    errors.append(f'{where}: inconsistent pbqIndexPath')
    if not isinstance(data['activities'], list):
        return errors + ['activities: expected an array']
    required = ('id', 'title', 'description', 'activityPath', 'launchPath',
                'primaryCertification', 'certificationAssociations', 'topics', 'status')
    seen = {key: set() for key in ('id', 'activityPath', 'launchPath')}
    for index, item in enumerate(data['activities']):
        where = f'activities[{index}]'
        if not fields(item, required, ('difficulty',), where):
            continue
        for key in ('id', 'title', 'description', 'activityPath', 'launchPath', 'primaryCertification'):
            if not text(item[key]):
                errors.append(f'{where}: {key} must be nonempty text')
        for key in seen:
            if isinstance(item[key], str):
                if item[key] in seen[key]:
                    errors.append(f'{where}: duplicate {key}: {item[key]}')
                seen[key].add(item[key])
        if not slug(item['id']):
            errors.append(f'{where}: invalid activity ID')
        if item['status'] not in ('published', 'draft', 'archived'):
            errors.append(f'{where}: invalid publication status')
        if 'difficulty' in item and item['difficulty'] not in ('beginner', 'intermediate', 'advanced'):
            errors.append(f'{where}: invalid difficulty')
        primary = item['primaryCertification']
        if not slug(primary) or primary not in data['certifications']:
            errors.append(f'{where}: invalid primary certification')
        location = item['activityPath']
        if not path(location, '/') or len(PurePosixPath(location).parts) != 4 or not location.startswith(f'practice/pbqs/{primary}/'):
            errors.append(f'{where}: activityPath must match the primary certification directory')
        if not path(item['launchPath'], '/app/') or item['launchPath'] != f'{location}app/':
            errors.append(f'{where}: launchPath must be the canonical activity app/')
        topics = item['topics']
        if (not isinstance(topics, list) or not topics or not all(slug(t) and t in data['topics'] for t in topics)
                or len(topics) != len(set(topics))):
            errors.append(f'{where}: invalid, empty, or duplicate topic references')
        associations = item['certificationAssociations']
        if not isinstance(associations, list):
            errors.append(f'{where}: certificationAssociations must be an array')
            continue
        certifications = []
        for association in associations:
            if not fields(association, ('certification', 'relevance', 'reason'), (), where + '.association'):
                continue
            cert = association['certification']
            if not slug(cert) or cert not in data['certifications']:
                errors.append(f'{where}: invalid certification association')
            else:
                certifications.append(cert)
            if association['relevance'] not in ('direct', 'foundational') or not text(association['reason']):
                errors.append(f'{where}: association needs valid relevance and a reason')
        if certifications.count(primary) != 1 or len(certifications) != len(set(certifications)):
            errors.append(f'{where}: primary must occur once; associations cannot repeat')
    return errors


def repository_errors(data, root=ROOT, site=None):
    errors = listing_errors(data, root)
    docs = root / 'docs'
    config = yaml.safe_load((root / 'mkdocs.yml').read_text())
    config['nav'] = Availability(root, catalog=data).navigation(config['nav'])
    base = config['site_url']
    records = data['activities']
    discovered = {p.relative_to(docs).as_posix() for p in (docs / 'practice/pbqs').rglob('app/index.html')}
    registered = {a['launchPath'] + 'index.html' for a in records}
    if discovered != registered:
        errors.append(f'app inventory mismatch: unregistered={sorted(discovered - registered)}; missing={sorted(registered - discovered)}')
    cert_dirs = {p.parent.name for p in (docs / 'practice/pbqs').glob('*/README.md')}
    if cert_dirs != set(data['certifications']):
        errors.append('certification identifiers differ from the existing PBQ indexes')

    def targets(source, content=None):
        html = markdown.markdown(source.read_text() if content is None else content)
        results = []
        for href in Links(html).links:
            url = urlsplit(href)
            if url.scheme or url.netloc or not url.path:
                continue
            resolved = (source.parent / unquote(url.path)).resolve()
            if resolved.is_relative_to(docs.resolve()):
                results.append(resolved.relative_to(docs.resolve()).as_posix())
        return results

    activity_readme = re.compile(r'practice/pbqs/[^/]+/[^/]+/README\.md\Z')

    def check_list(source, actual, expected):
        actual = [target for target in actual if activity_readme.fullmatch(target)]
        counts = Counter(actual)
        if any(count != 1 for count in counts.values()):
            errors.append(f'{source}: duplicate PBQ listings')
        missing = set(expected) - set(actual)
        if missing or set(actual) - set(expected):
            errors.append(f'{source}: catalog/list drift: missing={sorted(missing)}; unexpected={sorted(set(actual) - set(expected))}')

    def nav_paths(items):
        paths = []
        for item in items:
            for value in item.values():
                paths.extend(nav_paths(value) if isinstance(value, list) else [value])
        return paths

    def named_nav(items, name):
        for item in items:
            for label, value in item.items():
                if label == name:
                    return value
                if isinstance(value, list):
                    found = named_nav(value, name)
                    if found is not None:
                        return found
        return None

    published = {a['activityPath'] + 'README.md': a['id'] for a in records if a['status'] == 'published'}
    check_list('mkdocs.yml', nav_paths(config['nav']), published)
    pbq_nav = named_nav(config['nav'], 'PBQs') or []
    for cert, metadata in data['certifications'].items():
        expected = {a['activityPath'] + 'README.md': a['id'] for a in records
                    if a['status'] == 'published' and a['primaryCertification'] == cert}
        associated = {a['activityPath'] + 'README.md': a['id'] for a in records
                      if a['status'] == 'published' and any(s['certification'] == cert
                          for s in a['certificationAssociations'])}
        for field in ('overviewPath', 'pbqIndexPath'):
            source = metadata[field]
            file = docs / source
            if not file.is_file():
                errors.append(f'missing certification page: {source}')
                continue
            content = file.read_text()
            if field == 'overviewPath':
                section = re.search(r'^## Published PBQ Practice\s*\n(.*?)(?=^## |\Z)', content, re.M | re.S)
                content = section[1] if section else ''
            check_list(source, targets(file, content), associated)
        group = named_nav(pbq_nav, metadata['title'])
        check_list(f'mkdocs.yml PBQs/{metadata["title"]}', nav_paths(group) if isinstance(group, list) else [], expected)
    for activity in records:
        overview = docs / activity['activityPath'] / 'README.md'
        if not overview.is_file():
            errors.append(f'{activity["id"]}: missing activity overview')
            continue
        if split_page(overview.read_text())[1].partition('\n')[0] != '# ' + activity['title']:
            errors.append(f'{activity["id"]}: catalog title differs from the activity overview')
        launch = urljoin(base, activity['launchPath'])
        overview_url = urljoin(base, activity['activityPath'])
        urls = {urljoin(overview_url, href) for href in Links(markdown.markdown(overview.read_text())).links}
        if activity['status'] == 'published' and not {launch, launch + 'index.html'} & urls:
            errors.append(f'{activity["id"]}: overview does not link to canonical launch path')
        if site is not None:
            app = site / activity['launchPath'] / 'index.html'
            if activity['status'] != 'published':
                if app.exists():
                    errors.append(f'{activity["id"]}: unpublished launch path was built')
                continue
            if not app.is_file():
                errors.append(f'{activity["id"]}: missing built launch path')
                continue
            expected_nav = {'certification': f'practice/pbqs/{activity["primaryCertification"]}/',
                            'overview': activity['activityPath'], 'home': ''}
            nav = Links(app.read_text()).navigation
            for name, target in expected_nav.items():
                if name not in nav or urljoin(launch, nav[name]) != urljoin(base, target):
                    errors.append(f'{activity["id"]}: missing or incorrect built {name} navigation')
    if site is not None:
        asset = site / 'assets/data/pbqs.json'
        if not asset.is_file() or asset.read_bytes() != (root / CATALOG).read_bytes():
            errors.append('built catalog is missing or differs from its authoritative source')
        helper = Path('assets/javascripts/pbq-catalog.mjs')
        if not (site / helper).is_file() or (site / helper).read_bytes() != (docs / helper).read_bytes():
            errors.append('built catalog access helper is missing or differs from source')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-dir', type=Path, help='Also validate built launch paths, navigation, and catalog assets.')
    args = parser.parse_args()
    try:
        data = json.loads((ROOT / CATALOG).read_text())
    except (OSError, ValueError) as error:
        raise SystemExit(f'Cannot read PBQ catalog: {error}') from error
    errors = metadata_errors(data)
    if not errors:
        errors = repository_errors(data, site=args.site_dir)
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Passed: {len(data["activities"])} canonical PBQs; schema, references, inventory, launch paths, and listing consistency.')


if __name__ == '__main__':
    main()
