import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserCheck, Trophy, Plus, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Category = "men" | "women";

const getFormSchema = (category: Category, playerCount: number) =>
  z.object({
    teamName: z.string().min(2, "El nombre del equipo debe tener al menos 2 caracteres").max(100),
    personInCharge: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
    playerCount: z
      .number({ invalid_type_error: "Ingrese un número válido" })
      .min(1, "Mínimo 1 jugador")
      .max(category === "men" ? 12 : 13, `Máximo ${category === "men" ? 12 : 13} jugadores`),
  });

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

interface TeamRegistrationFormProps {
  onTeamRegistered: () => void;
}

export function TeamRegistrationForm({ onTeamRegistered }: TeamRegistrationFormProps) {
  const [category, setCategory] = useState<Category>("men");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>([""]);

  const maxPlayers = category === "men" ? 12 : 13;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getFormSchema(category, playerNames.length)),
    defaultValues: {
      teamName: "",
      personInCharge: "",
      playerCount: 1,
    },
  });

  const handleAddPlayer = () => {
    if (playerNames.length < maxPlayers) {
      setPlayerNames([...playerNames, ""]);
      setValue("playerCount", playerNames.length + 1);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length > 1) {
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);
      setValue("playerCount", newNames.length);
    }
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const onSubmit = async (data: FormData) => {
    // Validate all player names are filled
    const filledNames = playerNames.filter((name) => name.trim() !== "");
    if (filledNames.length !== playerNames.length) {
      toast({
        title: "Error",
        description: "Por favor ingrese el nombre de todos los jugadores.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert team first
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          team_name: data.teamName,
          person_in_charge: data.personInCharge,
          category: category,
          player_count: playerNames.length,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Insert all players
      const playersToInsert = playerNames.map((name) => ({
        team_id: teamData.id,
        player_name: name.trim(),
      }));

      const { error: playersError } = await supabase.from("players").insert(playersToInsert);

      if (playersError) throw playersError;

      toast({
        title: "¡Equipo registrado!",
        description: `El equipo "${data.teamName}" con ${playerNames.length} jugadores ha sido registrado.`,
      });

      reset();
      setPlayerNames([""]);
      onTeamRegistered();
    } catch (error) {
      console.error("Error registering team:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el equipo. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    const newMax = newCategory === "men" ? 12 : 13;
    if (playerNames.length > newMax) {
      setPlayerNames(playerNames.slice(0, newMax));
      setValue("playerCount", newMax);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
          <Trophy className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide text-foreground">
            Registrar Equipo
          </h2>
          <p className="text-sm text-muted-foreground">Complete los datos del equipo</p>
        </div>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-foreground mb-3 block">Categoría</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleCategoryChange("men")}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              category === "men"
                ? "border-men bg-men-light text-men"
                : "border-border bg-background text-muted-foreground hover:border-men/50"
            )}
          >
            <Users className="w-5 h-5" />
            <span className="font-semibold">Hombres</span>
            <span className="text-xs opacity-75">(máx. 12)</span>
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange("women")}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              category === "women"
                ? "border-women bg-women-light text-women"
                : "border-border bg-background text-muted-foreground hover:border-women/50"
            )}
          >
            <Users className="w-5 h-5" />
            <span className="font-semibold">Mujeres</span>
            <span className="text-xs opacity-75">(máx. 13)</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="teamName" className="text-sm font-medium text-foreground">
            Nombre del Equipo
          </Label>
          <Input
            id="teamName"
            {...register("teamName")}
            placeholder="Ej: Los Campeones FC"
            className="mt-1.5"
          />
          {errors.teamName && (
            <p className="text-sm text-destructive mt-1">{errors.teamName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="personInCharge" className="text-sm font-medium text-foreground">
            Persona a Cargo
          </Label>
          <Input
            id="personInCharge"
            {...register("personInCharge")}
            placeholder="Ej: Juan Pérez"
            className="mt-1.5"
          />
          {errors.personInCharge && (
            <p className="text-sm text-destructive mt-1">{errors.personInCharge.message}</p>
          )}
        </div>

        {/* Players List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-foreground">
              Jugadores ({playerNames.length}/{maxPlayers})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPlayer}
              disabled={playerNames.length >= maxPlayers}
              className="h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agregar
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {playerNames.map((name, index) => (
              <div key={index} className="flex items-center gap-2 animate-scale-in">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <Input
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  placeholder={`Nombre del jugador ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePlayer(index)}
                  disabled={playerNames.length <= 1}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <input type="hidden" {...register("playerCount", { valueAsNumber: true })} />

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full h-12 text-base font-semibold transition-all duration-200",
            category === "men" ? "gradient-men hover:opacity-90" : "gradient-women hover:opacity-90"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Registrando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Registrar Equipo ({playerNames.length} jugadores)
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
