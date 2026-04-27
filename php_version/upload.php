<?php
// upload.php - Upload de arquivos no PHP
require_once 'config.php';

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

if ($_FILES["file"]) {
    $target_file = $target_dir . basename($_FILES["file"]["name"]);
    $uploadOk = 1;
    $imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

    if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
        echo json_encode(["url" => "uploads/" . basename($_FILES["file"]["name"])]);
    } else {
        echo json_encode(["error" => "Erro ao fazer upload do arquivo."]);
    }
} else {
    echo json_encode(["error" => "Nenhum arquivo enviado."]);
}
?>
