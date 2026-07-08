import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy } from "lucide-react";
import { Link } from "wouter";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function Standings() {
  const [selectedGroup, setSelectedGroup] = useState("A");

  const { data: standings, isLoading } = trpc.standings.getGroup.useQuery({ groupId: selectedGroup });

  const getGroupColor = (group: string) => {
    const colors: Record<string, string> = {
      A: "bg-red-500/20 text-red-300 border-red-500/30",
      B: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      C: "bg-green-500/20 text-green-300 border-green-500/30",
      D: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      E: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      F: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      G: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      H: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      I: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      J: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      K: "bg-lime-500/20 text-lime-300 border-lime-500/30",
      L: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    };
    return colors[group] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const getGoalDifference = (gf: number, ga: number) => {
    const diff = gf - ga;
    if (diff > 0) return <span className="text-green-400">+{diff}</span>;
    if (diff < 0) return <span className="text-red-400">{diff}</span>;
    return <span className="text-slate-400">0</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Group Standings</h1>
            <p className="text-sm text-slate-400">12 groups • Points, wins, losses, and goal differences</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Group Selector */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Select Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {GROUPS.map(group => (
                <Button
                  key={group}
                  variant={selectedGroup === group ? "default" : "outline"}
                  onClick={() => setSelectedGroup(group)}
                  className={`${
                    selectedGroup === group
                      ? "bg-amber-400 text-slate-900 font-bold"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {group}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Group Standings Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  Group {selectedGroup}
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">Points, wins, losses, and goal differences</p>
              </div>
              <Badge className={getGroupColor(selectedGroup)}>
                Group {selectedGroup}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-slate-400 py-8">Loading standings...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-300">Pos</TableHead>
                      <TableHead className="text-slate-300">Team</TableHead>
                      <TableHead className="text-center text-slate-300">P</TableHead>
                      <TableHead className="text-center text-slate-300">W</TableHead>
                      <TableHead className="text-center text-slate-300">D</TableHead>
                      <TableHead className="text-center text-slate-300">L</TableHead>
                      <TableHead className="text-center text-slate-300">GF</TableHead>
                      <TableHead className="text-center text-slate-300">GA</TableHead>
                      <TableHead className="text-center text-slate-300">GD</TableHead>
                      <TableHead className="text-center text-slate-300 font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings?.map((standing, index) => (
                      <TableRow key={standing.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="font-bold text-amber-400">{index + 1}</TableCell>
                        <TableCell className="font-semibold text-white">
                          {standing.teamName}
                          <span className="text-xs text-slate-400 ml-2">({standing.teamCode})</span>
                        </TableCell>
                        <TableCell className="text-center text-slate-300">
                          {standing.wins + standing.draws + standing.losses}
                        </TableCell>
                        <TableCell className="text-center text-green-400">{standing.wins}</TableCell>
                        <TableCell className="text-center text-yellow-400">{standing.draws}</TableCell>
                        <TableCell className="text-center text-red-400">{standing.losses}</TableCell>
                        <TableCell className="text-center text-slate-300">{standing.goalsFor}</TableCell>
                        <TableCell className="text-center text-slate-300">{standing.goalsAgainst}</TableCell>
                        <TableCell className="text-center">
                          {getGoalDifference(standing.goalsFor, standing.goalsAgainst)}
                        </TableCell>
                        <TableCell className="text-center font-bold text-amber-400 text-lg">
                          {standing.points}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-slate-400">P</span>
                <p className="text-slate-300">Played</p>
              </div>
              <div>
                <span className="text-green-400">W</span>
                <p className="text-slate-300">Wins</p>
              </div>
              <div>
                <span className="text-yellow-400">D</span>
                <p className="text-slate-300">Draws</p>
              </div>
              <div>
                <span className="text-red-400">L</span>
                <p className="text-slate-300">Losses</p>
              </div>
              <div>
                <span className="text-amber-400">Pts</span>
                <p className="text-slate-300">Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
