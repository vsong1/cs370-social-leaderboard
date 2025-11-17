-- Migration: Add evidence_url column to match_result table
-- Run this if you already have the match_result table and need to add the evidence_url column

ALTER TABLE public.match_result 
ADD COLUMN IF NOT EXISTS evidence_url TEXT;

