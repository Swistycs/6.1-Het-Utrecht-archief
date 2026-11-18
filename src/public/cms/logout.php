<?php
declare(strict_types=1);
require __DIR__ . '/../../includes/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    logout();
    session_start();
    flash('success', 'Je bent uitgelogd.');
}
redirect('login.php');
