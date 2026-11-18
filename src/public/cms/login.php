<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';

if (current_user()) {
    redirect('points.php');
}

$error = null;
$email = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $email = (string) ($_POST['email'] ?? '');
    $error = attempt_login($email, (string) ($_POST['password'] ?? ''));
    if ($error === null) {
        redirect('points.php');
    }
}

cms_header('Inloggen');
?>
<div class="login">
  <img src="../assets/img/logo-hua.svg" alt="Het Utrechts Archief" class="login__logo" width="80" height="80">
  <h1>Inloggen</h1>
  <p class="muted">Beheer de inhoud van ‘Ontmoet de Oudegracht’.</p>
  <?php if ($error): ?><p class="flash flash--error" role="alert"><?= h($error) ?></p><?php endif; ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <label for="email">E-mailadres</label>
    <input type="email" id="email" name="email" value="<?= h($email) ?>" autocomplete="username" required autofocus>
    <label for="password">Wachtwoord</label>
    <input type="password" id="password" name="password" autocomplete="current-password" required>
    <button class="btn btn--primary">Inloggen</button>
  </form>
</div>
<?php cms_footer();
