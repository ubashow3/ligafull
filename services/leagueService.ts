
import { League, Championship, Club, Match, Player, TechnicalStaff, Official, MatchEvent, ChampionshipFinancials } from '../types';
import { supabase } from '../supabaseClient';

// Helper function to generate a slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

const resizeImage = (file: File, width: number, height: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            if (!event.target?.result) {
                return reject(new Error("FileReader did not return a result."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed'));
                    }
                    const newFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.9);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
};

export const uploadImage = async (file: File): Promise<string> => {
    if (!file) return '';
    try {
        const resizedFile = await resizeImage(file, 200, 200);
        const fileExt = 'jpg';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, resizedFile);

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        return data.publicUrl || '';
    } catch (e: any) {
        console.error("Image upload error:", e);
        return '';
    }
};

const transformLeagues = (data: any[]): League[] => {
    return data.map(l => {
        const officials = Array.isArray(l.officials) ? l.officials : [];
        const championships = Array.isArray(l.championships) ? l.championships : [];

        const transformedChamps = championships.map((c: any) => {
            const rawClubs = Array.isArray(c.championship_clubs) 
                ? c.championship_clubs.map((cc: any) => cc.clubs).filter(Boolean)
                : [];
            
            const clubs = rawClubs.map((club: any) => ({
                id: club.id,
                name: club.name,
                abbreviation: club.abbreviation,
                logoUrl: club.logo_url || '',
                whatsapp: club.whatsapp || '',
                players: (club.players || []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    position: p.position,
                    goals: p.goals_in_championship || 0,
                    photoUrl: p.photo_url || '',
                    birthDate: p.birth_date || '',
                    nickname: p.nickname || '',
                    cpf: p.cpf || ''
                })),
                technicalStaff: (club.technical_staff || []).map((ts: any) => ({
                    id: ts.id,
                    name: ts.name,
                    role: ts.role
                }))
            }));

            const clubMap = new Map<string, Club>(clubs.map(cl => [cl.id, cl]));
            const playerMap = new Map<string, string>();
            clubs.forEach(cl => cl.players.forEach(pl => playerMap.set(pl.id, pl.name)));

            const matches = (c.matches || []).map((m: any) => ({
                id: m.id,
                round: m.round,
                homeTeam: clubMap.get(m.home_team_id) || { id: m.home_team_id, name: 'Desconhecido', abbreviation: '???', logoUrl: '', players: [], technicalStaff: [] },
                awayTeam: clubMap.get(m.away_team_id) || { id: m.away_team_id, name: 'Desconhecido', abbreviation: '???', logoUrl: '', players: [], technicalStaff: [] },
                homeScore: m.home_score,
                awayScore: m.away_score,
                date: m.match_date,
                status: m.status,
                location: m.location || 'A definir',
                events: (m.match_events || []).map((e: any) => ({
                    type: e.type,
                    playerId: e.player_id,
                    playerName: playerMap.get(e.player_id) || 'Desconhecido',
                    minute: e.minute
                })),
                referee: l.officials.find((o: any) => o.id === m.referee_id)?.name,
                assistant1: l.officials.find((o: any) => o.id === m.assistant1_id)?.name,
                assistant2: l.officials.find((o: any) => o.id === m.assistant2_id)?.name,
                tableOfficial: l.officials.find((o: any) => o.id === m.table_official_id)?.name,
                championship_id: c.id,
                homeLineup: m.home_lineup || [],
                awayLineup: m.away_lineup || []
            }));

            return {
                id: c.id,
                name: c.name,
                clubs,
                matches,
                standings: [],
                financials: c.financials
            };
        });

        return {
            id: l.id,
            name: l.name,
            slug: l.slug,
            logoUrl: l.logo_url || '',
            adminEmail: l.admin_email,
            city: l.city || '',
            state: l.state || '',
            referees: officials.filter((o: any) => o.type === 'referee').map((o: any) => ({ id: o.id, name: o.name, nickname: o.nickname, cpf: o.cpf, bankAccount: o.bank_account })),
            tableOfficials: officials.filter((o: any) => o.type === 'table_official').map((o: any) => ({ id: o.id, name: o.name, nickname: o.nickname, cpf: o.cpf, bankAccount: o.bank_account })),
            championships: transformedChamps
        };
    });
};

const leagueQuery = `
    id, name, slug, logo_url, admin_email, admin_password_hash, city, state,
    officials (id, name, nickname, cpf, bank_account, type),
    championships (
        id, name, financials,
        championship_clubs (
            clubs (
                id, name, abbreviation, logo_url, whatsapp,
                players (id, name, position, goals_in_championship, photo_url, birth_date, nickname, cpf),
                technical_staff (id, name, role)
            )
        ),
        matches (
            id, round, home_team_id, away_team_id, home_score, away_score, match_date, status, location,
            referee_id, assistant1_id, assistant2_id, table_official_id, home_lineup, away_lineup,
            match_events (type, player_id, minute)
        )
    )
`;

export const fetchLeagues = async (): Promise<League[]> => {
    const { data, error } = await supabase.from('leagues').select(leagueQuery);
    if (error) throw error;
    return transformLeagues(data || []);
};

export const login = async (email: string, pass: string): Promise<League | null> => {
    const { data, error } = await supabase.from('leagues')
        .select(leagueQuery)
        .ilike('admin_email', email.trim())
        .eq('admin_password_hash', pass)
        .maybeSingle();
    if (error || !data) return null;
    return transformLeagues([data])[0];
};

export const createLeague = async (ld: any): Promise<League> => {
    const { data, error } = await supabase.from('leagues').insert({
        id: crypto.randomUUID(),
        name: ld.name,
        slug: generateSlug(ld.name),
        logo_url: ld.logoUrl,
        admin_email: ld.adminEmail.trim(),
        admin_password_hash: ld.adminPassword,
        state: ld.state,
        city: ld.city
    }).select().single();
    if (error) throw error;
    return { ...data, championships: [], referees: [], tableOfficials: [] };
};

export const createChampionship = async (leagueId: string, name: string) => {
    const { error } = await supabase.from('championships').insert({ id: crypto.randomUUID(), league_id: leagueId, name });
    if (error) throw error;
};

export const addClubToChampionship = async (championshipId: string, clubData: any) => {
    const { data: newClub, error: clubError } = await supabase.from('clubs').insert({
        id: crypto.randomUUID(),
        name: clubData.name,
        abbreviation: clubData.abbreviation,
        logo_url: clubData.logoUrl,
        whatsapp: clubData.whatsapp
    }).select().single();
    if (clubError) throw clubError;
    await supabase.from('championship_clubs').insert({ championship_id: championshipId, club_id: newClub.id });
};

export const generateMatches = async (championshipId: string, matches: Match[]) => {
    const inserts = matches.map(m => ({
        id: m.id || crypto.randomUUID(),
        championship_id: championshipId,
        round: m.round,
        home_team_id: (m.homeTeam as Club).id,
        away_team_id: (m.awayTeam as Club).id,
        status: m.status,
        match_date: m.date,
        location: m.location
    }));
    const { error } = await supabase.from('matches').insert(inserts);
    if (error) throw error;
};

export const updateMatch = async (match: Match, league: League) => {
    const officialsMap = new Map([...league.referees, ...league.tableOfficials].map(o => [o.name, o.id]));
    const { error: mError } = await supabase.from('matches').update({
        home_score: match.homeScore,
        away_score: match.awayScore,
        status: match.status,
        location: match.location,
        match_date: match.date,
        referee_id: match.referee ? officialsMap.get(match.referee) : null,
        assistant1_id: match.assistant1 ? officialsMap.get(match.assistant1) : null,
        assistant2_id: match.assistant2 ? officialsMap.get(match.assistant2) : null,
        table_official_id: match.tableOfficial ? officialsMap.get(match.tableOfficial) : null,
        home_lineup: match.homeLineup,
        away_lineup: match.awayLineup
    }).eq('id', match.id);
    if (mError) throw mError;

    await supabase.from('match_events').delete().eq('match_id', match.id);
    if (match.events.length > 0) {
        await supabase.from('match_events').insert(match.events.map(e => ({
            match_id: match.id, player_id: e.playerId, type: e.type, minute: e.minute
        })));
    }
};

export const createPlayer = async (clubId: string, p: any) => {
    await supabase.from('players').insert({
        id: crypto.randomUUID(), club_id: clubId, name: p.name, position: p.position,
        nickname: p.nickname, cpf: p.cpf, photo_url: p.photoUrl, birth_date: p.birthDate || null
    });
};

export const updatePlayer = async (p: Player) => {
    await supabase.from('players').update({
        name: p.name, nickname: p.nickname, position: p.position, cpf: p.cpf, photo_url: p.photoUrl, birth_date: p.birthDate || null
    }).eq('id', p.id);
};

export const deletePlayer = async (id: string) => {
    await supabase.from('players').delete().eq('id', id);
};

export const createStaff = async (clubId: string, s: any) => {
    await supabase.from('technical_staff').insert({ id: crypto.randomUUID(), club_id: clubId, name: s.name, role: s.role });
};

export const updateStaff = async (s: TechnicalStaff) => {
    await supabase.from('technical_staff').update({ name: s.name, role: s.role }).eq('id', s.id);
};

export const deleteStaff = async (id: string) => {
    await supabase.from('technical_staff').delete().eq('id', id);
};

export const createOfficial = async (leagueId: string, type: string, o: any) => {
    await supabase.from('officials').insert({
        id: crypto.randomUUID(), league_id: leagueId, name: o.name, nickname: o.nickname, cpf: o.cpf,
        bank_account: o.bankAccount, type: type === 'referees' ? 'referee' : 'table_official'
    });
};

export const updateOfficial = async (o: Official) => {
    await supabase.from('officials').update({ name: o.name, nickname: o.nickname, cpf: o.cpf, bank_account: o.bankAccount }).eq('id', o.id);
};

export const deleteOfficial = async (id: string) => {
    await supabase.from('officials').delete().eq('id', id);
};

export const saveChampionshipFinancials = async (id: string, f: any) => {
    await supabase.from('championships').update({ financials: f }).eq('id', id);
};

export const updateClubRegistrationStatus = async (champId: string, clubId: string, isPaid: boolean) => {
    const { data } = await supabase.from('championships').select('financials').eq('id', champId).single();
    const f = data?.financials || {};
    f.clubPayments = { ...(f.clubPayments || {}), [clubId]: isPaid };
    await supabase.from('championships').update({ financials: f }).eq('id', champId);
};

export const updateClubFinePaymentStatus = async (champId: string, clubId: string, round: number, isPaid: boolean) => {
    const { data } = await supabase.from('championships').select('financials').eq('id', champId).single();
    const f = data?.financials || {};
    if (!f.finePayments) f.finePayments = {};
    if (!f.finePayments[clubId]) f.finePayments[clubId] = {};
    f.finePayments[clubId][round] = isPaid;
    await supabase.from('championships').update({ financials: f }).eq('id', champId);
};

export const updateClubDetails = async (id: string, d: any) => {
    const up: any = {};
    if (d.name) up.name = d.name;
    if (d.logoUrl) up.logo_url = d.logoUrl;
    if (d.whatsapp) up.whatsapp = d.whatsapp;
    await supabase.from('clubs').update(up).eq('id', id);
};

export const createOrGetPlaceholderClub = async (name: string): Promise<Club> => {
    const { data } = await supabase.from('clubs').select('*').eq('name', name).maybeSingle();
    if (data) return { id: data.id, name: data.name, abbreviation: data.abbreviation, logoUrl: data.logo_url, players: [], technicalStaff: [] };
    const { data: n } = await supabase.from('clubs').insert({ id: crypto.randomUUID(), name, abbreviation: 'TBD' }).select().single();
    return { id: n.id, name: n.name, abbreviation: n.abbreviation, logoUrl: '', players: [], technicalStaff: [] };
};
