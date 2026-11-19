<?php
declare(strict_types=1);

function cms_header(string $title, ?array $user = null, string $active = ''): void
{
    $nav = [
        'points'   => ['points.php', 'Punten'],
        'route'    => ['route.php', 'Route'],
        'settings' => ['settings.php', 'Instellingen'],
    ];
    if ($user && $user['role'] === 'admin') {
        $nav['users'] = ['users.php', 'Gebruikers'];
    }
    ?>
<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title><?= h($title) ?> – CMS Ontmoet de Oudegracht</title>
  <link rel="stylesheet" href="../vendor/leaflet/leaflet.css">
  <link rel="stylesheet" href="../css/cms.css">
</head>
<body class="<?= $user ? 'has-nav' : 'is-login' ?>">
<a class="skip" href="#main">Naar de inhoud</a>
<?php if ($user): ?>
<header class="cms-top">
  <span class="cms-logo"><img src="../assets/img/logo-hua.svg" alt="" width="40" height="40"> CMS Ontmoet de Oudegracht</span>
  <span class="cms-user">Ingelogd als <?= h($user['name']) ?></span>
  <form method="post" action="logout.php"><?= csrf_field() ?><button class="btn btn--ghost">Uitloggen</button></form>
</header>
<nav class="cms-nav" aria-label="CMS-menu">
  <ul>
  <?php foreach ($nav as $key => [$href, $label]): ?>
    <li><a href="<?= $href ?>"<?= $key === $active ? ' aria-current="page"' : '' ?>><?= h($label) ?></a></li>
  <?php endforeach; ?>
    <li><a href="../" target="_blank" rel="noopener">Bekijk de applicatie ↗</a></li>
  </ul>
</nav>
<?php endif; ?>
<main id="main" class="cms-main">
<?php foreach (take_flashes() as $f): ?>
  <p class="flash flash--<?= h($f['type']) ?>" role="<?= $f['type'] === 'error' ? 'alert' : 'status' ?>"><?= h($f['message']) ?></p>
<?php endforeach;
}

function cms_footer(array $scripts = []): void
{
    ?>
</main>
<?php foreach ($scripts as $src): ?>
<script src="<?= h($src) ?>"<?= str_ends_with($src, 'cms.js') ? ' type="module"' : '' ?>></script>
<?php endforeach; ?>
</body>
</html>
<?php
}

function field_error(array $errors, string $key): string
{
    return isset($errors[$key])
        ? '<p class="field-error" id="err-' . h($key) . '">' . h($errors[$key]) . '</p>'
        : '';
}

function err_attrs(array $errors, string $key): string
{
    return isset($errors[$key]) ? ' aria-invalid="true" aria-describedby="err-' . h($key) . '"' : '';
}
