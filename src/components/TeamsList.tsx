import { useEffect, useState } from "react";
import { Users, User, Calendar, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface TeamWithPlayers extends Team {
  players: Player[];
}

interface TeamsListProps {
  refreshTrigger: number;
}

export function TeamsList({ refreshTrigger }: TeamsListProps) {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "men" | "women">("all");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (teamsError) throw teamsError;

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .order("created_at", { ascending: true });

      if (playersError) throw playersError;

      const teamsWithPlayers: TeamWithPlayers[] = (teamsData || []).map((team) => ({
        ...team,
        players: (playersData || []).filter((player) => player.team_id === team.id),
      }));

      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [refreshTrigger]);

  const filteredTeams = teams.filter((team) => {
    if (filter === "all") return true;
    return team.category === filter;
  });

  const menCount = teams.filter((t) => t.category === "men").length;
  const womenCount = teams.filter((t) => t.category === "women").length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toggleExpanded = (teamId: string) => {
    setExpandedTeams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
          <Trophy className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide text-foreground">
            Equipos Registrados
          </h2>
          <p className="text-sm text-muted-foreground">
            {teams.length} equipo{teams.length !== 1 ? "s" : ""} en total
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-men-light rounded-xl p-4 border border-men/20">
          <div className="flex items-center gap-2 text-men mb-1">
            <Users className="w-4 h-4" />
            <span className="font-semibold text-sm">Hombres</span>
          </div>
          <p className="font-display text-3xl text-men">{menCount}</p>
        </div>
        <div className="bg-women-light rounded-xl p-4 border border-women/20">
          <div className="flex items-center gap-2 text-women mb-1">
            <Users className="w-4 h-4" />
            <span className="font-semibold text-sm">Mujeres</span>
          </div>
          <p className="font-display text-3xl text-women">{womenCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all", label: "Todos" },
          { value: "men", label: "Hombres" },
          { value: "women", label: "Mujeres" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as typeof filter)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Teams List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No hay equipos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team, index) => {
            const isExpanded = expandedTeams.has(team.id);
            return (
              <div
                key={team.id}
                className={cn(
                  "rounded-xl border-2 transition-all duration-200 overflow-hidden animate-scale-in",
                  team.category === "men"
                    ? "border-men/20 bg-men-light/50 hover:border-men/40"
                    : "border-women/20 bg-women-light/50 hover:border-women/40"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpanded(team.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                            team.category === "men"
                              ? "bg-men text-primary-foreground"
                              : "bg-women text-primary-foreground"
                          )}
                        >
                          {team.category === "men" ? "Hombres" : "Mujeres"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{team.team_name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {team.person_in_charge}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(team.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex flex-col items-center justify-center px-4 py-2 rounded-xl",
                          team.category === "men" ? "bg-men/10" : "bg-women/10"
                        )}
                      >
                        <span
                          className={cn(
                            "font-display text-2xl",
                            team.category === "men" ? "text-men" : "text-women"
                          )}
                        >
                          {team.player_count}
                        </span>
                        <span className="text-xs text-muted-foreground">jugadores</span>
                      </div>
                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Players List */}
                {isExpanded && team.players.length > 0 && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-2">
                      Lista de Jugadores
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {team.players.map((player, playerIndex) => (
                        <div
                          key={player.id}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg",
                            team.category === "men" ? "bg-men/5" : "bg-women/5"
                          )}
                        >
                          <span
                            className={cn(
                              "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                              team.category === "men"
                                ? "bg-men/20 text-men"
                                : "bg-women/20 text-women"
                            )}
                          >
                            {playerIndex + 1}
                          </span>
                          <span className="text-sm text-foreground truncate">
                            {player.player_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
