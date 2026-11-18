const TEASER_MS = 5000;

export function createStopPopup({ points, onContinue }) {
  const el = document.getElementById('stop-popup');
  const num = document.getElementById('popup-num');
  const title = document.getElementById('popup-title');
  const text = document.getElementById('popup-text');
  const figure = document.getElementById('popup-figure');
  const img = document.getElementById('popup-img');
  const caption = document.getElementById('popup-caption');
  const btn = document.getElementById('popup-continue');
  let timer = null;

  btn.addEventListener('click', () => {
    hide();
    onContinue();
  });

  function show(p, { teaser = false } = {}) {
    clearTimeout(timer);
    num.textContent = String(points.indexOf(p) + 1);
    title.textContent = p.title_nl;
    text.textContent = p.text_nl;
    const m = p.media[0];
    figure.hidden = !m || teaser;
    if (m) {
      img.src = m.url;
      img.alt = m.alt_nl || '';
      caption.textContent = [m.caption_nl, m.year, m.source].filter(Boolean).join(' · ');
    }
    btn.hidden = teaser;
    el.classList.toggle('is-teaser', teaser);
    el.hidden = false;
    el.classList.remove('is-in');
    void el.offsetWidth;
    el.classList.add('is-in');
    if (teaser) timer = setTimeout(hide, TEASER_MS);
  }

  function hide() {
    clearTimeout(timer);
    el.hidden = true;
  }

  return { show, hide, get open() { return !el.hidden; } };
}
