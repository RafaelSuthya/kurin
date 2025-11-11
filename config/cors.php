<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // Gunakan origin eksplisit agar kredensial (cookie) dapat dikirim dari SPA dev
    'allowed_origins' => [
        // Frontend dev servers
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost:3013',
        'http://127.0.0.1:3013',
        // ✅ Production frontend
        'https://frontend-production-ebf2.up.railway.app',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
