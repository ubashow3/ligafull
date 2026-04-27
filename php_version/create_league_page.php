<?php
session_start();
include 'header.php';
?>

<div class="animate-fade-in max-w-2xl mx-auto">
    <a href="index.php" class="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Voltar
    </a>

    <div class="bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-white mb-6">Criar Nova Liga</h1>
        
        <form id="createLeagueForm" class="mt-8 space-y-6">
            <div>
                <label for="league-name" class="block text-sm font-medium text-gray-300">Nome da Liga</label>
                <input type="text" name="name" id="league-name" required class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="state" class="block text-sm font-medium text-gray-300">Estado</label>
                    <select id="state" name="state" required class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
                        <option value="" disabled selected>Selecione o Estado</option>
                    </select>
                </div>
                <div>
                    <label for="city" class="block text-sm font-medium text-gray-300">Cidade</label>
                    <select id="city" name="city" required disabled class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50">
                        <option value="" disabled selected>Selecione a Cidade</option>
                    </select>
                </div>
            </div>

            <div>
                <label for="admin-email" class="block text-sm font-medium text-gray-300">E-mail do Administrador</label>
                <input type="email" name="admin_email" id="admin-email" required class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
            </div>
            
            <div>
                <label for="league-password" class="block text-sm font-medium text-gray-300">Senha do Administrador</label>
                <input type="password" name="admin_password" id="league-password" required class="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-300">Logo da Liga</label>
                <div class="mt-1 flex items-center gap-4">
                    <div id="logoPreview" class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <input type="file" id="logoInput" accept="image/*" class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600/20 file:text-green-300 hover:file:bg-green-600/30">
                </div>
            </div>

            <div class="flex justify-end gap-4 pt-4">
                <a href="index.php" class="py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Cancelar
                </a>
                <button type="submit" id="submitBtn" class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center justify-center w-32 disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Criar Liga
                </button>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const stateSelect = document.getElementById('state');
    const citySelect = document.getElementById('city');
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const form = document.getElementById('createLeagueForm');
    const submitBtn = document.getElementById('submitBtn');

    let logoUrl = '';

    // Fetch States
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(res => res.json())
        .then(data => {
            data.forEach(state => {
                const opt = document.createElement('option');
                opt.value = state.sigla;
                opt.textContent = state.nome;
                stateSelect.appendChild(opt);
            });
        });

    stateSelect.addEventListener('change', (e) => {
        const sigla = e.target.value;
        citySelect.innerHTML = '<option value="" disabled selected>Selecione a Cidade</option>';
        citySelect.disabled = true;
        
        if (sigla) {
            fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios`)
                .then(res => res.json())
                .then(data => {
                    data.forEach(city => {
                        const opt = document.createElement('option');
                        opt.value = city.nome;
                        opt.textContent = city.nome;
                        citySelect.appendChild(opt);
                    });
                    citySelect.disabled = false;
                });
        }
    });

    logoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            logoPreview.innerHTML = '<div class="animate-spin h-5 w-5 text-green-400 border-2 border-green-400 border-t-transparent rounded-full"></div>';
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await fetch('upload.php', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.url) {
                    logoUrl = data.url;
                    logoPreview.innerHTML = `<img src="${logoUrl}" class="w-full h-full object-cover">`;
                } else {
                    alert('Erro no upload: ' + (data.error || 'Erro desconhecido'));
                    logoPreview.innerHTML = '<i class="fas fa-camera text-2xl text-gray-500"></i>';
                }
            } catch (error) {
                alert('Erro ao conectar com o servidor de upload.');
                logoPreview.innerHTML = '<i class="fas fa-camera text-2xl text-gray-500"></i>';
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.logo_url = logoUrl;
        
        // Generate slug from name
        data.slug = data.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>';

        try {
            const response = await fetch('create_league.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.id) {
                alert('Liga criada com sucesso!');
                window.location.href = 'index.php';
            } else {
                alert('Erro ao criar liga: ' + (result.error || 'Erro desconhecido'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar Liga';
            }
        } catch (error) {
            alert('Erro na conexão com o servidor.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Liga';
        }
    });
});
</script>

<?php include 'footer.php'; ?>
