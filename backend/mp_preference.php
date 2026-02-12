<?php
// backend/mp_preference.php
header('Content-Type: application/json; charset=utf-8');

// 1. Leer JSON del cuerpo
$body = json_decode(file_get_contents('php://input'), true);
$amount = isset($body['amount']) ? floatval($body['amount']) : 0;
$type   = isset($body['type']) ? $body['type'] : 'once';

// Validaciones básicas
if ($amount <= 0) {
    echo json_encode([
        'success' => false,
        'error'   => 'Monto inválido.'
    ]);
    exit;
}

// 2. Configurar credenciales de Mercado Pago
// IMPORTANTE: usa tu ACCESS_TOKEN real (idealmente desde variable de entorno)
$access_token = 'TU_ACCESS_TOKEN_DE_MERCADO_PAGO';

// 3. Armar preferencia
$items = [[
    'title'       => $type === 'monthly' ? 'Ofrenda mensual' : 'Ofrenda única',
    'quantity'    => 1,
    'currency_id' => 'CLP',
    'unit_price'  => $amount
]];

$preference = [
    'items'      => $items,
    'back_urls'  => [
        'success' => 'https://qgproject.cl/donacion-exitosa.php',
        'failure' => 'https://qgproject.cl/donacion-fallida.php',
        'pending' => 'https://qgproject.cl/donacion-pendiente.php'
    ],
    'auto_return' => 'approved'
];

// 4. Llamar a la API de Mercado Pago
$ch = curl_init('https://api.mercadopago.com/checkout/preferences');
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $access_token
    ],
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS     => json_encode($preference)
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false) {
    echo json_encode([
        'success' => false,
        'error'   => 'Error de comunicación con Mercado Pago.'
    ]);
    exit;
}

$data = json_decode($response, true);

// 5. Evaluar respuesta
if ($httpCode >= 200 && $httpCode < 300 && isset($data['init_point'])) {
    echo json_encode([
        'success'    => true,
        'init_point' => $data['init_point']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error'   => 'No se pudo crear la preferencia.',
        'detail'  => $data
    ]);
}
