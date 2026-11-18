<?php
return [
    'db' => [
        'host' => getenv('DB_HOST') ?: 'localhost',
        'name' => getenv('DB_NAME') ?: 'oudegracht',
        'user' => getenv('DB_USER') ?: 'oudegracht',
        'pass' => getenv('DB_PASS') ?: '',
    ],
    'debug' => false,
];
