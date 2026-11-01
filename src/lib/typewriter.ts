/**
 * 打字机效果：把「已渲染好的 HTML」逐字显示出来。
 *
 * 做法：先把整段 HTML 挂载进容器（标签结构、代码块、链接都在），
 * 然后按文档顺序逐字回填每个文本节点——只会让文字出现，不会破坏结构，
 * 所以 Markdown 渲染的安全性和排版全程不受影响。
 *
 * - 尊重 prefers-reduced-motion：直接整段显示，不做动画。
 * - 时长自适应：字越多越快，总时长限制在 min~max 之间，长回复不会让人等。
 * - 可选 scrollContainer：每帧把聊天区滚到底，跟随打字进度。
 * - 动画期间给容器加 .typing 类（可用来画方块光标），结束移除。
 */

export function typeInto(
  el: HTMLElement,
  html: string,
  opts: { scrollContainer?: HTMLElement; minMs?: number; maxMs?: number } = {},
): Promise<void> {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    el.innerHTML = html;
    return Promise.resolve();
  }

  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  const full: string[] = [];
  let total = 0;
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (node.nodeValue) {
      nodes.push(node);
      full.push(node.nodeValue);
      total += node.nodeValue.length;
    }
    node = walker.nextNode() as Text | null;
  }

  if (!total) {
    el.innerHTML = html;
    return Promise.resolve();
  }

  el.classList.add('typing');
  el.replaceChildren(tpl.content);
  nodes.forEach((n) => (n.nodeValue = ''));

  const scroll = opts.scrollContainer;
  const duration = Math.min(
    Math.max(total * 12, opts.minMs ?? 350),
    opts.maxMs ?? 2200,
  );

  return new Promise((resolve) => {
    const start = performance.now();
    let ni = 0; // 当前文本节点下标
    let ci = 0; // 当前节点里已显示的字符数
    let revealed = 0;

    // 调度器：优先 rAF（前台流畅省电）。有些环境 rAF 会被冻结（后台窗口、
    // 被遮挡的面板），rAF 200ms 内没被调度就永久切换到 16ms 定时器兜底，
    // 否则打字会永远停格、Promise 永不 resolve。
    let useTimeout = false;
    const schedule = (fn: () => void) => {
      if (useTimeout) {
        window.setTimeout(fn, 16);
        return;
      }
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        fn();
      };
      requestAnimationFrame(run);
      window.setTimeout(() => {
        if (!done) {
          done = true;
          useTimeout = true;
          fn();
        }
      }, 200);
    };

    const step = () => {
      const now = performance.now();
      const target = Math.min(total, Math.ceil(((now - start) / duration) * total));
      while (revealed < target && ni < nodes.length) {
        const need = target - revealed;
        const left = full[ni].length - ci;
        if (need >= left) {
          nodes[ni].nodeValue = full[ni]; // 本节点补完，推进到下一个
          revealed += left;
          ni++;
          ci = 0;
        } else {
          ci += need;
          revealed += need;
          nodes[ni].nodeValue = full[ni].slice(0, ci);
        }
      }
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
      if (revealed >= total) {
        el.classList.remove('typing');
        resolve();
      } else {
        schedule(step);
      }
    };
    schedule(step);
  });
}
