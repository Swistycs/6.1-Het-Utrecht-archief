const preview = document.getElementById('preview');
document.querySelectorAll('[data-use-time]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.useTime);
    if (!preview || !input) return;
    input.value = preview.currentTime.toFixed(1);
    input.focus();
  });
});

const mapEl = document.getElementById('pick-map');
if (mapEl && window.L) {
  const lat = document.getElementById('lat');
  const lng = document.getElementById('lng');
  const route = JSON.parse(mapEl.dataset.route || '[]').map((r) => [Number(r.lat), Number(r.lng)]);

  const map = L.map(mapEl);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap-bijdragers',
  }).addTo(map);

  if (route.length > 1) {
    const line = L.polyline(route, { color: '#247065', weight: 6 }).addTo(map);
    route.forEach((p) => L.circleMarker(p, { radius: 5, color: '#247065', fillOpacity: 1 }).addTo(map));
    map.fitBounds(line.getBounds(), { padding: [30, 30] });
  } else {
    map.setView([52.0905, 5.1205], 17);
  }

  let marker = null;
  const place = (latlng) => {
    if (marker) marker.setLatLng(latlng);
    else marker = L.marker(latlng, { keyboard: false }).addTo(map);
  };
  const current = () => {
    const a = parseFloat(String(lat.value).replace(',', '.'));
    const b = parseFloat(String(lng.value).replace(',', '.'));
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  };
  if (current()) place(current());

  map.on('click', (e) => {
    lat.value = e.latlng.lat.toFixed(6);
    lng.value = e.latlng.lng.toFixed(6);
    place(e.latlng);
  });
  [lat, lng].forEach((el) => el.addEventListener('change', () => { if (current()) place(current()); }));
}
