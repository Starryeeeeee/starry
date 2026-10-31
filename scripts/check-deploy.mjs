const H = { 'User-Agent': 'check' };
const runs = await fetch('https://api.github.com/repos/Starryeeeeee/starry/actions/runs?per_page=3', {
  headers: H,
}).then((r) => r.json());
for (const r of runs.workflow_runs) {
  console.log('[' + r.head_sha.slice(0, 7) + ']', r.display_title.slice(0, 24), '|', r.status, '|', r.conclusion ?? '-');
}
const t = await fetch('https://starryeeeeee.github.io/starry/admin/', { cache: 'no-store' }).then((r) => r.text());
console.log('live data-greet:', t.includes('data-greet'));
console.log('live data-overview:', t.includes('data-overview'));
