-- Update app_role enum to include superadmin
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';