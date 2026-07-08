import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar } from "lucide-react";
import { Link } from "wouter";

const STAGES = [
  { value: "group", label: "Group Stage" },
  { value: "round32", label: "Round of 32" },
  { value: "round16", label: "Round of 16" },
  { value: "quarterfinal", label: "Quarter-finals" },
  { value: "semifinal", label: "Semi-finals" },
  { value: "final", label: "Final" },
  { value: "thirdplace", label: "3rd Place" },
];

export default function Matches() {
  const [selectedStage, setSelectedStage] = useState("group");

  const { data: matches, isLoading } = trpc.matches.getByStage.useQuery({ stage: selectedStage });

  const getStageLabel = (stage: string) => {
    return STAGES.find(s => s.value === stage)?.label || stage;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      scheduled: { bg: "bg-slate-500/20 text-slate-300", text: "Scheduled" },
      live: { bg: "bg-red-500/20 text-red-300", text: "Live" },
      completed: { bg: "bg-green-500/20 text-green-300", text: "Completed" },
    };
    const badge = badges[status] || badges.scheduled;
    return <Badge className={badge.bg}>{badge.text}</Badge>;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            <h1 className="text-2xl font-bold text-white">Match Schedule</h1>
            <p className="text-sm text-slate-400">104 matches • June 11 - July 19, 2026</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stage Selector */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Select Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
              <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 bg-slate-700">
                {STAGES.map(stage => (
                  <TabsTrigger
                    key={stage.value}
                    value={stage.value}
                    className="text-xs md:text-sm data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900"
                  >
                    {stage.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Matches List */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">Loading matches...</div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="bg-slate-800 border-slate-700 hover:border-amber-400/50 transition-colors">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Match Number & Date */}
                    <div className="md:col-span-1">
                      <div className="text-xs text-slate-400">Match {match.matchNumber}</div>
                      <div className="text-sm font-semibold text-slate-300 mt-1">
                        {formatDate(match.matchDate)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{match.city}</div>
                    </div>

                    {/* Home Team */}
                    <div className="md:col-span-1 text-center">
                      <div className="font-semibold text-white">{String(match.homeTeamName)}</div>
                      <div className="text-xs text-slate-400">{String(match.homeTeamCode)}</div>
                    </div>

                    {/* Score */}
                    <div className="md:col-span-1 text-center">
                      {match.status === "completed" ? (
                        <div className="text-3xl font-bold text-amber-400">
                          {match.homeGoals} - {match.awayGoals}
                        </div>
                      ) : match.status === "live" ? (
                        <div className="text-2xl font-bold text-red-400">
                          {match.homeGoals} - {match.awayGoals}
                          <div className="text-xs text-red-300 mt-1">LIVE</div>
                        </div>
                      ) : (
                        <div className="text-slate-400">vs</div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="md:col-span-1 text-center">
                      <div className="font-semibold text-white">{String(match.awayTeamName)}</div>
                      <div className="text-xs text-slate-400">{String(match.awayTeamCode)}</div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-1 text-right">
                      {getStatusBadge(match.status)}
                    </div>
                  </div>

                  {/* Stadium Info */}
                  {match.stadium && (
                    <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {match.stadium}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center text-slate-400">
              No matches found for this stage.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
