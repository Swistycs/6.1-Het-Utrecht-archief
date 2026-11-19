const TEASER_MS = 5000;

export function createStopPopup({ points, onContinue }) {
  const el = document.getElementById('stop-popup');
  const num = document.getElementById('popup-num');
  const title = document.getElementById('popup-title');
  const text = document.getElementById('popup-text');
  const figure = document.getElementById('popup-figure');
  const img = document.getElementById('popup-img');
  const caption = document.getElementById('popup-caption');
  const thumbs = document.getElementById('popup-thumbs');
  const btn = document.getElementById('popup-continue');
  let timer = null;

  btn.addEventListener('click', () => {
    hide();
    onContinue();
  });

  function showMedia(media, index) {
    const m = media[index];
    img.src = m.url;
    img.alt = m.alt_nl || '';
    caption.textContent = [m.caption_nl, m.year, m.source].filter(Boolean).join(' · ');
    [...thumbs.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
  }

  function renderThumbs(media) {
    thumbs.replaceChildren(...(media.length > 1 ? media.map((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stop-popup__thumb';
      b.setAttribute('aria-label', `Afbeelding ${i + 1} van ${media.length}: ${m.alt_nl || ''}`);
      const t = document.createElement('img');
      t.src = m.url;
      t.alt = '';
      b.append(t);
      b.addEventListener('click', () => showMedia(media, i));
      return b;
    }) : []));
  }

  function show(p, { teaser = false } = {}) {
    clearTimeout(timer);
    num.textContent = String(points.indexOf(p) + 1);
    title.textContent = p.title_nl;
    text.textContent = p.text_nl;
    figure.hidden = !p.media.length || teaser;
    if (p.media.length) {
      renderThumbs(p.media);
      showMedia(p.media, 0);
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
