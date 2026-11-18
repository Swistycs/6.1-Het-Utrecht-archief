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

  function layout(total) {
    items.forEach(({ p, li }) => {
      li.style.left = `${Math.min(100, (p.time_start / total) * 100)}%`;
    });
  }
  layout(duration);

  let activeId;

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
      if (p) live.textContent = `${p.title_nl}. ${p.text_nl}`;
      onChange?.(p);
    },
  };
}
