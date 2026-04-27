<?php
// register.php - Registro de usuário no MySQL
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$full_name = $conn->real_escape_string($data['full_name']);
$email = $conn->real_escape_string($data['email']);
$password = $data['password'];

$id = uniqid();
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO users (id, full_name, email, password) VALUES ('$id', '$full_name', '$email', '$hashedPassword')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['id' => $id, 'full_name' => $full_name, 'email' => $email]);
} else {
    echo json_encode(['error' => 'Erro ao registrar: ' . $conn->error]);
}

$conn->close();
?>
