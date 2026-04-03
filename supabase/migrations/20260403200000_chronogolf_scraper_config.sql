-- Populate scraper_config for all Chronogolf courses so the server
-- doesn't need to fetch the club page for metadata.

UPDATE public.courses SET scraper_config = '{"club_id": 14158, "affiliation_type_id": 57454}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/bonneville-golf-course%';

UPDATE public.courses SET scraper_config = '{"club_id": 14180, "affiliation_type_id": 57542}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/forest-dale-golf-course%';

UPDATE public.courses SET scraper_config = '{"club_id": 14185, "affiliation_type_id": 57562}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/glendale-golf-course%';

UPDATE public.courses SET scraper_config = '{"club_id": 14203, "affiliation_type_id": 57634}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/mountain-dell-golf-course%';

UPDATE public.courses SET scraper_config = '{"club_id": 14207, "affiliation_type_id": 57650}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/nibley-park-golf-course%';

UPDATE public.courses SET scraper_config = '{"club_id": 14222, "affiliation_type_id": 57710}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/rose-park-golf-course%';

UPDATE public.courses SET scraper_config = '{"club_id": 14167, "affiliation_type_id": 57490}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/copper-golf-club%';

UPDATE public.courses SET scraper_config = '{"club_id": 14198, "affiliation_type_id": 57614}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/meadow-brook-slco%';

UPDATE public.courses SET scraper_config = '{"club_id": 14199, "affiliation_type_id": 57618}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/mick-riley-slco%';

UPDATE public.courses SET scraper_config = '{"club_id": 14204, "affiliation_type_id": 57638}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/mountain-view-slco%';

UPDATE public.courses SET scraper_config = '{"club_id": 14210, "affiliation_type_id": 57662}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/old-mill-slco%';

UPDATE public.courses SET scraper_config = '{"club_id": 14219, "affiliation_type_id": 57698}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/riverbend-slco%';

UPDATE public.courses SET scraper_config = '{"club_id": 18885, "affiliation_type_id": 109741}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/river-oaks-golf-course-utah%';

UPDATE public.courses SET scraper_config = '{"club_id": 14235, "affiliation_type_id": 57762}'::jsonb
  WHERE booking_url LIKE '%chronogolf.com/club/south-mountain-slco%';
