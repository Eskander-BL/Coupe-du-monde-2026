import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Zap, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Teams() {
  const [selectedConfederation, setSelectedConfederation] = useState<number | null>(null);

  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();
  const { data: confederations } = trpc.confederations.getAll.useQuery();

  const filteredTeams = selectedConfederation
    ? teams?.filter(t => t.confederationId === selectedConfederation)
    : teams;

  const getConfederationName = (id: number) => {
    return confederations?.find(c => c.id === id)?.name || "";
  };

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
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Teams</h1>
            <p className="text-sm text-slate-400">All 48 qualified teams</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Confederation Filter */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Filter by Confederation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedConfederation === null ? "default" : "outline"}
                onClick={() => setSelectedConfederation(null)}
                className={selectedConfederation === null ? "bg-amber-400 text-slate-900" : ""}
              >
                All Teams
              </Button>
              {confederations?.map(conf => (
                <Button
                  key={conf.id}
                  variant={selectedConfederation === conf.id ? "default" : "outline"}
                  onClick={() => setSelectedConfederation(conf.id)}
                  className={selectedConfederation === conf.id ? "bg-amber-400 text-slate-900" : ""}
                >
                  {conf.code}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        {teamsLoading ? (
          <div className="text-center text-slate-400">Loading teams...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams?.map(team => (
              <Link key={team.id} href={`/team/${team.id}`}>
                <Card className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                        <p className="text-xs text-slate-400 mt-1">{team.code}</p>
                      </div>
                      <Badge className={getGroupColor(team.groupId)}>
                        Group {team.groupId}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Confederation */}
                      <div className="text-xs text-slate-400">
                        {getConfederationName(team.confederationId)}
                      </div>

                      {/* Ratings */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Offensive
                          </span>
                          <span className={`font-semibold ${getRatingColor(Number(team.offensiveStrength))}`}>
                            {team.offensiveStrength || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Defensive
                          </span>
                          <span className={`font-semibold ${getRatingColor(Number(team.defensiveStrength))}`}>
                            {team.defensiveStrength || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <span className="text-sm font-semibold text-slate-300">Overall</span>
                          <span className={`text-lg font-bold ${getRatingColor(Number(team.overallRating))}`}>
                            {team.overallRating || "—"}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
