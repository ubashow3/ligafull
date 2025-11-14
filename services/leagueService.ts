

import { supabase } from '../supabaseClient';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, MatchEvent } from '../types';

// Helper function to generate a slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

// Nova função para upload de imagem
export const uploadImage = async (file: File): Promise<string> => {
    if (!file) return '';

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem.');
    }

    return data.publicUrl;
};

// Helper to transform Supabase data into the nested structure the app expects
const transformLeagues = (data: any[]): League[] => {
    if (!data) return [];
    return data.map(league => {
        const referees = (league.officials || []).filter((o: any) => o.type === 'referee');
        const tableOfficials = (league.officials || []).filter((o: any) => o.type === 'table_official');
        const officialsMap = new Map<string, string>((league.officials || []).map((o: any) => [o.id, o.name]));

        const championships = (league.championships || []).map((champ: any) => {
            const clubs = (champ.clubs || []).map((club: any) => ({
                id: club.id,
                name: club.name,
                abbreviation: club.abbreviation,
                logoUrl: club.logo_url,
                whatsapp: club.whatsapp,
                players: (club.players || []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    position: p.position,
                    goals: p.goals_in_championship,
                    photoUrl: p.photo_url,
                    birthDate: p.birth_date,
                    nickname: p.nickname,
                    cpf: p.cpf,
                })),
                technicalStaff: (club.technical_staff || []).map((ts: any) => ({...ts})),
            }));

            const clubMap = new Map<string, Club>(clubs.map((c: Club) => [c.id, c]));
            
            const matches = (champ.matches || []).map((match: any) => {
                const homeTeam = clubMap.get(match.home_team_id);
                const awayTeam = clubMap.get(match.away_team_id);
                
                const getTeamObject = (teamId: string, teamData?: Club): Club => {
                    if (teamData) return teamData;
                    // This handles placeholder teams that might not be in the clubMap yet
                    const placeholderName = teamId.startsWith('ph-') ? teamId.substring(3).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Desconhecido';
                    return { id: teamId, name: placeholderName, abbreviation: 'TBD', logoUrl: '', players: [], technicalStaff: [] };
                };

                return {
                    id: match.id,
                    round: match.round,
                    homeTeam: getTeamObject(match.home_team_id, homeTeam),
                    awayTeam: getTeamObject(match.away_team_id, awayTeam),
                    homeScore: match.home_score,
                    awayScore: match.away_score,
                    date: match.match_date,
                    status: match.status,
                    location: match.location,
                    events: (match.match_events || []).map((e: any) => ({ type: e.type, playerId: e.player_id, minute: e.minute, playerName: '' })),
                    referee: officialsMap.get(match.referee_id),
                    assistant1: officialsMap.get(match.assistant1_id),
                    assistant2: officialsMap.get(match.assistant2_id),
                    tableOfficial: officialsMap.get(match.table_official_id),
                    championship_id: match.championship_id,
                };
            });

            return { ...champ, clubs, matches };
        });
        
        return {
            ...league,
            adminPassword: league.admin_password_hash,
            logoUrl: league.logo_url,
            adminEmail: league.admin_email,
            referees,
            tableOfficials,
            championships
        };
    });
};


const leagueQuery = `
    id,
    name,
    slug,
    logo_url,
    admin_email,
    admin_password_hash,
    city,
    state,
    officials (
        id,
        name,
        nickname,
        cpf,
        bank_account,
        type
    ),
    championships (
        id,
        name,
        championship_clubs (
            clubs (
                id,
                name,
                abbreviation,
                logo_url,
                whatsapp,
                players (
                    id,
                    name,
                    position,
                    goals_in_championship,
                    photo_url,
                    birth_date,
                    nickname,
                    cpf
                ),
                technical_staff (
                    id,
                    name,
                    role
                )
            )
        ),
        matches (
            id,
            round,
            home_team_id,
            away_team_id,
            home_score,
            away_score,
            match_date,
            status,
            location,
            referee_id,
            assistant1_id,
            assistant2_id,
            table_official_id,
            championship_id,
            match_events (
                type,
                player_id,
                minute
            )
        )
    )
`;

// Helper to correctly structure the data from the many-to-many join
const structureChampionships = (data: any[]) => {
    return data.map(league => ({
        ...league,
        championships: league.championships.map((champ: any) => ({
            ...champ,
            clubs: champ.championship_clubs.map((cc: any) => cc.clubs)
        }))
    }))
}

export const fetchLeagues = async (): Promise<League[]> => {
    const { data, error } = await supabase.from('leagues').select(leagueQuery);
    if (error) throw error;
    const structuredData = structureChampionships(data);
    return transformLeagues(structuredData);
};

export const login = async (email: string, pass: string): Promise<League | null> => {
    const { data, error } = await supabase.from('leagues')
        .select(leagueQuery)
        .eq('admin_email', email)
        .eq('admin_password_hash', pass)
        .single();
    if (error || !data) return null;
    const structuredData = structureChampionships([data]);
    return transformLeagues(structuredData)[0];
};

export const createLeague = async (leagueData: { name: string, logoUrl: string, adminEmail: string, adminPassword: string, state: string, city: string }): Promise<League> => {
    const { name, logoUrl, adminEmail, adminPassword, state, city } = leagueData;
    const { data, error } = await supabase.from('leagues').insert({
        id: crypto.randomUUID(),
        name,
        slug: generateSlug(name),
        logo_url: logoUrl,
        admin_email: adminEmail,
        admin_password_hash: adminPassword,
        state,
        city,
    }).select().single();

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            if (error.message.includes('leagues_slug_key')) {
                throw new Error('Já existe uma liga com este nome (slug).');
            }
            if (error.message.includes('leagues_admin_email_key') || error.message.includes('leagues_admin_email_idx')) {
                throw new Error('Este e-mail já está sendo utilizado por outra liga.');
            }
        }
        throw error;
    }
    
    if (!data) {
        throw new Error("Não foi possível obter os dados da liga após a criação.");
    }

    return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        adminEmail: data.admin_email,
        adminPassword: data.admin_password_hash,
        state: data.state,
        city: data.city,
        championships: [],
        referees: [],
        tableOfficials: [],
    };
};

export const createChampionship = async (leagueId: string, champName: string): Promise<Championship> => {
    const { data, error } = await supabase.from('championships').insert({
        id: crypto.randomUUID(),
        name: champName,
        league_id: leagueId
    }).select().single();
    if (error) throw error;
    return { ...data, clubs: [], matches: [], standings: [] };
};

export const addClubToChampionship = async (championshipId: string, clubData: { name: string, abbreviation: string, logoUrl: string, whatsapp: string }) => {
    // 1. Create the club
    const { data: newClub, error: clubError } = await supabase.from('clubs').insert({
        id: crypto.randomUUID(),
        name: clubData.name,
        abbreviation: clubData.abbreviation,
        logo_url: clubData.logoUrl,
        whatsapp: clubData.whatsapp,
    }).select().single();
    if (clubError) throw clubError;

    // 2. Link club to championship
    const { error: linkError } = await supabase.from('championship_clubs').insert({
        championship_id: championshipId,
        club_id: newClub.id,
    });
    if (linkError) throw linkError;
};

export const generateMatches = async (championshipId: string, matches: Match[]) => {
    const matchesToInsert = matches.map(m => ({
        id: m.id || crypto.randomUUID(),
        championship_id: championshipId,
        round: m.round,
        home_team_id: (m.homeTeam as Club).id,
        away_team_id: (m.awayTeam as Club).id,
        status: m.status,
        match_date: m.date,
        location: m.location,
    }));
    const { error } = await supabase.from('matches').insert(matchesToInsert);
    if (error) throw error;
};

export const updateMatch = async (match: Match, league: League) => {
    const officialsMap = new Map<string, string>([
        ...league.referees.map((o): [string, string] => [o.name, o.id]),
        ...league.tableOfficials.map((o): [string, string] => [o.name, o.id]),
    ]);

    const { error: matchError } = await supabase.from('matches').update({
        home_score: match.homeScore,
        away_score: match.awayScore,
        status: match.status,
        location: match.location,
        match_date: match.date,
        referee_id: match.referee ? officialsMap.get(match.referee) : null,
        assistant1_id: match.assistant1 ? officialsMap.get(match.assistant1) : null,
        assistant2_id: match.assistant2 ? officialsMap.get(match.assistant2) : null,
        table_official_id: match.tableOfficial ? officialsMap.get(match.tableOfficial) : null,
        home_team_id: match.homeTeam.id,
        away_team_id: match.awayTeam.id,
    }).eq('id', match.id);
    if (matchError) throw matchError;

    const { error: deleteError } = await supabase.from('match_events').delete().eq('match_id', match.id);
    if (deleteError) throw deleteError;
    
    if (match.events.length > 0) {
        const eventsToInsert = match.events.map(e => ({
            match_id: match.id,
            player_id: e.playerId,
            type: e.type,
            minute: e.minute
        }));
        const { error: insertError } = await supabase.from('match_events').insert(eventsToInsert);
        if (insertError) throw insertError;
    }

    // Recalculate top scorers every time the summary is saved (draft or final)
    const championshipId = match.championship_id;
    if (!championshipId) {
        console.warn("Could not update player goals: Championship ID not found in match object.");
        return;
    }

    const { data: championshipClubs, error: clubsError } = await supabase
        .from('championship_clubs')
        .select('club_id')
        .eq('championship_id', championshipId);
    if (clubsError) throw clubsError;
    
    const clubIds = (championshipClubs || []).map(cc => cc.club_id);
    if (clubIds.length === 0) return;

    // FIX: Fetch club_id along with id to use in the robust upsert later.
    const { data: playersInChampionship, error: playersError } = await supabase
        .from('players')
        .select('id, club_id')
        .in('club_id', clubIds);
    if (playersError) throw playersError;

    const allPlayerGoals: { [key: string]: number } = {};
    (playersInChampionship || []).forEach(p => { allPlayerGoals[p.id] = 0; });

    const { data: allMatchEvents, error: eventsError } = await supabase
        .from('match_events')
        .select('player_id, matches!inner(championship_id)')
        .eq('matches.championship_id', championshipId)
        .eq('type', 'goal');
    if (eventsError) throw eventsError;

    (allMatchEvents || []).forEach(event => {
        if (event.player_id && allPlayerGoals.hasOwnProperty(event.player_id)) {
            allPlayerGoals[event.player_id]++;
        }
    });
    
    // FIX: Create a payload for upsert that includes the required 'club_id' to prevent not-null constraint violations.
    const playersToUpdate = (playersInChampionship || []).map(player => ({
        id: player.id,
        club_id: player.club_id,
        goals_in_championship: allPlayerGoals[player.id] || 0,
    }));
    
    // FIX: Use a single, robust bulk 'upsert' instead of a loop of 'updates'. This is more performant and solves the error.
    if (playersToUpdate.length > 0) {
        const { error: upsertError } = await supabase
            .from('players')
            .upsert(playersToUpdate, { onConflict: 'id' });

        if (upsertError) {
            console.error(`Failed to upsert player goals`, upsertError);
            throw upsertError;
        }
    }
};

// Official Handlers
export const createOfficial = async (leagueId: string, type: 'referees' | 'tableOfficials', official: Omit<Official, 'id'>) => {
    const { name, nickname, cpf, bankAccount } = official;
    const { error } = await supabase.from('officials').insert({
        id: crypto.randomUUID(),
        league_id: leagueId,
        name,
        nickname,
        cpf,
        bank_account: bankAccount,
        type: type === 'referees' ? 'referee' : 'table_official',
    }).select();
    if (error) {
        console.error("Supabase createOfficial error:", error);
        throw new Error(`Falha ao criar oficial: ${error.message}`);
    }
};
export const updateOfficial = async (official: Official) => {
    const { id, name, nickname, cpf, bankAccount } = official;
    const { error } = await supabase.from('officials').update({ name, nickname, cpf, bank_account: bankAccount }).eq('id', id);
    if (error) {
        console.error("Supabase updateOfficial error:", error);
        throw new Error(`Falha ao atualizar oficial: ${error.message}`);
    }
};
export const deleteOfficial = async (id: string) => {
    const { error } = await supabase.from('officials').delete().eq('id', id);
    if (error) {
        console.error("Supabase deleteOfficial error:", error);
        throw new Error(`Falha ao deletar oficial: ${error.message}`);
    }
};

// Player Handlers
export const createPlayer = async (clubId: string, player: Omit<Player, 'id'>) => {
    const { name, position, nickname, cpf, photoUrl, birthDate, goals } = player;
    const { data, error } = await supabase.from('players').insert({
        id: crypto.randomUUID(),
        club_id: clubId,
        name,
        position,
        nickname,
        cpf,
        photo_url: photoUrl,
        birth_date: birthDate,
        goals_in_championship: goals,
    }).select();
    if (error) {
        console.error("Supabase createPlayer error:", error);
        throw new Error(`Falha ao criar jogador: ${error.message}`);
    }
    return data;
};
export const updatePlayer = async (player: Player) => {
    const { id, name, nickname, position, cpf, photoUrl, birthDate } = player;
    const { error } = await supabase.from('players').update({ 
        name, 
        nickname, 
        position, 
        cpf, 
        photo_url: photoUrl,
        birth_date: birthDate 
    }).eq('id', id);
    if (error) {
        console.error("Supabase updatePlayer error:", error);
        throw new Error(`Falha ao atualizar jogador: ${error.message}`);
    }
};
export const deletePlayer = async (id: string) => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
        console.error("Supabase deletePlayer error:", error);
        throw new Error(`Falha ao deletar jogador: ${error.message}`);
    }
};

// Staff Handlers
export const createStaff = async (clubId: string, staff: Omit<TechnicalStaff, 'id'>) => {
    const { name, role } = staff;
    const { data, error } = await supabase.from('technical_staff').insert({
        id: crypto.randomUUID(),
        club_id: clubId,
        name,
        role,
    }).select();
    if (error) {
        console.error("Supabase createStaff error:", error);
        throw new Error(`Falha ao criar membro da comissão: ${error.message}`);
    }
    return data;
};
export const updateStaff = async (staff: TechnicalStaff) => {
    const { id, name, role } = staff;
    const { error } = await supabase.from('technical_staff').update({ name, role }).eq('id', id);
    if (error) {
        console.error("Supabase updateStaff error:", error);
        throw new Error(`Falha ao atualizar membro da comissão: ${error.message}`);
    }
};
export const deleteStaff = async (id: string) => {
    const { error } = await supabase.from('technical_staff').delete().eq('id', id);
    if (error) {
        console.error("Supabase deleteStaff error:", error);
        throw new Error(`Falha ao deletar membro da comissão: ${error.message}`);
    }
};

export const createOrGetPlaceholderClub = async (clubName: string): Promise<Club> => {
    const { data: existingClub, error: selectError } = await supabase
        .from('clubs')
        .select('*')
        .eq('name', clubName)
        .maybeSingle();

    if (selectError) throw selectError;

    if (existingClub) {
        return {
            id: existingClub.id,
            name: existingClub.name,
            abbreviation: existingClub.abbreviation,
            logoUrl: existingClub.logo_url,
            whatsapp: existingClub.whatsapp,
            players: [],
            technicalStaff: []
        };
    }

    const newPlaceholderClub = {
        id: `ph-${clubName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: clubName,
        abbreviation: 'TBD',
        logo_url: ''
    };
    
    const { data: newClub, error: insertError } = await supabase
        .from('clubs')
        .insert(newPlaceholderClub)
        .select()
        .single();

    if (insertError) throw insertError;
    
    return {
        id: newClub.id,
        name: newClub.name,
        abbreviation: newClub.abbreviation,
        logoUrl: newClub.logo_url,
        whatsapp: newClub.whatsapp,
        players: [],
        technicalStaff: []
    };
};