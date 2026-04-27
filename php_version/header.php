<?php
require_once 'config.php';

// Fetch leagues for the sidebar
$sidebar_leagues_query = $conn->query("SELECT * FROM leagues ORDER BY name ASC");
$sidebar_leagues = [];
if ($sidebar_leagues_query) {
    while($row = $sidebar_leagues_query->fetch_assoc()) {
        $sidebar_leagues[] = $row;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LigaFull - é bola na rede!</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-gray-200 min-h-screen font-sans">
    <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 shadow-md">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <button id="menuBtn" class="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Menu de Ligas">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                
                <div class="cursor-pointer group" onclick="window.location.href='index.php'">
                    <div class="flex items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-green-400 group-hover:scale-110 transition-transform">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L8 12v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.25.58-.56 1.12-.9 1.6l-2.6-2.6V12c0-1.1-.9-2-2-2h-1L6.3 5.47c.59-.34 1.23-.6 1.9-.77v1.3c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5.07c3.5.63 6.15 3.58 6.15 7.13 0 .79-.14 1.56-.39 2.27z" fill="currentColor"/>
                        </svg>
                        <h1 class="text-xl sm:text-2xl font-black text-white tracking-tighter">
                            <span class="text-green-400">Liga</span>Full
                        </h1>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <?php if (isset($_SESSION['user_id'])): ?>
                    <div class="flex items-center gap-2 bg-gray-900/50 p-1 pr-3 rounded-full border border-white/5">
                        <img 
                            src="<?php echo $_SESSION['user_photo'] ?? 'https://ui-avatars.com/api/?name=' . urlencode($_SESSION['user_name']); ?>" 
                            class="w-8 h-8 rounded-full object-cover border border-white/10"
                            alt="Perfil"
                        >
                        <div class="hidden sm:block">
                            <p class="text-[10px] font-black text-white uppercase leading-none"><?php echo explode(' ', $_SESSION['user_name'])[0]; ?></p>
                            <a href="logout.php" class="text-[8px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest mt-0.5">Sair</a>
                        </div>
                    </div>
                <?php endif; ?>

                <a href="admin/index.php" class="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Configurações de Administrador">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </a>
            </div>
        </div>
    </header>

    <!-- Sidebar Drawer -->
    <div id="sidebar" class="fixed top-0 left-0 h-full bg-gray-800 w-72 shadow-xl transform -translate-x-full transition-transform duration-300 ease-in-out z-[60] border-r border-gray-700">
        <div class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-bold text-white">Ligas Disponíveis</h2>
            <button id="closeSidebar" class="text-gray-400 hover:text-white" aria-label="Fechar menu">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <nav class="p-4 flex flex-col h-[calc(100%-64px)]">
            <ul class="space-y-2 flex-grow overflow-y-auto no-scrollbar">
                <?php foreach ($sidebar_leagues as $league): ?>
                    <li>
                        <a href="league_details.php?slug=<?php echo $league['slug']; ?>" class="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
                            <img src="<?php echo $league['logo_url'] ?: 'img/default-logo.png'; ?>" alt="<?php echo $league['name']; ?>" class="w-8 h-8 rounded-full mr-3 object-cover flex-shrink-0">
                            <span class="text-white font-medium"><?php echo $league['name']; ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
                <?php if (empty($sidebar_leagues)): ?>
                    <li class="p-3 text-gray-500 text-sm italic">Nenhuma liga cadastrada.</li>
                <?php endif; ?>
            </ul>

            <!-- Ad Space in Sidebar -->
            <div class="mt-auto p-4 bg-gray-900 rounded-xl border border-gray-700">
                <span class="text-[8px] text-gray-500 font-bold uppercase block mb-2">Espaço Patrocinado</span>
                <img src="https://logodownload.org/wp-content/uploads/2014/07/adidas-logo-0.png" class="w-12 mx-auto filter grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer" alt="Adidas">
                <p class="text-[10px] text-gray-400 text-center mt-2 font-medium">Equipamento profissional para sua liga.</p>
            </div>
        </nav>
    </div>
    <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-50" style="display: none;"></div>
    <main class="container mx-auto px-4 py-8">
