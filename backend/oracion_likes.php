<?php
// oracion_likes.php
// API simple para manejar likes de motivos de oración (lectura/escritura en likes_oracion.json)

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$likesFile = __DIR__ . '/likes_oracion.json';

// ---- Funciones auxiliares ----
function loadLikes($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }

    $json = file_get_contents($filePath);
    $data = json_decode($json, true);

    if (!is_array($data)) {
        return [];
    }

    return $data;
}

function saveLikes($filePath, $likes) {
    $fp = fopen($filePath, 'c+'); // crea si no existe
    if (!$fp) {
        return false;
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }

    // Leer contenido actual (por si otro proceso escribió antes)
    $contents = stream_get_contents($fp);
    $current = json_decode($contents, true);
    if (!is_array($current)) {
        $current = [];
    }

    $json = json_encode($likes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    // Limpiar archivo y escribir nuevo contenido
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $json);
    fflush($fp);

    flock($fp, LOCK_UN);
    fclose($fp);

    return true;
}

// ---- GET: devolver todos los conteos ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $likes = loadLikes($likesFile);
    echo json_encode([
        'success' => true,
        'likes'   => $likes
    ]);
    exit;
}

// ---- POST: actualizar un like (like / unlike) ----
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Payload inválido.']);
        exit;
    }

    $id     = isset($payload['id']) ? trim($payload['id']) : '';
    $action = isset($payload['action']) ? trim($payload['action']) : '';

    if ($id === '' || ($action !== 'like' && $action !== 'unlike')) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parámetros inválidos.']);
        exit;
    }

    $likes = loadLikes($likesFile);
    if (!isset($likes[$id]) || !is_int($likes[$id])) {
        $likes[$id] = 0;
    }

    if ($action === 'like') {
        $likes[$id] += 1;
    } elseif ($action === 'unlike') {
        $likes[$id] = max(0, $likes[$id] - 1);
    }

    if (!saveLikes($likesFile, $likes)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se pudo guardar el archivo de likes.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'id'      => $id,
        'count'   => $likes[$id]
    ]);
    exit;
}

// Método no permitido
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
