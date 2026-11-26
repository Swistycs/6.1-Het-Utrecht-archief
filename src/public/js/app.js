import { createPlayer } from './player.js';
import { createMap } from './map.js';
import { createPoints } from './points.js';
import { createIdle } from './idle.js';
import { createStopPopup } from './popup.js';
import { playEffect, startAmbient, stopAmbient, setSoundEnabled, isSoundEnabled, unlockAudio } from './audio.js';

const API_URL = 'api/content.php';

async function loadContent() {
  const res = await fetch(API_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`API gaf status ${res.status}`);
  return res.json();
}

function showError(message) {
  const main = document.querySelector('main');
  const p = document.createElement('p');
  p.className = 'error';
  p.setAttribute('role', 'alert');
  p.textContent = message;
  main.replaceChildren(p);
}

function initDialogs(settings) {
  const intro = document.getElementById('dlg-intro');
  const colofon = document.getElementById('dlg-colofon');
  document.getElementById('intro-text').textContent = settings.intro_nl || '';
  document.getElementById('colofon-text').textContent = settings.colofon_nl || '';
  document.getElementById('btn-info').addEventListener('click', () => colofon.showModal());
  [intro, colofon].forEach((dlg) => dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }));
  return { intro, colofon };
}

const TILE_COLORS = ['var(--hua-paars)', 'var(--hua-groenbeige)', 'var(--hua-beige-55)', 'var(--hua-paars-45)', 'var(--hua-green)', 'var(--hua-red)'];
const TILE_PATTERN = 'pcpcp' + 'cpcpp';

function buildMosaic(el, points) {
  const photos = points.flatMap((p) => p.media.slice(0, 1).map((m) => m.url));
  let pi = 0;
  let ci = 0;
  const tiles = [...TILE_PATTERN].map((kind, i) => {
    const tile = document.createElement('span');
    if (kind === 'p' && photos.length) {
      tile.style.backgroundImage = `url("${photos[pi++ % photos.length]}")`;
    } else {
      tile.style.background = TILE_COLORS[ci++ % TILE_COLORS.length];
    }
    tile.style.animationDelay = `${i * 60}ms`;
    return tile;
  });
  el.replaceChildren(...tiles);
}

async function registerOffline(settings, points) {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('sw.js');
    const reg = await navigator.serviceWorker.ready;
    const urls = [
      settings.video_file,
      ...points.flatMap((p) => p.media.map((m) => m.url)),
    ].filter(Boolean).map((u) => new URL(u, location.href).href);
    reg.active?.postMessage({ type: 'precache-media', urls });
  } catch (err) {
    console.warn('Offline werking niet beschikbaar', err);
  }
}

async function init() {
  let content;
  try {
    content = await loadContent();
  } catch (err) {
    console.error(err);
    showError('De inhoud kon niet worden geladen. Probeer het later opnieuw.');
    return;
  }
  const { settings, route, points } = content;

  const dialogs = initDialogs(settings);
  registerOffline(settings, points);

  let player;
  let idle;

  const map = createMap({
    route,
    points,
    onPointSelect: (p) => sailTo(p),
  });

  let inAttract = true;

  const popup = createStopPopup({
    points,
    onContinue: () => player.play(),
    onStay: () => idle?.start(),
    autoSeconds: settings.stop_seconds ?? 20,
  });

  const info = createPoints({
    points,
    duration: Number(settings.video_duration) || 1,
    onChange: (p) => {
      map.setActive(p ? p.id : null);
      if (!p || !player) return;
      if (inAttract) {
        popup.show(p, { teaser: true });
      } else {
        player.pause();
        popup.show(p);
        playEffect(p.sound);
      }
    },
  });

  player = await createPlayer({
    settings,
    points,
    onTime: (t) => {
      map.setTime(t);
      info.update(t);
    },
    onState: (playing) => {
      if (playing && !inAttract) startAmbient();
      else stopAmbient();
      if (inAttract || !idle) return;
      if (playing || popup.counting) idle.stop();
      else idle.start();
    },
  });

  const btnSound = document.getElementById('btn-sound');
  const showSound = () => {
    const on = isSoundEnabled();
    btnSound.setAttribute('aria-pressed', String(on));
    document.getElementById('sound-label').textContent = on ? 'Geluid aan' : 'Geluid uit';
  };
  btnSound.addEventListener('click', () => {
    setSoundEnabled(!isSoundEnabled());
    showSound();
  });
  showSound();

  function sailTo(p) {
    player.pause();
    player.seek(p.time_start);
    if (inAttract) return;
    popup.show(p);
  }

  info.layout(player.duration);
  document.getElementById('btn-play').addEventListener('click', () => popup.hide());

  window.addEventListener('resize', () => map.invalidateSize());

  const attract = document.getElementById('attract');
  buildMosaic(document.getElementById('attract-mosaic'), points);
  idle = createIdle({ seconds: settings.idle_seconds, onIdle: enterAttract });

  function enterAttract() {
    inAttract = true;
    stopAmbient();
    setSoundEnabled(true);
    showSound();
    popup.hide();
    idle.stop();
    [dialogs.intro, dialogs.colofon].forEach((d) => d.open && d.close());
    player.setLoop(false);
    player.pause();
    player.seek(0);
    attract.hidden = false;
    attract.focus();
  }

  function leaveAttract() {
    inAttract = false;
    unlockAudio();
    popup.hide();
    attract.hidden = true;
    player.setLoop(false);
    player.pause();
    player.seek(0);
    dialogs.intro.showModal();
    idle.start();
  }

  attract.addEventListener('click', leaveAttract);
  dialogs.intro.addEventListener('close', () => {
    if (inAttract) return;
    player.seek(0);
    player.play();
  });
  enterAttract();
}

init();
