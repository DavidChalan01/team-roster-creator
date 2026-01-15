-- Create app_role enum (if not exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Add admin policies to teams (drop first if exists)
DROP POLICY IF EXISTS "Admins can update teams" ON public.teams;
CREATE POLICY "Admins can update teams"
ON public.teams FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;
CREATE POLICY "Admins can delete teams"
ON public.teams FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policies to players (drop first if exists)
DROP POLICY IF EXISTS "Admins can update players" ON public.players;
CREATE POLICY "Admins can update players"
ON public.players FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete players" ON public.players;
CREATE POLICY "Admins can delete players"
ON public.players FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));