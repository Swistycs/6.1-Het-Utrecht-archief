const SKIP_SECONDS = 10;

function createFakeClock(duration) {
  let base = 0;
  let startedAt = null;
  const now = () => (startedAt === null ? base : base + (performance.now() - startedAt) / 1000);
  return {
    duration,
    get currentTime() { return Math.min(now(), duration); },
    set currentTime(t) { base = Math.max(0, Math.min(t, duration)); if (startedAt !== null) startedAt = performance.now(); },
    get paused() { return startedAt === null; },
    get ended() { return now() >= duration; },
    play() { if (this.ended) base = 0; startedAt = performance.now(); return Promise.resolve(); },
    pause() { base = now(); startedAt = null; },
  };
}

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export async function createPlayer({ settings, points, onTime, onMarker }) {
  const videoEl = document.getElementById('film');
  const placeholder = document.getElementById('film-placeholder');
  const placeholderTime = document.getElementById('placeholder-time');
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const btnBack = document.getElementById('btn-back');
  const btnFwd = document.getElementById('btn-forward');
  const range = document.getElementById('timeline');
  const markers = document.getElementById('timeline-markers');
  const timeCur = document.getElementById('time-current');
  const timeTot = document.getElementById('time-total');
  let media;
  if (settings.video_file) {
    videoEl.src = settings.video_file;
    await new Promise((resolve) => {
      if (videoEl.readyState >= 1) return resolve();
      videoEl.addEventListener('loadedmetadata', resolve, { once: true });
      videoEl.addEventListener('error', resolve, { once: true });
    });
    media = videoEl;
  }
  if (!media || !Number.isFinite(media.duration)) {
    media = createFakeClock(Number(settings.video_duration) || 240);
    videoEl.hidden = true;
    placeholder.hidden = false;
  }
  const duration = media.duration;
  range.max = String(duration);
  timeTot.textContent = formatTime(duration);
  const markerEls = new Map();
  points.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'timeline__marker';
    b.textContent = String(i + 1);
    b.style.left = `${(p.time_start / duration) * 100}%`;
    b.setAttribute('aria-label', `Vaar naar ${p.title_nl}`);
    b.addEventListener('click', () => onMarker(p));
    markers.append(b);
    markerEls.set(p.id, b);
  });
  let scrubbing = false;
  range.addEventListener('pointerdown', () => { scrubbing = true; });
  window.addEventListener('pointerup', () => { scrubbing = false; });
  range.addEventListener('input', () => seek(Number(range.value)));

  btnPlay.addEventListener('click', toggle);
  btnBack.addEventListener('click', () => seek(media.currentTime - SKIP_SECONDS));
  btnFwd.addEventListener('click', () => seek(media.currentTime + SKIP_SECONDS));
  function updatePlayButton() {
    const playing = !media.paused && !media.ended;
    playIcon.textContent = playing ? '❚❚' : '▶';
    btnPlay.setAttribute('aria-label', playing ? 'Pauzeren' : 'Afspelen');
  }

  function play() { const r = media.play(); updatePlayButton(); return r; }
  function pause() { media.pause(); updatePlayButton(); }
  function toggle() { (media.paused || media.ended) ? play() : pause(); }
  function seek(t) {
    media.currentTime = Math.max(0, Math.min(t, duration));
    tick(true);
  }
  let loop = false;
  let lastT = -1;
  function tick(force = false) {
    const t = media.currentTime;
    if (force || t !== lastT) {
      lastT = t;
      if (!scrubbing) range.value = String(t);
      range.setAttribute('aria-valuetext', `${formatTime(t)} van ${formatTime(duration)}`);
      timeCur.textContent = formatTime(t);
      placeholderTime.textContent = formatTime(t);
      onTime(t);
    }
    if (!(media instanceof HTMLMediaElement) && !media.paused && media.ended) {
      if (loop) { media.currentTime = 0; } else { media.pause(); updatePlayButton(); }
    }
  }
  (function loop() { tick(); requestAnimationFrame(loop); })();
  if (media instanceof HTMLMediaElement) {
    media.addEventListener('play', updatePlayButton);
    media.addEventListener('pause', updatePlayButton);
    media.addEventListener('ended', updatePlayButton);
  }
  return {
    duration,
    get currentTime() { return media.currentTime; },
    seek,
    play,
    pause,
    setLoop(on) {
      loop = Boolean(on);
      if (media instanceof HTMLMediaElement) media.loop = loop;
    },
    setActiveMarker(id) {
      markerEls.forEach((el, pid) => el.classList.toggle('is-active', pid === id));
    },
  };
}
