// Version-specific metadata supplies counts and weights; these policies are shared.
export function allocateDomains(domains, count) {
  if (!Number.isInteger(count) || count < 1 || !Array.isArray(domains) || !domains.length
      || new Set(domains.map(d => d.id)).size !== domains.length
      || domains.some(d => !d.id || !Number.isFinite(d.weight) || d.weight <= 0)
      || Math.abs(domains.reduce((sum, d) => sum + d.weight, 0) - 100) > 1e-8) {
    throw new Error('The examination question count or domain weights are invalid.');
  }
  // Hamilton/largest-remainder allocation. Equal remainders use metadata order.
  const rows = domains.map((domain, index) => {
    const exact = count * domain.weight / 100;
    return { ...domain, count: Math.floor(exact), remainder: exact - Math.floor(exact), index };
  });
  const ranked = [...rows].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const remaining = count - rows.reduce((sum, row) => sum + row.count, 0);
  for (let i = 0; i < remaining; i++) ranked[i].count++;
  return rows.map(({ remainder, index, ...row }) => row);
}

export function sampleObjectives(questions, objectives, count, random = Math.random) {
  const pool = [...questions], selected = [], coverage = new Map(objectives.map(id => [id, 0]));
  const choose = list => list[Math.floor(random() * list.length)];
  while (selected.length < count) {
    // Visit the least-covered objective that still has an unused candidate.
    const available = objectives.filter(id => pool.some(q => q.objectives.includes(id)));
    if (!available.length) throw new Error('The bank cannot satisfy this domain allocation.');
    const lowest = Math.min(...available.map(id => coverage.get(id)));
    const objective = choose(available.filter(id => coverage.get(id) === lowest));
    const q = choose(pool.filter(q => q.objectives.includes(objective)));
    selected.push(q); pool.splice(pool.indexOf(q), 1);
    for (const id of q.objectives) if (coverage.has(id)) coverage.set(id, coverage.get(id) + 1);
  }
  return selected;
}
