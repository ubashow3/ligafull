<?php include 'header.php'; ?>
<?php
require_once '../config.php';

$id = $_GET['id'] ?? '';
$stmt = $conn->prepare("SELECT * FROM leagues WHERE id = ?");
$stmt->bind_param("s", $id);
$stmt->execute();
$league = $stmt->get_result()->fetch_assoc();

if (!$league) {
    echo "<div class='text-center py-20 text-white'>Liga não encontrada.</div>";
    include 'footer.php';
    exit;
}

// Fetch championships
$stmt = $conn->prepare("SELECT * FROM championships WHERE league_id = ?");
$stmt->bind_param("s", $league['id']);
$stmt->execute();
$championships = $stmt->get_result();
?>

<div class="animate-fade-in">
    <div class="flex items-center mb-8">
        <img src="<?php echo $league['logo_url'] ?: '../img/default-logo.png'; ?>" alt="<?php echo $league['name']; ?> logo" class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mr-4 sm:mr-6 border-4 border-gray-700">
        <div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-white"><?php echo $league['name']; ?></h1>
            <p class="text-gray-400">Painel do Administrador</p>
        </div>
    </div>
    
    <div class="border-b border-gray-700 mb-6">
        <nav class="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
            <button onclick="switchTab('championships')" id="tab-championships" class="px-4 py-2 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 bg-gray-700 text-green-400">
                Campeonatos
            </button>
            <button onclick="switchTab('referees')" id="tab-referees" class="px-4 py-2 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 text-gray-400 hover:bg-gray-800 hover:text-white">
                Árbitros
            </button>
            <button onclick="switchTab('tableOfficials')" id="tab-tableOfficials" class="px-4 py-2 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-300 text-gray-400 hover:bg-gray-800 hover:text-white">
                Mesários
            </button>
        </nav>
    </div>
    
    <div class="mt-6">
        <div id="view-championships" class="animate-fade-in">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl sm:text-2xl font-bold text-green-400">Campeonatos</h2>
                <button onclick="toggleAddChampForm()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors text-sm sm:text-base">
                    <i class="fas fa-plus mr-2"></i>
                    <span>Campeonato</span>
                </button>
            </div>
            
            <div id="addChampForm" class="hidden bg-gray-700/50 p-4 rounded-lg mb-4 animate-fade-in-down">
                <form id="newChampForm">
                    <input type="hidden" name="league_id" value="<?php echo $league['id']; ?>">
                    <input 
                        type="text"
                        name="name"
                        placeholder="Nome do novo campeonato"
                        required
                        class="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div class="flex justify-end mt-2">
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg">Salvar</button>
                    </div>
                </form>
            </div>

            <div class="space-y-4">
                <?php while ($champ = $championships->fetch_assoc()): ?>
                    <div class="bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 cursor-pointer transition-transform duration-300 hover:scale-[1.02] hover:bg-gray-700 border border-gray-700">
                        <h3 class="text-lg sm:text-xl font-bold text-white"><?php echo $champ['name']; ?></h3>
                        <p class="text-gray-400 mt-1">0 clubes participantes</p>
                    </div>
                <?php endwhile; ?>
                <?php if ($championships->num_rows === 0): ?>
                    <div class="text-center py-10 text-gray-500">
                        Nenhum campeonato criado nesta liga. Use o botão 'Adicionar Campeonato' para começar.
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <div id="view-referees" class="hidden animate-fade-in">
            <div class="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
                <i class="fas fa-user-tie text-5xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 font-bold uppercase tracking-widest">Módulo de Árbitros em breve.</p>
            </div>
        </div>

        <div id="view-tableOfficials" class="hidden animate-fade-in">
            <div class="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
                <i class="fas fa-clipboard-list text-5xl text-gray-600 mb-4"></i>
                <p class="text-gray-400 font-bold uppercase tracking-widest">Módulo de Mesários em breve.</p>
            </div>
        </div>
    </div>
</div>

<script>
function switchTab(tab) {
    const views = ['championships', 'referees', 'tableOfficials'];
    views.forEach(v => {
        document.getElementById('view-' + v).classList.add('hidden');
        document.getElementById('tab-' + v).classList.remove('bg-gray-700', 'text-green-400');
        document.getElementById('tab-' + v).classList.add('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
    });
    
    document.getElementById('view-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('bg-gray-700', 'text-green-400');
    document.getElementById('tab-' + tab).classList.remove('text-gray-400', 'hover:bg-gray-800', 'hover:text-white');
}

function toggleAddChampForm() {
    const form = document.getElementById('addChampForm');
    form.classList.toggle('hidden');
}

document.getElementById('newChampForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch('create_championship.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.id) {
            window.location.reload();
        } else {
            alert('Erro ao criar campeonato: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro na conexão com o servidor.');
    }
});
</script>

<?php include 'footer.php'; ?>
