<?php include 'header.php'; ?>
<?php
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'config.php';
    $full_name = $_POST['full_name'];
    $email = $_POST['email'];
    $password = $_POST['password'];

    $id = uniqid();
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (id, full_name, email, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $id, $full_name, $email, $passwordHash);

    if ($stmt->execute()) {
        $_SESSION['user_id'] = $id;
        $_SESSION['user_name'] = $full_name;
        header('Location: index.php');
        exit;
    } else {
        $error = "Erro ao cadastrar usuário. E-mail já pode estar em uso.";
    }
}
?>

<div class="animate-fade-in flex items-center justify-center min-h-[70vh]">
    <div class="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
            <h2 class="text-3xl font-extrabold text-white mb-2 tracking-tight">Criar Conta</h2>
            <p class="text-gray-400">Junte-se à LigaFull e comece sua jornada.</p>
        </div>

        <?php if (isset($error)): ?>
            <div class="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                <i class="fas fa-exclamation-circle"></i>
                <?php echo $error; ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Nome Completo</label>
                <input type="text" name="full_name" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="Seu nome completo">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">E-mail</label>
                <input type="email" name="email" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="seu@email.com">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Senha</label>
                <input type="password" name="password" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="••••••••">
            </div>
            
            <p class="text-xs text-gray-500 text-center">
                Ao se cadastrar, você concorda com nossos <a href="#" class="text-green-400 hover:underline">Termos de Uso</a> e <a href="#" class="text-green-400 hover:underline">Política de Privacidade</a>.
            </p>

            <button type="submit" class="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/20">
                Criar Conta Agora
            </button>
        </form>
        
        <div class="mt-8 text-center pt-6 border-t border-gray-700">
            <p class="text-gray-400">Já tem uma conta? <a href="login.php" class="text-green-400 font-bold hover:underline">Entre aqui</a></p>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>
