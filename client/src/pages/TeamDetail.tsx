import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Zap, Shield, Trophy } from "lucide-react";
import { Link } from "wouter";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id || "0");

  const { data: team, isLoading: teamLoading } = trpc.teams.getById.useQuery({ id: teamId });
  const { data: standings } = trpc.standings.getAll.useQuery();
  const { data: players } = trpc.players.getByTeam.useQuery({ teamId });

  // Find the standing for this team
  const standing = standings?.find(s => s.teamId === teamId);

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading team details...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/teams">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Team Not Found</h1>
            </div>
          </div>
        </header>
      </div>
    );
  }

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "text-slate-400";
    if (rating >= 8) return "text-green-400";
    if (rating >= 7) return "text-blue-400";
    if (rating >= 6) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/teams">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            <p className="text-sm text-slate-400">{team.code}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Offensive Strength */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Offensive Strength
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getRatingColor(Number(team.offensiveStrength))}`}>
                {team.offensiveStrength || "—"}
              </div>
              <p className="text-xs text-slate-400 mt-2">Out of 10</p>
            </CardContent>
          </Card>

          {/* Defensive Strength */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Defensive Strength
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getRatingColor(Number(team.defensiveStrength))}`}>
                {team.defensiveStrength || "—"}
              </div>
              <p className="text-xs text-slate-400 mt-2">Out of 10</p>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Overall Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getRatingColor(Number(team.overallRating))}`}>
                {team.overallRating || "—"}
              </div>
              <p className="text-xs text-slate-400 mt-2">Out of 10</p>
            </CardContent>
          </Card>
        </div>

        {/* Group Standing */}
        {standing && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Group {team.groupId} Standing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Played</p>
                  <p className="text-2xl font-bold text-white">{standing.wins + standing.draws + standing.losses}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Wins</p>
                  <p className="text-2xl font-bold text-green-400">{standing.wins}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Draws</p>
                  <p className="text-2xl font-bold text-yellow-400">{standing.draws}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Losses</p>
                  <p className="text-2xl font-bold text-red-400">{standing.losses}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Points</p>
                  <p className="text-2xl font-bold text-amber-400">{standing.points}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Goals For</p>
                  <p className="text-xl font-bold text-slate-300">{standing.goalsFor}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Goals Against</p>
                  <p className="text-xl font-bold text-slate-300">{standing.goalsAgainst}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Goal Difference</p>
                  <p className={`text-xl font-bold ${standing.goalsFor - standing.goalsAgainst > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {standing.goalsFor - standing.goalsAgainst > 0 ? '+' : ''}{standing.goalsFor - standing.goalsAgainst}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Squad */}
        {players && players.length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Squad ({players.length} players)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-center text-slate-300">Number</TableHead>
                      <TableHead className="text-center text-slate-300">Position</TableHead>
                      <TableHead className="text-center text-slate-300">Goals</TableHead>
                      <TableHead className="text-center text-slate-300">Assists</TableHead>
                      <TableHead className="text-center text-slate-300">Minutes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="font-semibold text-white">{player.name}</TableCell>
                        <TableCell className="text-center text-slate-300">{player.number}</TableCell>
                        <TableCell className="text-center text-slate-400 text-sm">{player.position}</TableCell>
                        <TableCell className="text-center text-green-400 font-semibold">{player.goals}</TableCell>
                        <TableCell className="text-center text-blue-400 font-semibold">{player.assists}</TableCell>
                        <TableCell className="text-center text-slate-400">{player.minutesPlayed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
