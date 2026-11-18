<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';
$user = require_login();

$fields = [
    'intro_nl'       => ['Introductietekst (Nederlands)', 'textarea', 600],
    'intro_en'       => ['Introductietekst (Engels)', 'textarea', 600],
    'colofon_nl'     => ['Colofon (Nederlands)', 'textarea', 1500],
    'colofon_en'     => ['Colofon (Engels)', 'textarea', 1500],
    'idle_seconds'   => ['Na hoeveel seconden zonder aanraking terug naar het startscherm?', 'number', 4],
    'video_file'     => ['Videobestand (pad vanaf de webroot)', 'text', 255],
    'video_duration' => ['Lengte van de film (seconden)', 'text', 10],
];

$errors = [];
$values = [];
foreach ($fields as $key => $_) {
    $values[$key] = setting($key);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    foreach ($fields as $key => [$label, $type, $max]) {
        $v = trim((string) ($_POST[$key] ?? ''));
        if (mb_strlen($v) > $max) $errors[$key] = "‘$label’ is te lang (maximaal $max tekens).";
        $values[$key] = $v;
    }
    $idle = (int) $values['idle_seconds'];
    if ($idle < 15 || $idle > 3600) $errors['idle_seconds'] = 'Kies een tijd tussen 15 en 3600 seconden.';
    if (!is_numeric(str_replace(',', '.', $values['video_duration'])) || (float) str_replace(',', '.', $values['video_duration']) <= 0) {
        $errors['video_duration'] = 'Vul de lengte van de film in seconden in, bijvoorbeeld 182.8.';
    }
    if ($values['video_file'] !== '' && !preg_match('#^assets/video/[A-Za-z0-9._-]+\.(mp4|webm)$#', $values['video_file'])) {
        $errors['video_file'] = 'Het videobestand moet in assets/video/ staan en eindigen op .mp4 of .webm.';
    }
    if (!$errors) {
        $values['video_duration'] = str_replace(',', '.', $values['video_duration']);
        $stmt = db()->prepare('INSERT INTO settings (setting_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)');
        foreach ($values as $k => $v) $stmt->execute([$k, $v]);
        flash('success', 'De instellingen zijn opgeslagen.');
        redirect('settings.php');
    }
}

cms_header('Instellingen', $user, 'settings');
?>
<h1>Instellingen</h1>
<?php if ($errors): ?>
  <div class="flash flash--error" role="alert"><p>De instellingen zijn nog niet opgeslagen:</p>
  <ul><?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>
<form method="post" class="form card">
  <?= csrf_field() ?>
  <?php foreach ($fields as $key => [$label, $type, $max]): ?>
    <label for="<?= $key ?>"><?= h($label) ?></label>
    <?php if ($type === 'textarea'): ?>
      <textarea id="<?= $key ?>" name="<?= $key ?>" rows="4" maxlength="<?= $max ?>"<?= str_ends_with($key, '_en') ? ' lang="en"' : '' ?><?= err_attrs($errors, $key) ?>><?= h($values[$key]) ?></textarea>
    <?php else: ?>
      <input id="<?= $key ?>" name="<?= $key ?>" type="<?= $type ?>" value="<?= h($values[$key]) ?>"<?= err_attrs($errors, $key) ?>>
    <?php endif; ?>
    <?= field_error($errors, $key) ?>
  <?php endforeach; ?>
  <div class="form-actions"><button class="btn btn--primary">Opslaan</button></div>
</form>
<?php cms_footer();
