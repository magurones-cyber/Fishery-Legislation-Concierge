-- 00_enable_extensions.sql
-- Supabase SQL Editorで最初に実行します。

create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;
