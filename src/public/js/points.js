export function activePointAt(points, t) {
  return points.find((p) => p.time_start <= t && t < p.time_end) || null;
}

export function nextPointAfter(points, t) {
  return points.find((p) => p.time_start > t) || null;
}

export function createPoints({ points, duration, onChange }) {
  const ticks = document.getElementById('stops');
  const statusLabel = document.getElementById('status-label');
  const statusName = document.getElementById('status-name');
  const live = document.getElementById('live');

  const items = points.map((p) => {
    const tick = document.createElement('span');
    tick.className = 'vtick';
    ticks.append(tick);
    return { p, tick };
  });

  function layout(total) {
    items.forEach(({ p, tick }) => {
      tick.style.left = `${Math.min(100, (p.time_start / total) * 100)}%`;
    });
  }
  layout(duration);

  let activeId;
  let statusKey = '';

  function renderStatus(t, active) {
    const next = active ? null : nextPointAfter(points, t);
    const key = active ? `nu-${active.id}` : next ? `volgende-${next.id}` : 'einde';
    if (key === statusKey) return;
    statusKey = key;
    if (active) {
      statusLabel.textContent = `Stop ${points.indexOf(active) + 1} van ${points.length}`;
      statusName.textContent = active.title_nl;
    } else if (next) {
      statusLabel.textContent = 'Volgende stop';
      statusName.textContent = next.title_nl;
    } else {
      statusLabel.textContent = 'Eindpunt';
      statusName.textContent = 'Einde van de vaartocht';
    }
  }

  return {
    layout,
    update(t) {
      const p = activePointAt(points, t);
      items.forEach(({ p: q, tick }) => {
        tick.classList.toggle('is-done', q.time_start <= t);
        tick.classList.toggle('is-current', Boolean(p) && q.id === p.id);
      });
      renderStatus(t, p);
      const id = p ? p.id : null;
      if (id === activeId) return;
      activeId = id;
      if (p) live.textContent = `${p.title_nl}. ${p.text_nl}`;
      onChange?.(p);
    },
  };
}
