<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';
$user = require_login();

$id = (int) ($_GET['id'] ?? 0);
$videoFile = setting('video_file');
$videoDuration = (float) setting('video_duration', '0');

function load_point(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM points WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

$point = $id ? load_point($id) : null;
if ($id && !$point) {
    flash('error', 'Dit punt bestaat niet (meer).');
    redirect('points.php');
}

$errors = [];
$form = $point ?? [
    'title_nl' => '', 'title_en' => '', 'text_nl' => '', 'text_en' => '',
    'time_start' => '', 'time_end' => '', 'lat' => '', 'lng' => '',
    'sound' => '', 'sort_order' => 0, 'is_published' => 0,
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? 'save';

    if ($action === 'save') {
        [$data, $errors] = validate_point($_POST, $videoDuration);
        if (!$errors) {
            $cols = ['title_nl', 'title_en', 'text_nl', 'text_en', 'time_start', 'time_end', 'lat', 'lng', 'sound', 'sort_order', 'is_published'];
            $values = array_map(fn($c) => $data[$c], $cols);
            $values[] = $user['id'];
            if ($point) {
                $set = implode(', ', array_map(fn($c) => "$c = ?", $cols));
                $values[] = $point['id'];
                db()->prepare("UPDATE points SET $set, updated_by = ? WHERE id = ?")->execute($values);
                flash('success', 'De wijzigingen zijn opgeslagen.');
                redirect('point-edit.php?id=' . $point['id']);
            }
            db()->prepare('INSERT INTO points (' . implode(', ', $cols) . ', updated_by) VALUES (' . rtrim(str_repeat('?, ', count($cols) + 1), ', ') . ')')
                ->execute($values);
            flash('success', 'Het punt is aangemaakt. Je kunt nu archiefbronnen toevoegen.');
            redirect('point-edit.php?id=' . db()->lastInsertId());
        }
        $form = array_merge($form, $_POST);
    }

    if ($point && $action === 'delete') {
        if (empty($_POST['confirm'])) {
            flash('error', 'Vink eerst aan dat je het punt echt wilt verwijderen.');
            redirect('point-edit.php?id=' . $point['id'] . '#verwijderen');
        }
        $files = db()->prepare('SELECT file_path FROM media WHERE point_id = ?');
        $files->execute([$point['id']]);
        db()->prepare('DELETE FROM points WHERE id = ?')->execute([$point['id']]);
        foreach ($files->fetchAll(PDO::FETCH_COLUMN) as $f) delete_upload($f);
        flash('success', 'Het punt ‘' . $point['title_nl'] . '’ is verwijderd.');
        redirect('points.php');
    }

    if ($point && $action === 'add_media') {
        $mErr = [];
        $alt = str_field($_POST, 'alt_nl', 255, true, 'beschrijving van de afbeelding (alt-tekst)', $mErr);
        $source = str_field($_POST, 'source', 255, true, 'bronvermelding', $mErr);
        $caption = str_field($_POST, 'caption_nl', 255, false, 'bijschrift', $mErr);
        $altEn = str_field($_POST, 'alt_en', 255, false, 'alt-tekst (Engels)', $mErr);
        $captionEn = str_field($_POST, 'caption_en', 255, false, 'bijschrift (Engels)', $mErr);
        $yearRaw = trim((string) ($_POST['year'] ?? ''));
        $year = null;
        if ($yearRaw !== '') {
            if (!ctype_digit($yearRaw) || (int) $yearRaw < 1000 || (int) $yearRaw > (int) date('Y')) {
                $mErr['year'] = 'Vul een geldig jaartal in, bijvoorbeeld 1929.';
            } else {
                $year = (int) $yearRaw;
            }
        }
        if (!$mErr) {
            [$file, $upErr] = store_image_upload($_FILES['image'] ?? null);
            if ($upErr) $mErr['image'] = $upErr;
        }
        if ($mErr) {
            flash('error', implode(' ', $mErr));
        } else {
            db()->prepare('INSERT INTO media (point_id, file_path, alt_nl, alt_en, caption_nl, caption_en, source, year, sort_order)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(m.sort_order), 0) + 1 FROM media m WHERE m.point_id = ?))')
                ->execute([$point['id'], $file, $alt, $altEn, $caption, $captionEn, $source, $year, $point['id']]);
            db()->prepare('UPDATE points SET updated_by = ? WHERE id = ?')->execute([$user['id'], $point['id']]);
            flash('success', 'De archiefbron is toegevoegd.');
        }
        redirect('point-edit.php?id=' . $point['id'] . '#bronnen');
    }

    if ($point && $action === 'delete_media') {
        $stmt = db()->prepare('SELECT file_path FROM media WHERE id = ? AND point_id = ?');
        $stmt->execute([(int) ($_POST['media_id'] ?? 0), $point['id']]);
        if ($file = $stmt->fetchColumn()) {
            db()->prepare('DELETE FROM media WHERE id = ? AND point_id = ?')->execute([(int) $_POST['media_id'], $point['id']]);
            delete_upload($file);
            flash('success', 'De archiefbron is verwijderd.');
        }
        redirect('point-edit.php?id=' . $point['id'] . '#bronnen');
    }
}

$media = [];
if ($point) {
    $stmt = db()->prepare('SELECT * FROM media WHERE point_id = ? ORDER BY sort_order, id');
    $stmt->execute([$point['id']]);
    $media = $stmt->fetchAll();
}
$route = db()->query('SELECT video_time AS t, lat, lng FROM route_track ORDER BY video_time')->fetchAll();
$sounds = ['' => 'Geen geluid', 'water' => 'Water', 'stad' => 'Stad', 'markt' => 'Markt', 'voetstappen' => 'Voetstappen'];

cms_header($point ? 'Punt bewerken' : 'Nieuw punt', $user, 'points');
?>
<p><a href="points.php">← Terug naar alle punten</a></p>
<h1><?= $point ? 'Punt bewerken: ' . h($point['title_nl']) : 'Nieuw punt' ?></h1>

<?php if ($errors): ?>
  <div class="flash flash--error" role="alert">
    <p>Het punt is nog niet opgeslagen. Verbeter het volgende:</p>
    <ul><?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?></ul>
  </div>
<?php endif; ?>

<form method="post" class="form form--point" novalidate>
  <?= csrf_field() ?>
  <input type="hidden" name="action" value="save">

  <fieldset class="card">
    <legend>Tekst</legend>
    <div class="cols">
      <div>
        <label for="title_nl">Titel (Nederlands) *</label>
        <input id="title_nl" name="title_nl" maxlength="150" required value="<?= h($form['title_nl']) ?>"<?= err_attrs($errors, 'title_nl') ?>>
        <?= field_error($errors, 'title_nl') ?>
        <label for="text_nl">Tekst (Nederlands) *</label>
        <p class="hint" id="hint-text">Kort en in eenvoudige taal (B1), zodat kinderen en volwassenen het snappen.</p>
        <textarea id="text_nl" name="text_nl" rows="6" maxlength="2000" required aria-describedby="hint-text"<?= err_attrs($errors, 'text_nl') ?>><?= h($form['text_nl']) ?></textarea>
        <?= field_error($errors, 'text_nl') ?>
      </div>
      <div>
        <label for="title_en">Titel (Engels)</label>
        <input id="title_en" name="title_en" maxlength="150" value="<?= h($form['title_en']) ?>" lang="en">
        <label for="text_en">Tekst (Engels)</label>
        <textarea id="text_en" name="text_en" rows="6" maxlength="2000" lang="en"><?= h($form['text_en']) ?></textarea>
      </div>
    </div>
  </fieldset>

  <fieldset class="card">
    <legend>Wanneer in de film?</legend>
    <?php if ($videoFile): ?>
      <video id="preview" class="preview" src="../<?= h($videoFile) ?>" controls muted preload="metadata"></video>
      <p class="hint">Spoel de film naar de juiste plek en druk op ‘Huidige videotijd gebruiken’.</p>
    <?php else: ?>
      <p class="hint">Er is nog geen film ingesteld (zie Instellingen). Vul de tijden in seconden in.</p>
    <?php endif; ?>
    <div class="cols">
      <div>
        <label for="time_start">Begintijd (seconden) *</label>
        <div class="inline">
          <input id="time_start" name="time_start" inputmode="decimal" required value="<?= h($form['time_start']) ?>"<?= err_attrs($errors, 'time_start') ?>>
          <?php if ($videoFile): ?><button type="button" class="btn" data-use-time="time_start">Huidige videotijd gebruiken</button><?php endif; ?>
        </div>
        <?= field_error($errors, 'time_start') ?>
      </div>
      <div>
        <label for="time_end">Eindtijd (seconden) *</label>
        <div class="inline">
          <input id="time_end" name="time_end" inputmode="decimal" required value="<?= h($form['time_end']) ?>"<?= err_attrs($errors, 'time_end') ?>>
          <?php if ($videoFile): ?><button type="button" class="btn" data-use-time="time_end">Huidige videotijd gebruiken</button><?php endif; ?>
        </div>
        <?= field_error($errors, 'time_end') ?>
      </div>
    </div>
  </fieldset>

  <fieldset class="card">
    <legend>Waar op de kaart?</legend>
    <p class="hint" id="hint-map">Klik op de kaart om de plek van het punt te kiezen. De groene lijn is de vaarroute.</p>
    <div id="pick-map" class="pick-map" data-route="<?= h(json_encode($route)) ?>" aria-describedby="hint-map"></div>
    <div class="cols">
      <div>
        <label for="lat">Breedtegraad *</label>
        <input id="lat" name="lat" inputmode="decimal" required value="<?= h($form['lat']) ?>"<?= err_attrs($errors, 'lat') ?>>
        <?= field_error($errors, 'lat') ?>
      </div>
      <div>
        <label for="lng">Lengtegraad *</label>
        <input id="lng" name="lng" inputmode="decimal" required value="<?= h($form['lng']) ?>"<?= err_attrs($errors, 'lng') ?>>
        <?= field_error($errors, 'lng') ?>
      </div>
    </div>
  </fieldset>

  <fieldset class="card">
    <legend>Overig</legend>
    <div class="cols">
      <div>
        <label for="sound">Geluidseffect</label>
        <select id="sound" name="sound">
          <?php foreach ($sounds as $val => $label): ?>
            <option value="<?= h($val) ?>"<?= ($form['sound'] ?? '') === $val ? ' selected' : '' ?>><?= h($label) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div>
        <label for="sort_order">Volgorde (bij gelijke begintijd)</label>
        <input id="sort_order" name="sort_order" type="number" value="<?= (int) $form['sort_order'] ?>">
      </div>
    </div>
    <label class="check"><input type="checkbox" name="is_published" value="1"<?= !empty($form['is_published']) ? ' checked' : '' ?>> Gepubliceerd (zichtbaar in de applicatie)</label>
  </fieldset>

  <div class="form-actions">
    <button class="btn btn--primary"><?= $point ? 'Wijzigingen opslaan' : 'Punt aanmaken' ?></button>
    <a class="btn" href="points.php">Annuleren</a>
  </div>
</form>

<?php if ($point): ?>
<section class="card" id="bronnen" aria-labelledby="bronnen-title">
  <h2 id="bronnen-title">Archiefbronnen</h2>
  <?php if ($media): ?>
    <ul class="media-list">
    <?php foreach ($media as $m): ?>
      <li>
        <img src="../uploads/<?= h($m['file_path']) ?>" alt="<?= h($m['alt_nl']) ?>">
        <div>
          <strong><?= h($m['caption_nl'] ?: $m['alt_nl']) ?></strong>
          <p class="muted"><?= h(implode(' · ', array_filter([$m['year'], $m['source']]))) ?></p>
          <form method="post">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="delete_media">
            <input type="hidden" name="media_id" value="<?= (int) $m['id'] ?>">
            <button class="btn btn--danger">Verwijderen<span class="visually-hidden"> <?= h($m['alt_nl']) ?></span></button>
          </form>
        </div>
      </li>
    <?php endforeach; ?>
    </ul>
  <?php else: ?>
    <p class="muted">Nog geen bronnen bij dit punt.</p>
  <?php endif; ?>

  <h3>Bron toevoegen</h3>
  <form method="post" enctype="multipart/form-data" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="add_media">
    <input type="hidden" name="MAX_FILE_SIZE" value="<?= UPLOAD_MAX_BYTES ?>">
    <label for="image">Afbeelding * <span class="hint">(JPG, PNG of WebP, maximaal 5 MB)</span></label>
    <input type="file" id="image" name="image" accept="image/jpeg,image/png,image/webp" required>
    <div class="cols">
      <div>
        <label for="alt_nl">Wat is er te zien? (alt-tekst) *</label>
        <input id="alt_nl" name="alt_nl" maxlength="255" required>
        <label for="caption_nl">Bijschrift</label>
        <input id="caption_nl" name="caption_nl" maxlength="255">
      </div>
      <div>
        <label for="alt_en">Alt-tekst (Engels)</label>
        <input id="alt_en" name="alt_en" maxlength="255" lang="en">
        <label for="caption_en">Bijschrift (Engels)</label>
        <input id="caption_en" name="caption_en" maxlength="255" lang="en">
      </div>
    </div>
    <div class="cols">
      <div>
        <label for="source">Bronvermelding * <span class="hint">(bijv. catalogusnummer HUA)</span></label>
        <input id="source" name="source" maxlength="255" required>
      </div>
      <div>
        <label for="year">Jaar</label>
        <input id="year" name="year" inputmode="numeric" maxlength="4">
      </div>
    </div>
    <button class="btn btn--primary">Bron uploaden</button>
  </form>
</section>

<section class="card card--danger" id="verwijderen" aria-labelledby="del-title">
  <h2 id="del-title">Punt verwijderen</h2>
  <p>Het punt en alle bronnen erbij worden definitief verwijderd. Dit kun je niet ongedaan maken.</p>
  <form method="post">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="delete">
    <label class="check"><input type="checkbox" name="confirm" value="1" required> Ja, ik wil ‘<?= h($point['title_nl']) ?>’ verwijderen</label>
    <button class="btn btn--danger">Punt verwijderen</button>
  </form>
</section>
<?php endif;
cms_footer(['https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', '../js/cms.js']);
