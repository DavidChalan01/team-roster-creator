-- Create players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view players
CREATE POLICY "Anyone can view players" 
ON public.players 
FOR SELECT 
USING (true);

-- Allow anyone to insert players
CREATE POLICY "Anyone can insert players" 
ON public.players 
FOR INSERT 
WITH CHECK (true);