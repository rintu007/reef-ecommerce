-- Extensions used across the schema.
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive text (promo codes, emails)
