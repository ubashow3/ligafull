<?php
session_start();
include 'header.php';
require_once 'config.php';

// Fetch leagues for initial display (will be filtered by JS)
$leagues_query = $conn->query("SELECT * FROM leagues ORDER BY created_at DESC");
$leagues = [];
while($row = $leagues_query->fetch_assoc()) {
    // Count championships for each league
    $league_id = $row['id'];
    $champ_count = $conn->query("SELECT COUNT(*) as count FROM championships WHERE league_id = '$league_id'")->fetch_assoc()['count'];
    $row['championship_count'] = $champ_count;
    $leagues[] = $row;
}
?>

<div class="animate-fade-in">
    <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-extrabold text-green-400">LigaFull</h1>
        <p class="text-white text-xl font-bold italic mt-1 mb-4 tracking-wider">é bola na rede!</p>
        <p class="mt-2 text-lg text-gray-300">A maior plataforma de gerenciamento social do futebol amador.</p>
        <p class="mt-2 text-md text-gray-400 italic">Explore ligas, veja a resenha e participe da comunidade.</p>
    </div>

    <div class="max-w-4xl mx-auto mb-8 p-4 bg-gray-800/50 rounded-lg">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label for="state-filter" class="block text-sm font-medium text-gray-300 mb-1">Filtrar por Estado</label>
                <select id="state-filter" class="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-green-500">
                    <option value="">Todos os Estados</option>
                </select>
            </div>
            <div>
                <label for="city-filter" class="block text-sm font-medium text-gray-300 mb-1">Filtrar por Cidade</label>
                <select id="city-filter" disabled class="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white disabled:opacity-50 focus:outline-none focus:ring-green-500">
                    <option value="">Todos as Cidades</option>
                </select>
            </div>
        </div>
    </div>

    <div id="leaguesList" class="space-y-6 max-w-4xl mx-auto">
        <!-- Leages will be rendered here by JS -->
        <div class="text-center py-10 text-gray-400">Carregando ligas...</div>
    </div>
</div>

<script>
// Pass initial data to JS
const initialLeagues = <?php echo json_encode($leagues); ?>;

document.addEventListener('DOMContentLoaded', () => {
    const stateFilter = document.getElementById('state-filter');
    const cityFilter = document.getElementById('city-filter');
    const leaguesList = document.getElementById('leaguesList');
    
    let states = [];
    let cities = [];
    let selectedState = '';
    let selectedCity = '';

    // Fetch States
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(res => res.json())
        .then(data => {
            states = data;
            states.forEach(state => {
                const opt = document.createElement('option');
                opt.value = state.sigla;
                opt.textContent = state.nome;
                stateFilter.appendChild(opt);
            });
        });

    stateFilter.addEventListener('change', (e) => {
        selectedState = e.target.value;
        selectedCity = '';
        cityFilter.innerHTML = '<option value="">Todos as Cidades</option>';
        
        if (selectedState) {
            cityFilter.disabled = false;
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`)
                .then(res => res.json())
                .then(data => {
                    cities = data;
                    cities.forEach(city => {
                        const opt = document.createElement('option');
                        opt.value = city.nome;
                        opt.textContent = city.nome;
                        cityFilter.appendChild(opt);
                    });
                });
        } else {
            cityFilter.disabled = true;
        }
        renderLeagues();
    });

    cityFilter.addEventListener('change', (e) => {
        selectedCity = e.target.value;
        renderLeagues();
    });

    function renderLeagues() {
        const filtered = initialLeagues.filter(league => {
            const stateMatch = !selectedState || league.state === selectedState;
            const cityMatch = !selectedCity || league.city === selectedCity;
            return stateMatch && cityMatch;
        });

        if (filtered.length === 0) {
            leaguesList.innerHTML = `
                <div class="text-center py-10 px-6 bg-gray-800 rounded-lg">
                    <h3 class="text-xl font-semibold text-white">Nenhuma liga encontrada.</h3>
                    <p class="text-gray-400 mt-2">Tente remover os filtros ou crie uma nova liga.</p>
                </div>
            `;
            return;
        }

        leaguesList.innerHTML = filtered.map(league => `
            <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer group flex items-center transition-all duration-300 hover:bg-gray-700 hover:shadow-xl border border-transparent hover:border-green-500/30" onclick="window.location.href='league_details.php?slug=${league.slug}'">
                <img src="${league.logo_url || 'img/default-logo.png'}" alt="${league.name} logo" class="w-24 h-24 sm:w-32 sm:h-32 object-cover flex-shrink-0" onerror="this.src='img/default-logo.png'">
                <div class="p-4 sm:p-6">
                    <h2 class="text-xl sm:text-2xl font-bold text-white group-hover:text-green-400 transition-colors duration-300 flex items-center gap-2">
                        ${league.name}
                    </h2>
                    <div class="flex items-center gap-4 mt-2 text-sm sm:text-base text-gray-400">
                        <span>${league.city}, ${league.state}</span>
                        <span>&bull;</span>
                        <span>${league.championship_count} campeonato(s)</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderLeagues();
});
</script>

<?php include 'footer.php'; ?>
