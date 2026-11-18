<?php
declare(strict_types=1);

require __DIR__ . '/../../includes/db.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-cache');
try {
    $pdo = db();
    $settings = [];
    foreach ($pdo->query('SELECT setting_key, value FROM settings') as $row) {
        $settings[$row['setting_key']] = $row['value'];
    }

    $route = array_map(
        fn(array $r) => ['t' => (float) $r['video_time'], 'lat' => (float) $r['lat'], 'lng' => (float) $r['lng']],
        $pdo->query('SELECT video_time, lat, lng FROM route_track ORDER BY video_time')->fetchAll()
    );

    $points = $pdo->query(
        'SELECT id, title_nl, title_en, text_nl, text_en, time_start, time_end, lat, lng, sound, sort_order
           FROM points
          WHERE is_published = 1
          ORDER BY time_start, sort_order'
    )->fetchAll();
    $mediaByPoint = [];
    $media = $pdo->query(
        'SELECT m.id, m.point_id, m.file_path, m.alt_nl, m.alt_en, m.caption_nl, m.caption_en, m.source, m.year
           FROM media m
           JOIN points p ON p.id = m.point_id AND p.is_published = 1
          ORDER BY m.point_id, m.sort_order, m.id'
    );
    foreach ($media as $m) {
        $pid = (int) $m['point_id'];
        unset($m['point_id']);
        $m['id']   = (int) $m['id'];
        $m['year'] = $m['year'] !== null ? (int) $m['year'] : null;
        $m['url']  = 'uploads/' . rawurlencode($m['file_path']);
        unset($m['file_path']);
        $mediaByPoint[$pid][] = $m;
    }
    foreach ($points as &$p) {
        $p['id']         = (int) $p['id'];
        $p['time_start'] = (float) $p['time_start'];
        $p['time_end']   = (float) $p['time_end'];
        $p['lat']        = (float) $p['lat'];
        $p['lng']        = (float) $p['lng'];
        $p['sort_order'] = (int) $p['sort_order'];
        $p['media']      = $mediaByPoint[$p['id']] ?? [];
    }
    unset($p);
    echo json_encode(
        ['settings' => $settings, 'route' => $route, 'points' => $points],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
} catch (Throwable $e) {
    error_log('[api/content] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'De inhoud kon niet worden geladen.']);
}
