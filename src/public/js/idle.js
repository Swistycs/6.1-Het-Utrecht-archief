const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

export function createIdle({ seconds, onIdle }) {
  const ms = Math.max(15, Number(seconds) || 90) * 1000;
  let timer = null;
  let running = false;
  const reset = () => {
    if (!running) return;
    clearTimeout(timer);
    timer = setTimeout(() => { running = false; onIdle(); }, ms);
  };
  EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true, capture: true }));
  return {
    start() { running = true; reset(); },
    stop() { running = false; clearTimeout(timer); },
  };
}
