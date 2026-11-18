<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../includes/db.php';
[$_, $name, $email] = $argv + [null, null, null];
if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Gebruik: php create-admin.php \"Naam\" email@voorbeeld.nl\n");
    exit(1);
}
fwrite(STDOUT, 'Wachtwoord (min. 12 tekens): ');
system('stty -echo 2>/dev/null');
$pass = trim((string) fgets(STDIN));
system('stty echo 2>/dev/null');
fwrite(STDOUT, "\n");
if (mb_strlen($pass) < 12) {
    fwrite(STDERR, "Het wachtwoord moet minstens 12 tekens lang zijn.\n");
    exit(1);
}
db()->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "admin")
               ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = "admin", failed_logins = 0, locked_until = NULL')
    ->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT)]);
echo "Beheerder $email is klaar.\n";
