import AsyncStorage from '@react-native-async-storage/async-storage';

export const LIBRARIES = [
  { id: 'gehu-central',  name: 'Central Library',       building: 'Graphic Era Hill University', totalSpots: 16, availableSpots: 16, lat: 30.2723733, lng: 77.9997382, adminPin: '1111' },
  { id: 'gehu-law',      name: 'Law Library',            building: 'GEHU Law Block',              totalSpots: 10, availableSpots: 10, lat: 30.2720000, lng: 77.9990000, adminPin: '2222' },
  { id: 'santoshanad',   name: 'Santoshanad Library',    building: 'Santoshanad Block',           totalSpots: 12, availableSpots: 12, lat: 30.2673625, lng: 77.9931595, adminPin: '3333' },
  { id: 'csit-block',    name: 'CSIT Block Library',     building: 'CSIT Department',             totalSpots: 8,  availableSpots: 8,  lat: 30.2688125, lng: 77.9907376, adminPin: '4444' },
  { id: 'chanakya',      name: 'Chanakya Block Library', building: 'Chanakya Block',              totalSpots: 10, availableSpots: 10, lat: 30.2676875, lng: 77.9937376, adminPin: '5555' },
];

// Booking statuses:
// 'pending'   — booked in app, 6 min window to scan QR at entrance
// 'confirmed' — scanned QR at entrance, currently inside
// 'completed' — scanned QR at exit (checked out normally)
// 'expired'   — didn't scan within 6 mins, seat auto-released
// 'released'  — manually released by admin

export const RESERVE_MINUTES = 6;
export const SESSION_HOURS   = 4;

const KEYS = {
  LIBRARIES: 'ss_libraries',
  BOOKINGS:  'ss_bookings',
  STUDENT:   'ss_student',
};

// ── Libraries ──────────────────────────────────────────────
export async function getLibraries() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LIBRARIES);
    const libs = raw ? JSON.parse(raw) : LIBRARIES.map(l => ({ ...l }));
    return await runExpiryCheck(libs);
  } catch { return LIBRARIES.map(l => ({ ...l })); }
}

export async function saveLibraries(libs) {
  await AsyncStorage.setItem(KEYS.LIBRARIES, JSON.stringify(libs));
}

// ── Bookings ───────────────────────────────────────────────
export async function getBookings() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveBookings(bookings) {
  await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
}

// ── Student ────────────────────────────────────────────────
export async function getStudent() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STUDENT);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveStudent(student) {
  await AsyncStorage.setItem(KEYS.STUDENT, JSON.stringify(student));
}

// ── Step 1: Book seat in app → status = 'pending', 6 min timer ──
export async function bookSeat(library, student) {
  const libs     = await getLibraries();
  const bookings = await getBookings();
  const lib      = libs.find(l => l.id === library.id);

  if (!lib || lib.availableSpots <= 0)
    return { success: false, reason: 'No seats available' };

  // Block duplicate active bookings
  const existing = bookings.find(
    b => b.libraryId === library.id &&
         b.studentErp === student.erpId &&
         ['pending', 'confirmed'].includes(b.status)
  );
  if (existing) return { success: false, reason: 'You already have an active booking here' };

  const now = new Date();
  const booking = {
    id:            Date.now().toString(),
    libraryId:     library.id,
    libraryName:   library.name,
    building:      library.building,
    studentName:   student.name,
    studentErp:    student.erpId,
    department:    student.department,
    year:          student.year,
    section:       student.section,
    status:        'pending',
    bookedAt:      now.toISOString(),
    expiresAt:     new Date(now.getTime() + RESERVE_MINUTES * 60 * 1000).toISOString(),
    checkedInAt:   null,
    checkedOutAt:  null,
    sessionEndsAt: null,
  };

  const updatedLibs = libs.map(l =>
    l.id === library.id ? { ...l, availableSpots: l.availableSpots - 1 } : l
  );

  bookings.unshift(booking);
  await saveLibraries(updatedLibs);
  await saveBookings(bookings);
  return { success: true, booking };
}

// ── Step 2: Student scans QR ──
// pending  → confirm check-in
// confirmed → check out
// no booking → tell them to book first
export async function handleQRScan(libraryId, student) {
  const bookings = await getBookings();
  const libs     = await getLibraries();
  const now      = new Date();

  const idx = bookings.findIndex(
    b => b.libraryId === libraryId &&
         b.studentErp === student.erpId &&
         ['pending', 'confirmed'].includes(b.status)
  );

  // ── CHECK OUT ──
  if (idx !== -1 && bookings[idx].status === 'confirmed') {
    bookings[idx] = { ...bookings[idx], status: 'completed', checkedOutAt: now.toISOString() };
    const updatedLibs = libs.map(l =>
      l.id === libraryId ? { ...l, availableSpots: Math.min(l.totalSpots, l.availableSpots + 1) } : l
    );
    await saveBookings(bookings);
    await saveLibraries(updatedLibs);
    return { action: 'checkout', booking: bookings[idx] };
  }

  // ── CHECK IN ──
  if (idx !== -1 && bookings[idx].status === 'pending') {
    if (new Date(bookings[idx].expiresAt) < now) {
      // Window expired
      bookings[idx] = { ...bookings[idx], status: 'expired' };
      const updatedLibs = libs.map(l =>
        l.id === libraryId ? { ...l, availableSpots: Math.min(l.totalSpots, l.availableSpots + 1) } : l
      );
      await saveBookings(bookings);
      await saveLibraries(updatedLibs);
      return { action: 'expired', booking: bookings[idx] };
    }

    bookings[idx] = {
      ...bookings[idx],
      status:        'confirmed',
      checkedInAt:   now.toISOString(),
      sessionEndsAt: new Date(now.getTime() + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
    };
    await saveBookings(bookings);
    return { action: 'checkin', booking: bookings[idx] };
  }

  return { action: 'none', booking: null };
}

// ── Admin: manually release N seats ──
export async function adminReleaseSeats(libraryId, count) {
  const libs     = await getLibraries();
  const bookings = await getBookings();
  let released   = 0;

  const updatedBookings = bookings.map(b => {
    if (released < count && b.libraryId === libraryId && b.status === 'confirmed') {
      released++;
      return { ...b, status: 'released', checkedOutAt: new Date().toISOString() };
    }
    return b;
  });

  const updatedLibs = libs.map(l =>
    l.id === libraryId
      ? { ...l, availableSpots: Math.min(l.totalSpots, l.availableSpots + released) }
      : l
  );

  await saveBookings(updatedBookings);
  await saveLibraries(updatedLibs);
  return released;
}

// ── Auto expiry check (runs on every getLibraries call) ──
async function runExpiryCheck(libs) {
  const bookings = await getBookings();
  const now      = new Date();
  let changed    = false;
  const deltas   = {};

  const updated = bookings.map(b => {
    if (b.status === 'pending' && new Date(b.expiresAt) < now) {
      changed = true;
      deltas[b.libraryId] = (deltas[b.libraryId] || 0) + 1;
      return { ...b, status: 'expired' };
    }
    if (b.status === 'confirmed' && b.sessionEndsAt && new Date(b.sessionEndsAt) < now) {
      changed = true;
      deltas[b.libraryId] = (deltas[b.libraryId] || 0) + 1;
      return { ...b, status: 'completed', checkedOutAt: now.toISOString() };
    }
    return b;
  });

  if (changed) {
    const updatedLibs = libs.map(l => ({
      ...l,
      availableSpots: Math.min(l.totalSpots, l.availableSpots + (deltas[l.id] || 0)),
    }));
    await saveBookings(updated);
    await saveLibraries(updatedLibs);
    return updatedLibs;
  }
  return libs;
}

// ── Helpers ────────────────────────────────────────────────
export function getSecondsLeft(isoString) {
  return Math.max(0, Math.floor((new Date(isoString) - new Date()) / 1000));
}

export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
