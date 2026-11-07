-- ROLLBACK for 20261104000001_seasons.sql. Only run if it breaks something.
-- Destroys every season users have saved. Workouts are not affected (they are not linked).
begin;
drop table if exists public.seasons;
commit;
