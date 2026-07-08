import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Award, Zap, Target } from "lucide-react";
import { Link } from "wouter";

export default function Stats() {
  const [activeTab, setActiveTab] = useState("scorers");

  const { data: topScorers, isLoading: scorersLoading } = trpc.players.getTopScorers.useQuery({ limit: 30 });
  const { data: topAssisters, isLoading: assistersLoading } = trpc.players.getTopAssisters.useQuery({ limit: 30 });

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
            <h1 className="text-2xl font-bold text-white">Player Statistics</h1>
            <p className="text-sm text-slate-400">Top scorers and assists</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger value="scorers" className="data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
              <Zap className="w-4 h-4 mr-2" />
              Top Scorers
            </TabsTrigger>
            <TabsTrigger value="assists" className="data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900">
              <Target className="w-4 h-4 mr-2" />
              Top Assists
            </TabsTrigger>
          </TabsList>

          {/* Top Scorers Tab */}
          <TabsContent value="scorers" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Top Scorers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scorersLoading ? (
                  <div className="text-center text-slate-400 py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-transparent">
                          <TableHead className="text-slate-300">Rank</TableHead>
                          <TableHead className="text-slate-300">Player</TableHead>
                          <TableHead className="text-slate-300">Team</TableHead>
                          <TableHead className="text-center text-slate-300">Pos</TableHead>
                          <TableHead className="text-center text-slate-300 font-bold">Goals</TableHead>
                          <TableHead className="text-center text-slate-300">Assists</TableHead>
                          <TableHead className="text-center text-slate-300">Minutes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topScorers?.map((player, index) => (
                          <TableRow key={player.id} className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell className="font-bold text-amber-400 text-lg">
                              {index + 1}
                              {index === 0 && " 🥇"}
                              {index === 1 && " 🥈"}
                              {index === 2 && " 🥉"}
                            </TableCell>
                            <TableCell className="font-semibold text-white">{player.name}</TableCell>
                            <TableCell className="text-slate-300">
                              {player.teamCode}
                            </TableCell>
                            <TableCell className="text-center text-slate-400 text-sm">
                              {player.position}
                            </TableCell>
                            <TableCell className="text-center font-bold text-green-400 text-lg">
                              {player.goals}
                            </TableCell>
                            <TableCell className="text-center text-blue-400">
                              {player.assists}
                            </TableCell>
                            <TableCell className="text-center text-slate-400">
                              {player.minutesPlayed}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Assists Tab */}
          <TabsContent value="assists" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  Top Assists
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assistersLoading ? (
                  <div className="text-center text-slate-400 py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-transparent">
                          <TableHead className="text-slate-300">Rank</TableHead>
                          <TableHead className="text-slate-300">Player</TableHead>
                          <TableHead className="text-slate-300">Team</TableHead>
                          <TableHead className="text-center text-slate-300">Pos</TableHead>
                          <TableHead className="text-center text-slate-300 font-bold">Assists</TableHead>
                          <TableHead className="text-center text-slate-300">Goals</TableHead>
                          <TableHead className="text-center text-slate-300">Minutes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topAssisters?.map((player, index) => (
                          <TableRow key={player.id} className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell className="font-bold text-blue-400 text-lg">
                              {index + 1}
                              {index === 0 && " 🥇"}
                              {index === 1 && " 🥈"}
                              {index === 2 && " 🥉"}
                            </TableCell>
                            <TableCell className="font-semibold text-white">{player.name}</TableCell>
                            <TableCell className="text-slate-300">
                              {player.teamCode}
                            </TableCell>
                            <TableCell className="text-center text-slate-400 text-sm">
                              {player.position}
                            </TableCell>
                            <TableCell className="text-center font-bold text-blue-400 text-lg">
                              {player.assists}
                            </TableCell>
                            <TableCell className="text-center text-green-400">
                              {player.goals}
                            </TableCell>
                            <TableCell className="text-center text-slate-400">
                              {player.minutesPlayed}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
