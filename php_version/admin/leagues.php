<?php include 'header.php'; ?>
<?php
require_once '../config.php';

// Handle league deletion
if (isset($_GET['delete'])) {
    $id = $_GET['delete'];
    $stmt = $conn->prepare("DELETE FROM leagues WHERE id = ?");
    $stmt->bind_param("s", $id);
    $stmt->execute();
    echo "<script>window.location.href='leagues.php';</script>";
}

// Fetch all leagues
$leagues = $conn->query("SELECT * FROM leagues ORDER BY created_at DESC");
?>

<div class="animate-fade-in">
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-extrabold text-white">Ligas</h1>
            <p class="text-gray-400">Gerencie todas as ligas cadastradas no sistema.</p>
        </div>
        <a href="../create_league_page.php" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all">
            <i class="fas fa-plus"></i> Nova Liga
        </a>
    </div>

    <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-700/50 text-gray-400 text-xs uppercase tracking-widest font-bold">
                        <th class="px-6 py-4">Liga</th>
                        <th class="px-6 py-4">Localização</th>
                        <th class="px-6 py-4">Admin</th>
                        <th class="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    <?php while ($league = $leagues->fetch_assoc()): ?>
                        <tr class="hover:bg-gray-700/30 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <img src="<?php echo $league['logo_url'] ?: '../img/default-logo.png'; ?>" class="w-10 h-10 rounded-full object-cover border border-gray-600">
                                    <span class="font-bold text-white"><?php echo $league['name']; ?></span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm">
                                <?php echo $league['city']; ?> - <?php echo $league['state']; ?>
                            </td>
                            <td class="px-6 py-4 text-sm">
                                <?php echo $league['admin_email']; ?>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <a href="league_details.php?id=<?php echo $league['id']; ?>" class="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors" title="Detalhes">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <a href="leagues.php?delete=<?php echo $league['id']; ?>" onclick="return confirm('Tem certeza que deseja excluir esta liga?')" class="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                    <?php if ($leagues->num_rows === 0): ?>
                        <tr>
                            <td colspan="4" class="px-6 py-12 text-center text-gray-500">
                                <i class="fas fa-search text-4xl mb-4 block"></i>
                                Nenhuma liga encontrada.
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>
