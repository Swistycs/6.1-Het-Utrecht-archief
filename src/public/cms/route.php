<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';
$user = require_login();

$videoFile = setting('video_file');
$videoDuration = (float) setting('video_duration', '0');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $rows = [];
    $errors = [];
    $times = $_POST['t'] ?? [];
    foreach ((array) $times as $i => $t) {
        if (!empty($_POST['remove'][$i])) continue;
        $t = str_replace(',', '.', trim((string) $t));
        $lat = str_replace(',', '.', trim((string) ($_POST['lat_row'][$i] ?? '')));
        $lng = str_replace(',', '.', trim((string) ($_POST['lng_row'][$i] ?? '')));
        if ($t === '' && $lat === '' && $lng === '') continue;
        if (!is_numeric($t) || !is_numeric($lat) || !is_numeric($lng)) {
            $errors[] = 'Elke rij heeft een tijd, breedtegraad en lengtegraad nodig (als getal).';
            continue;
        }
        [, $e] = validate_point(['title_nl' => 'x', 'text_nl' => 'x', 'time_start' => $t, 'time_end' => $videoDuration, 'lat' => $lat, 'lng' => $lng], $videoDuration + 0.01);
        if (isset($e['lat']) || isset($e['time_start'])) {
            $errors[] = 'Rij met tijd ' . $t . ': ' . ($e['lat'] ?? $e['time_start']);
            continue;
        }
        $rows[] = [(float) $t, (float) $lat, (float) $lng];
    }
    $nt = str_replace(',', '.', trim((string) ($_POST['time_new'] ?? '')));
    $nlat = str_replace(',', '.', trim((string) ($_POST['lat'] ?? '')));
    $nlng = str_replace(',', '.', trim((string) ($_POST['lng'] ?? '')));
    if ($nt !== '' || $nlat !== '' || $nlng !== '') {
        if (is_numeric($nt) && is_numeric($nlat) && is_numeric($nlng)) {
            $rows[] = [(float) $nt, (float) $nlat, (float) $nlng];
        } else {
            $errors[] = 'Het nieuwe ijkpunt heeft een tijd én een plek op de kaart nodig.';
        }
    }
    if (count($rows) < 2) $errors[] = 'De route heeft minstens twee ijkpunten nodig (begin en eind).';

    if ($errors) {
        foreach (array_unique($errors) as $e) flash('error', $e);
    } else {
        usort($rows, fn($a, $b) => $a[0] <=> $b[0]);
        $pdo = db();
        $pdo->beginTransaction();
        $pdo->exec('DELETE FROM route_track');
        $ins = $pdo->prepare('INSERT INTO route_track (video_time, lat, lng) VALUES (?, ?, ?)');
        foreach ($rows as $r) $ins->execute($r);
        $pdo->commit();
        flash('success', 'De vaarroute is opgeslagen (' . count($rows) . ' ijkpunten).');
    }
    redirect('route.php');
}

$route = db()->query('SELECT video_time AS t, lat, lng FROM route_track ORDER BY video_time')->fetchAll();
cms_header('Route', $user, 'route');
?>
<h1>Vaarroute</h1>
<p class="muted">De route bestaat uit ijkpunten: <em>op dit moment in de film is de boot op deze plek</em>. Tussen twee ijkpunten schuift de boot gelijkmatig. Meer ijkpunten = nauwkeuriger.</p>

<form method="post" class="form">
  <?= csrf_field() ?>
  <section class="card">
    <h2>Nieuw ijkpunt</h2>
    <?php if ($videoFile): ?>
      <video id="preview" class="preview" src="../<?= h($videoFile) ?>" controls muted preload="metadata"></video>
    <?php endif; ?>
    <p class="hint" id="hint-map">1. Spoel de film naar een herkenbare plek. 2. Druk op ‘Huidige videotijd gebruiken’. 3. Klik op de kaart waar de boot op dat moment is. 4. Opslaan.</p>
    <div class="inline">
      <label for="time_new">Tijd (s)</label>
      <input id="time_new" name="time_new" inputmode="decimal">
      <?php if ($videoFile): ?><button type="button" class="btn" data-use-time="time_new">Huidige videotijd gebruiken</button><?php endif; ?>
    </div>
    <div id="pick-map" class="pick-map" data-route="<?= h(json_encode($route)) ?>" aria-describedby="hint-map"></div>
    <div class="cols">
      <div><label for="lat">Breedtegraad</label><input id="lat" name="lat" inputmode="decimal"></div>
      <div><label for="lng">Lengtegraad</label><input id="lng" name="lng" inputmode="decimal"></div>
    </div>
  </section>

  <section class="card">
    <h2>Bestaande ijkpunten</h2>
    <div class="table-wrap">
    <table class="table">
      <thead><tr><th scope="col">Tijd (s)</th><th scope="col">Breedtegraad</th><th scope="col">Lengtegraad</th><th scope="col">Verwijderen</th></tr></thead>
      <tbody>
      <?php foreach ($route as $i => $r): ?>
        <tr>
          <td><input aria-label="Tijd ijkpunt <?= $i + 1 ?>" name="t[<?= $i ?>]" value="<?= h($r['t']) ?>" inputmode="decimal"></td>
          <td><input aria-label="Breedtegraad ijkpunt <?= $i + 1 ?>" name="lat_row[<?= $i ?>]" value="<?= h($r['lat']) ?>" inputmode="decimal"></td>
          <td><input aria-label="Lengtegraad ijkpunt <?= $i + 1 ?>" name="lng_row[<?= $i ?>]" value="<?= h($r['lng']) ?>" inputmode="decimal"></td>
          <td><label class="check"><input type="checkbox" name="remove[<?= $i ?>]" value="1"><span class="visually-hidden">Ijkpunt <?= $i + 1 ?> verwijderen</span></label></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    </div>
  </section>
  <div class="form-actions"><button class="btn btn--primary">Route opslaan</button></div>
</form>
<?php cms_footer(['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', '../js/cms.js']);
