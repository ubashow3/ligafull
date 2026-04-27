
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, MatchEvent, ChampionshipFinancials, UserProfile, Post, ChampionshipWizardConfig } from '../types';

const API_BASE_URL = '/api';

// Helper for image uploads
export const uploadImage = async (file: File): Promise<string> => {
    if (!file) return '';
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload.php`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Erro ao fazer upload');
        const data = await response.json();
        return data.url;
    } catch (err) {
        console.error('Erro ao fazer upload da imagem:', err);
        return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'; // Fallback
    }
};

export const userRegister = async (userData: any): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/user_register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const rawText = await response.text();
        let errorMessage = 'Falha no registro';
        
        try {
            const errorData = JSON.parse(rawText);
            if (errorData.error) {
                errorMessage = typeof errorData.error === 'string' ? errorData.error : (errorData.error.message || JSON.stringify(errorData.error));
            } else if (errorData.message) {
                errorMessage = typeof errorData.message === 'string' ? errorData.message : (errorData.message.message || JSON.stringify(errorData.message));
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        } catch (e) {
            errorMessage = rawText || response.statusText || 'Erro desconhecido';
        }
        
        // Final guard to ensure it's a string
        if (typeof errorMessage !== 'string') {
            errorMessage = String(errorMessage);
        }
        
        throw new Error(errorMessage);
    }
    
    return await response.json();
};

export const userLogin = async (email: string, pass: string): Promise<UserProfile | null> => {
    const response = await fetch(`${API_BASE_URL}/user_login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
    });
    
    if (!response.ok) {
        const rawText = await response.text();
        let errorMessage = 'Email ou senha incorretos';
        try {
            const errorData = JSON.parse(rawText);
            errorMessage = errorData.error || errorData.message || errorMessage;
            if (typeof errorMessage !== 'string') errorMessage = JSON.stringify(errorMessage);
        } catch (e) {
            // Se não for JSON, usamos o texto puro se for curto
            if (rawText && rawText.length < 100) errorMessage = rawText;
        }
        throw new Error(errorMessage);
    }
    
    return await response.json();
};

export const createGuestProfile = (): UserProfile => {
    return {
        id: crypto.randomUUID(), 
        full_name: 'Visitante LigaFull',
        photo_url: 'https://ui-avatars.com/api/?name=Visitante+LigaFull&background=0D8ABC&color=fff',
        email: 'visitante@ligafull.com',
        is_paid: true,
        trial_started_at: new Date().toISOString(),
        registered_league_id: ''
    };
};

export interface Ad {
    id: string;
    brand_name: string;
    image_url: string;
    target_url: string;
    active: boolean;
}

// Social & User Profile Methods
export const getOrCreateProfile = async (userData: any): Promise<UserProfile> => {
    // If it's already a full profile from our local DB, just return it
    if (userData.full_name) return userData;

    // Otherwise, this might be from a legacy auth provider or social login
    // In our new SQLite model, we use user_login.php or user_register.php
    return userData;
};

export const fetchAds = async (): Promise<Ad[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/ads.php`);
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        return [];
    }
};

export const fetchPosts = async (leagueId: string): Promise<Post[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?league_id=${leagueId}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.error('Erro ao buscar posts:', err);
        return [];
    }
};

export const createPost = async (postData: Omit<Post, 'id' | 'created_at'>): Promise<Post> => {
    const response = await fetch(`${API_BASE_URL}/create_post.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
    });
    
    if (!response.ok) throw new Error('Erro ao criar post');
    return await response.json();
};

export const createClub = async (championshipId: string, clubData: any): Promise<Club> => {
    const response = await fetch(`${API_BASE_URL}/create_club.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            championship_id: championshipId,
            name: clubData.name,
            abbreviation: clubData.abbreviation,
            logo_url: clubData.logoUrl || clubData.logo_url,
            whatsapp: clubData.whatsapp
        })
    });
    
    if (!response.ok) throw new Error('Erro ao criar clube');
    const data = await response.json();
    
    return {
        id: data.id,
        name: data.name,
        abbreviation: data.abbreviation,
        logoUrl: data.logo_url || '',
        whatsapp: data.whatsapp || '',
        players: [],
        technicalStaff: []
    };
};

export const createPlayer = async (clubId: string, playerData: any): Promise<Player> => {
    const response = await fetch(`${API_BASE_URL}/create_player.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            club_id: clubId,
            name: playerData.name,
            nickname: playerData.nickname,
            position: playerData.position,
            cpf: playerData.cpf,
            birth_date: playerData.birthDate || playerData.birth_date,
            photo_url: playerData.photoUrl || playerData.photo_url
        })
    });
    
    if (!response.ok) throw new Error('Erro ao criar jogador');
    const data = await response.json();
    
    return {
        id: data.id,
        name: data.name,
        nickname: data.nickname,
        position: data.position,
        cpf: data.cpf,
        birthDate: data.birth_date,
        photoUrl: data.photo_url,
        goals: 0
    };
};

export const updateClubDetails = async (clubId: string, details: any): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_club_details.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: clubId,
            name: details.name,
            abbreviation: details.abbreviation,
            logo_url: details.logoUrl || details.logo_url,
            whatsapp: details.whatsapp
        })
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar clube');
};

export const updatePlayer = async (clubId: string, player: Player): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_player.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: player.id,
            name: player.name,
            nickname: player.nickname,
            position: player.position,
            cpf: player.cpf,
            birth_date: player.birthDate,
            photo_url: player.photoUrl
        })
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar jogador');
};

export const deletePlayer = async (clubId: string, playerId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/delete_player.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId })
    });
    
    if (!response.ok) throw new Error('Erro ao excluir jogador');
};

export const updateClubRegistrationStatus = async (championshipId: string, clubId: string, isPaid: boolean): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_club_registration_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            championship_id: championshipId,
            club_id: clubId,
            is_paid: isPaid
        })
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar status de registro');
};

export const createStaff = async (clubId: string, staffData: any): Promise<TechnicalStaff> => {
    const response = await fetch(`${API_BASE_URL}/create_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: clubId, ...staffData })
    });
    
    if (!response.ok) throw new Error('Erro ao criar comissão');
    return await response.json();
};

export const updateStaff = async (clubId: string, staff: TechnicalStaff): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staff)
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar comissão');
};

export const deleteStaff = async (clubId: string, staffId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/delete_staff.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staffId })
    });
    
    if (!response.ok) throw new Error('Erro ao excluir membro da comissão');
};

export const createLeague = async (leagueData: any): Promise<League> => {
    const response = await fetch(`${API_BASE_URL}/create_league.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: leagueData.name,
            slug: leagueData.slug,
            logo_url: leagueData.logoUrl || leagueData.logo_url,
            cover_url: leagueData.coverUrl || leagueData.cover_url,
            admin_email: leagueData.adminEmail,
            city: leagueData.city,
            state: leagueData.state
        })
    });
    
    if (!response.ok) throw new Error('Erro ao criar liga');
    const data = await response.json();
    
    return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url || '',
        coverUrl: data.cover_url || '',
        adminEmail: data.admin_email,
        city: data.city || '',
        state: data.state || '',
        referees: [],
        tableOfficials: [],
        championships: []
    };
};

export const createChampionship = async (leagueId: string, name: string): Promise<Championship> => {
    const response = await fetch(`${API_BASE_URL}/create_championship.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league_id: leagueId, name })
    });
    
    if (!response.ok) throw new Error('Erro ao criar campeonato');
    const data = await response.json();
    
    return {
        id: data.id,
        name: data.name,
        standings: [],
        financials: {
            refereeFee: 0,
            assistantFee: 0,
            tableOfficialFee: 0,
            fieldFee: 0,
            yellowCardFine: 0,
            redCardFine: 0,
            registrationFeePerClub: 0,
            totalCost: 0
        },
        clubs: [],
        matches: [],
        topScorers: []
    };
};

export const createOfficial = async (leagueId: string, type: string, data: any): Promise<Official> => {
    const response = await fetch(`${API_BASE_URL}/create_official.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            league_id: leagueId, 
            type: type === 'referees' ? 'referee' : 'table_official', 
            ...data 
        })
    });
    
    if (!response.ok) throw new Error('Erro ao criar oficial');
    return await response.json();
};

// API_BASE_URL consolidated at the top

export const updateOfficial = async (type: string, data: Official): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_official.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar oficial');
    }
};

export const deleteOfficial = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/delete_official.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    
    if (!response.ok) throw new Error('Erro ao excluir oficial');
};

export const saveFinancials = async (championshipId: string, financials: ChampionshipFinancials): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/save_financials.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championship_id: championshipId, financials })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar dados financeiros');
    }
};

export const updateClubFinePaymentStatus = async (championshipId: string, clubId: string, round: number, isPaid: boolean): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_club_fine.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            championship_id: championshipId,
            club_id: clubId,
            round,
            is_paid: isPaid
        })
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar multa');
};

export const updateMatch = async (match: Match): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/update_match.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: match.id,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            date: match.date,
            location: match.location,
            status: match.status,
            refereeId: match.refereeId,
            assistant1Id: match.assistant1Id,
            assistant2Id: match.assistant2Id,
            tableOfficialId: match.tableOfficialId,
            homeLineup: match.homeLineup,
            awayLineup: match.awayLineup,
            events: match.events
        })
    });
    
    if (!response.ok) throw new Error('Erro ao atualizar partida');
};

export const generateMatches = async (championshipId: string, config: ChampionshipWizardConfig): Promise<void> => {
    // 1. Buscar clubes da fonte de dados local (através de fetchLeagues)
    const allLeagues = await fetchLeagues();
    let currentClubs: any[] = [];
    allLeagues.forEach(l => {
        const champ = l.championships.find(c => c.id === championshipId);
        if (champ) currentClubs = champ.clubs;
    });

    if (currentClubs.length < 2) throw new Error('Mínimo de 2 clubes necessário');

    // 2. Gerar jogos
    const matchesToInsert = [];
    for (let i = 0; i < currentClubs.length; i++) {
        for (let j = i + 1; j < currentClubs.length; j++) {
            matchesToInsert.push({
                round: 1,
                home_team_id: currentClubs[i].id,
                away_team_id: currentClubs[j].id
            });
        }
    }

    // 3. Salvar no servidor
    const response = await fetch(`${API_BASE_URL}/batch_matches.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championship_id: championshipId, matches: matchesToInsert })
    });
    
    if (!response.ok) throw new Error('Erro ao gerar jogos no servidor');
};

export const login = async (email: string, pass: string): Promise<League | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        
        if (response.ok) {
            const leagueData = await response.json();
            // Retorna o objeto mapeado pelo servidor
            return leagueData;
        }

        return null;
    } catch (error) {
        console.error('Erro no login:', error);
        return null;
    }
};

export const fetchLeagues = async (): Promise<League[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/leagues`);
        if (!response.ok) throw new Error('Falha ao buscar ligas do servidor local');
        return await response.json();
    } catch (err) {
        console.error('Erro ao carregar ligas do servidor local:', err);
        return [];
    }
};

function transformLeagues(data: any[]): League[] {
    return data.map(l => {
        const officialsList = l.officials || [];
        const referees = officialsList.filter((o: any) => o.type === 'referee').map((o: any) => ({ 
            id: o.id, name: o.name, nickname: o.nickname, cpf: o.cpf, bankAccount: o.bank_account, role: o.role 
        }));
        const tableOfficials = officialsList.filter((o: any) => o.type === 'table_official').map((o: any) => ({ 
            id: o.id, name: o.name, nickname: o.nickname, cpf: o.cpf, bankAccount: o.bank_account, role: o.role 
        }));

        return {
            id: l.id, 
            name: l.name, 
            slug: l.slug, 
            logoUrl: l.logo_url || '', 
            coverUrl: l.cover_url || '', 
            adminEmail: l.admin_email, 
            city: l.city || 'Cidade', 
            state: l.state || 'UF',
            referees,
            tableOfficials,
            championships: (l.championships || []).map((c: any) => {
                const clubs = (c.clubs || []).map((club: any) => ({
                    id: club.id, name: club.name, abbreviation: club.abbreviation, logoUrl: club.logo_url || '', whatsapp: club.whatsapp || '',
                    players: (club.players || []).map((p: any) => ({ 
                        id: p.id, name: p.name, position: p.position, goals: p.goals || 0, 
                        photoUrl: p.photo_url || '', birthDate: p.birth_date || '', nickname: p.nickname || '', cpf: p.cpf || '' 
                    })),
                    technicalStaff: (club.technical_staff || []).map((ts: any) => ({ id: ts.id, name: ts.name, role: ts.role }))
                }));

                const matches = (c.matches || []).map((m: any) => {
                    const homeTeam = clubs.find((cl: any) => cl.id === m.home_team_id) || { id: m.home_team_id, name: 'Clube', abbreviation: 'CLU', logoUrl: '', players: [], technicalStaff: [] };
                    const awayTeam = clubs.find((cl: any) => cl.id === m.away_team_id) || { id: m.away_team_id, name: 'Clube', abbreviation: 'CLU', logoUrl: '', players: [], technicalStaff: [] };
                    
                    const ref = officialsList.find((o: any) => o.id === m.referee_id)?.name;
                    const a1 = officialsList.find((o: any) => o.id === m.assistant1_id)?.name;
                    const a2 = officialsList.find((o: any) => o.id === m.assistant2_id)?.name;
                    const to = officialsList.find((o: any) => o.id === m.table_official_id)?.name;

                    return {
                        id: m.id, round: m.round, homeScore: m.home_score, awayScore: m.away_score, date: m.match_date, status: m.status, location: m.location || 'A definir',
                        homeTeam,
                        awayTeam,
                        referee: ref, assistant1: a1, assistant2: a2, tableOfficial: to,
                        refereeId: m.referee_id, assistant1Id: m.assistant1_id, assistant2Id: m.assistant2_id, tableOfficialId: m.table_official_id,
                        events: m.events || [],
                        homeLineup: m.home_lineup || [],
                        awayLineup: m.away_lineup || []
                    };
                });

                const financials: ChampionshipFinancials = {
                    refereeFee: Number(c.referee_fee) || 0,
                    assistantFee: Number(c.assistant_fee) || 0,
                    tableOfficialFee: Number(c.table_official_fee) || 0,
                    fieldFee: Number(c.field_fee) || 0,
                    yellowCardFine: Number(c.yellow_card_fine) || 0,
                    redCardFine: Number(c.red_card_fine) || 0,
                    registrationFeePerClub: Number(c.registration_fee_per_club) || 0,
                    totalCost: (Number(c.referee_fee || 0) + (Number(c.assistant_fee || 0) * 2) + Number(c.table_official_fee || 0) + Number(c.field_fee || 0)) * matches.length,
                    playerRegistrationDeadline: c.player_registration_deadline
                };

                return { id: c.id, name: c.name, standings: [], topScorers: [], financials, clubs, matches };
            })
        };
    });
}
