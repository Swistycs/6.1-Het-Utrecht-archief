export function positionAt(route, t) {
  if (!route.length) return null;
  if (t <= route[0].t) return [route[0].lat, route[0].lng];
  const last = route[route.length - 1];
  if (t >= last.t) return [last.lat, last.lng];
  let lo = 0, hi = route.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (route[mid].t <= t) lo = mid; else hi = mid;
  }
  const a = route[lo], b = route[hi];
  const f = (t - a.t) / (b.t - a.t);
  return [a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f];
}
export function createMap({ route, points, onPointSelect }) {
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
    tap: true,
    keyboard: true,
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap-bijdragers',
  }).addTo(map);
  const latlngs = route.map((r) => [r.lat, r.lng]);
  const line = L.polyline(latlngs, { color: '#247065', weight: 7, opacity: 0.9 }).addTo(map);
  map.fitBounds(line.getBounds(), { padding: [40, 40] });

  const size = Math.max(56, Math.round(window.innerWidth * 0.035));
  const markers = new Map();
  points.forEach((p, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<span class="map-point">${i + 1}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    const m = L.marker([p.lat, p.lng], { icon, keyboard: true, title: p.title_nl, riseOnHover: false })
      .addTo(map)
      .on('click', () => onPointSelect(p));
    const el = m.getElement();
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Punt ${i + 1}: ${p.title_nl}. Vaar hierheen.`);
    markers.set(p.id, m);
  });
  const boat = L.marker(latlngs[0] || [52.0905, 5.1205], {
    icon: L.divIcon({ className: 'boat-marker', html: '<span aria-hidden="true">⛵</span>', iconSize: [40, 40], iconAnchor: [20, 20] }),
    keyboard: false,
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(map);
  let lastPos = null;
  return {
    setTime(t) {
      const pos = positionAt(route, t);
      if (!pos) return;
      if (lastPos && pos[0] === lastPos[0] && pos[1] === lastPos[1]) return;
      lastPos = pos;
      boat.setLatLng(pos);
      if (!map.getBounds().pad(-0.25).contains(pos)) {
        map.panTo(pos, { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches });
      }
    },
    setActive(id) {
      markers.forEach((m, pid) => {
        m.getElement()?.querySelector('.map-point')?.classList.toggle('is-active', pid === id);
        m.setZIndexOffset(pid === id ? 500 : 0);
      });
    },
    invalidateSize() { map.invalidateSize(); },
  };
}
