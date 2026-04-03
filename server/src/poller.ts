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

const COURSE_CONCURRENCY = 5;

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

/** Run async tasks with a concurrency limit */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
  await Promise.all(workers);
  return results;
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

  // 4. Scrape courses in parallel (max COURSE_CONCURRENCY at a time)
  const slotsByCourse = new Map<string, TeeTimeSlot[]>();
  const courseEntries = [...prefsByCourse.entries()];

  const scrapeTasks = courseEntries.map(([courseId, coursePrefs]) => async () => {
    const course = courseMap.get(courseId);
    if (!course) {
      console.error(`Course ${courseId} not found, skipping`);
      return;
    }

    try {
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
          console.log(`    ${day} at ${time} — ${slot.numPlayersAvailable} players | ${slot.holes}h${price}`);
        }
      } else {
        console.log(`  ${course.name}: no available tee times found`);
      }
    } catch (err) {
      console.error(`Error scraping course ${course.name}:`, err);
    }
  });

  await runWithConcurrency(scrapeTasks, COURSE_CONCURRENCY);

  // 5. For each preference, filter slots and diff against matched_tee_times
  const newMatchesByUserCourse = new Map<string, { courseName: string; count: number }>();

  await deleteStaleTeeTimes();

  for (const pref of preferences) {
    try {
      const course = courseMap.get(pref.course_id);
      if (!course) continue;

      const allSlots = slotsByCourse.get(pref.course_id) ?? [];

      const filteredSlots = allSlots.filter(
        (slot) =>
          slot.numPlayersAvailable >= pref.num_players &&
          isDayMatch(slot.dateTime, pref.days_of_week) &&
          isTimeInWindow(slot.dateTime, pref.earliest_time, pref.latest_time) &&
          (pref.holes === 0 || slot.holes === pref.holes)
      );

      // For "both" (holes=0), deduplicate by tee_time — prefer 18-hole over 9-hole
      let matchingSlots: TeeTimeSlot[];
      if (pref.holes === 0) {
        const byTime = new Map<string, TeeTimeSlot>();
        for (const slot of filteredSlots) {
          const key = slot.dateTime.toISOString();
          const existing = byTime.get(key);
          if (!existing || slot.holes > existing.holes) {
            byTime.set(key, slot);
          }
        }
        matchingSlots = [...byTime.values()];
      } else {
        matchingSlots = filteredSlots;
      }

      if (matchingSlots.length > 0) {
        console.log(`  Preference ${pref.id} (${course.name}): ${matchingSlots.length} slots match filters`);
      } else {
        console.log(`  Preference ${pref.id} (${course.name}): no slots match filters (days=${JSON.stringify(pref.days_of_week)}, time=${pref.earliest_time}-${pref.latest_time}, players=${pref.num_players})`);
      }

      const existing = await getMatchedTeeTimes(pref.id);
      const normalizeTime = (t: string | Date) => new Date(t).toISOString();
      const existingByTeeTime = new Map(
        existing.map((row) => [normalizeTime(row.tee_time), row])
      );

      const scrapedTeeTimeSet = new Set(
        matchingSlots.map((s) => normalizeTime(s.dateTime))
      );

      const newSlots = matchingSlots.filter(
        (s) => !existingByTeeTime.has(normalizeTime(s.dateTime))
      );

      const staleIds = existing
        .filter((row) => !scrapedTeeTimeSet.has(normalizeTime(row.tee_time)))
        .map((row) => row.id);

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
          holes: slot.holes,
        }));
        await insertMatchedTeeTimes(rows);
      }

      if (staleIds.length > 0) {
        console.log(`    ${staleIds.length} stale tee times removed for ${course.name}`);
        await deleteMatchedTeeTimes(staleIds);
      }

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
