<?php include 'header.php'; ?>
<?php
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'config.php';
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, full_name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['full_name'];
        header('Location: index.php');
        exit;
    } else {
        $error = "E-mail ou senha incorretos.";
    }
}
?>

<div class="animate-fade-in flex items-center justify-center min-h-[60vh]">
    <div class="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
        <div class="text-center mb-8">
            <h2 class="text-3xl font-extrabold text-white mb-2 tracking-tight">Entrar na LigaFull</h2>
            <p class="text-gray-400">Acesse sua conta para gerenciar seus clubes.</p>
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
                <input type="email" name="email" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="seu@email.com">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Senha</label>
                <input type="password" name="password" required class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-500" placeholder="••••••••">
            </div>
            
            <div class="flex items-center justify-between text-sm">
                <label class="flex items-center gap-2 text-gray-400 cursor-pointer">
                    <input type="checkbox" class="rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500">
                    Lembrar de mim
                </label>
                <a href="#" class="text-green-400 hover:underline">Esqueceu a senha?</a>
            </div>

            <button type="submit" class="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-600/20">
                Entrar Agora
            </button>
        </form>
        
        <div class="mt-8 text-center pt-6 border-t border-gray-700">
            <p class="text-gray-400">Não tem uma conta? <a href="register_page.php" class="text-green-400 font-bold hover:underline">Cadastre-se</a></p>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>
