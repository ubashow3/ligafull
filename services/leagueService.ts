

import { supabase } from '../supabaseClient';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, MatchEvent } from '../types';

// Helper function to generate a slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
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
                ...club,
                logoUrl: club.logo_url,
                players: (club.players || []).map((p: any) => ({
                    ...p,
                    goals: p.goals_in_championship,
                    photoUrl: p.photo_url,
                    birthDate: p.birth_date,
                })),
                technicalStaff: (club.technical_staff || []).map((ts: any) => ({...ts})),
            }));

            const clubMap = new Map<string, Club>(clubs.map((c: Club) => [c.id, c]));
            
            const matches = (champ.matches || []).map((match: any) => {
                const homeTeam = clubMap.get(match.home_team_id);
                const awayTeam = clubMap.get(match.away_team_id);
                
                const getTeamObject = (teamId: string, teamData?: Club): Club => {
                    if (teamData) return teamData;
                    if (teamId.startsWith('ph-')) {
                        return { id: teamId, name: teamId.substring(3).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), abbreviation: 'TBD', logoUrl: '', players: [], technicalStaff: [] };
                    }
                    return { id: teamId, name: 'Desconhecido', abbreviation: '???', logoUrl: '', players: [], technicalStaff: [] };
                };

                return {
                    ...match,
                    homeTeam: getTeamObject(match.home_team_id, homeTeam),
                    awayTeam: getTeamObject(match.away_team_id, awayTeam),
                    date: match.match_date,
                    events: (match.match_events || []).map((e: any) => ({ ...e, playerId: e.player_id })),
                    referee: officialsMap.get(match.referee_id),
                    assistant1: officialsMap.get(match.assistant1_id),
                    assistant2: officialsMap.get(match.assistant2_id),
                    tableOfficial: officialsMap.get(match.table_official_id),
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


export const fetchLeagues = async (): Promise<League[]> => {
    const { data, error } = await supabase.from('leagues').select(leagueQuery);
    if (error) throw error;
    return transformLeagues(data);
};

export const login = async (email: string, pass: string): Promise<League | null> => {
    const { data, error } = await supabase.from('leagues')
        .select(leagueQuery)
        .eq('admin_email', email)
        .eq('admin_password_hash', pass)
        .single();
    if (error || !data) return null;
    return transformLeagues([data])[0];
};

export const createLeague = async (leagueData: { name: string, logoUrl: string, adminEmail: string, adminPassword: string, state: string, city: string }): Promise<League> => {
    const { name, logoUrl, adminEmail, adminPassword, state, city } = leagueData;
    const { data, error } = await supabase.from('leagues').insert({
        id: crypto.randomUUID(),
        name,
        slug: generateSlug(name),
        logo_url: logoUrl || `https://picsum.photos/seed/${Date.now()}/200/200`,
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
        logo_url: clubData.logoUrl || `https://picsum.photos/seed/${Date.now()}/100/100`,
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
    // FIX: Explicitly type the returned array from .map() as a [string, string] tuple
    // to match the expected argument type for the Map constructor.
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

    if (match.status === 'finished') {
        if (!match.championship_id) {
            throw new Error("Cannot update players' stats without a championship_id on the match");
        }
        const championship = league.championships.find(c => c.id === match.championship_id);
        if (!championship) throw new Error("Championship not found in league data for goal recalculation");

        const allPlayerGoals: { [key: string]: number } = {};
        championship.clubs.flatMap(c => c.players).forEach(p => allPlayerGoals[p.id] = 0);
        
        const { data: allMatchEvents, error: eventsError } = await supabase.from('match_events')
            .select('player_id, type, matches!inner(championship_id)')
            .eq('matches.championship_id', match.championship_id)
            .eq('type', 'goal');

        if (eventsError) throw eventsError;

        (allMatchEvents || []).forEach(event => {
            if (event.player_id) {
                 allPlayerGoals[event.player_id] = (allPlayerGoals[event.player_id] || 0) + 1;
            }
        });

        const playersToUpdate = Object.entries(allPlayerGoals).map(([id, goals_in_championship]) => ({ id, goals_in_championship }));
        if (playersToUpdate.length > 0) {
            const { error: playerUpdateError } = await supabase.from('players').upsert(playersToUpdate);
            if (playerUpdateError) throw playerUpdateError;
        }
    }
};

// Official Handlers
export const createOfficial = async (leagueId: string, type: 'referees' | 'tableOfficials', official: Omit<Official, 'id'>) => {
    await supabase.from('officials').insert({ id: crypto.randomUUID(), ...official, league_id: leagueId, type: type === 'referees' ? 'referee' : 'table_official', bank_account: official.bankAccount });
};
export const updateOfficial = async (official: Official) => {
    await supabase.from('officials').update({ name: official.name, nickname: official.nickname, cpf: official.cpf, bank_account: official.bankAccount }).eq('id', official.id);
};
export const deleteOfficial = async (id: string) => {
    await supabase.from('officials').delete().eq('id', id);
};

// Player Handlers
export const createPlayer = async (clubId: string, player: Omit<Player, 'id'>) => {
    await supabase.from('players').insert({ id: crypto.randomUUID(), ...player, club_id: clubId, photo_url: player.photoUrl, birth_date: player.birthDate, goals_in_championship: 0 });
};
export const updatePlayer = async (player: Player) => {
    await supabase.from('players').update({ name: player.name, nickname: player.nickname, position: player.position, cpf: player.cpf, photo_url: player.photoUrl }).eq('id', player.id);
};
export const deletePlayer = async (id: string) => {
    await supabase.from('players').delete().eq('id', id);
};

// Staff Handlers
export const createStaff = async (clubId: string, staff: Omit<TechnicalStaff, 'id'>) => {
    await supabase.from('technical_staff').insert({ id: crypto.randomUUID(), ...staff, club_id: clubId });
};
export const updateStaff = async (staff: TechnicalStaff) => {
    await supabase.from('technical_staff').update({ name: staff.name, role: staff.role }).eq('id', staff.id);
};
export const deleteStaff = async (id: string) => {
    await supabase.from('technical_staff').delete().eq('id', id);
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
        id: crypto.randomUUID(),
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