import { supabase } from '../supabaseClient';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, ChampionshipFinancials, MatchEvent } from '../types';

// Helper function to generate a slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};


// Helper to transform Supabase data into the nested structure the app expects
const transformLeagues = (data: any[]): League[] => {
    return data.map(league => {
        const championships = (league.championships || []).map((champ: any) => {
            const clubs = (champ.championship_clubs || []).map((cc: any) => ({
                ...(cc.clubs || {}),
                players: cc.clubs?.players || [],
                technicalStaff: cc.clubs?.technical_staff || [],
            }));
            const matches = (champ.matches || []).map((match: any) => ({
                ...match,
                events: match.match_events || [],
            }));
            return { ...champ, clubs, matches };
        });
        
        return {
            ...league,
            adminPassword: league.admin_password, // map snake_case to camelCase
            logoUrl: league.logo_url,
            adminEmail: league.admin_email,
            referees: (league.officials || []).filter((o: any) => o.type === 'referee'),
            tableOfficials: (league.officials || []).filter((o: any) => o.type === 'table_official'),
            championships
        };
    });
};

const leagueQuery = `
    id, name, slug, logo_url, admin_email, admin_password, latitude, longitude,
    officials (*),
    championships (
        *,
        championship_clubs ( clubs (*, players(*), technical_staff(*)) ),
        matches ( *, homeTeam:clubs!matches_home_team_id_fkey(*), awayTeam:clubs!matches_away_team_id_fkey(*), match_events(*) ),
        financials:championship_financials(*),
        clubFinancials:club_financials(*)
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
        .eq('admin_password', pass) // WARNING: Insecure
        .single();
    if (error || !data) return null;
    return transformLeagues([data])[0];
};

export const createLeague = async (leagueData: { name: string, logoUrl: string, adminEmail: string, adminPassword: string }): Promise<League> => {
    const { name, logoUrl, adminEmail, adminPassword } = leagueData;
    const { data, error } = await supabase.from('leagues').insert({
        name,
        slug: generateSlug(name),
        logo_url: logoUrl || `https://picsum.photos/seed/${Date.now()}/200/200`,
        admin_email: adminEmail,
        admin_password: adminPassword, // WARNING: Insecure
    }).select().single();

    if (error) throw error;
    return { ...data, championships: [], referees: [], tableOfficials: [] }; // Return a valid League structure
};

export const createChampionship = async (leagueId: string, champName: string): Promise<Championship> => {
    const { data, error } = await supabase.from('championships').insert({
        name: champName,
        league_id: leagueId
    }).select().single();
    if (error) throw error;
    return { ...data, clubs: [], matches: [], standings: [], financials: null, clubFinancials: null };
};

export const addClubToChampionship = async (championshipId: string, clubData: { name: string, abbreviation: string, logoUrl: string, whatsapp: string }) => {
    // 1. Create the club
    const { data: newClub, error: clubError } = await supabase.from('clubs').insert({
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
        championship_id: championshipId,
        round: m.round,
        home_team_id: (m.homeTeam as Club).id,
        away_team_id: (m.awayTeam as Club).id,
        status: m.status,
        date: m.date,
        location: m.location,
    }));
    const { error } = await supabase.from('matches').insert(matchesToInsert);
    if (error) throw error;
};

export const updateMatch = async (match: Match, clubs: Club[]) => {
    // 1. Update match score, status, details
    const { error: matchError } = await supabase.from('matches').update({
        home_score: match.homeScore,
        away_score: match.awayScore,
        status: match.status,
        location: match.location,
        date: match.date,
        referee: match.referee,
        assistant1: match.assistant1,
        assistant2: match.assistant2,
        table_official: match.tableOfficial,
    }).eq('id', match.id);
    if (matchError) throw matchError;

    // 2. Sync events (delete all, then re-insert)
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

    // 3. Recalculate goals and update players table (heavy operation)
    if (match.status === 'finished') {
        // FIX: Add check for championship_id before proceeding with goal recalculation.
        if (!match.championship_id) {
            throw new Error("Cannot update players' stats without a championship_id on the match");
        }
        // This is simplified. A real app might use a database function for this.
        const allPlayerGoals: { [key: string]: number } = {};
        clubs.flatMap(c => c.players).forEach(p => allPlayerGoals[p.id] = 0);
        
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

        const playersToUpdate = Object.entries(allPlayerGoals).map(([id, goals]) => ({ id, goals }));
        const { error: playerUpdateError } = await supabase.from('players').upsert(playersToUpdate);
        if (playerUpdateError) throw playerUpdateError;
    }
};

// Official Handlers
export const createOfficial = async (leagueId: string, type: 'referees' | 'tableOfficials', official: Omit<Official, 'id'>) => {
    await supabase.from('officials').insert({ ...official, league_id: leagueId, type: type === 'referees' ? 'referee' : 'table_official' });
};
export const updateOfficial = async (official: Official) => {
    await supabase.from('officials').update({ name: official.name, nickname: official.nickname, cpf: official.cpf, bank_account: official.bankAccount }).eq('id', official.id);
};
export const deleteOfficial = async (id: string) => {
    await supabase.from('officials').delete().eq('id', id);
};

// Player Handlers
export const createPlayer = async (clubId: string, player: Omit<Player, 'id'>) => {
    await supabase.from('players').insert({ ...player, club_id: clubId, photo_url: player.photoUrl });
};
export const updatePlayer = async (player: Player) => {
    await supabase.from('players').update({ name: player.name, nickname: player.nickname, position: player.position, cpf: player.cpf, photo_url: player.photoUrl }).eq('id', player.id);
};
export const deletePlayer = async (id: string) => {
    await supabase.from('players').delete().eq('id', id);
};

// Staff Handlers
export const createStaff = async (clubId: string, staff: Omit<TechnicalStaff, 'id'>) => {
    await supabase.from('technical_staff').insert({ ...staff, club_id: clubId });
};
export const updateStaff = async (staff: TechnicalStaff) => {
    await supabase.from('technical_staff').update({ name: staff.name, role: staff.role }).eq('id', staff.id);
};
export const deleteStaff = async (id: string) => {
    await supabase.from('technical_staff').delete().eq('id', id);
};

// Financials Handlers
export const saveFinancials = async (championshipId: string, financials: ChampionshipFinancials, clubs: Club[]) => {
    // 1. Upsert championship financials settings
    await supabase.from('championship_financials').upsert({
        championship_id: championshipId,
        referee_fee: financials.refereeFee,
        assistant_fee: financials.assistantFee,
        table_official_fee: financials.tableOfficialFee,
        field_fee: financials.fieldFee,
        yellow_card_fine: financials.yellowCardFine,
        red_card_fine: financials.redCardFine,
    }, { onConflict: 'championship_id' });
    
    // 2. Recalculate and update club financials
     const { data: allMatchEvents, error } = await supabase.from('match_events')
        .select('*, player:players(club_id)')
        .in('type', ['yellow_card', 'red_card'])
        .eq('match:matches!inner(championship_id)', championshipId);
    
     if (error) throw error;

    const clubFines: { [clubId: string]: number } = {};
    clubs.forEach(c => clubFines[c.id] = 0);

    allMatchEvents.forEach(event => {
        const clubId = event.player?.club_id;
        if (clubId) {
            const fine = event.type === 'yellow_card' ? financials.yellowCardFine : financials.redCardFine;
            clubFines[clubId] += fine;
        }
    });

    const clubFinancialsToUpsert = clubs.map(club => ({
        championship_id: championshipId,
        club_id: club.id,
        registration_fee_due: financials.registrationFeePerClub,
        total_fines: clubFines[club.id] || 0,
    }));

    await supabase.from('club_financials').upsert(clubFinancialsToUpsert, { onConflict: 'championship_id, club_id', ignoreDuplicates: false });
};

export const updateClubPayment = async (championshipId: string, clubId: string, amount: number) => {
    await supabase.from('club_financials')
        .update({ amount_paid: amount })
        .eq('championship_id', championshipId)
        .eq('club_id', clubId);
};