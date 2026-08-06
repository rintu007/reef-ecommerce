-- Legacy-parity re-audit (2026-08-07): closes gaps found in the listing form,
-- location search, and consent-gate features. See project-legacy-parity-audit memory.

alter table listings add column photo_type text;
alter table listings add column latitude double precision;
alter table listings add column longitude double precision;

alter table profiles add column seller_agreed boolean not null default false;
alter table profiles add column eula_accepted boolean not null default false;

-- Haversine-distance search for local-pickup listings, used by the ZIP/GPS
-- radius filter on Browse. Distances in miles.
create or replace function nearby_listing_ids(p_lat double precision, p_lng double precision, p_radius_miles double precision)
returns table (id uuid, distance_miles double precision)
language sql stable as $$
  select id, distance_miles from (
    select id,
      (3958.8 * acos(
        least(1, greatest(-1,
          cos(radians(p_lat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(latitude))
        ))
      )) as distance_miles
    from listings
    where latitude is not null and longitude is not null
      and local_pickup = true
      and status = 'active'
  ) d
  where distance_miles <= p_radius_miles
  order by distance_miles asc;
$$;
