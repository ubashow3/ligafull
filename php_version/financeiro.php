<?php
include 'config.php';

// financeiro.php - Gerencia as informações financeiras do campeonato
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    if (!isset($_GET['championship_id'])) {
        echo json_encode(['error' => 'ID do campeonato não fornecido']);
        exit;
    }
    
    $championship_id = $_GET['championship_id'];
    $sql = "SELECT referee_fee, assistant_fee, table_official_fee, field_fee, 
                   yellow_card_fine, red_card_fine, registration_fee_per_club, 
                   player_registration_deadline 
            FROM championships WHERE id = '$championship_id'";
            
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        echo json_encode($result->fetch_assoc());
    } else {
        echo json_encode(['error' => 'Campeonato não encontrado']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['championship_id'])) {
        echo json_encode(['error' => 'Dados inválidos']);
        exit;
    }
    
    $id = $data['championship_id'];
    $referee_fee = $data['refereeFee'] ?? 0;
    $assistant_fee = $data['assistantFee'] ?? 0;
    $table_official_fee = $data['tableOfficialFee'] ?? 0;
    $field_fee = $data['fieldFee'] ?? 0;
    $yellow_card_fine = $data['yellowCardFine'] ?? 0;
    $red_card_fine = $data['redCardFine'] ?? 0;
    $registration_fee_per_club = $data['registrationFeePerClub'] ?? 0;
    $deadline = $data['playerRegistrationDeadline'] ?? null;

    $sql = "UPDATE championships SET 
            referee_fee = '$referee_fee', 
            assistant_fee = '$assistant_fee', 
            table_official_fee = '$table_official_fee', 
            field_fee = '$field_fee', 
            yellow_card_fine = '$yellow_card_fine', 
            red_card_fine = '$red_card_fine', 
            registration_fee_per_club = '$registration_fee_per_club',
            player_registration_deadline = " . ($deadline ? "'$deadline'" : "NULL") . "
            WHERE id = '$id'";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => $conn->error]);
    }
}
?>
