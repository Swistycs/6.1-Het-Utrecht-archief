<?php
declare(strict_types=1);

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES      = 15;
const SESSION_IDLE_SEC  = 30 * 60;
const MIN_PASSWORD_LEN  = 12;

function attempt_login(string $email, string $password): ?string
{
    $generic = 'Het e-mailadres of wachtwoord klopt niet.';
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([trim($email)]);
    $user = $stmt->fetch();
    if (!$user) {
        password_verify($password, '$2y$10$ni1/TWguy8r8kXzB0ErcbONAu/PiEuxbtUe1tfPQwZX8VOBQV3XWy');
        return $generic;
    }
    if ($user['locked_until'] !== null && strtotime($user['locked_until']) > time()) {
        return 'Dit account is tijdelijk geblokkeerd na te veel mislukte pogingen. Probeer het over ' . LOCK_MINUTES . ' minuten opnieuw.';
    }
    if (!password_verify($password, $user['password_hash'])) {
        $failed = (int) $user['failed_logins'] + 1;
        $lock = $failed >= MAX_FAILED_LOGINS ? date('Y-m-d H:i:s', time() + LOCK_MINUTES * 60) : null;
        db()->prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?')
            ->execute([$lock ? 0 : $failed, $lock, $user['id']]);
        return $lock
            ? 'Te veel mislukte pogingen. Dit account is ' . LOCK_MINUTES . ' minuten geblokkeerd.'
            : $generic;
    }
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    }
    db()->prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?')->execute([$user['id']]);
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['last_seen'] = time();
    return null;
}
function logout(): void
{
    $_SESSION = [];
    session_regenerate_id(true);
    session_destroy();
}
function current_user(): ?array
{
    static $user = false;
    if ($user !== false) {
        return $user;
    }
    if (empty($_SESSION['user_id'])) {
        return $user = null;
    }
    $stmt = db()->prepare('SELECT id, name, email, role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    return $user = ($stmt->fetch() ?: null);
}
function require_login(): array
{
    $idleTooLong = isset($_SESSION['last_seen']) && time() - $_SESSION['last_seen'] > SESSION_IDLE_SEC;
    if ($idleTooLong) {
        logout();
        session_start();
        flash('error', 'Je was 30 minuten niet actief en bent uitgelogd.');
    }
    $user = $idleTooLong ? null : current_user();
    if (!$user) {
        redirect('login.php');
    }
    $_SESSION['last_seen'] = time();
    return $user;
}
function require_admin(): array
{
    $user = require_login();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        exit('Alleen een beheerder mag deze pagina openen.');
    }
    return $user;
}
