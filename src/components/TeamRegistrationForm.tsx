import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Category = "men" | "women";

const getFormSchema = (category: Category) =>
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getFormSchema(category)),
    defaultValues: {
      teamName: "",
      personInCharge: "",
      playerCount: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("teams").insert({
        team_name: data.teamName,
        person_in_charge: data.personInCharge,
        category: category,
        player_count: data.playerCount,
      });

      if (error) throw error;

      toast({
        title: "¡Equipo registrado!",
        description: `El equipo "${data.teamName}" ha sido registrado exitosamente.`,
      });

      reset();
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

  const maxPlayers = category === "men" ? 12 : 13;

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
        <Label className="text-sm font-medium text-foreground mb-3 block">
          Categoría
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCategory("men")}
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
            onClick={() => setCategory("women")}
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

        <div>
          <Label htmlFor="playerCount" className="text-sm font-medium text-foreground">
            Número de Jugadores
            <span className="text-muted-foreground font-normal ml-1">
              (máximo {maxPlayers})
            </span>
          </Label>
          <Input
            id="playerCount"
            type="number"
            min={1}
            max={maxPlayers}
            {...register("playerCount", { valueAsNumber: true })}
            placeholder={`1 - ${maxPlayers}`}
            className="mt-1.5"
          />
          {errors.playerCount && (
            <p className="text-sm text-destructive mt-1">{errors.playerCount.message}</p>
          )}
        </div>

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
              Registrar Equipo
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
