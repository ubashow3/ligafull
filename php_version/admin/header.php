<?php
session_start();
if (!isset($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - LigaFull</title>
    <link rel="stylesheet" href="../css/style.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-gray-200 min-h-screen font-sans">
    <div class="flex flex-col md:flex-row min-h-screen">
        <!-- Sidebar -->
        <aside class="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div class="p-6 border-b border-gray-700">
                <a href="index.php" class="text-2xl font-extrabold text-green-400 tracking-tight">
                    LigaFull <span class="text-white text-sm font-normal">Admin</span>
                </a>
            </div>
            <nav class="flex-grow p-4 space-y-1">
                <a href="index.php" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors <?php echo basename($_SERVER['PHP_SELF']) == 'index.php' ? 'bg-gray-700 text-green-400' : 'text-gray-400'; ?>">
                    <i class="fas fa-chart-pie w-5"></i> Dashboard
                </a>
                <a href="leagues.php" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors <?php echo basename($_SERVER['PHP_SELF']) == 'leagues.php' ? 'bg-gray-700 text-green-400' : 'text-gray-400'; ?>">
                    <i class="fas fa-trophy w-5"></i> Ligas
                </a>
                <a href="championships.php" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors <?php echo basename($_SERVER['PHP_SELF']) == 'championships.php' ? 'bg-gray-700 text-green-400' : 'text-gray-400'; ?>">
                    <i class="fas fa-medal w-5"></i> Campeonatos
                </a>
                <a href="clubs.php" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors <?php echo basename($_SERVER['PHP_SELF']) == 'clubs.php' ? 'bg-gray-700 text-green-400' : 'text-gray-400'; ?>">
                    <i class="fas fa-shield-alt w-5"></i> Clubes
                </a>
            </nav>
            <div class="p-4 border-t border-gray-700">
                <div class="flex items-center gap-3 p-3 mb-2">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xs">
                        <?php echo substr($_SESSION['admin_name'], 0, 1); ?>
                    </div>
                    <span class="text-sm font-medium truncate"><?php echo $_SESSION['admin_name']; ?></span>
                </div>
                <a href="logout.php" class="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                    <i class="fas fa-sign-out-alt w-5"></i> Sair
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow p-4 md:p-8 overflow-x-hidden">
