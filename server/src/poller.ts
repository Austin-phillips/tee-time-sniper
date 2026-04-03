import { getActivePreferences, getCoursesByIds } from './db/preferences';
import {
  getMatchedTeeTimes,
  insertMatchedTeeTimes,
  deleteMatchedTeeTimes,
  deleteStaleTeeTimes,
  InsertMatchedTeeTime,
} from './db/matched-tee-times';
import { sendBatchPushNotification } from './notifications/push';
import { BaseScraper } from './scrapers/base.scraper';
import { ForeupScraper } from './scrapers/foreup.scraper';
import { EzlinksScraper } from './scrapers/ezlinks.scraper';
import { GolfnowScraper } from './scrapers/golfnow.scraper';
import { ChronogolfScraper } from './scrapers/chronogolf.scraper';
import { CustomScraper } from './scrapers/custom.scraper';
import { TeeTimeSlot, Course, Preference } from './types';

function getScraperForPlatform(platform: string): BaseScraper {
  switch (platform) {
    case 'foreup': return new ForeupScraper();
    case 'ezlinks': return new EzlinksScraper();
    case 'golfnow': return new GolfnowScraper();
    case 'chronogolf': return new ChronogolfScraper();
    default: return new CustomScraper();
  }
}

function isTimeInWindow(dateTime: Date, earliest: string, latest: string): boolean {
  const timeStr = dateTime.toTimeString().slice(0, 8); // HH:MM:SS
  return timeStr >= earliest && timeStr <= latest;
}

function isDayMatch(dateTime: Date, daysOfWeek: number[]): boolean {
  return daysOfWeek.includes(dateTime.getDay());
}

export async function pollForTeeTimesOnce(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting poll run...`);

  // 1. Fetch all active preferences
  const preferences = await getActivePreferences();
  console.log(`Found ${preferences.length} active preferences`);

  if (preferences.length === 0) return;

  // 2. Group preferences by course_id
  const prefsByCourse = new Map<string, Preference[]>();
  for (const pref of preferences) {
    const group = prefsByCourse.get(pref.course_id) ?? [];
    group.push(pref);
    prefsByCourse.set(pref.course_id, group);
  }

  // 3. Batch-fetch all unique courses
  const courseIds = [...prefsByCourse.keys()];
  const courses = await getCoursesByIds(courseIds);
  const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

  // 4. Scrape each unique course ONCE
  const slotsByCourse = new Map<string, TeeTimeSlot[]>();

  for (const [courseId, coursePrefs] of prefsByCourse) {
    const course = courseMap.get(courseId);
    if (!course) {
      console.error(`Course ${courseId} not found, skipping`);
      continue;
    }

    try {
      // Compute widest scrape window across all preferences for this course
      const minPlayers = Math.min(...coursePrefs.map((p) => p.num_players));
      const maxLookAhead = Math.max(...coursePrefs.map((p) => p.look_ahead_days));

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + maxLookAhead);

      const scraper = getScraperForPlatform(course.booking_platform);
      const slots = await scraper.getAvailableSlots(
        course.booking_url,
        { start: now, end: endDate },
        minPlayers,
        course.scraper_config
      );

      // Tag slots with the Supabase course ID
      slotsByCourse.set(
        courseId,
        slots.map((s) => ({ ...s, courseId: course.id }))
      );

      if (slots.length > 0) {
        console.log(`  ${course.name}: scraped ${slots.length} available tee times`);
        for (const slot of slots) {
          const dt = slot.dateTime;
          const day = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const time = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const price = slot.price > 0 ? ` | $${slot.price}` : '';
          console.log(`    ${day} at ${time} — ${slot.numPlayersAvailable} players${price}`);
        }
      } else {
        console.log(`  ${course.name}: no available tee times found`);
      }
    } catch (err) {
      console.error(`Error scraping course ${course.name}:`, err);
    }
  }

  // 5. For each preference, filter slots and diff against matched_tee_times
  // Track new matches per (userId, courseId) for batch notifications
  const newMatchesByUserCourse = new Map<string, { courseName: string; count: number }>();

  // First, prune any tee times that are in the past
  await deleteStaleTeeTimes();

  for (const pref of preferences) {
    try {
      const course = courseMap.get(pref.course_id);
      if (!course) continue;

      const allSlots = slotsByCourse.get(pref.course_id) ?? [];

      // 5a. Filter scraped slots for this preference
      const matchingSlots = allSlots.filter(
        (slot) =>
          slot.numPlayersAvailable >= pref.num_players &&
          isDayMatch(slot.dateTime, pref.days_of_week) &&
          isTimeInWindow(slot.dateTime, pref.earliest_time, pref.latest_time)
      );

      if (matchingSlots.length > 0) {
        console.log(`  Preference ${pref.id} (${course.name}): ${matchingSlots.length} slots match filters`);
      } else {
        console.log(`  Preference ${pref.id} (${course.name}): no slots match filters (days=${JSON.stringify(pref.days_of_week)}, time=${pref.earliest_time}-${pref.latest_time}, players=${pref.num_players})`);
      }

      // 5b. Fetch existing matched_tee_times for this preference
      const existing = await getMatchedTeeTimes(pref.id);
      const existingByTeeTime = new Map(
        existing.map((row) => [row.tee_time, row])
      );

      // 5c. Compute diff
      const scrapedTeeTimeSet = new Set(
        matchingSlots.map((s) => s.dateTime.toISOString())
      );

      // NEW = in scraped but not in existing
      const newSlots = matchingSlots.filter(
        (s) => !existingByTeeTime.has(s.dateTime.toISOString())
      );

      // STALE = in existing but not in scraped
      const staleIds = existing
        .filter((row) => !scrapedTeeTimeSet.has(row.tee_time))
        .map((row) => row.id);

      // 5d. Insert new rows
      if (newSlots.length > 0) {
        console.log(`    ${newSlots.length} NEW tee times for ${course.name}:`);
        for (const slot of newSlots) {
          const dt = slot.dateTime;
          const day = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const time = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          console.log(`      ${day} at ${time}`);
        }
        const rows: InsertMatchedTeeTime[] = newSlots.map((slot) => ({
          user_id: pref.user_id,
          preference_id: pref.id,
          course_id: pref.course_id,
          course_name: course.name,
          tee_time: slot.dateTime.toISOString(),
          players_available: slot.numPlayersAvailable,
          price: slot.price,
          booking_url: slot.bookingUrl,
        }));
        await insertMatchedTeeTimes(rows);
      }

      // 5e. Delete stale rows
      if (staleIds.length > 0) {
        console.log(`    ${staleIds.length} stale tee times removed for ${course.name}`);
        await deleteMatchedTeeTimes(staleIds);
      }

      // 5f. Track for notification batching
      if (newSlots.length > 0) {
        const key = `${pref.user_id}:${pref.course_id}`;
        const prev = newMatchesByUserCourse.get(key);
        if (prev) {
          prev.count += newSlots.length;
        } else {
          newMatchesByUserCourse.set(key, {
            courseName: course.name,
            count: newSlots.length,
          });
        }
      }
    } catch (err) {
      console.error(`Error processing preference ${pref.id}:`, err);
    }
  }

  // 6. Send one push notification per (user, course) with new matches
  for (const [key, { courseName, count }] of newMatchesByUserCourse) {
    const [userId] = key.split(':');
    try {
      await sendBatchPushNotification(userId, courseName, count);
    } catch (err) {
      console.error(`Push notification failed for ${key}:`, err);
    }
  }

  console.log(`[${new Date().toISOString()}] Poll run complete.`);
}
