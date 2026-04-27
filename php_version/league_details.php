<?php
session_start();
include 'header.php';
require_once 'config.php';

$slug = $_GET['slug'] ?? '';
$stmt = $conn->prepare("SELECT * FROM leagues WHERE slug = ?");
$stmt->bind_param("s", $slug);
$stmt->execute();
$league = $stmt->get_result()->fetch_assoc();

if (!$league) {
    echo "<div class='text-center py-20 text-white'>Liga não encontrada.</div>";
    include 'footer.php';
    exit;
}

// Fetch championships for this league
$stmt = $conn->prepare("SELECT * FROM championships WHERE league_id = ?");
$stmt->bind_param("s", $league['id']);
$stmt->execute();
$championships = $stmt->get_result();

$coverImage = $league['cover_url'] ?: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';
?>

<div class="animate-fade-in -mt-8 min-h-screen bg-[#18191a]">
    <!-- Header Estilo Facebook -->
    <div class="bg-[#242526] shadow-md border-b border-white/5">
        <div class="max-w-5xl mx-auto relative">
            <!-- Foto de Capa -->
            <div class="h-44 sm:h-72 md:h-96 w-full overflow-hidden rounded-b-2xl relative group">
                <img src="<?php echo $coverImage; ?>" alt="Capa da Liga" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                
                <a href="index.php" class="absolute top-4 left-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold py-2 px-4 rounded-xl inline-flex items-center transition-all border border-white/10 text-xs z-20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Todas as Ligas
                </a>
            </div>

            <!-- Avatar e Informações da Liga -->
            <div class="px-4 sm:px-8 flex flex-col items-center sm:items-end sm:flex-row gap-4 sm:gap-6 -mt-16 sm:-mt-20 pb-6 relative z-10">
                <div class="relative">
                    <div class="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-[6px] border-[#242526] shadow-2xl bg-[#18191a] overflow-hidden">
                        <img src="<?php echo $league['logo_url'] ?: 'img/default-logo.png'; ?>" alt="<?php echo $league['name']; ?> logo" class="w-full h-full object-cover">
                    </div>
                </div>
                
                <div class="flex-grow text-center sm:text-left mb-2">
                    <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-1 italic uppercase"><?php echo $league['name']; ?></h1>
                    <p class="text-gray-400 font-bold text-sm uppercase tracking-widest">
                        <?php echo $league['city']; ?>, <?php echo $league['state']; ?> • <span class="text-green-500"><?php echo $championships->num_rows; ?> Campeonatos</span>
                    </p>
                </div>

                <div class="flex gap-2 mb-2">
                    <button class="bg-[#3a3b3c] hover:bg-[#4e4f50] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all">
                       Seguir Liga
                    </button>
                </div>
            </div>

            <!-- Abas Estilo Facebook -->
            <div class="border-t border-white/5 px-4 sm:px-8 flex gap-2">
                <button onclick="switchTab('resenha')" id="tab-resenha" class="py-4 px-6 text-sm font-black uppercase tracking-tighter transition-all relative text-[#1877F2]">
                    Resenha ⚡
                    <div class="tab-indicator absolute bottom-0 left-0 w-full h-[4px] bg-[#1877F2] rounded-t-full"></div>
                </button>
                <button onclick="switchTab('campeonatos')" id="tab-campeonatos" class="py-4 px-6 text-sm font-black uppercase tracking-tighter transition-all relative text-gray-400 hover:bg-white/5">
                    Campeonatos 🏆
                    <div class="tab-indicator hidden absolute bottom-0 left-0 w-full h-[4px] bg-[#1877F2] rounded-t-full"></div>
                </button>
            </div>
        </div>
    </div>

    <!-- Conteúdo Centralizado -->
    <div class="max-w-4xl mx-auto px-4 py-8">
        <div id="view-resenha" class="animate-fade-in">
            <div class="bg-[#242526] p-8 rounded-3xl border border-white/5 text-center py-20">
                <i class="fas fa-comments text-5xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 font-bold uppercase tracking-widest">Nenhuma resenha disponível no momento.</p>
            </div>
        </div>

        <div id="view-campeonatos" class="hidden animate-fade-in">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <?php while ($champ = $championships->fetch_assoc()): ?>
                    <div class="bg-[#242526] p-8 rounded-[32px] border border-white/5 cursor-pointer transition-all hover:bg-[#3a3b3c] hover:scale-[1.02] group relative overflow-hidden shadow-xl">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                            </div>
                            <div>
                                <h3 class="text-2xl font-black text-white leading-none group-hover:text-[#1877F2] transition-colors uppercase italic"><?php echo $champ['name']; ?></h3>
                                <p class="text-gray-500 text-xs font-black uppercase tracking-widest mt-2">0 Clubes Inscritos</p>
                            </div>
                        </div>
                        <div class="mt-8 flex items-center justify-between">
                            <span class="text-[10px] text-[#1877F2] font-black uppercase tracking-widest bg-[#1877F2]/10 px-3 py-1 rounded-full">Ver Tabela e Jogos</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                <?php endwhile; ?>
                <?php if ($championships->num_rows === 0): ?>
                    <div class="col-span-2 text-center py-24 bg-[#242526]/50 rounded-[40px] border border-dashed border-white/10">
                        <p class="text-gray-600 font-black uppercase tracking-[0.2em] italic">Nenhum campeonato ativo no momento</p>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<script>
function switchTab(tab) {
    const resenhaView = document.getElementById('view-resenha');
    const campeonatosView = document.getElementById('view-campeonatos');
    const resenhaTab = document.getElementById('tab-resenha');
    const campeonatosTab = document.getElementById('tab-campeonatos');

    if (tab === 'resenha') {
        resenhaView.classList.remove('hidden');
        campeonatosView.classList.add('hidden');
        resenhaTab.classList.add('text-[#1877F2]');
        resenhaTab.classList.remove('text-gray-400');
        campeonatosTab.classList.add('text-gray-400');
        campeonatosTab.classList.remove('text-[#1877F2]');
        resenhaTab.querySelector('.tab-indicator').classList.remove('hidden');
        campeonatosTab.querySelector('.tab-indicator').classList.add('hidden');
    } else {
        resenhaView.classList.add('hidden');
        campeonatosView.classList.remove('hidden');
        campeonatosTab.classList.add('text-[#1877F2]');
        campeonatosTab.classList.remove('text-gray-400');
        resenhaTab.classList.add('text-gray-400');
        resenhaTab.classList.remove('text-[#1877F2]');
        campeonatosTab.querySelector('.tab-indicator').classList.remove('hidden');
        resenhaTab.querySelector('.tab-indicator').classList.add('hidden');
    }
}
</script>

<?php include 'footer.php'; ?>
