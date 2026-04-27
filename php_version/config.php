<?php
// config.php - Conexão com o MySQL (XAMPP)
$host = 'localhost';
$user = 'root';
$pass = '';
$db   = 'ligafull';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

// Configuração de CORS para o React conseguir falar com o PHP
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit;
}
?>
