<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';
$user = require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        $e = [];
        $name = str_field($_POST, 'name', 100, true, 'naam', $e);
        $email = str_field($_POST, 'email', 190, true, 'e-mailadres', $e);
        $role = ($_POST['role'] ?? '') === 'admin' ? 'admin' : 'editor';
        $pass = (string) ($_POST['password'] ?? '');
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) $e['email'] = 'Dit is geen geldig e-mailadres.';
        if (mb_strlen($pass) < MIN_PASSWORD_LEN) $e['password'] = 'Het wachtwoord moet minstens ' . MIN_PASSWORD_LEN . ' tekens lang zijn.';
        if (!$e) {
            $exists = db()->prepare('SELECT 1 FROM users WHERE email = ?');
            $exists->execute([$email]);
            if ($exists->fetchColumn()) $e['email'] = 'Er is al een gebruiker met dit e-mailadres.';
        }
        if ($e) {
            foreach ($e as $msg) flash('error', $msg);
        } else {
            db()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
                ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT), $role]);
            flash('success', "$name is toegevoegd.");
        }
    }

    if ($action === 'delete') {
        $id = (int) ($_POST['id'] ?? 0);
        if ($id === (int) $user['id']) {
            flash('error', 'Je kunt jezelf niet verwijderen.');
        } else {
            db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
            flash('success', 'De gebruiker is verwijderd.');
        }
    }
    redirect('users.php');
}

$users = db()->query('SELECT id, name, email, role, created_at FROM users ORDER BY name')->fetchAll();
cms_header('Gebruikers', $user, 'users');
?>
<h1>Gebruikers</h1>
<div class="table-wrap">
<table class="table">
  <thead><tr><th scope="col">Naam</th><th scope="col">E-mailadres</th><th scope="col">Rol</th><th scope="col"><span class="visually-hidden">Acties</span></th></tr></thead>
  <tbody>
  <?php foreach ($users as $u): ?>
    <tr>
      <td><?= h($u['name']) ?></td>
      <td><?= h($u['email']) ?></td>
      <td><?= $u['role'] === 'admin' ? 'Beheerder' : 'Redacteur' ?></td>
      <td class="actions">
        <?php if ((int) $u['id'] !== (int) $user['id']): ?>
        <form method="post">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="delete">
          <input type="hidden" name="id" value="<?= (int) $u['id'] ?>">
          <button class="btn btn--danger">Verwijderen<span class="visually-hidden"> <?= h($u['name']) ?></span></button>
        </form>
        <?php endif; ?>
      </td>
    </tr>
  <?php endforeach; ?>
  </tbody>
</table>
</div>

<section class="card">
  <h2>Gebruiker toevoegen</h2>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <input type="hidden" name="action" value="create">
    <div class="cols">
      <div><label for="name">Naam</label><input id="name" name="name" required maxlength="100"></div>
      <div><label for="email">E-mailadres</label><input id="email" name="email" type="email" required maxlength="190"></div>
    </div>
    <div class="cols">
      <div>
        <label for="password">Tijdelijk wachtwoord <span class="hint">(minstens <?= MIN_PASSWORD_LEN ?> tekens)</span></label>
        <input id="password" name="password" type="password" required minlength="<?= MIN_PASSWORD_LEN ?>" autocomplete="new-password">
      </div>
      <div>
        <label for="role">Rol</label>
        <select id="role" name="role">
          <option value="editor">Redacteur – mag inhoud beheren</option>
          <option value="admin">Beheerder – mag ook gebruikers beheren</option>
        </select>
      </div>
    </div>
    <button class="btn btn--primary">Toevoegen</button>
  </form>
</section>
<?php cms_footer();
