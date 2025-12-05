-- Fix RLS policy for squad_chat_room table
-- This allows squad members to create chat rooms for their squads

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Squad members can create chat rooms" ON squad_chat_room;
DROP POLICY IF EXISTS "Squad members can view chat rooms" ON squad_chat_room;

-- Enable RLS on squad_chat_room if not already enabled
ALTER TABLE squad_chat_room ENABLE ROW LEVEL SECURITY;

-- Policy: Squad members can view chat rooms for squads they belong to
CREATE POLICY "Squad members can view chat rooms"
ON squad_chat_room
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM squad_membership
        WHERE squad_membership.squad_id = squad_chat_room.squad_id
        AND squad_membership.user_id = auth.uid()
    )
);

-- Policy: Squad members can create chat rooms for squads they belong to
CREATE POLICY "Squad members can create chat rooms"
ON squad_chat_room
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM squad_membership
        WHERE squad_membership.squad_id = squad_chat_room.squad_id
        AND squad_membership.user_id = auth.uid()
    )
);

