import { useState } from "react";
import { Trophy } from "lucide-react";
import { TeamRegistrationForm } from "@/components/TeamRegistrationForm";
import { TeamsList } from "@/components/TeamsList";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTeamRegistered = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="gradient-hero py-8 md:py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-center text-primary-foreground tracking-wider">
            Registro de Equipos
          </h1>
          <p className="text-center text-primary-foreground/80 mt-3 text-lg md:text-xl max-w-2xl mx-auto">
            Sistema de inscripción para categorías masculina y femenina
          </p>
          <div className="flex justify-center gap-6 mt-6 text-primary-foreground/90">
            <div className="text-center">
              <span className="font-display text-3xl md:text-4xl">12</span>
              <p className="text-sm opacity-80">máx. hombres</p>
            </div>
            <div className="w-px bg-primary-foreground/30" />
            <div className="text-center">
              <span className="font-display text-3xl md:text-4xl">13</span>
              <p className="text-sm opacity-80">máx. mujeres</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <TeamRegistrationForm onTeamRegistered={handleTeamRegistered} />
          <TeamsList refreshTrigger={refreshTrigger} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Sistema de Registro de Equipos Deportivos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
