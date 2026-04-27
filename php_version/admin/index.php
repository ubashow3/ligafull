<?php include 'header.php'; ?>
<?php
require_once '../config.php';

// Fetch some stats
$leagues_count = $conn->query("SELECT COUNT(*) as count FROM leagues")->fetch_assoc()['count'];
$championships_count = $conn->query("SELECT COUNT(*) as count FROM championships")->fetch_assoc()['count'];
$clubs_count = $conn->query("SELECT COUNT(*) as count FROM clubs")->fetch_assoc()['count'];
$users_count = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];
?>

<div class="animate-fade-in">
    <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-white">Dashboard</h1>
        <p class="text-gray-400">Bem-vindo ao painel administrativo da LigaFull.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400">
                    <i class="fas fa-trophy text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white"><?php echo $leagues_count; ?></div>
            <div class="text-sm text-gray-400 font-medium uppercase tracking-wider">Ligas Ativas</div>
        </div>
        
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <i class="fas fa-medal text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white"><?php echo $championships_count; ?></div>
            <div class="text-sm text-gray-400 font-medium uppercase tracking-wider">Campeonatos</div>
        </div>

        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                    <i class="fas fa-shield-alt text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white"><?php echo $clubs_count; ?></div>
            <div class="text-sm text-gray-400 font-medium uppercase tracking-wider">Clubes</div>
        </div>

        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center text-yellow-400">
                    <i class="fas fa-users text-xl"></i>
                </div>
            </div>
            <div class="text-3xl font-bold text-white"><?php echo $users_count; ?></div>
            <div class="text-sm text-gray-400 font-medium uppercase tracking-wider">Usuários</div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
            <div class="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 class="text-lg font-bold text-white">Ligas Recentes</h3>
                <a href="leagues.php" class="text-green-400 text-sm hover:underline">Ver todas</a>
            </div>
            <div class="divide-y divide-gray-700">
                <?php
                $latest_leagues = $conn->query("SELECT * FROM leagues ORDER BY created_at DESC LIMIT 5");
                while ($league = $latest_leagues->fetch_assoc()):
                ?>
                    <div class="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                        <div class="flex items-center gap-4">
                            <img src="<?php echo $league['logo_url'] ?: '../img/default-logo.png'; ?>" class="w-10 h-10 rounded-full object-cover border border-gray-600">
                            <div>
                                <div class="font-bold text-white"><?php echo $league['name']; ?></div>
                                <div class="text-xs text-gray-400"><?php echo $league['city']; ?>, <?php echo $league['state']; ?></div>
                            </div>
                        </div>
                        <a href="leagues.php?id=<?php echo $league['id']; ?>" class="text-gray-400 hover:text-white">
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    </div>
                <?php endwhile; ?>
            </div>
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-bold text-white mb-6">Ações Rápidas</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="../create_league_page.php" class="flex items-center gap-4 p-4 bg-green-600/10 border border-green-600/20 rounded-xl text-green-400 hover:bg-green-600/20 transition-all">
                    <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-black">
                        <i class="fas fa-plus"></i>
                    </div>
                    <span class="font-bold">Nova Liga</span>
                </a>
                <a href="championships.php" class="flex items-center gap-4 p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl text-blue-400 hover:bg-blue-600/20 transition-all">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <i class="fas fa-medal"></i>
                    </div>
                    <span class="font-bold">Campeonatos</span>
                </a>
                <a href="clubs.php" class="flex items-center gap-4 p-4 bg-purple-600/10 border border-purple-600/20 rounded-xl text-purple-400 hover:bg-purple-600/20 transition-all">
                    <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <span class="font-bold">Clubes</span>
                </a>
                <a href="users.php" class="flex items-center gap-4 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-xl text-yellow-400 hover:bg-yellow-600/20 transition-all">
                    <div class="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center text-black">
                        <i class="fas fa-users"></i>
                    </div>
                    <span class="font-bold">Usuários</span>
                </a>
            </div>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>
