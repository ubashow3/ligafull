<?php include 'header.php'; ?>
<?php
require_once 'config.php';
$leagues = $conn->query("SELECT * FROM leagues ORDER BY created_at DESC");
?>

<div class="animate-fade-in">
    <div class="mb-12">
        <h1 class="text-4xl font-extrabold text-white mb-4">Ligas Ativas</h1>
        <p class="text-xl text-gray-400">Explore as ligas de basquete em nossa plataforma.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <?php if ($leagues->num_rows > 0): ?>
            <?php while ($league = $leagues->fetch_assoc()): ?>
                <div class="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-green-500/50 transition-all group cursor-pointer" onclick="window.location.href='league_details.php?slug=<?php echo $league['slug']; ?>'">
                    <div class="h-40 bg-gray-700 relative overflow-hidden">
                        <img src="<?php echo $league['cover_url'] ?: 'https://picsum.photos/seed/'.$league['id'].'/800/400'; ?>" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60">
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent"></div>
                        <div class="absolute bottom-4 left-6 flex items-center gap-4">
                            <img src="<?php echo $league['logo_url'] ?: 'img/default-logo.png'; ?>" class="w-16 h-16 rounded-full border-4 border-gray-800 shadow-2xl object-cover bg-gray-800">
                        </div>
                    </div>
                    <div class="p-6 pt-2">
                        <h3 class="text-2xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors"><?php echo $league['name']; ?></h3>
                        <p class="text-gray-400 flex items-center gap-2 mb-6">
                            <i class="fas fa-map-marker-alt text-green-500"></i>
                            <?php echo $league['city']; ?>, <?php echo $league['state']; ?>
                        </p>
                        
                        <div class="flex items-center justify-between pt-4 border-t border-gray-700">
                            <div class="flex items-center gap-2 text-sm text-gray-400">
                                <i class="fas fa-medal text-green-500"></i>
                                <span>0 Campeonatos</span>
                            </div>
                            <span class="text-green-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Ver mais <i class="fas fa-chevron-right text-xs"></i>
                            </span>
                        </div>
                    </div>
                </div>
            <?php endwhile; ?>
        <?php else: ?>
            <div class="col-span-full text-center py-20 bg-gray-800 rounded-3xl border-2 border-dashed border-gray-700">
                <i class="fas fa-trophy text-6xl text-gray-600 mb-6 block"></i>
                <p class="text-gray-400 text-xl font-medium">Nenhuma liga encontrada no momento.</p>
                <a href="create_league_page.php" class="text-green-400 font-bold mt-4 inline-block hover:underline">Seja o primeiro a criar uma!</a>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include 'footer.php'; ?>
