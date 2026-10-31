const H = { 'User-Agent': 'check' };
const runs = await fetch('https://api.github.com/repos/Starryeeeeee/starry/actions/runs?per_page=3', {
  headers: H,
}).then((r) => r.json());
for (const r of runs.workflow_runs) {
  console.log('[' + r.head_sha.slice(0, 7) + ']', r.display_title.slice(0, 28), '|', r.status, '|', r.conclusion ?? '-');
}
const q = await fetch('https://starryeeeeee.github.io/starry/quotes/', { cache: 'no-store' });
const t = await q.text();
console.log('quotes status:', q.status, '| len:', t.length);
console.log('has 箴言:', t.includes('箴言'), '| has moment-card:', t.includes('moment-card'));
