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

async function cachedVideoUrl(file) {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open('oudegracht-media');
    const hit = await cache.match(new URL(file, location.href).href);
    return hit ? URL.createObjectURL(await hit.blob()) : null;
  } catch {
    return null;
  }
}

export async function createPlayer({ settings, onTime, onState }) {
  const videoEl = document.getElementById('film');
  const placeholder = document.getElementById('film-placeholder');
  const placeholderTime = document.getElementById('placeholder-time');
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const btnBack = document.getElementById('btn-back');
  const btnFwd = document.getElementById('btn-forward');
  const range = document.getElementById('timeline');
  const timeCur = document.getElementById('time-current');
  const timeTot = document.getElementById('time-total');
  let media;
  const loadSrc = (src) => new Promise((resolve) => {
    const done = () => {
      videoEl.removeEventListener('loadedmetadata', done);
      videoEl.removeEventListener('error', done);
      resolve(videoEl.readyState >= 1 && !videoEl.error);
    };
    videoEl.addEventListener('loadedmetadata', done);
    videoEl.addEventListener('error', done);
    videoEl.src = src;
  });
  if (settings.video_file) {
    const cachedSrc = await cachedVideoUrl(settings.video_file);
    const ok = cachedSrc && await loadSrc(cachedSrc);
    if (!ok) await loadSrc(settings.video_file);
    media = videoEl;
    let recovering = false;
    videoEl.addEventListener('error', async () => {
      if (recovering) return;
      recovering = true;
      const at = lastT > 0 ? lastT : 0;
      const wasPlaying = !videoEl.paused;
      if (await loadSrc(`${settings.video_file}?herstel=${Date.now()}`)) {
        videoEl.currentTime = at;
        if (wasPlaying) videoEl.play().catch(() => {});
      }
      recovering = false;
    });
  }
  if (!media || !Number.isFinite(media.duration)) {
    media = createFakeClock(Number(settings.video_duration) || 240);
    videoEl.hidden = true;
    placeholder.hidden = false;
  }
  const duration = media.duration;
  range.max = String(duration);
  timeTot.textContent = formatTime(duration);
  const track = range.parentElement;
  let scrubbing = false;
  range.addEventListener('pointerdown', () => { scrubbing = true; });
  window.addEventListener('pointerup', () => { scrubbing = false; });
  range.addEventListener('input', () => seek(Number(range.value)));

  btnPlay.addEventListener('click', toggle);
  btnBack?.addEventListener('click', () => seek(media.currentTime - SKIP_SECONDS));
  btnFwd?.addEventListener('click', () => seek(media.currentTime + SKIP_SECONDS));
  function updatePlayButton() {
    const playing = !media.paused && !media.ended;
    playIcon.textContent = playing ? '❚❚' : '▶';
    if (playText) playText.textContent = playing ? 'Pauze' : 'Varen';
    onState?.(playing);
  }

  function play() {
    const r = media.play();
    updatePlayButton();
    return r?.catch?.(() => {});
  }
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
      track.style.setProperty('--progress', `${(t / duration) * 100}%`);
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
  };
}
