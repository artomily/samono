-- Migration: switch wallet_type values from Stellar wallets to BNB Chain (EVM) wallets.
--
-- The app moved from Stellar (Freighter/Albedo/xBull/Lobstr) to BNB Smart Chain
-- (MetaMask/Binance Web3 Wallet/Trust/OKX). `schema.sql` already reflects the
-- final state for fresh databases.

alter table public.wallet_connections
  drop constraint if exists wallet_connections_wallet_type_check;

update public.wallet_connections
  set wallet_type = 'other'
  where wallet_type not in ('metamask', 'binance', 'trust', 'okx', 'other');

alter table public.wallet_connections
  add constraint wallet_connections_wallet_type_check
  check (wallet_type in ('metamask', 'binance', 'trust', 'okx', 'other'));

-- Wallet auth now uses the @wallet.bnb email domain.
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
      when new.email like '%@wallet.bnb' then null
      else coalesce(new.raw_user_meta_data->>'username', null)
    end,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
