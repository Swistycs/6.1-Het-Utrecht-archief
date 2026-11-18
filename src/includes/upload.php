<?php
declare(strict_types=1);

const UPLOAD_DIR       = __DIR__ . '/../public/uploads/';
const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES     = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

function store_image_upload(?array $file): array
{
    if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return [null, 'Kies een afbeelding om te uploaden.'];
    }
    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE || $file['size'] > UPLOAD_MAX_BYTES) {
        return [null, 'De afbeelding is te groot. Het maximum is 5 MB.'];
    }
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        return [null, 'Het uploaden is mislukt. Probeer het opnieuw.'];
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset(UPLOAD_TYPES[$mime]) || @getimagesize($file['tmp_name']) === false) {
        return [null, 'Alleen JPG-, PNG- en WebP-afbeeldingen zijn toegestaan.'];
    }
    $name = bin2hex(random_bytes(16)) . '.' . UPLOAD_TYPES[$mime];
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $name)) {
        error_log('[upload] kon bestand niet verplaatsen naar ' . UPLOAD_DIR);
        return [null, 'Het uploaden is mislukt. Neem contact op met de beheerder.'];
    }
    chmod(UPLOAD_DIR . $name, 0644);
    return [$name, null];
}
function delete_upload(string $name): void
{

    if (preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/', $name)) {
        @unlink(UPLOAD_DIR . $name);
    }
}
