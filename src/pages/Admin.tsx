import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  LogOut,
  Users,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  User,
  ArrowLeft,
  RefreshCw,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

interface TeamWithPlayers extends Team {
  players: Player[];
}

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ teamName?: string; personInCharge?: string; playerName?: string }>({});
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: "team" | "player"; id: string; name: string }>({
    open: false,
    type: "team",
    id: "",
    name: "",
  });

  // New team dialog
  const [newTeamDialog, setNewTeamDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({
    teamName: "",
    personInCharge: "",
    category: "men" as "men" | "women",
  });

  // Add player dialog
  const [addPlayerDialog, setAddPlayerDialog] = useState<{ open: boolean; teamId: string; teamName: string }>({
    open: false,
    teamId: "",
    teamName: "",
  });
  const [newPlayerName, setNewPlayerName] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin-login");
    }
  }, [user, isAdmin, loading, navigate]);

  const fetchTeams = async () => {
    setLoadingTeams(true);
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
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos.",
        variant: "destructive",
      });
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTeams();
    }
  }, [isAdmin]);

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

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team.id);
    setEditValues({ teamName: team.team_name, personInCharge: team.person_in_charge });
  };

  const handleSaveTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from("teams")
        .update({
          team_name: editValues.teamName,
          person_in_charge: editValues.personInCharge,
        })
        .eq("id", teamId);

      if (error) throw error;

      toast({
        title: "Equipo actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
      setEditingTeam(null);
      fetchTeams();
    } catch (error) {
      console.error("Error updating team:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el equipo.",
        variant: "destructive",
      });
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player.id);
    setEditValues({ playerName: player.player_name });
  };

  const handleSavePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("players")
        .update({ player_name: editValues.playerName })
        .eq("id", playerId);

      if (error) throw error;

      toast({
        title: "Jugador actualizado",
        description: "El nombre se ha actualizado correctamente.",
      });
      setEditingPlayer(null);
      fetchTeams();
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el jugador.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const { error } = await supabase.from("teams").delete().eq("id", deleteDialog.id);

      if (error) throw error;

      toast({
        title: "Equipo eliminado",
        description: `El equipo "${deleteDialog.name}" ha sido eliminado.`,
      });
      setDeleteDialog({ open: false, type: "team", id: "", name: "" });
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el equipo.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlayer = async () => {
    try {
      const { error } = await supabase.from("players").delete().eq("id", deleteDialog.id);

      if (error) throw error;

      toast({
        title: "Jugador eliminado",
        description: `El jugador "${deleteDialog.name}" ha sido eliminado.`,
      });
      setDeleteDialog({ open: false, type: "player", id: "", name: "" });
      fetchTeams();
    } catch (error) {
      console.error("Error deleting player:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el jugador.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.teamName.trim() || !newTeam.personInCharge.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("teams").insert({
        team_name: newTeam.teamName.trim(),
        person_in_charge: newTeam.personInCharge.trim(),
        category: newTeam.category,
        player_count: 0,
      });

      if (error) throw error;

      toast({
        title: "Equipo creado",
        description: `El equipo "${newTeam.teamName}" ha sido creado exitosamente.`,
      });
      setNewTeamDialog(false);
      setNewTeam({ teamName: "", personInCharge: "", category: "men" });
      fetchTeams();
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el equipo.",
        variant: "destructive",
      });
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el nombre del jugador.",
        variant: "destructive",
      });
      return;
    }

    const team = teams.find((t) => t.id === addPlayerDialog.teamId);
    if (!team) return;

    // Validar que no exceda el límite de jugadores
    if (team.player_count >= 6) {
      toast({
        title: "Límite alcanzado",
        description: "Este equipo ya tiene el máximo de 6 jugadores.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: insertError } = await supabase.from("players").insert({
        team_id: addPlayerDialog.teamId,
        player_name: newPlayerName.trim(),
      });

      if (insertError) throw insertError;

      // Actualizar el contador de jugadores
      const { error: updateError } = await supabase
        .from("teams")
        .update({ player_count: team.player_count + 1 })
        .eq("id", addPlayerDialog.teamId);

      if (updateError) throw updateError;

      toast({
        title: "Jugador agregado",
        description: `${newPlayerName} ha sido agregado al equipo.`,
      });
      setAddPlayerDialog({ open: false, teamId: "", teamName: "" });
      setNewPlayerName("");
      fetchTeams();
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el jugador.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl tracking-wide text-foreground">
                  Panel de Administración
                </h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ver Sitio
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-foreground">Equipos Registrados</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchTeams} disabled={loadingTeams}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loadingTeams && "animate-spin")} />
              Actualizar
            </Button>
            <Button onClick={() => setNewTeamDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Equipo
            </Button>
          </div>
        </div>

        {loadingTeams ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No hay equipos registrados</p>
            <Button onClick={() => setNewTeamDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer equipo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => {
              const isExpanded = expandedTeams.has(team.id);
              const isEditingThis = editingTeam === team.id;
              const canAddPlayers = team.player_count < 6;

              return (
                <div
                  key={team.id}
                  className={cn(
                    "bg-card rounded-xl border-2 overflow-hidden transition-all duration-200",
                    team.category === "men"
                      ? "border-men/20 hover:border-men/40"
                      : "border-women/20 hover:border-women/40"
                  )}
                >
                  {/* Team Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                          <span className="text-xs text-muted-foreground">
                            {team.player_count} / 6 jugadores
                          </span>
                        </div>

                        {isEditingThis ? (
                          <div className="space-y-2">
                            <Input
                              value={editValues.teamName}
                              onChange={(e) =>
                                setEditValues({ ...editValues, teamName: e.target.value })
                              }
                              placeholder="Nombre del equipo"
                              className="h-9"
                            />
                            <Input
                              value={editValues.personInCharge}
                              onChange={(e) =>
                                setEditValues({ ...editValues, personInCharge: e.target.value })
                              }
                              placeholder="Persona a cargo"
                              className="h-9"
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-foreground">{team.team_name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <User className="w-3.5 h-3.5" />
                              {team.person_in_charge}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditingThis ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-primary"
                              onClick={() => handleSaveTeam(team.id)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingTeam(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {canAddPlayers && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() =>
                                  setAddPlayerDialog({
                                    open: true,
                                    teamId: team.id,
                                    teamName: team.team_name,
                                  })
                                }
                                title="Agregar jugador"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEditTeam(team)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  type: "team",
                                  id: team.id,
                                  name: team.team_name,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => toggleExpanded(team.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Players List */}
                  {isExpanded && team.players.length > 0 && (
                    <div className="px-4 pb-4 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-2">
                        Jugadores
                      </p>
                      <div className="space-y-2">
                        {team.players.map((player, index) => {
                          const isEditingThisPlayer = editingPlayer === player.id;

                          return (
                            <div
                              key={player.id}
                              className={cn(
                                "flex items-center justify-between gap-2 px-3 py-2 rounded-lg",
                                team.category === "men" ? "bg-men/5" : "bg-women/5"
                              )}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span
                                  className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0",
                                    team.category === "men"
                                      ? "bg-men/20 text-men"
                                      : "bg-women/20 text-women"
                                  )}
                                >
                                  {index + 1}
                                </span>
                                {isEditingThisPlayer ? (
                                  <Input
                                    value={editValues.playerName}
                                    onChange={(e) =>
                                      setEditValues({ ...editValues, playerName: e.target.value })
                                    }
                                    className="h-8 flex-1"
                                  />
                                ) : (
                                  <span className="text-sm text-foreground truncate">
                                    {player.player_name}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {isEditingThisPlayer ? (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-primary"
                                      onClick={() => handleSavePlayer(player.id)}
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => setEditingPlayer(null)}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                                      onClick={() => handleEditPlayer(player)}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        setDeleteDialog({
                                          open: true,
                                          type: "player",
                                          id: player.id,
                                          name: player.player_name,
                                        })
                                      }
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === "team"
                ? `Esto eliminará el equipo "${deleteDialog.name}" y todos sus jugadores. Esta acción no se puede deshacer.`
                : `Esto eliminará al jugador "${deleteDialog.name}". Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.type === "team" ? handleDeleteTeam : handleDeletePlayer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Team Dialog */}
      <Dialog open={newTeamDialog} onOpenChange={setNewTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Equipo</DialogTitle>
            <DialogDescription>
              Ingresa los datos del equipo que deseas crear.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Equipo</label>
              <Input
                placeholder="Ej: Los Tigres"
                value={newTeam.teamName}
                onChange={(e) => setNewTeam({ ...newTeam, teamName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Persona a Cargo</label>
              <Input
                placeholder="Ej: Juan Pérez"
                value={newTeam.personInCharge}
                onChange={(e) => setNewTeam({ ...newTeam, personInCharge: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select
                value={newTeam.category}
                onValueChange={(value: "men" | "women") =>
                  setNewTeam({ ...newTeam, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Hombres</SelectItem>
                  <SelectItem value="women">Mujeres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTeamDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTeam}>Crear Equipo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog
        open={addPlayerDialog.open}
        onOpenChange={(open) => setAddPlayerDialog({ ...addPlayerDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Jugador</DialogTitle>
            <DialogDescription>
              Agregar un nuevo jugador al equipo "{addPlayerDialog.teamName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Jugador</label>
              <Input
                placeholder="Ej: Carlos Rodríguez"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddPlayer();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddPlayerDialog({ open: false, teamId: "", teamName: "" });
                setNewPlayerName("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddPlayer}>Agregar Jugador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}