export function activePointAt(points, t) {
  return points.find((p) => p.time_start <= t && t < p.time_end) || null;
}

export function nextPointAfter(points, t) {
  return points.find((p) => p.time_start > t) || null;
}

export function createPoints({ points, duration, onChange, onSelect }) {
  const list = document.getElementById('stops');
  const live = document.getElementById('live');

  const items = points.map((p, i) => {
    const li = document.createElement('li');
    li.className = 'vstop';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vstop__btn';
    const dot = document.createElement('span');
    dot.className = 'vstop__dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = String(i + 1);
    const name = document.createElement('span');
    name.className = 'vstop__name';
    name.textContent = p.title_nl;
    btn.append(dot, name);
    btn.setAttribute('aria-label', `Stop ${i + 1}: ${p.title_nl}. Vaar hierheen.`);
    btn.addEventListener('click', () => onSelect?.(p));
    li.append(btn);
    list.append(li);
    return { p, li, btn };
  });

  let activeId;

  function fitLabels() {
    const names = items.map(({ li }) => li.querySelector('.vstop__name'));
    names.forEach((n) => { n.style.visibility = ''; });
    const shown = [];
    const overlaps = (r) => shown.some((s) => r.left < s.right + 12 && r.right > s.left - 12);
    const order = [...items.keys()].sort((a, b) =>
      (items[b].p.id === activeId) - (items[a].p.id === activeId));
    order.forEach((i) => {
      const r = names[i].getBoundingClientRect();
      if (overlaps(r)) names[i].style.visibility = 'hidden';
      else shown.push(r);
    });
  }

  function layout(total) {
    items.forEach(({ p, li }) => {
      li.style.left = `${Math.min(100, (p.time_start / total) * 100)}%`;
    });
    fitLabels();
  }
  layout(duration);
  window.addEventListener('resize', fitLabels);

  function render(t, active) {
    items.forEach(({ p, li, btn }) => {
      const current = active && p.id === active.id;
      li.classList.toggle('is-current', Boolean(current));
      li.classList.toggle('is-done', !current && p.time_end <= t);
      if (current) btn.setAttribute('aria-current', 'step');
      else btn.removeAttribute('aria-current');
    });
  }

  return {
    layout,
    update(t) {
      const p = activePointAt(points, t);
      render(t, p);
      const id = p ? p.id : null;
      if (id === activeId) return;
      activeId = id;
      fitLabels();
      if (p) live.textContent = `${p.title_nl}. ${p.text_nl}`;
      onChange?.(p);
    },
  };
}
