// The saved deadline uses wall time. Monotonic elapsed time also prevents an
// in-tab wall-clock rollback from giving an active attempt additional time.
export function createExamClock(wall = () => Date.now(), monotonic = () => performance.now()) {
  const startWall = wall(), startMonotonic = monotonic();
  let last = startWall;
  return () => (last = Math.floor(Math.max(last, wall(), startWall + monotonic() - startMonotonic)));
}

export function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
