<?php
// user_login.php - Login de usuário no MySQL
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = $conn->real_escape_string($data['email']);
$password = $data['password'];

$sql = "SELECT * FROM users WHERE email = '$email'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        echo json_encode($user);
    } else {
        echo json_encode(['error' => 'Senha incorreta']);
    }
} else {
    echo json_encode(['error' => 'Usuário não encontrado']);
}

$conn->close();
?>
