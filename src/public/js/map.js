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
export function headingAt(route, t) {
  if (route.length < 2) return 0;
  let i = route.findIndex((r) => r.t > t);
  if (i <= 0) i = i === 0 ? 1 : route.length - 1;
  const a = route[i - 1], b = route[i];
  const dx = (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180);
  const dy = b.lat - a.lat;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

const BOAT_SVG = `<svg class="boat" viewBox="0 0 40 124" aria-hidden="true">
  <path class="boat__wake" d="M13 100 L4 122 M27 100 L36 122"/>
  <path class="boat__hull" d="M20 2 C30 14 34 30 34 50 L34 88 Q34 98 24 98 L16 98 Q6 98 6 88 L6 50 C6 30 10 14 20 2 Z"/>
  <path class="boat__deck" d="M20 9 C27 19 30 33 30 51 L30 86 Q30 93 23 93 L17 93 Q10 93 10 86 L10 51 C10 33 13 19 20 9 Z"/>
  <path class="boat__planks" d="M16 22 V91 M20 12 V93 M24 22 V91"/>
  <path class="boat__thwart" d="M10.5 40 H29.5 M10 76 H30"/>
  <rect class="boat__canopy" x="12.5" y="52" width="15" height="17" rx="1.5"/>
</svg>`;

const HERKENNINGSPUNTEN = [
  { naam: 'Domtoren', lat: 52.090653, lng: 5.121309 },
  { naam: 'Stadhuis', lat: 52.091881, lng: 5.119292 },
];

const KAART_GEBIED = [[52.0878, 5.1150], [52.0927, 5.1255]];

export function createMap({ route, points, onPointSelect }) {
  const map = L.map('map', {
    zoomControl: false,
    attributionControl: true,
    tap: true,
    keyboard: true,
    zoomSnap: 0.25,
    minZoom: 16,
    maxBounds: KAART_GEBIED,
    maxBoundsViscosity: 1,
  });
  map.attributionControl.setPrefix(false);
  L.tileLayer('assets/kaart/{z}/{x}/{y}.jpg', {
    minZoom: 16,
    maxZoom: 21,
    maxNativeZoom: 20,
    bounds: KAART_GEBIED,
    className: 'map-tiles',
    attribution: 'Luchtfoto: Beeldmateriaal Nederland / PDOK (CC BY 4.0)',
  }).addTo(map);
  const latlngs = route.map((r) => [r.lat, r.lng]);
  L.polyline(latlngs, { color: '#ffffff', weight: 11, opacity: 0.85, lineCap: 'round' }).addTo(map);
  const line = L.polyline(latlngs, { color: '#247065', weight: 6, opacity: 1, lineCap: 'round' }).addTo(map);
  const view = line.getBounds();
  HERKENNINGSPUNTEN.forEach((h) => view.extend([h.lat, h.lng]));
  const fit = () => map.fitBounds(view, { padding: [40, 40] });
  fit();

  HERKENNINGSPUNTEN.forEach((h) => {
    L.marker([h.lat, h.lng], {
      icon: L.divIcon({ className: 'map-label', html: `<span>${h.naam}</span>`, iconSize: null }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
  });

  const size = 44;
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
    icon: L.divIcon({ className: 'boat-marker', html: BOAT_SVG, iconSize: [32, 99], iconAnchor: [16, 41] }),
    keyboard: false,
    interactive: false,
    zIndexOffset: 400,
  }).addTo(map);
  let lastPos = null;
  return {
    setTime(t) {
      const pos = positionAt(route, t);
      if (!pos) return;
      if (lastPos && pos[0] === lastPos[0] && pos[1] === lastPos[1]) return;
      lastPos = pos;
      boat.setLatLng(pos);
      const svg = boat.getElement()?.querySelector('.boat');
      if (svg) svg.style.transform = `rotate(${headingAt(route, t)}deg)`;
      points.forEach((p) => {
        markers.get(p.id)?.getElement()?.querySelector('.map-point')?.classList.toggle('is-done', p.time_start <= t);
      });
    },
    setActive(id) {
      markers.forEach((m, pid) => {
        m.getElement()?.querySelector('.map-point')?.classList.toggle('is-active', pid === id);
        m.setZIndexOffset(pid === id ? 1000 : 0);
      });
    },
    invalidateSize() { map.invalidateSize(); fit(); },
  };
}
