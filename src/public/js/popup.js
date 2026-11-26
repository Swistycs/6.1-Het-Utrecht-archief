const TEASER_MS = 5000;

export function createStopPopup({ points, onContinue, onStay, autoSeconds = 0 }) {
  const el = document.getElementById('stop-popup');
  const num = document.getElementById('popup-num');
  const title = document.getElementById('popup-title');
  const text = document.getElementById('popup-text');
  const figure = document.getElementById('popup-figure');
  const img = document.getElementById('popup-img');
  const caption = document.getElementById('popup-caption');
  const thumbs = document.getElementById('popup-thumbs');
  const btn = document.getElementById('popup-continue');
  const stay = document.getElementById('popup-stay');
  const bar = document.getElementById('popup-countdown');
  const autoMs = Math.max(0, Number(autoSeconds) || 0) * 1000;
  let timer = null;
  let autoTimer = null;
  let autoOn = true;

  function stopCountdown() {
    clearTimeout(autoTimer);
    autoTimer = null;
    bar.hidden = true;
    stay.hidden = true;
  }

  function startCountdown() {
    stopCountdown();
    if (!autoMs || !autoOn) return;
    bar.hidden = false;
    stay.hidden = false;
    const fill = bar.firstElementChild;
    fill.style.animation = 'none';
    void fill.offsetWidth;
    fill.style.animation = `countdown ${autoMs}ms linear forwards`;
    autoTimer = setTimeout(() => {
      hide();
      onContinue();
    }, autoMs);
  }

  btn.addEventListener('click', () => {
    hide();
    onContinue();
  });

  stay.addEventListener('click', () => {
    stopCountdown();
    btn.focus();
    onStay?.();
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
      b.addEventListener('click', () => {
        showMedia(media, i);
        if (autoTimer) startCountdown();
      });
      return b;
    }) : []));
  }

  function show(p, { teaser = false } = {}) {
    clearTimeout(timer);
    stopCountdown();
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
    else startCountdown();
  }

  function hide() {
    clearTimeout(timer);
    stopCountdown();
    el.hidden = true;
  }

  function setAuto(on) {
    autoOn = Boolean(on);
    if (!autoOn) {
      if (autoTimer) { stopCountdown(); onStay?.(); }
    } else if (!el.hidden && !el.classList.contains('is-teaser')) {
      startCountdown();
    }
  }

  return {
    show,
    hide,
    setAuto,
    get autoAvailable() { return autoMs > 0; },
    get open() { return !el.hidden; },
    get counting() { return autoTimer !== null; },
  };
}
