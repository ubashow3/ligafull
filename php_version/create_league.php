<?php
// create_league.php - Salvar liga no MySQL
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['error' => 'Nenhum dado recebido']);
    exit;
}

$id = uniqid();
$name = $conn->real_escape_string($data['name']);
$slug = $conn->real_escape_string($data['slug']);
$logo_url = $conn->real_escape_string($data['logo_url'] ?? '');
$cover_url = $conn->real_escape_string($data['cover_url'] ?? '');
$admin_email = $conn->real_escape_string($data['admin_email']);
$admin_password = $data['admin_password'];
$city = $conn->real_escape_string($data['city'] ?? '');
$state = $conn->real_escape_string($data['state'] ?? '');

$passwordHash = password_hash($admin_password, PASSWORD_DEFAULT);

$sql = "INSERT INTO leagues (id, name, slug, logo_url, cover_url, admin_email, admin_password_hash, city, state) 
        VALUES ('$id', '$name', '$slug', '$logo_url', '$cover_url', '$admin_email', '$passwordHash', '$city', '$state')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['id' => $id, 'name' => $name, 'slug' => $slug]);
} else {
    echo json_encode(['error' => $conn->error]);
}

$conn->close();
?>
