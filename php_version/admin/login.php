<?php
session_start();
if (isset($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once '../config.php';
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, full_name, password FROM users WHERE email = ? AND role = 'admin'");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['admin_id'] = $user['id'];
        $_SESSION['admin_name'] = $user['full_name'];
        header('Location: index.php');
        exit;
    } else {
        $error = "Credenciais inválidas ou você não é um administrador.";
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin - LigaFull</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-gray-200 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div class="text-center mb-8">
            <h1 class="text-3xl font-extrabold text-green-400 tracking-tight mb-2">
                LigaFull <span class="text-white font-normal text-xl">Admin</span>
            </h1>
            <p class="text-gray-400">Entre com suas credenciais de administrador</p>
        </div>

        <?php if (isset($error)): ?>
            <div class="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                <i class="fas fa-exclamation-circle"></i>
                <?php echo $error; ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                <input type="email" name="email" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="admin@ligafull.com">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Senha</label>
                <input type="password" name="password" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="••••••••">
            </div>
            <button type="submit" class="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/20">
                Entrar no Painel
            </button>
        </form>
        
        <div class="mt-8 text-center pt-6 border-t border-gray-700">
            <a href="../index.php" class="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                <i class="fas fa-arrow-left text-xs"></i> Voltar para o site
            </a>
        </div>
    </div>
</body>
</html>
