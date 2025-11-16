

import { supabase } from '../supabaseClient';
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, MatchEvent, ChampionshipFinancials } from '../types';

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

// "Bulletproof" data transformation. Uses imperative loops with individual try-catch blocks
// to prevent a single corrupt record from crashing the entire app load.
const transformLeagues = (data: any[]): League[] => {
    if (!Array.isArray(data)) return [];

    const leagues: League[] = [];

    for (const leagueData of data) {
        try {
            if (!leagueData || typeof leagueData !== 'object' || !leagueData.id) {
                console.warn("Skipping invalid league data:", leagueData);
                continue;
            }

            // OFFICIALS
            let referees: Official[] = [];
            let tableOfficials: Official[] = [];
            const officialsMap = new Map<string, string>();
            const rawOfficials = Array.isArray(leagueData.officials) ? leagueData.officials : [];
            for (const o of rawOfficials) {
                try {
                    if (!o || typeof o !== 'object' || !o.id) continue;
                    const official: Official = {
                        id: String(o.id || ''), name: String(o.name || 'Nome Inválido'),
                        nickname: String(o.nickname || ''), cpf: String(o.cpf || ''),
                        bankAccount: String(o.bank_account || '')
                    };
                    officialsMap.set(official.id, official.name);
                    if (o.type === 'referee') referees.push(official);
                    if (o.type === 'table_official') tableOfficials.push(official);
                } catch (e) {
                    console.error("Error processing an official record, skipping:", o, e);
                }
            }
            
            // CHAMPIONSHIPS
            let championships: Championship[] = [];
            const rawChampionships = Array.isArray(leagueData.championships) ? leagueData.championships : [];
            for (const champData of rawChampionships) {
                try {
                    if (!champData || typeof champData !== 'object' || !champData.id) continue;

                    // CLUBS
                    let clubs: Club[] = [];
                    const rawClubs = Array.isArray(champData.clubs) ? champData.clubs : [];
                    for (const clubData of rawClubs) {
                         try {
                            if (!clubData || typeof clubData !== 'object' || !clubData.id) continue;
                            
                            let players: Player[] = [];
                            const rawPlayers = Array.isArray(clubData.players) ? clubData.players : [];
                            for(const p of rawPlayers) {
                                try {
                                    if (!p || typeof p !== 'object' || !p.id) continue;
                                    players.push({
                                        id: String(p.id), name: String(p.name || 'Nome Inválido'),
                                        position: String(p.position || 'Indefinido'), goals: Number(p.goals_in_championship) || 0,
                                        photoUrl: String(p.photo_url || ''), birthDate: String(p.birth_date || ''),
                                        nickname: String(p.nickname || ''), cpf: String(p.cpf || ''),
                                    });
                                } catch (e) { console.error("Error processing a player record, skipping:", p, e); }
                            }

                            let technicalStaff: TechnicalStaff[] = [];
                            const rawStaff = Array.isArray(clubData.technical_staff) ? clubData.technical_staff : [];
                            for(const ts of rawStaff) {
                                try {
                                    if (!ts || typeof ts !== 'object' || !ts.id) continue;
                                    technicalStaff.push({
                                        id: String(ts.id), name: String(ts.name || 'Nome Inválido'), role: String(ts.role || 'Cargo Inválido'),
                                    });
                                } catch(e) { console.error("Error processing a staff record, skipping:", ts, e); }
                            }

                            clubs.push({
                                id: String(clubData.id), name: String(clubData.name || 'Nome Inválido'),
                                abbreviation: String(clubData.abbreviation || '---'), logoUrl: String(clubData.logo_url || ''),
                                whatsapp: String(clubData.whatsapp || ''),
                                players, technicalStaff
                            });
                        } catch (e) { console.error("Error processing a club record, skipping:", clubData, e); }
                    }
                    
                    const clubMap = new Map<string, Club>(clubs.map(c => [c.id, c]));
                    const getTeamObject = (teamId: string | null | undefined): Club => {
                        const id = String(teamId || '');
                        if (!id || !clubMap.has(id)) {
                           const placeholderName = id.startsWith('ph-') ? id.substring(3).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Time Inválido';
                           return { id: id || `unknown-${crypto.randomUUID()}`, name: placeholderName, abbreviation: 'TBD', logoUrl: '', players: [], technicalStaff: [] };
                        }
                        return clubMap.get(id)!;
                    };

                    // MATCHES
                    let matches: Match[] = [];
                    const rawMatches = Array.isArray(champData.matches) ? champData.matches : [];
                    for(const matchData of rawMatches) {
                        try {
                            if (!matchData || typeof matchData !== 'object' || !matchData.id) continue;
                            
                            let events: MatchEvent[] = [];
                            const rawEvents = Array.isArray(matchData.match_events) ? matchData.match_events : [];
                            for(const e of rawEvents) {
                                try {
                                    if (!e || typeof e !== 'object' || !e.type || !e.player_id) continue;
                                    events.push({ type: e.type, playerId: String(e.player_id), minute: Number(e.minute) || 0, playerName: '' });
                                } catch(er) { console.error("Error processing a match event record, skipping:", e, er); }
                            }
                            
                            matches.push({
                                id: String(matchData.id), round: Number(matchData.round) || 1,
                                homeTeam: getTeamObject(matchData.home_team_id),
                                awayTeam: getTeamObject(matchData.away_team_id),
                                homeScore: matchData.home_score != null ? Number(matchData.home_score) : null, 
                                awayScore: matchData.away_score != null ? Number(matchData.away_score) : null,
                                date: matchData.match_date && !isNaN(new Date(matchData.match_date).getTime()) ? matchData.match_date : new Date().toISOString(),
                                status: ['scheduled', 'in_progress', 'finished'].includes(matchData.status) ? matchData.status : 'scheduled',
                                location: String(matchData.location || 'A definir'),
                                events,
                                referee: officialsMap.get(String(matchData.referee_id || '')),
                                assistant1: officialsMap.get(String(matchData.assistant1_id || '')),
                                assistant2: officialsMap.get(String(matchData.assistant2_id || '')),
                                tableOfficial: officialsMap.get(String(matchData.table_official_id || '')),
                                championship_id: String(champData.id),
                                homeLineup: Array.isArray(matchData.home_lineup) ? matchData.home_lineup : [], 
                                awayLineup: Array.isArray(matchData.away_lineup) ? matchData.away_lineup : [],
                            });
                        } catch(e) { console.error("Error processing a match record, skipping:", matchData, e); }
                    }

                    // FINANCIALS
                    let financials: ChampionshipFinancials | undefined = undefined;
                    try {
                        const rawFinancials = champData.financials;
                        if (rawFinancials && typeof rawFinancials === 'object' && !Array.isArray(rawFinancials)) {
                            financials = {
                                refereeFee: Number(rawFinancials.refereeFee) || 0, assistantFee: Number(rawFinancials.assistantFee) || 0,
                                tableOfficialFee: Number(rawFinancials.tableOfficialFee) || 0, fieldFee: Number(rawFinancials.fieldFee) || 0,
                                yellowCardFine: Number(rawFinancials.yellowCardFine) || 0, redCardFine: Number(rawFinancials.redCardFine) || 0,
                                totalCost: Number(rawFinancials.totalCost) || 0, registrationFeePerClub: Number(rawFinancials.registrationFeePerClub) || 0,
                                clubPayments: rawFinancials.clubPayments || {},
                                finePayments: rawFinancials.finePayments || {},
                            };
                        }
                    } catch(e) { console.error("Error processing financials for championship, continuing without financials:", champData.id, e); financials = undefined; }

                    championships.push({ 
                        id: String(champData.id), name: String(champData.name || 'Nome Inválido'),
                        clubs, matches, standings: [], financials
                    });
                } catch(e) { console.error("Error processing a championship record, skipping:", champData, e); }
            }
            
            leagues.push({
                id: String(leagueData.id), name: String(leagueData.name), slug: String(leagueData.slug || generateSlug(leagueData.name)),
                logoUrl: String(leagueData.logo_url || ''), adminEmail: String(leagueData.admin_email || ''),
                adminPassword: String(leagueData.admin_password_hash || ''),
                city: String(leagueData.city || ''), state: String(leagueData.state || ''),
                referees, tableOfficials, championships
            });
        } catch (e) {
            console.error(`Fatal error processing league data, skipping league:`, leagueData, e);
        }
    }
    return leagues;
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
        financials,
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
            home_lineup,
            away_lineup,
            match_events (
                type,
                player_id,
                minute
            )
        )
    )
`;

// Helper to correctly structure the data from the many-to-many join
const structureChampionships = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(league => league && typeof league === 'object').map(league => {
        try {
            const championships = Array.isArray(league.championships) ? league.championships : [];
            const structuredChampionships = championships.map((champ: any) => {
                try {
                    if (!champ || typeof champ !== 'object') return null;
                    const clubs = (Array.isArray(champ.championship_clubs) ? champ.championship_clubs : [])
                        .map((cc: any) => {
                            if (cc && typeof cc === 'object' && cc.clubs && typeof cc.clubs === 'object') {
                                return { ...cc.clubs };
                            }
                            return null;
                        })
                        .filter(club => club && typeof club === 'object' && club.id);
                    return { ...champ, clubs };
                } catch (e) {
                    console.error("Failed to structure championship clubs for championship:", champ.id, e);
                    return { ...champ, clubs: [] }; 
                }
            }).filter(champ => champ !== null);

            return { ...league, championships: structuredChampionships };
        } catch (e) {
            console.error("Failed to structure league championships for league:", league.id, e);
            return { ...league, championships: [] };
        }
    });
};


export const fetchLeagues = async (): Promise<League[]> => {
    const { data, error } = await supabase.from('leagues').select(leagueQuery);
    if (error) throw error;
    const structuredData = structureChampionships(data);
    return transformLeagues(structuredData);
};

export const login = async (email: string, pass: string): Promise<League | null> => {
    if (!email || !pass) return null;
    const { data, error } = await supabase.from('leagues')
        .select(leagueQuery)
        .ilike('admin_email', email.trim()) 
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
        admin_email: adminEmail.trim(), 
        admin_password_hash: adminPassword, 
        state,
        city,
    }).select().single();

    if (error) {
        if (error.code === '23505') { 
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

export const saveChampionshipFinancials = async (championshipId: string, financials: ChampionshipFinancials) => {
    const { error } = await supabase
        .from('championships')
        .update({ financials })
        .eq('id', championshipId);
    if (error) {
        console.error("Supabase saveChampionshipFinancials error:", error);
        throw new Error(`Falha ao salvar dados financeiros: ${error.message}`);
    }
};

export const addClubToChampionship = async (championshipId: string, clubData: { name: string, abbreviation: string, logoUrl: string, whatsapp: string }) => {
    const { data: newClub, error: clubError } = await supabase.from('clubs').insert({
        id: crypto.randomUUID(),
        name: clubData.name,
        abbreviation: clubData.abbreviation,
        logo_url: clubData.logoUrl,
        whatsapp: clubData.whatsapp,
    }).select().single();
    if (clubError) throw clubError;

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
        home_lineup: match.homeLineup,
        away_lineup: match.awayLineup,
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

    const { data: playersInChampionship, error: playersError } = await supabase
        .from('players')
        .select('*')
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
    
    const playersToUpdate = (playersInChampionship || [])
        .filter(player => player && player.name)
        .map(player => ({
            ...player,
            goals_in_championship: allPlayerGoals[player.id] || 0,
        }));
    
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

export const updateClubRegistrationStatus = async (championshipId: string, clubId: string, isPaid: boolean) => {
    // 1. Fetch current financials
    const { data, error: fetchError } = await supabase
        .from('championships')
        .select('financials')
        .eq('id', championshipId)
        .single();
    
    if (fetchError) {
        console.error("Supabase updateClubRegistrationStatus (fetch) error:", fetchError);
        throw new Error(`Falha ao buscar dados financeiros: ${fetchError.message}`);
    }

    const currentFinancials = (data?.financials || {}) as Partial<ChampionshipFinancials>;

    // 2. Update the clubPayments map
    const updatedFinancials = {
        ...currentFinancials,
        clubPayments: {
            ...(currentFinancials.clubPayments || {}),
            [clubId]: isPaid,
        },
    };

    // 3. Save the updated financials object
    const { error: updateError } = await supabase
        .from('championships')
        .update({ financials: updatedFinancials })
        .eq('id', championshipId);

    if (updateError) {
        console.error("Supabase updateClubRegistrationStatus (update) error:", updateError);
        throw new Error(`Falha ao atualizar status de pagamento: ${updateError.message}`);
    }
};

export const updateClubFinePaymentStatus = async (championshipId: string, clubId: string, round: number, isPaid: boolean) => {
    const { data, error: fetchError } = await supabase
        .from('championships')
        .select('financials')
        .eq('id', championshipId)
        .single();
    
    if (fetchError) {
        console.error("Supabase updateClubFinePaymentStatus (fetch) error:", fetchError);
        throw new Error(`Falha ao buscar dados financeiros: ${fetchError.message}`);
    }

    const currentFinancials = (data?.financials || {}) as Partial<ChampionshipFinancials>;
    
    const clubFinePayments = currentFinancials.finePayments?.[clubId] || {};

    const updatedFinancials = {
        ...currentFinancials,
        finePayments: {
            ...(currentFinancials.finePayments || {}),
            [clubId]: {
                ...clubFinePayments,
                [round]: isPaid,
            },
        },
    };

    const { error: updateError } = await supabase
        .from('championships')
        .update({ financials: updatedFinancials })
        .eq('id', championshipId);

    if (updateError) {
        console.error("Supabase updateClubFinePaymentStatus (update) error:", updateError);
        throw new Error(`Falha ao atualizar status de pagamento da multa: ${updateError.message}`);
    }
};