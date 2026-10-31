create table if not exists public.shop_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.shop_admins enable row level security;

create or replace function public.is_shop_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shop_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_shop_admin() from public, anon;
grant execute on function public.is_shop_admin() to authenticated;

create table if not exists public.shop_state (
  id boolean primary key default true check (id),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references auth.users (id)
);

alter table public.shop_state enable row level security;

create or replace function public.get_shop_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_shop_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;

  return (select data from public.shop_state where id = true);
end;
$$;

create or replace function public.save_shop_state(payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_shop_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;

  if jsonb_typeof(payload) is distinct from 'object'
    or jsonb_typeof(payload -> 'products') is distinct from 'array'
    or jsonb_typeof(payload -> 'movements') is distinct from 'array'
    or jsonb_typeof(payload -> 'customers') is distinct from 'array'
    or jsonb_typeof(payload -> 'invoices') is distinct from 'array' then
    raise exception 'Format des données de boutique invalide' using errcode = '22023';
  end if;

  insert into public.shop_state (id, data, updated_by)
  values (true, payload, (select auth.uid()))
  on conflict (id) do update
  set data = excluded.data,
      updated_by = excluded.updated_by,
      updated_at = now();
end;
$$;

create or replace function public.get_public_products()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', product -> 'id',
        'name', product -> 'name',
        'category', product -> 'category',
        'sellPrice', product -> 'sellPrice',
        'stock', product -> 'stock',
        'minStock', product -> 'minStock',
        'image', product -> 'image',
        'description', product -> 'description',
        'createdAt', product -> 'createdAt'
      )
    ),
    '[]'::jsonb
  )
  from public.shop_state as s
  cross join lateral jsonb_array_elements(s.data -> 'products') as p(product)
  where s.id = true;
$$;

revoke all on function public.get_shop_state() from public, anon;
revoke all on function public.save_shop_state(jsonb) from public, anon;
revoke all on function public.get_public_products() from public;
grant execute on function public.get_shop_state() to authenticated;
grant execute on function public.save_shop_state(jsonb) to authenticated;
grant execute on function public.get_public_products() to anon, authenticated;
