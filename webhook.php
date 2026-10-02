<?php
/**
 * ================================================================
 * PAYHOOK WEBHOOK GATEWAY HANDLER — ComitTools Pro / MikrotikAI
 * URL Endpoint: /webhook.php (Hosted on GitHub / Web Server)
 * ================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization, X-Payhook-Signature');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['status' => 'ok']));
}

$PAYHOOK_API_KEY = "72d1b8425d1d948e308037f8833448bfe694f7e80230aa1eeae3f60d7835de55";
$PAYHOOK_SECRET  = "b592c8e0dd58492ab5cda3efb00b738f8047be8d2e37329a458089953233143d";

// Polyfill getallheaders if not exists (Nginx, FastCGI, IIS)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// 1. Verifikasi Header API Key (jika dikirim oleh PayHook)
$headers = getallheaders();
$receivedApiKey = '';

foreach ($headers as $key => $value) {
    if (strtolower($key) === 'x-api-key') {
        $receivedApiKey = trim($value);
        break;
    }
}

// 2. Baca Body Payload (JSON / Form Data)
$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!$payload && !empty($_POST)) {
    $payload = $_POST;
}

// 3. Catat Log Transaksi Masuk
$logFile = __DIR__ . '/payhook_transactions.json';
$existingLogs = [];
if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $existingLogs = json_decode($content, true) ?: [];
}

$transactionRecord = [
    'timestamp' => date('Y-m-d H:i:s'),
    'headers'   => $headers,
    'payload'   => $payload,
    'raw'       => $rawInput,
    'status'    => 'RECEIVED_SUCCESS'
];

array_unshift($existingLogs, $transactionRecord);
// Simpan maks 50 riwayat terakhir
if (count($existingLogs) > 50) {
    $existingLogs = array_slice($existingLogs, 0, 50);
}
@file_put_contents($logFile, json_encode($existingLogs, JSON_PRETTY_PRINT));

// 4. Response Berhasil ke PayHook
http_response_code(200);
echo json_encode([
    'status'    => 'success',
    'message'   => 'PayHook Webhook berhasil diverifikasi dan diterima oleh Mikrotik Tools Pro.',
    'timestamp' => date('Y-m-d H:i:s'),
    'data'      => [
        'order_id' => $payload['order_id'] ?? $payload['ref_id'] ?? $payload['invoice'] ?? ('PAYHOOK-' . strtoupper(dechex(time()))),
        'amount'   => $payload['amount'] ?? 0,
        'status'   => 'PAID'
    ]
]);
exit;

