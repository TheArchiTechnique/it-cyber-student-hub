import { loadCatalog, selectPBQs, launchURL } from './pbq-catalog.mjs';

// Asset-relative resolution preserves both root hosting and GitHub Pages subpaths.
const siteRoot = new URL('../../', import.meta.url);
const relevanceLabels = { direct: 'Direct practice', foundational: 'Foundational practice' };

function element(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function field(form, name, label, options) {
  const wrapper = element('label', label, { class: `pbq-library-field pbq-library-${name}` });
  const control = element(options ? 'select' : 'input', '', {
    id: `pbq-${name}`, name, 'aria-controls': 'pbq-results'
  });
  if (options) {
    for (const [value, title] of options) control.append(element('option', title, { value }));
  } else {
    control.type = 'search';
    control.placeholder = 'Search titles and descriptions';
  }
  wrapper.append(control);
  form.append(wrapper);
  return control;
}

function taxonomyOptions(taxonomy) {
  return Object.entries(taxonomy)
    .sort((a, b) => a[1].title.localeCompare(b[1].title, 'en'))
    .map(([id, record]) => [id, record.title]);
}

function card(activity, catalog) {
  const article = element('article', '', { class: 'pbq-library-card', 'data-pbq-id': activity.id });
  article.append(element('h3', activity.title), element('p', activity.description));
  const subjects = [...new Set(activity.topics.map(id => catalog.topics[id].subject))];
  const taxonomy = subjects.map(subject => {
    const topics = activity.topics.filter(id => catalog.topics[id].subject === subject);
    return `${catalog.subjects[subject].title}: ${topics.map(id => catalog.topics[id].title).join(', ')}`;
  }).join(' · ');
  article.append(element('p', taxonomy, { class: 'pbq-library-meta' }));
  const associations = activity.certificationAssociations.map(association =>
    `${catalog.certifications[association.certification].title}: ${relevanceLabels[association.relevance]}`
  ).join(' · ');
  article.append(element('p', associations, { class: 'pbq-library-meta' }));
  const actions = element('div', '', { class: 'pbq-library-actions' });
  actions.append(
    element('a', 'Launch activity', {
      href: launchURL(activity, siteRoot), class: 'pbq-library-launch',
      'aria-label': `Launch ${activity.title}`
    }),
    element('a', 'Activity overview', {
      href: new URL(activity.activityPath, siteRoot).href,
      'aria-label': `${activity.title} overview`
    })
  );
  article.append(actions);
  return article;
}

async function mountLibrary(root) {
  root.hidden = false;
  root.replaceChildren();
  const status = element('p', 'Loading activities…', { role: 'status', 'aria-atomic': 'true' });
  root.append(status);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const catalog = await loadCatalog(undefined, { signal: controller.signal });
    clearTimeout(timeout);
    const form = element('form', '', { class: 'pbq-library-filters', 'aria-label': 'Filter PBQs' });
    const controls = {
      keyword: field(form, 'keyword', 'Keyword search'),
      certification: field(form, 'certification', 'Certification', [
        ['', 'All Certifications'],
        ...Object.entries(catalog.certifications).map(([id, record]) => [id, record.title])
      ]),
      subject: field(form, 'subject', 'Technical subject', [['', 'All Subjects'], ...taxonomyOptions(catalog.subjects)]),
      topic: field(form, 'topic', 'Topic', [['', 'All Topics'], ...taxonomyOptions(catalog.topics)]),
      relevance: field(form, 'relevance', 'Certification relevance', [
        ['', 'All'], ['direct', 'Direct Certification Practice'], ['foundational', 'Foundational Practice']
      ])
    };
    const clear = element('button', 'Clear Filters', { type: 'button', class: 'pbq-library-clear' });
    form.append(clear);
    const heading = element('h2', 'Activities');
    const results = element('div', '', { id: 'pbq-results', class: 'pbq-library-results' });
    function render() {
      const filters = Object.fromEntries(Object.entries(controls).map(([name, control]) => [name, control.value]));
      const activities = selectPBQs(catalog, filters)
        .sort((a, b) => a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en'));
      results.replaceChildren(...activities.map(activity => card(activity, catalog)));
      status.textContent = `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'} found`;
      if (!activities.length) {
        results.append(element('p', 'No published activities match these filters. Change a filter or use Clear Filters to try again.', {
          class: 'pbq-library-empty'
        }));
      }
    }
    form.addEventListener('submit', event => event.preventDefault());
    controls.keyword.addEventListener('input', render);
    for (const [name, control] of Object.entries(controls)) {
      if (name !== 'keyword') control.addEventListener('change', render);
    }
    clear.addEventListener('click', () => {
      form.reset();
      render();
      controls.keyword.focus();
    });
    // Keep the live region mounted so assistive technology announces count updates.
    root.prepend(form);
    status.before(heading);
    root.append(results);
    render();
  } catch {
    for (const child of [...root.children]) if (child !== status) child.remove();
    status.textContent = 'The activity library could not load. Try again, or browse the certification sections below.';
    const retry = element('button', 'Try again', { type: 'button', class: 'pbq-library-clear' });
    retry.addEventListener('click', async () => {
      await mountLibrary(root);
      root.querySelector('input, button')?.focus();
    });
    root.append(retry);
  } finally {
    clearTimeout(timeout);
  }
}

for (const root of document.querySelectorAll('[data-pbq-library]')) mountLibrary(root);
