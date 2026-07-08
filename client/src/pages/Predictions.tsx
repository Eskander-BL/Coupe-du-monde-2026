import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Star, Trophy, Users, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Predictions() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const { data: topScorers } = trpc.players.getTopScorers.useQuery({ limit: 30 });
  const { data: matches } = trpc.matches.getAll.useQuery();
  const { data: modelValidation } = trpc.stats.getModelValidation.useQuery();
  const { data: dataQuality } = trpc.stats.getDataQuality.useQuery();
  const { data: teamReadiness } = trpc.stats.getTeamReadiness.useQuery();
  const { data: mlForecast } = trpc.stats.getMlForecast.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const totalCompletedMatches = useMemo(
    () => matches?.filter(m => m.status === "completed").length ?? 0,
    [matches],
  );

  const winnerPredictions = useMemo(() => {
    if (mlForecast?.status === "ok") {
      return mlForecast.outputs.winnerProbabilities.map(item => ({
        rank: item.rank,
        teamName: item.teamName,
        teamCode: item.teamCode,
        probability: item.probability,
        score: item.readinessScore,
      }));
    }
    if (!teamReadiness?.length) return [];
    const ranked = [...teamReadiness].sort((a, b) => b.readinessScore - a.readinessScore).slice(0, 5);
    const total = ranked.reduce((acc, r) => acc + r.readinessScore, 0) || 1;
    return ranked.map((item, idx) => ({
      rank: idx + 1,
      teamName: item.teamName,
      teamCode: item.teamCode,
      probability: Math.round((item.readinessScore / total) * 1000) / 10,
      score: item.readinessScore,
    }));
  }, [mlForecast, teamReadiness]);

  const topScorerPredictions = useMemo(() => {
    if (mlForecast?.status === "ok") {
      return mlForecast.outputs.topScorerProbabilities.map(item => ({
        rank: item.rank,
        playerName: item.playerName,
        teamCode: item.teamCode,
        currentGoals: item.currentGoals,
        goalsPer90: item.goalsPer90,
        confidence: item.probability,
      }));
    }
    if (!topScorers?.length) return [];

    const ranked = topScorers.slice(0, 5);
    const scoreTotal =
      ranked.reduce((acc, player) => {
        const minutes = Math.max(1, player.minutesPlayed ?? 0);
        const goalsPer90 = ((player.goals ?? 0) / minutes) * 90;
        return acc + goalsPer90 + (player.goals ?? 0) * 0.2;
      }, 0) || 1;

    return ranked.map((player, idx) => {
      const currentGoals = player.goals ?? 0;
      const minutes = player.minutesPlayed ?? 0;
      const goalsPer90 = minutes > 0 ? (currentGoals / minutes) * 90 : 0;
      const scorerWeight = goalsPer90 + currentGoals * 0.2;
      const confidence = Math.round((scorerWeight / scoreTotal) * 1000) / 10;

      return {
        rank: idx + 1,
        playerName: player.name,
        teamCode: player.teamCode,
        currentGoals,
        goalsPer90: Number(goalsPer90.toFixed(2)),
        confidence: Math.min(95, Math.max(5, confidence)),
      };
    });
  }, [mlForecast, topScorers]);

  const bestDefenderPrediction = useMemo(() => {
    if (mlForecast?.status === "ok") {
      const top = mlForecast.outputs.bestDefenders[0];
      if (!top) return null;
      const full = allPlayers?.find(player => player.id === top.playerId);
      return full ?? null;
    }
    if (!allPlayers?.length) return null;
    const defenders = allPlayers.filter(player => player.position === "DF");
    if (!defenders.length) return null;

    const sorted = defenders.sort((a, b) => {
      const aScore = a.minutesPlayed * 0.004 + a.assists * 1.8 + a.goals * 1.2;
      const bScore = b.minutesPlayed * 0.004 + b.assists * 1.8 + b.goals * 1.2;
      return bScore - aScore;
    });
    return sorted[0];
  }, [allPlayers, mlForecast]);

  const bestPlayerPrediction = useMemo(() => {
    if (mlForecast?.status === "ok") {
      const top = mlForecast.outputs.bestPlayers[0];
      if (!top) return null;
      const full = allPlayers?.find(player => player.id === top.playerId);
      return full ?? null;
    }
    if (!allPlayers?.length) return null;

    const ranked = [...allPlayers].sort((a, b) => {
      const aScore = a.goals * 4 + a.assists * 3 + a.minutesPlayed * 0.01;
      const bScore = b.goals * 4 + b.assists * 3 + b.minutesPlayed * 0.01;
      return bScore - aScore;
    });
    return ranked[0];
  }, [allPlayers, mlForecast]);

  const playersByTeam = useMemo(() => {
    if (!selectedTeamId) return allPlayers ?? [];
    return (allPlayers ?? []).filter(player => player.teamId === selectedTeamId);
  }, [allPlayers, selectedTeamId]);

  const selectedPlayerStats = useMemo(() => {
    if (!selectedPlayerId) return null;
    return (allPlayers ?? []).find(player => player.id === selectedPlayerId) ?? null;
  }, [allPlayers, selectedPlayerId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Previsions - Coupe du Monde 2026</h1>
            <p className="text-sm text-slate-400">Analyse statistique des equipes et des joueurs</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            Cette page presente une projection statistique a partir des performances observees: niveau d'equipe, forme recente, production offensive et temps de jeu.
          </p>
          <p className="text-xs text-blue-200 mt-2">
            Matchs completes detectes: {totalCompletedMatches}
          </p>
          {mlForecast?.status === "ok" && (
            <p className="text-xs text-blue-200 mt-1">
              Modele actif: {mlForecast.model.name} v{mlForecast.model.version}
            </p>
          )}
          {mlForecast?.status === "insufficient_data" && (
            <p className="text-xs text-amber-200 mt-1">
              ML bloque: {mlForecast.reason}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Fiabilite du modele</CardTitle>
              <CardDescription className="text-slate-400">
                Evaluation sur matchs termines (backtest interne)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-300">Echantillon: <span className="text-white font-semibold">{modelValidation?.sampleSize ?? 0}</span></p>
              <p className="text-slate-300">MAE score: <span className="text-white font-semibold">{modelValidation?.scoreMae ?? "—"}</span></p>
              <p className="text-slate-300">Accuracy vainqueur: <span className="text-white font-semibold">{modelValidation?.winnerAccuracy ?? "—"}%</span></p>
              <p className="text-slate-300">Brier score: <span className="text-white font-semibold">{modelValidation?.winnerBrier ?? "—"}</span></p>
              <p className="text-slate-300">Calibration gap: <span className="text-white font-semibold">{modelValidation?.calibrationGap ?? "—"}</span></p>
              <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 mt-1">
                Statut: {modelValidation?.quality ?? "non disponible"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Qualite des donnees</CardTitle>
              <CardDescription className="text-slate-400">
                Controles automatiques des donnees source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-300">Equipes: <span className="text-white font-semibold">{dataQuality?.teamsCount ?? 0}</span></p>
              <p className="text-slate-300">Joueurs: <span className="text-white font-semibold">{dataQuality?.playersCount ?? 0}</span></p>
              <p className="text-slate-300">Equipes sans ratings: <span className="text-white font-semibold">{dataQuality?.teamsMissingRatings ?? 0}</span></p>
              <p className="text-slate-300">Joueurs sans photo: <span className="text-white font-semibold">{dataQuality?.playersMissingPhoto ?? 0}</span></p>
              <p className="text-slate-300">Anomalies stats/minutes: <span className="text-white font-semibold">{(dataQuality?.playersInvalidMinutes ?? 0) + (dataQuality?.playersInvalidStats ?? 0)}</span></p>
              <Badge className="bg-green-500/20 text-green-200 border-green-500/30 mt-1">
                Score qualite: {dataQuality?.qualityScore ?? "—"} / 100
              </Badge>
            </CardContent>
          </Card>
        </div>

        {mlForecast?.status === "ok" && (
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Validation temporelle (V2 Elo)</CardTitle>
              <CardDescription className="text-slate-400">
                Train passe (70%) / Test recent (30%) pour limiter le sur-apprentissage
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-slate-700 p-3">
                <p className="text-slate-400">Test matches</p>
                <p className="text-white font-semibold">{mlForecast.validation.testMatches ?? 0}</p>
              </div>
              <div className="rounded-md border border-slate-700 p-3">
                <p className="text-slate-400">Winner accuracy</p>
                <p className="text-white font-semibold">{mlForecast.validation.winnerAccuracy ?? "—"}%</p>
              </div>
              <div className="rounded-md border border-slate-700 p-3">
                <p className="text-slate-400">Brier score</p>
                <p className="text-white font-semibold">{mlForecast.validation.brierScore ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Indice de preparation match</CardTitle>
            <CardDescription className="text-slate-400">
              Estimation non-medicale basee sur repos, dynamique recente et performance terrain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 rounded-md border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
              Regle de fiabilite: aucune estimation sommeil/psychologie n'est utilisee.
              Le score est calcule uniquement a partir de signaux match verifiables.
            </div>
            <div className="mb-3 rounded-md border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300">
              Inclus: repos, points recents, momentum, efficacite offensive, stabilite defensive.
              Exclu: sommeil, donnees psychologiques.
            </div>
            <div className="space-y-2">
              {(teamReadiness ?? []).slice(0, 6).map(team => (
                <div key={team.teamId} className="rounded-lg border border-slate-700 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{team.teamName}</p>
                      <p className="text-xs text-slate-400">
                        Repos: {team.restDays ?? "—"} j | Forme: {team.recentPoints} pts | Momentum: {team.momentum}
                      </p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                      {team.readinessScore}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="winner" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="winner" className="data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
              <Trophy className="w-4 h-4 mr-2" />
              Vainqueur probable
            </TabsTrigger>
            <TabsTrigger value="topscorer" className="data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
              <Zap className="w-4 h-4 mr-2" />
              Buteur probable
            </TabsTrigger>
            <TabsTrigger value="awards" className="data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
              <Star className="w-4 h-4 mr-2" />
              Distinctions
            </TabsTrigger>
            <TabsTrigger value="explorer" className="data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
              <Users className="w-4 h-4 mr-2" />
              Explorateur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="winner" className="mt-6 space-y-4">
            {winnerPredictions.map(pred => (
              <Card key={pred.rank} className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-amber-400">
                        {pred.rank === 1 && "🥇"}
                        {pred.rank === 2 && "🥈"}
                        {pred.rank === 3 && "🥉"}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{pred.teamName}</h3>
                        <p className="text-sm text-slate-400">{pred.teamCode}</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-lg px-4 py-2">
                      {pred.probability}%
                    </Badge>
                  </div>
                  <p className="text-slate-300">
                    Indice de performance: {pred.score.toFixed(2)}
                    {"elo" in pred ? ` • Elo: ${pred.elo}` : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="topscorer" className="mt-6 space-y-4">
            {topScorerPredictions.map(pred => (
              <Card key={pred.rank} className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-green-400">
                        {pred.rank === 1 && "🥇"}
                        {pred.rank === 2 && "🥈"}
                        {pred.rank === 3 && "🥉"}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{pred.playerName}</h3>
                        <p className="text-sm text-slate-400">{pred.teamCode} • {pred.currentGoals} buts • {pred.goalsPer90}/90</p>
                      </div>
                    </div>
                    <Badge className="bg-green-400/20 text-green-300 border-green-400/30 text-lg px-4 py-2">
                      {pred.confidence}%
                    </Badge>
                  </div>
                  <p className="text-slate-300">
                    Forme buteur observee: <span className="font-semibold text-white">{pred.currentGoals} buts</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="awards" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Meilleur defenseur (estimation)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-white font-bold">{bestDefenderPrediction?.name ?? "A definir"}</p>
                  <p className="text-slate-400 text-sm">{bestDefenderPrediction?.teamName ?? "—"} • {bestDefenderPrediction?.position ?? "—"}</p>
                  <p className="text-slate-300 mt-2">
                    Minutes: {bestDefenderPrediction?.minutesPlayed ?? 0} | Assists: {bestDefenderPrediction?.assists ?? 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-400" />
                    Meilleur joueur (estimation)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-white font-bold">{bestPlayerPrediction?.name ?? "A definir"}</p>
                  <p className="text-slate-400 text-sm">{bestPlayerPrediction?.teamName ?? "—"} • {bestPlayerPrediction?.position ?? "—"}</p>
                  <p className="text-slate-300 mt-2">
                    Buts: {bestPlayerPrediction?.goals ?? 0} | Passes: {bestPlayerPrediction?.assists ?? 0} | Minutes: {bestPlayerPrediction?.minutesPlayed ?? 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="explorer" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Filtre par equipe et par joueur</CardTitle>
                <CardDescription className="text-slate-400">
                Analyse detaillee des performances individuelles par equipe et par joueur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={selectedTeamId ?? ""}
                    onChange={e => {
                      const nextTeamId = e.target.value ? Number(e.target.value) : null;
                      setSelectedTeamId(nextTeamId);
                      setSelectedPlayerId(null);
                    }}
                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Toutes les equipes</option>
                    {(teams ?? []).map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedPlayerId ?? ""}
                    onChange={e => setSelectedPlayerId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Selectionner un joueur</option>
                    {playersByTeam.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} - {player.teamCode}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlayerStats ? (
                  <div className="rounded-lg border border-slate-700 p-4">
                    <p className="text-xl font-bold text-white">{selectedPlayerStats.name}</p>
                    <p className="text-slate-400">{selectedPlayerStats.teamName} • {selectedPlayerStats.position}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="rounded-md bg-slate-900 p-3">
                        <p className="text-xs text-slate-400">Buts</p>
                        <p className="text-lg font-semibold text-green-400">{selectedPlayerStats.goals}</p>
                      </div>
                      <div className="rounded-md bg-slate-900 p-3">
                        <p className="text-xs text-slate-400">Passes</p>
                        <p className="text-lg font-semibold text-blue-400">{selectedPlayerStats.assists}</p>
                      </div>
                      <div className="rounded-md bg-slate-900 p-3">
                        <p className="text-xs text-slate-400">Minutes</p>
                        <p className="text-lg font-semibold text-white">{selectedPlayerStats.minutesPlayed}</p>
                      </div>
                      <div className="rounded-md bg-slate-900 p-3">
                        <p className="text-xs text-slate-400">Perf index</p>
                        <p className="text-lg font-semibold text-amber-400">
                          {(selectedPlayerStats.goals * 4 + selectedPlayerStats.assists * 3 + selectedPlayerStats.minutesPlayed * 0.01).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Selectionne un joueur pour voir sa performance detaillee.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
