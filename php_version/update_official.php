<?php
include 'config.php';

// update_official.php - Atualiza os dados de um oficial (árbitro ou mesário)
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(['error' => 'ID do oficial não fornecido']);
    exit;
}

$id = $data['id'];
$name = $data['name'] ?? '';
$nickname = $data['nickname'] ?? '';
$cpf = $data['cpf'] ?? '';
$bank_account = $data['bank_account'] ?? '';
$role = $data['role'] ?? '';

$sql = "UPDATE officials SET 
        name = '$name', 
        nickname = '$nickname', 
        cpf = '$cpf', 
        bank_account = '$bank_account', 
        role = '$role' 
        WHERE id = '$id'";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => $conn->error]);
}
?>
