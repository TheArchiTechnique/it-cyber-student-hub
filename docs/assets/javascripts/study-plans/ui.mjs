export function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
}
export function link(label, href) {
  const a = node('a', label);
  a.href = href;
  return a;
}
export function button(label, act) {
  const b = node('button', label);
  b.type = 'button';
  b.addEventListener('click', act);
  return b;
}
export function panel(title) {
  const section = node('section', undefined, 'panel');
  section.append(node('h2', title));
  return section;
}

export function hubURL(path) {
  return new URL(path, new URL(document.body.dataset.hub, document.baseURI));
}
