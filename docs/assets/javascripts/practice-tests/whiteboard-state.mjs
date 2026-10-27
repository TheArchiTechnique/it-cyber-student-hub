// Session-owned tool data and geometry, independent of questions and the DOM.
export const WHITEBOARD_TEXT_LIMIT = 200000;
export const WHITEBOARD_MIN_SIZE = { width: 280, height: 300 };

export function restoreWhiteboard(value) {
  const state = { text: '', visible: false, minimized: false, bounds: null, docked: false };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return state;
  state.text = typeof value.text === 'string' ? value.text.slice(0, WHITEBOARD_TEXT_LIMIT) : '';
  state.visible = value.visible === true;
  state.minimized = value.minimized === true;
  state.docked = value.docked === true;
  if (value.bounds && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(value.bounds[key]))) {
    state.bounds = Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, value.bounds[key]]));
  }
  return state;
}

export function constrainWhiteboardBounds(bounds, area) {
  const available = {
    width: Number.isFinite(area.width) ? Math.max(1, area.width) : 1,
    height: Number.isFinite(area.height) ? Math.max(1, area.height) : 1
  };
  const valid = bounds && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(bounds[key])) && bounds.width > 0 && bounds.height > 0;
  const limit = (value, low, high) => Math.min(high, Math.max(low, value));
  const width = limit(valid ? bounds.width : 380, Math.min(WHITEBOARD_MIN_SIZE.width, available.width), available.width);
  const height = limit(valid ? bounds.height : 380, Math.min(WHITEBOARD_MIN_SIZE.height, available.height), available.height);
  return {
    x: limit(valid ? bounds.x : available.width - width, 0, available.width - width),
    y: limit(valid ? bounds.y : 0, 0, available.height - height), width, height
  };
}
