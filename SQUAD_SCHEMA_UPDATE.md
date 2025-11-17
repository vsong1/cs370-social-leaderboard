-- ============================================================
-- SQUAD TABLE SCHEMA UPDATE on 11/16/2025
-- ============================================================

-- Add missing fields to squad table
ALTER TABLE public.squad 
ADD COLUMN IF NOT EXISTS game_title TEXT,
ADD COLUMN IF NOT EXISTS skill_tier TEXT,
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public'));

-- Add index on invite_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_squad_invite_code ON public.squad(invite_code);

-- Add comment for documentation
COMMENT ON COLUMN public.squad.game_title IS 'Primary game for this squad';
COMMENT ON COLUMN public.squad.skill_tier IS 'Skill level tier (e.g., Immortal, Grandmaster)';
COMMENT ON COLUMN public.squad.invite_code IS 'Unique invite code for joining private squads';
COMMENT ON COLUMN public.squad.visibility IS 'Squad visibility: private or public';

