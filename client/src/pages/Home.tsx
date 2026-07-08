import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Shield, Star, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: standings } = trpc.standings.getAll.useQuery();
  const { data: matches } = trpc.matches.getAll.useQuery();
  const { data: topScorers } = trpc.players.getTopScorers.useQuery({ limit: 1 });
  const { data: globalTopScorers } = trpc.players.getTopScorers.useQuery({ limit: 20 });
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const { data: teamReadiness } = trpc.stats.getTeamReadiness.useQuery();
  const { data: playersByTeam } = trpc.players.getByTeam.useQuery(
    { teamId: selectedTeamId ?? 0 },
    { enabled: selectedTeamId !== null },
  );

  const qualifiedToRound16 = useMemo(() => {
    const fromMatches =
      matches
        ?.filter(match => match.stage === "round16")
        .flatMap(match => [match.homeTeamId, match.awayTeamId]) ?? [];

    if (fromMatches.length > 0) {
      return teams?.filter(team => fromMatches.includes(team.id)) ?? [];
    }

    const fromStandings =
      standings
        ?.filter(row => (row.position ?? 99) <= 2)
        .map(row => row.teamId) ?? [];

    return teams?.filter(team => fromStandings.includes(team.id)).slice(0, 16) ?? [];
  }, [matches, standings, teams]);

  const likelyWinner = useMemo(() => {
    if (!teamReadiness?.length) return null;
    return teamReadiness[0];
  }, [teamReadiness]);

  const bestPlayer = useMemo(() => {
    if (!allPlayers?.length) return null;
    return [...allPlayers].sort((a, b) => {
      const aScore = a.goals * 4 + a.assists * 3 + a.minutesPlayed * 0.01;
      const bScore = b.goals * 4 + b.assists * 3 + b.minutesPlayed * 0.01;
      return bScore - aScore;
    })[0];
  }, [allPlayers]);

  const bestDefensiveTeam = useMemo(() => {
    if (!teams?.length) return null;
    return [...teams].sort((a, b) => Number(b.defensiveStrength ?? 0) - Number(a.defensiveStrength ?? 0))[0];
  }, [teams]);

  const selectedTeamName = teams?.find(team => team.id === selectedTeamId)?.name;

  const playersByPosition = (playersByTeam ?? []).reduce((acc: Record<string, number>, player) => {
    acc[player.position] = (acc[player.position] ?? 0) + 1;
    return acc;
  }, {}) || {};

  const teamPowerRanking = useMemo(() => {
    if (!teams?.length) return [];

    const standingsByTeam = (standings ?? []).reduce(
      (acc, row) => {
        const prev = acc[row.teamId] ?? { points: 0, goalsFor: 0, goalsAgainst: 0, matches: 0 };
        acc[row.teamId] = {
          points: prev.points + row.points,
          goalsFor: prev.goalsFor + row.goalsFor,
          goalsAgainst: prev.goalsAgainst + row.goalsAgainst,
          matches: prev.matches + row.wins + row.draws + row.losses,
        };
        return acc;
      },
      {} as Record<number, { points: number; goalsFor: number; goalsAgainst: number; matches: number }>,
    );

    return [...teams]
      .map(team => {
        const s = standingsByTeam[team.id] ?? { points: 0, goalsFor: 0, goalsAgainst: 0, matches: 1 };
        const matchesPlayed = Math.max(1, s.matches);
        const pointsPerMatch = s.points / matchesPlayed;
        const goalDiffPerMatch = (s.goalsFor - s.goalsAgainst) / matchesPlayed;
        const attackPerMatch = s.goalsFor / matchesPlayed;
        const defensePerMatch = Math.max(0, 2 - s.goalsAgainst / matchesPlayed);
        const modelPower = pointsPerMatch * 42 + goalDiffPerMatch * 18 + attackPerMatch * 12 + defensePerMatch * 10;
        return { ...team, modelPower };
      })
      .sort((a, b) => b.modelPower - a.modelPower);
  }, [standings, teams]);

  const predictedFinal = useMemo(() => {
    const [first, second] = teamPowerRanking;
    if (!first || !second) return null;
    const firstExpectedGoals = Math.max(0, Math.round((first.modelPower / 35) * 10) / 10);
    const secondExpectedGoals = Math.max(0, Math.round((second.modelPower / 35) * 10) / 10);
    return {
      homeTeam: first,
      awayTeam: second,
      homeScore: Math.round(firstExpectedGoals),
      awayScore: Math.round(secondExpectedGoals),
      xgHome: firstExpectedGoals,
      xgAway: secondExpectedGoals,
    };
  }, [teamPowerRanking]);

  const teamLogo = (team: { name: string; code: string; flagUrl: string | null }) =>
    team.flagUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(team.code)}&background=0f172a&color=f8fafc&size=128`;

  const playerPhoto = (name: string, photoUrl?: string | null) =>
    photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=f8fafc&size=128`;

  const finalMatchInsights = useMemo(() => {
    if (!predictedFinal) return null;
    const totalPower = predictedFinal.homeTeam.modelPower + predictedFinal.awayTeam.modelPower || 1;
    const homePossession = Math.round((predictedFinal.homeTeam.modelPower / totalPower) * 100);
    const awayPossession = 100 - homePossession;

    const homeCorners = Math.max(2, Math.round(predictedFinal.xgHome * 2.2));
    const awayCorners = Math.max(2, Math.round(predictedFinal.xgAway * 2.2));

    const probableScorers = (globalTopScorers ?? [])
      .filter(
        player =>
          player.teamId === predictedFinal.homeTeam.id ||
          player.teamId === predictedFinal.awayTeam.id,
      )
      .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
      .slice(0, 3);

    return {
      homePossession,
      awayPossession,
      homeCorners,
      awayCorners,
      probableScorers,
    };
  }, [globalTopScorers, predictedFinal]);

  const selectedTeamFormChart = useMemo(() => {
    return (playersByTeam ?? [])
      .slice()
      .sort((a, b) => {
        const aScore = a.goals * 4 + a.assists * 3 + a.minutesPlayed * 0.01;
        const bScore = b.goals * 4 + b.assists * 3 + b.minutesPlayed * 0.01;
        return bScore - aScore;
      })
      .slice(0, 8)
      .map(player => ({
        player: player.name.split(" ").slice(-1)[0],
        formIndex: Number((player.goals * 4 + player.assists * 3 + player.minutesPlayed * 0.01).toFixed(1)),
        goals: player.goals,
      }));
  }, [playersByTeam]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">FIFA World Cup 2026</h1>
              <p className="text-sm text-slate-400">Dashboard analytique - Projet portfolio</p>
            </div>
          </div>
          {isAuthenticated && user && (
            <div className="text-sm text-slate-300">
              Bonjour, <span className="font-semibold text-white">{user.name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Vainqueur probable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{likelyWinner?.teamName ?? "A definir"}</div>
              <p className="text-xs text-slate-400 mt-1">
                Confiance modele: {likelyWinner ? `${Math.min(95, Math.max(50, likelyWinner.readinessScore)).toFixed(1)}%` : "donnees insuffisantes"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Equipes en 1/8
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{qualifiedToRound16.length}</div>
              <p className="text-xs text-slate-400 mt-1">Suivi du tableau final</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-400" />
                Joueur cle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{bestPlayer?.name ?? "A definir"}</div>
              <p className="text-xs text-slate-400 mt-1">{bestPlayer?.teamName ?? "donnees insuffisantes"}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Defense reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{bestDefensiveTeam?.name ?? "A definir"}</div>
              <p className="text-xs text-slate-400 mt-1">Note defense: {bestDefensiveTeam?.defensiveStrength ?? "—"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Equipes qualifiees pour les huitiemes</CardTitle>
              <CardDescription className="text-slate-400">
                Vue synthese des equipes encore en course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {qualifiedToRound16.length > 0 ? (
                  qualifiedToRound16.map(team => (
                    <div key={team.id} className="flex items-center gap-3 rounded-lg border border-slate-700 px-3 py-2">
                      <img
                        src={teamLogo(team)}
                        alt={team.name}
                        className="h-8 w-8 rounded-full object-cover bg-slate-900"
                        loading="lazy"
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">{team.name}</p>
                        <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 mt-1">1/8</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">Aucune equipe qualifiee disponible.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Performances individuelles</CardTitle>
              <CardDescription className="text-slate-400">
                Joueurs et equipes les plus performants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-slate-700 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Meilleur buteur projete</p>
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={playerPhoto(topScorers?.[0]?.name ?? "Player", topScorers?.[0]?.photoUrl)}
                    alt={topScorers?.[0]?.name ?? "Player"}
                    className="h-10 w-10 rounded-full object-cover bg-slate-900"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-lg font-bold text-white">{topScorers?.[0]?.name ?? "Donnees indisponibles"}</p>
                    <p className="text-sm text-slate-400">
                      {topScorers?.[0]?.goals ?? 0} buts • {topScorers?.[0]?.teamCode ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Bloc defensif le plus solide</p>
                <div className="mt-2 flex items-center gap-3">
                  {bestDefensiveTeam && (
                    <img
                      src={teamLogo(bestDefensiveTeam)}
                      alt={bestDefensiveTeam.name}
                      className="h-10 w-10 rounded-full object-cover bg-slate-900"
                      loading="lazy"
                    />
                  )}
                  <div>
                    <p className="text-lg font-bold text-white">{bestDefensiveTeam?.name ?? "Donnees indisponibles"}</p>
                    <p className="text-sm text-slate-400">Defensive strength: {bestDefensiveTeam?.defensiveStrength ?? "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Finale probable et score estime</CardTitle>
            <CardDescription className="text-slate-400">
              Projection basee sur la forme recente et les indicateurs d'equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!predictedFinal ? (
              <p className="text-sm text-slate-400">Pas assez de donnees pour predire la finale.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={teamLogo(predictedFinal.homeTeam)}
                      alt={predictedFinal.homeTeam.name}
                      className="h-12 w-12 rounded-full object-cover bg-slate-900"
                      loading="lazy"
                    />
                    <div>
                      <p className="font-bold text-white">{predictedFinal.homeTeam.name}</p>
                      <p className="text-xs text-slate-400">xG: {predictedFinal.xgHome}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-amber-400">
                      {predictedFinal.homeScore} - {predictedFinal.awayScore}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Projection du score final</p>
                  </div>
                  <div className="flex items-center justify-start md:justify-end gap-3">
                    <div className="text-right">
                      <p className="font-bold text-white">{predictedFinal.awayTeam.name}</p>
                      <p className="text-xs text-slate-400">xG: {predictedFinal.xgAway}</p>
                    </div>
                    <img
                      src={teamLogo(predictedFinal.awayTeam)}
                      alt={predictedFinal.awayTeam.name}
                      className="h-12 w-12 rounded-full object-cover bg-slate-900"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-700 p-3">
                    <p className="text-xs text-slate-400 uppercase">Possession estimee</p>
                    <p className="text-sm text-white mt-2">
                      {predictedFinal.homeTeam.code}: <span className="font-semibold">{finalMatchInsights?.homePossession ?? 50}%</span> | {predictedFinal.awayTeam.code}: <span className="font-semibold">{finalMatchInsights?.awayPossession ?? 50}%</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 p-3">
                    <p className="text-xs text-slate-400 uppercase">Corners estimes</p>
                    <p className="text-sm text-white mt-2">
                      {predictedFinal.homeTeam.code}: <span className="font-semibold">{finalMatchInsights?.homeCorners ?? 0}</span> | {predictedFinal.awayTeam.code}: <span className="font-semibold">{finalMatchInsights?.awayCorners ?? 0}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700 p-3">
                    <p className="text-xs text-slate-400 uppercase">Buteurs attendus</p>
                    <p className="text-sm text-white mt-2">
                      {finalMatchInsights?.probableScorers.map(player => player.name).join(", ") || "A definir"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Analyse joueurs par equipe</CardTitle>
            <CardDescription className="text-slate-400">
              Filtrer une equipe pour comparer les performances individuelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              value={selectedTeamId ?? ""}
              onChange={event => setSelectedTeamId(event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Choisir une equipe</option>
              {(teams ?? []).map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            {!selectedTeamId ? (
              <p className="text-sm text-slate-400">Choisis une equipe pour afficher les statistiques joueurs.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-700 p-3">
                  <p className="text-sm text-slate-300">Equipe</p>
                  <p className="text-xl font-bold text-white">{selectedTeamName ?? "Equipe non disponible"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Joueurs: {playersByTeam?.length ?? 0} | GK: {playersByPosition.GK ?? 0} | DF: {playersByPosition.DF ?? 0} | MF: {playersByPosition.MF ?? 0} | FW: {playersByPosition.FW ?? 0}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(playersByTeam ?? []).slice(0, 8).map(player => (
                    <div key={player.id} className="rounded-lg border border-slate-700 p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={playerPhoto(player.name, player.photoUrl)}
                          alt={player.name}
                          className="h-9 w-9 rounded-full object-cover bg-slate-900"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-semibold text-white">{player.name}</p>
                          <p className="text-xs text-slate-400">{player.position}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">Buts: {player.goals} | Passes: {player.assists}</p>
                      <p className="text-sm text-slate-300">Minutes: {player.minutesPlayed}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTeamId && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Forme des joueurs - {selectedTeamName}</CardTitle>
              <CardDescription className="text-slate-400">
                Indice de performance calcule sur buts, passes et temps de jeu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTeamFormChart.length === 0 ? (
                <p className="text-sm text-slate-400">Pas assez de donnees pour le graphique.</p>
              ) : (
                <ChartContainer
                  className="h-[280px] w-full"
                  config={{
                    formIndex: { label: "Forme", color: "#f59e0b" },
                  }}
                >
                  <BarChart data={selectedTeamFormChart}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="player" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="formIndex" fill="var(--color-formIndex)" radius={6} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/stats">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12">
              Voir les statistiques
            </Button>
          </Link>
          <Link href="/teams">
            <Button className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold h-12">
              Voir les equipes
            </Button>
          </Link>
          <Link href="/predictions">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12">
              Voir les predictions
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
