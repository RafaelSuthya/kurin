<?php
// Router untuk PHP built-in server agar:
// - File statis di public/* dilayani langsung
// - Request /api/* diarahkan ke Laravel (public/index.php)
// - Sisanya diarahkan ke Laravel front controller (public/index.php)

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$publicPath = __DIR__ . '/public';
$filePath = $publicPath . $uri;

// Layani file statis (css/js/img) langsung
if ($uri !== '/' && file_exists($filePath) && is_file($filePath)) {
    return false; // biarkan PHP server melayani file tersebut
}

// Arahkan API ke Laravel front controller
if (preg_match('#^/api(?:/|$)#', $uri)) {
    require $publicPath . '/index.php';
    return true;
}

// Fallback ke Laravel untuk route non-API
require $publicPath . '/index.php';
return true;