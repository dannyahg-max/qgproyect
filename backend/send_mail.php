<?php
// ============================================================================
// send_mail.php
// Envío de correo desde formulario de contacto usando PHPMailer (sin Composer)
// ============================================================================

// En producción puedes dejar estos valores en 0.
// Si necesitas depurar, cambia a E_ALL y display_errors = 1.
error_reporting(0);
ini_set('display_errors', 0);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --------------- CARGA DE PHPMailer (SIN COMPOSER) --------------- //
// La carpeta PHPMailer debe estar en: qgproyect/backend/PHPMailer/

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

// --------------- CONFIGURACIÓN BÁSICA DEL SITIO --------------- //

$siteEmail   = 'contacto@qgproject.cl';        // Correo de envío (y de recepción)
$siteName    = 'qgproject';      // Nombre que verá el receptor
$thankYouUrl = '../gracias.html';              // Página de agradecimiento

// --------------- VALIDACIÓN DEL MÉTODO HTTP --------------- //

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Método no permitido.');
}

// --------------- HONEYPOT (ANTI-SPAM) --------------- //
// Campo "website" NO debe venir con contenido si el usuario es real.

$honeypot = $_POST['website'] ?? '';
if (trim($honeypot) !== '') {
    // Se asume que es un bot; respondemos OK pero no enviamos nada.
    http_response_code(200);
    exit('OK');
}

// --------------- RECEPCIÓN Y SANEAMIENTO DE DATOS --------------- //

$name   = trim($_POST['name']  ?? '');
$email  = trim($_POST['email'] ?? '');
$phone  = trim($_POST['phone'] ?? '');
$topic  = trim($_POST['topic'] ?? '');
$msg    = trim($_POST['msg']   ?? '');

// Validaciones mínimas
if (
    $name === '' ||
    $email === '' ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    $msg === ''
) {
    http_response_code(400);
    exit('Faltan datos obligatorios o el email no es válido.');
}

$topicLabel = $topic !== '' ? $topic : 'No especificado';

// --------------- CONSTRUCCIÓN DEL CORREO --------------- //

$subject = 'Nuevo contacto desde el sitio — Quijada Gómez';

// Cuerpo en HTML
$bodyHtml = "
    <h2>Nuevo mensaje de contacto</h2>
    <p><strong>Nombre:</strong> " . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</p>
    <p><strong>Email:</strong> " . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . "</p>
    <p><strong>Teléfono:</strong> " . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . "</p>
    <p><strong>Motivo:</strong> " . htmlspecialchars($topicLabel, ENT_QUOTES, 'UTF-8') . "</p>
    <p><strong>Mensaje:</strong></p>
    <p>" . nl2br(htmlspecialchars($msg, ENT_QUOTES, 'UTF-8')) . "</p>
";

// Versión en texto plano (por si el cliente de correo no admite HTML)
$bodyPlain = "Nuevo mensaje de contacto\n\n";
$bodyPlain .= "Nombre: {$name}\n";
$bodyPlain .= "Email: {$email}\n";
$bodyPlain .= "Teléfono: {$phone}\n";
$bodyPlain .= "Motivo: {$topicLabel}\n\n";
$bodyPlain .= "Mensaje:\n{$msg}\n";

// --------------- CONFIGURACIÓN Y ENVÍO CON PHPMailer --------------- //

try {
    $mail = new PHPMailer(true);

    // Config de servidor SMTP (ajusta estos datos según tu hosting)
    $mail->isSMTP();
    $mail->Host       = 'mail.qgproject.cl';   // Normalmente: mail.tudominio.cl
    $mail->SMTPAuth   = true;
    $mail->Username   = $siteEmail;            // Usualmente el mismo correo $siteEmail
    $mail->Password   = 'qgproject2026'; // TODO: PON AQUÍ LA CONTRASEÑA REAL
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL
    $mail->Port       = 465;                  // 465 (SSL) o 587 (TLS) según tu proveedor

    $mail->CharSet = 'UTF-8';

    // Remitente
    $mail->setFrom($siteEmail, $siteName);

    // Destinatario (tú mismo)
    $mail->addAddress($siteEmail, $siteName);

    // Si quieres que al responder se use el correo de quien escribe:
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($email, $name);
    }

    // Contenido
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $bodyHtml;
    $mail->AltBody = $bodyPlain;

    // Enviar
    $mail->send();

    // --------------- REDIRECCIÓN A PÁGINA DE GRACIAS --------------- //
    header('Location: ' . $thankYouUrl);
    exit;

} catch (Exception $e) {
    // En caso de error, puedes registrar el detalle en un log del servidor:
    // error_log('Error al enviar correo de contacto: ' . $mail->ErrorInfo);

    http_response_code(500);
    echo 'Ocurrió un problema al enviar tu mensaje. Inténtalo nuevamente más tarde.';
}
