-- Fix the database linter warning: pin the search_path on the shared
-- updated_at trigger function so it can never resolve objects in an
-- attacker-controlled schema.
alter function public.set_updated_at() set search_path = '';
