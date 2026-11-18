import { createPlayer } from './player.js';
import { createMap } from './map.js';
import { createPoints } from './points.js';
import { createIdle } from './idle.js';
import { createStopPopup } from './popup.js';

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

  let player;

  const map = createMap({
    route,
    points,
    onPointSelect: (p) => sailTo(p),
  });

  let inAttract = true;

  const popup = createStopPopup({
    points,
    onContinue: () => player.play(),
  });

  const info = createPoints({
    points,
    duration: Number(settings.video_duration) || 1,
    onSelect: (p) => sailTo(p),
    onChange: (p) => {
      map.setActive(p ? p.id : null);
      if (!p || !player) return;
      if (inAttract) {
        popup.show(p, { teaser: true });
      } else {
        player.pause();
        popup.show(p);
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
  });

  function sailTo(p) {
    player.seek(p.time_start);
    player.play();
  }

  info.layout(player.duration);
  document.getElementById('btn-play').addEventListener('click', () => popup.hide());

  window.addEventListener('resize', () => map.invalidateSize());

  const attract = document.getElementById('attract');
  const idle = createIdle({ seconds: settings.idle_seconds, onIdle: enterAttract });

  function enterAttract() {
    inAttract = true;
    popup.hide();
    idle.stop();
    [dialogs.intro, dialogs.colofon].forEach((d) => d.open && d.close());
    player.seek(0);
    player.setLoop(true);
    player.play();
    attract.hidden = false;
    attract.focus();
  }

  function leaveAttract() {
    inAttract = false;
    popup.hide();
    attract.hidden = true;
    player.setLoop(false);
    player.pause();
    player.seek(0);
    dialogs.intro.showModal();
    idle.start();
  }

  attract.addEventListener('click', leaveAttract);
  enterAttract();
}

init();
