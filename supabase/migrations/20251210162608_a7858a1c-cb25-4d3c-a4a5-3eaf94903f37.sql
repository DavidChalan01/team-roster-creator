-- Create enum for team categories
CREATE TYPE public.team_category AS ENUM ('men', 'women');

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  person_in_charge TEXT NOT NULL,
  category team_category NOT NULL,
  player_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint to ensure player counts are within limits
  CONSTRAINT valid_player_count CHECK (
    (category = 'men' AND player_count >= 1 AND player_count <= 12) OR
    (category = 'women' AND player_count >= 1 AND player_count <= 13)
  )
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view teams
CREATE POLICY "Anyone can view teams" 
ON public.teams 
FOR SELECT 
USING (true);

-- Allow anyone to insert teams
CREATE POLICY "Anyone can insert teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (true);