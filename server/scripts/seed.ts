import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../src/db/client';

/**
 * Seed script — adds all public golf courses in Salt Lake County & Utah County.
 * Run with: npx ts-node scripts/seed.ts
 */

async function seed() {
  console.log('Seeding database...');

  const courses = [
    // ── foreup (supported) ────────────────────────────────
    { name: 'Cedar Hills Golf Club',       booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/19765/2198' },
    { name: 'Gladstan Golf Course',         booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/index/18922' },
    { name: 'Links at Sleepy Ridge',        booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/19396/1726' },
    { name: 'Murray Parkway Golf Course',   booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/6263/244' },
    { name: 'Stonebridge Golf Club',        booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/22130' },
    { name: 'TalonsCove Golf Club',         booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/19567/1814' },
    { name: 'Thanksgiving Point Golf Club', booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/19645/2034' },
    { name: 'The Oaks at Spanish Fork',     booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/21698/8633' },
    { name: 'The Ranches Golf Club',        booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/19613/1934' },
    { name: 'The Ridge Golf Course',        booking_platform: 'foreup', booking_url: 'https://foreupsoftware.com/index.php/booking/22131' },
    { name: 'Timpanogos Golf Club',         booking_platform: 'foreup', booking_url: 'https://app.foreupsoftware.com/index.php/booking/index/6279' },

    // ── chronogolf (not yet supported) ────────────────────
    // SLC City municipal courses
    { name: 'Bonneville Golf Course',       booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/bonneville-golf-course' },
    { name: 'Forest Dale Golf Course',      booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/forest-dale-golf-course' },
    { name: 'Glendale Golf Course',         booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/glendale-golf-course' },
    { name: 'Mountain Dell Golf Course',    booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/mountain-dell-golf-course' },
    { name: 'Nibley Park Golf Course',      booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/nibley-park-golf-course' },
    { name: 'Rose Park Golf Course',        booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/rose-park-golf-course' },
    // Salt Lake County courses
    { name: 'Copper Club Golf Course',      booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/copper-golf-club' },
    { name: 'Meadow Brook Golf Course',     booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/meadow-brook-slco' },
    { name: 'Mick Riley Golf Course',       booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/mick-riley-slco' },
    { name: 'Mountain View Golf Course',    booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/mountain-view-slco' },
    { name: 'Old Mill Golf Course',         booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/old-mill-slco' },
    { name: 'Riverbend Golf Course',        booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/riverbend-slco' },
    { name: 'River Oaks Golf Course',       booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/river-oaks-golf-course-utah' },
    { name: 'South Mountain Golf Course',   booking_platform: 'chronogolf', booking_url: 'https://www.chronogolf.com/club/south-mountain-slco' },

    // ── other platforms (not yet supported) ───────────────
    { name: 'Fore Lakes Golf Course',       booking_platform: 'membersports', booking_url: 'https://app.membersports.com/tee-times/15394/18905/0/0/0' },
    { name: 'Glenmoor Golf Course',         booking_platform: 'cps-golf',     booking_url: 'http://glenmoor.cps.golf/onlineresweb/search-teetime' },
    { name: 'Hobble Creek Golf Course',     booking_platform: 'membersports', booking_url: 'https://app.membersports.com/tee-times/15404/18918/0/0/0' },
    { name: 'Pebblebrook Golf Course',      booking_platform: 'easytee',      booking_url: 'https://app.easyteegolf.com/course/pebblebrook-golf-club/' },
  ];

  const { data: insertedCourses, error: courseError } = await supabaseAdmin
    .from('courses')
    .upsert(courses, { onConflict: 'name' })
    .select();

  if (courseError) throw courseError;
  console.log(`${insertedCourses.length} courses seeded`);
  console.log('Done!');
}

seed().catch(console.error);
