<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';
$user = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (int) ($_POST['id'] ?? 0);
    $publish = ($_POST['action'] ?? '') === 'publish' ? 1 : 0;
    db()->prepare('UPDATE points SET is_published = ?, updated_by = ? WHERE id = ?')->execute([$publish, $user['id'], $id]);
    flash('success', $publish ? 'Het punt is gepubliceerd.' : 'Het punt is nu een concept en niet meer zichtbaar.');
    redirect('points.php');
}

$points = db()->query(
    'SELECT p.id, p.title_nl, p.time_start, p.time_end, p.is_published, p.updated_at, u.name AS editor,
            (SELECT COUNT(*) FROM media m WHERE m.point_id = p.id) AS media_count
       FROM points p LEFT JOIN users u ON u.id = p.updated_by
      ORDER BY p.time_start, p.sort_order'
)->fetchAll();

function fmt_time(float $s): string { return sprintf('%d:%04.1f', intdiv((int) $s, 60), fmod($s, 60)); }

cms_header('Punten', $user, 'points');
?>
<div class="page-head">
  <h1>Punten langs de gracht</h1>
  <a class="btn btn--primary" href="point-edit.php">+ Nieuw punt</a>
</div>
<p class="muted">Een punt verschijnt in de applicatie zodra de film bij de begintijd is. Alleen gepubliceerde punten zijn zichtbaar.</p>

<?php if (!$points): ?>
  <p>Er zijn nog geen punten. Maak het eerste punt aan met de knop ‘Nieuw punt’.</p>
<?php else: ?>
<div class="table-wrap">
<table class="table">
  <thead><tr><th scope="col">#</th><th scope="col">Titel</th><th scope="col">Tijd in de film</th><th scope="col">Bronnen</th><th scope="col">Status</th><th scope="col">Laatst gewijzigd</th><th scope="col"><span class="visually-hidden">Acties</span></th></tr></thead>
  <tbody>
  <?php foreach ($points as $i => $p): ?>
    <tr>
      <td><?= $i + 1 ?></td>
      <td><a href="point-edit.php?id=<?= (int) $p['id'] ?>"><?= h($p['title_nl']) ?></a></td>
      <td><?= fmt_time((float) $p['time_start']) ?> – <?= fmt_time((float) $p['time_end']) ?></td>
      <td><?= (int) $p['media_count'] ?></td>
      <td><span class="badge <?= $p['is_published'] ? 'badge--on' : 'badge--off' ?>"><?= $p['is_published'] ? 'Gepubliceerd' : 'Concept' ?></span></td>
      <td><?= h(date('d-m-Y H:i', strtotime($p['updated_at']))) ?><?= $p['editor'] ? ' door ' . h($p['editor']) : '' ?></td>
      <td class="actions">
        <a class="btn" href="point-edit.php?id=<?= (int) $p['id'] ?>">Bewerken<span class="visually-hidden"> <?= h($p['title_nl']) ?></span></a>
        <form method="post">
          <?= csrf_field() ?>
          <input type="hidden" name="id" value="<?= (int) $p['id'] ?>">
          <?php if ($p['is_published']): ?>
            <button class="btn" name="action" value="unpublish">Verbergen<span class="visually-hidden"> <?= h($p['title_nl']) ?></span></button>
          <?php else: ?>
            <button class="btn" name="action" value="publish">Publiceren<span class="visually-hidden"> <?= h($p['title_nl']) ?></span></button>
          <?php endif; ?>
        </form>
      </td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
</div>
<?php endif;
cms_footer();
