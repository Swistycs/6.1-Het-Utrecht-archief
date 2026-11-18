<?php
declare(strict_types=1);

const UTRECHT_BOUNDS = ['lat_min' => 52.06, 'lat_max' => 52.12, 'lng_min' => 5.08, 'lng_max' => 5.16];

function str_field(array $in, string $key, int $max, bool $required, string $label, array &$errors): ?string
{
    $v = trim((string) ($in[$key] ?? ''));
    if ($v === '') {
        if ($required) $errors[$key] = "Vul een $label in.";
        return null;
    }
    if (mb_strlen($v) > $max) {
        $errors[$key] = "De $label mag maximaal $max tekens lang zijn.";
    }
    return $v;
}

function num_field(array $in, string $key, string $label, array &$errors): ?float
{
    $raw = str_replace(',', '.', trim((string) ($in[$key] ?? '')));
    if ($raw === '' || !is_numeric($raw)) {
        $errors[$key] = "Vul bij $label een getal in.";
        return null;
    }
    return (float) $raw;
}

function validate_point(array $in, float $videoDuration): array
{
    $e = [];
    $d = [
        'title_nl' => str_field($in, 'title_nl', 150, true, 'titel (Nederlands)', $e),
        'title_en' => str_field($in, 'title_en', 150, false, 'titel (Engels)', $e),
        'text_nl'  => str_field($in, 'text_nl', 2000, true, 'tekst (Nederlands)', $e),
        'text_en'  => str_field($in, 'text_en', 2000, false, 'tekst (Engels)', $e),
        'sound'    => str_field($in, 'sound', 100, false, 'geluid', $e),
        'time_start' => num_field($in, 'time_start', 'begintijd', $e),
        'time_end'   => num_field($in, 'time_end', 'eindtijd', $e),
        'lat'        => num_field($in, 'lat', 'breedtegraad', $e),
        'lng'        => num_field($in, 'lng', 'lengtegraad', $e),
        'sort_order' => (int) ($in['sort_order'] ?? 0),
        'is_published' => !empty($in['is_published']) ? 1 : 0,
    ];
    if ($d['time_start'] !== null && ($d['time_start'] < 0 || $d['time_start'] > $videoDuration)) {
        $e['time_start'] = sprintf('De begintijd moet tussen 0 en %.1f seconden liggen.', $videoDuration);
    }
    if ($d['time_end'] !== null && $d['time_end'] > $videoDuration) {
        $e['time_end'] = sprintf('De eindtijd mag niet na het einde van de film liggen (%.1f s).', $videoDuration);
    }
    if ($d['time_start'] !== null && $d['time_end'] !== null && $d['time_end'] <= $d['time_start']) {
        $e['time_end'] = 'De eindtijd moet na de begintijd liggen.';
    }
    if ($d['lat'] !== null && $d['lng'] !== null) {
        $b = UTRECHT_BOUNDS;
        if ($d['lat'] < $b['lat_min'] || $d['lat'] > $b['lat_max'] || $d['lng'] < $b['lng_min'] || $d['lng'] > $b['lng_max']) {
            $e['lat'] = 'Deze positie ligt niet in Utrecht. Klik op de kaart om de plek te kiezen.';
        }
    }
    return [$d, $e];
}
