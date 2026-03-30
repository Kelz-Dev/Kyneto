-- Migration: Add storage tracking columns to providers table
-- Run this on the production PostgreSQL database

ALTER TABLE providers ADD COLUMN IF NOT EXISTS pledged_capacity_gb NUMERIC DEFAULT 0;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS used_gb NUMERIC DEFAULT 0;
