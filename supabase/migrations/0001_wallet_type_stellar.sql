-- Migration: switch wallet_type values from Solana wallets to Stellar wallets.
--
-- The app moved from Solana (Phantom/Solflare) to Stellar (Freighter/Albedo/
-- xBull/Lobstr). Apply this to any already-provisioned database so the
-- wallet_connections CHECK constraint accepts the new wallet_type values.
-- `schema.sql` already reflects the final state for fresh databases.

alter table public.wallet_connections
  drop constraint if exists wallet_connections_wallet_type_check;

-- Re-map any legacy rows to 'other' so the new constraint can be added.
update public.wallet_connections
  set wallet_type = 'other'
  where wallet_type not in ('freighter', 'albedo', 'xbull', 'lobstr', 'other');

alter table public.wallet_connections
  add constraint wallet_connections_wallet_type_check
  check (wallet_type in ('freighter', 'albedo', 'xbull', 'lobstr', 'other'));

-- Update the signup trigger to recognise the new Stellar wallet email domain
-- (@wallet.xlm) so wallet accounts are still routed to /register with a null
-- username. Wallet auth previously used @wallet.sol.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    case
      when new.email like '%@wallet.xlm' then null
      else coalesce(new.raw_user_meta_data->>'username', null)
    end,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
