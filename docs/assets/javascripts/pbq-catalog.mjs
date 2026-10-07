/* Catalog access for future views. Importing this module has no side effects. */
export async function loadCatalog(url = new URL('../data/pbqs.json', import.meta.url)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PBQ catalog could not be loaded (${response.status}).`);
  const catalog = await response.json();
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.activities)) {
    throw new Error('Unsupported PBQ catalog format.');
  }
  return catalog;
}

/** Filters combine with AND. Certification matches primary or additional associations.
 *  Relevance always applies to that same association. null status includes all records.
 */
export function selectPBQs(catalog, {
  certification, relevance, subject, topic, status = 'published'
} = {}) {
  return catalog.activities.filter(activity =>
    (status === null || activity.status === status) &&
    ((!certification && !relevance) || activity.certificationAssociations.some(association =>
      (!certification || association.certification === certification) &&
      (!relevance || association.relevance === relevance))) &&
    (!topic || activity.topics.includes(topic)) &&
    (!subject || activity.topics.some(id => catalog.topics[id]?.subject === subject))
  );
}

/** Use the same identity and launch path regardless of the discovery view. */
export function getPBQ(catalog, id) {
  return catalog.activities.find(activity => activity.id === id);
}

/** siteRoot must be the site base URL, including any project subpath and trailing slash. */
export function launchURL(activity, siteRoot) {
  const base = new URL(siteRoot);
  if (!base.pathname.endsWith('/') || base.search || base.hash) {
    throw new Error('siteRoot must end with a slash and have no query or fragment.');
  }
  return new URL(activity.launchPath, base).href;
}
