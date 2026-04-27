<?php
header('Content-Type: application/json');
require_once '../config.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['league_id'])) {
    echo json_encode(['error' => 'Dados inválidos']);
    exit;
}

$id = uniqid();
$name = $data['name'];
$league_id = $data['league_id'];

$stmt = $conn->prepare("INSERT INTO championships (id, name, league_id) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $id, $name, $league_id);

if ($stmt->execute()) {
    echo json_encode(['id' => $id]);
} else {
    echo json_encode(['error' => $conn->error]);
}
?>
