export function activePointAt(points, t) {
  return points.find((p) => p.time_start <= t && t < p.time_end) || null;
}

export function nextPointAfter(points, t) {
  return points.find((p) => p.time_start > t) || null;
}

const INTRO = {
  title: 'Vaar mee over de Oudegracht',
  text: 'In 1929 voer iemand met een filmcamera over de Oudegracht. Vaar mee en ontdek wat er langs de gracht te zien was.',
};

export function createPoints({ points, onChange, onSelect, lang = 'nl' }) {
  const block = document.querySelector('.block--info');
  const label = document.getElementById('info-label');
  const title = document.getElementById('info-title');
  const text = document.getElementById('info-text');
  const mediaBox = document.getElementById('info-media');
  const nextBox = document.getElementById('info-next');
  const nextBtn = document.getElementById('btn-next');
  const nextNum = document.getElementById('next-num');
  const nextTitle = document.getElementById('next-title');
  const live = document.getElementById('live');

  const field = (obj, name) => obj[`${name}_${lang}`] || obj[`${name}_nl`] || '';
  const numberOf = (p) => points.indexOf(p) + 1;

  let activeId;
  let nextId;
  let nextPoint = null;

  nextBtn.addEventListener('click', () => { if (nextPoint) onSelect?.(nextPoint); });

  function renderMedia(p) {
    mediaBox.replaceChildren(...(p ? p.media : []).map((m) => {
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      img.src = m.url;
      img.alt = field(m, 'alt');
      img.loading = 'lazy';
      const cap = document.createElement('figcaption');
      cap.textContent = [field(m, 'caption'), m.year, m.source].filter(Boolean).join(' · ');
      fig.append(img, cap);
      return fig;
    }));
  }

  function renderActive(p) {
    if (p) {
      label.textContent = `Stop ${numberOf(p)} van ${points.length}`;
      title.textContent = field(p, 'title');
      text.textContent = field(p, 'text');
      live.textContent = `${field(p, 'title')}. ${field(p, 'text')}`;
    } else {
      label.textContent = 'Onderweg';
      title.textContent = INTRO.title;
      text.textContent = INTRO.text;
    }
    renderMedia(p);
    block.classList.remove('is-changed');
    void block.offsetWidth;
    block.classList.add('is-changed');
  }

  function renderNext(n) {
    nextPoint = n;
    nextBox.hidden = !n;
    if (!n) return;
    nextNum.textContent = String(numberOf(n));
    nextTitle.textContent = field(n, 'title');
    nextBtn.setAttribute('aria-label', `Vaar naar de volgende stop: ${field(n, 'title')}`);
  }

  return {
    update(t) {
      const p = activePointAt(points, t);
      const id = p ? p.id : null;
      if (id !== activeId) {
        activeId = id;
        renderActive(p);
        onChange?.(p);
      }
      const n = nextPointAfter(points, t);
      const nid = n ? n.id : null;
      if (nid !== nextId) {
        nextId = nid;
        renderNext(n);
      }
    },
  };
}
