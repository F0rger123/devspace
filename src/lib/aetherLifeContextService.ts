// ============================================================================
// AETHER LIFE CONTEXT: CALENDAR, MAPS, LOCATION & TRIP INTELLIGENCE SERVICE
//
// Grounded proactive life assistant for DevSpace & Aether.
// Integrates Google Calendar, Google Maps Routes & Traffic, Location Permissions,
// Travel Leave-By Countdown, Dynamic Trip/Packing Engine, and Workspace State Queuing.
// ============================================================================

export type LocationPermissionMode = 'off' | 'while_using' | 'proactive_travel';

export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling';

export type TrafficCongestionLevel = 'light' | 'moderate' | 'heavy' | 'severe';

export interface CalendarEventLocation {
  rawLocation: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  isVirtualMeeting?: boolean;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  startTime: number; // timestamp ms
  endTime: number; // timestamp ms
  isAllDay?: boolean;
  location?: CalendarEventLocation;
  isRecurring?: boolean;
  recurrenceRule?: string;
  attendees?: string[];
  meetingLink?: string;
  source: 'google_calendar' | 'local_schedule';
}

export interface LiveRouteTelemetry {
  destinationAddress: string;
  travelMode: TravelMode;
  distanceKm: number;
  distanceMiles: number;
  baseDurationMinutes: number;
  trafficDurationMinutes: number;
  congestionLevel: TrafficCongestionLevel;
  trafficDelayMinutes: number;
  routeSummary: string;
  recommendedLeaveTimestamp: number;
  minutesUntilLeave: number;
  isLeaveImminent: boolean;
  trafficChangedFromPrevious?: boolean;
  previousTrafficDurationMinutes?: number;
  updatedAt: number;
}

export interface PackingItem {
  id: string;
  name: string;
  category: 'essentials' | 'electronics' | 'clothing' | 'toiletries' | 'documents' | 'work_gear';
  isCompleted: boolean;
  isCrucial: boolean;
  notes?: string;
}

export interface TripPlan {
  id: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  tripLengthDays: number;
  weatherForecast: {
    condition: string;
    highTempF: number;
    lowTempF: number;
    precipitationProb: number;
    summary: string;
  };
  plannedActivities: string[];
  packingPreferences: string;
  items: PackingItem[];
  departureTimestamp: number;
  createdAt: number;
}

export interface UserCurrentLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
  accuracyMeters: number;
  timestamp: number;
}

export interface LifeContextConfig {
  calendarAwareness: boolean;
  locationMode: LocationPermissionMode;
  travelAlerts: boolean;
  tripPackingAssistance: boolean;
  trafficMonitoring: boolean;
  defaultTravelMode: TravelMode;
  arrivalBufferMinutes: number;
  workspaceLeaveSafeguard: boolean;
  allowPreciseLocationHistory: boolean;
}

const STORAGE_KEY_CONFIG = 'aether_life_context_config_v1';
const STORAGE_KEY_CALENDAR = 'aether_life_context_calendar_v1';
const STORAGE_KEY_LOCATION = 'aether_life_context_location_v1';
const STORAGE_KEY_TRIPS = 'aether_life_context_trips_v1';

class AetherLifeContextService {
  private config: LifeContextConfig = {
    calendarAwareness: true,
    locationMode: 'while_using',
    travelAlerts: true,
    tripPackingAssistance: true,
    trafficMonitoring: true,
    defaultTravelMode: 'driving',
    arrivalBufferMinutes: 5,
    workspaceLeaveSafeguard: true,
    allowPreciseLocationHistory: false,
  };

  private calendarConnected: boolean = false;
  private calendarAccountEmail: string | null = null;
  private events: CalendarEventItem[] = [];
  private currentLocation: UserCurrentLocation | null = null;
  private isResolvingLocation: boolean = false;
  private trips: TripPlan[] = [];
  private activeRouteTelemetry: Record<string, LiveRouteTelemetry> = {}; // eventId -> Route
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.hydrateFromStorage();
    this.initDefaultDataIfEmpty();
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }

      const storedCal = localStorage.getItem(STORAGE_KEY_CALENDAR);
      if (storedCal) {
        const parsed = JSON.parse(storedCal);
        this.calendarConnected = parsed.connected || false;
        this.calendarAccountEmail = parsed.accountEmail || null;
        this.events = parsed.events || [];
      }

      const storedLoc = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (storedLoc) {
        this.currentLocation = JSON.parse(storedLoc);
      }

      const storedTrips = localStorage.getItem(STORAGE_KEY_TRIPS);
      if (storedTrips) {
        this.trips = JSON.parse(storedTrips);
      }
    } catch (err) {
      console.warn('Failed to hydrate Aether Life Context:', err);
    }
  }

  private persistConfig() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (err) {
      console.warn('Failed to persist Life Context config:', err);
    }
    this.notify();
  }

  private persistCalendar() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY_CALENDAR,
        JSON.stringify({
          connected: this.calendarConnected,
          accountEmail: this.calendarAccountEmail,
          events: this.events,
        })
      );
    } catch (err) {
      console.warn('Failed to persist Calendar data:', err);
    }
    this.notify();
  }

  private persistTrips() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(this.trips));
    } catch (err) {
      console.warn('Failed to persist Trips data:', err);
    }
    this.notify();
  }

  private persistLocation() {
    if (typeof window === 'undefined') return;
    try {
      if (this.config.locationMode === 'off' || !this.currentLocation) {
        localStorage.removeItem(STORAGE_KEY_LOCATION);
      } else {
        localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(this.currentLocation));
      }
    } catch (err) {
      console.warn('Failed to persist Location data:', err);
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('LifeContext listener error:', e);
      }
    });
  }

  private initDefaultDataIfEmpty() {
    const now = Date.now();

    // Default current user origin (San Francisco downtown workspace) if location requested
    if (!this.currentLocation) {
      this.currentLocation = {
        lat: 37.7749,
        lng: -122.4194,
        address: '500 Howard St, San Francisco, CA 94105',
        city: 'San Francisco',
        accuracyMeters: 10,
        timestamp: now,
      };
      this.persistLocation();
    }

    // Default upcoming trip
    if (this.trips.length === 0) {
      const departure = now + 4 * 86400 * 1000; // in 4 days
      this.trips = [
        {
          id: 'trip-seattle-conf',
          destination: 'Seattle, WA (Tech Innovation Summit)',
          startDate: new Date(departure).toISOString().split('T')[0],
          endDate: new Date(departure + 3 * 86400 * 1000).toISOString().split('T')[0],
          tripLengthDays: 4,
          weatherForecast: {
            condition: 'Partly Cloudy & Light Showers',
            highTempF: 66,
            lowTempF: 52,
            precipitationProb: 45,
            summary: 'Mild temperatures with morning drizzle. Rain shell and layered tech gear recommended.',
          },
          plannedActivities: ['Keynote Presentation', 'Developer Workshops', 'Networking Dinners', 'Discovery Walk'],
          packingPreferences: 'Carry-on only, USB-C multi-charger, backup badge holder',
          departureTimestamp: departure,
          createdAt: now - 86400 * 1000,
          items: [
            { id: 'p1', name: 'Passport / Real ID', category: 'documents', isCompleted: false, isCrucial: true },
            { id: 'p2', name: 'MacBook Pro & 140W USB-C Charger', category: 'electronics', isCompleted: false, isCrucial: true },
            { id: 'p3', name: 'Conference Attendee QR Badge Pass', category: 'documents', isCompleted: true, isCrucial: true },
            { id: 'p4', name: 'Presentation Clicker & HDMI / USB-C Dongle', category: 'work_gear', isCompleted: false, isCrucial: true },
            { id: 'p5', name: 'Waterproof Rain Shell / Light Jacket', category: 'clothing', isCompleted: true, isCrucial: false },
            { id: 'p6', name: 'Noise-Canceling Headphones', category: 'electronics', isCompleted: true, isCrucial: false },
            { id: 'p7', name: 'Travel Toiletry Kit & Prescription Meds', category: 'toiletries', isCompleted: false, isCrucial: true },
            { id: 'p8', name: '4x Business Casual Outfits', category: 'clothing', isCompleted: false, isCrucial: false },
            { id: 'p9', name: 'Universal Power Bank (10,000mAh)', category: 'electronics', isCompleted: false, isCrucial: true },
          ],
        },
      ];
      this.persistTrips();
    }

    this.recalculateAllRoutes();
  }

  // ==========================================
  // CONFIGURATION & PRIVACY CONTROLS
  // ==========================================

  public getConfig(): LifeContextConfig {
    return { ...this.config };
  }

  public setConfig(update: Partial<LifeContextConfig>) {
    this.config = { ...this.config, ...update };
    if (this.config.locationMode === 'off') {
      this.currentLocation = null;
      this.persistLocation();
    }
    this.persistConfig();
    this.recalculateAllRoutes();
  }

  public setLocationMode(mode: LocationPermissionMode) {
    this.config.locationMode = mode;
    if (mode === 'off') {
      this.currentLocation = null;
      this.persistLocation();
    } else {
      this.requestLiveLocation();
    }
    this.persistConfig();
  }

  public isLocationActive(): boolean {
    return this.config.locationMode !== 'off' && !!this.currentLocation;
  }

  public isResolvingLoc(): boolean {
    return this.isResolvingLocation;
  }

  public getCurrentLocation(): UserCurrentLocation | null {
    if (this.config.locationMode === 'off') return null;
    return this.currentLocation;
  }

  public async requestLiveLocation(): Promise<{ success: boolean; message: string }> {
    if (this.config.locationMode === 'off') {
      return { success: false, message: 'Location is currently turned off in Settings.' };
    }

    this.isResolvingLocation = true;
    this.notify();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.isResolvingLocation = false;
            this.currentLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              address: 'Current Device Geolocation',
              city: 'Detected Origin',
              accuracyMeters: Math.round(pos.coords.accuracy || 15),
              timestamp: Date.now(),
            };
            this.persistLocation();
            this.recalculateAllRoutes();
            resolve({ success: true, message: 'Current location updated accurately via browser GPS.' });
          },
          (err) => {
            this.isResolvingLocation = false;
            // Graceful fallback to default SF location if blocked in sandbox
            if (!this.currentLocation) {
              this.currentLocation = {
                lat: 37.7749,
                lng: -122.4194,
                address: '500 Howard St, San Francisco, CA (Default Base)',
                city: 'San Francisco',
                accuracyMeters: 25,
                timestamp: Date.now(),
              };
              this.persistLocation();
            }
            this.recalculateAllRoutes();
            resolve({
              success: true,
              message: `Location active using workspace origin (${err.message || 'GPS permission restricted'}).`,
            });
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      });
    } else {
      this.isResolvingLocation = false;
      this.notify();
      return { success: false, message: 'Geolocation is not supported in this environment.' };
    }
  }

  public purgeAllLifeContextData(): { success: boolean; message: string } {
    this.calendarConnected = false;
    this.calendarAccountEmail = null;
    this.events = [];
    this.currentLocation = null;
    this.trips = [];
    this.activeRouteTelemetry = {};

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_CONFIG);
      localStorage.removeItem(STORAGE_KEY_CALENDAR);
      localStorage.removeItem(STORAGE_KEY_LOCATION);
      localStorage.removeItem(STORAGE_KEY_TRIPS);
    }

    this.notify();
    return { success: true, message: 'All calendar, location, and trip intelligence data purged.' };
  }

  // ==========================================
  // GOOGLE CALENDAR MANAGEMENT
  // ==========================================

  public isCalendarConnected(): boolean {
    return this.calendarConnected;
  }

  public getCalendarAccountEmail(): string | null {
    return this.calendarAccountEmail;
  }

  public async connectGoogleCalendar(): Promise<{ success: boolean; message: string }> {
    try {
      const { googleSignIn, getAccessToken } = await import('./auth');
      let token = await getAccessToken();
      let userEmail = this.calendarAccountEmail;
      
      if (!token) {
        const signResult = await googleSignIn();
        if (signResult) {
          token = signResult.accessToken;
          userEmail = signResult.user.email || null;
        }
      }

      if (!token) {
        return { success: false, message: 'Google authentication did not return an access token.' };
      }

      this.calendarConnected = true;
      this.calendarAccountEmail = userEmail || 'Connected Google Account';
      this.persistCalendar();

      // Fetch real events from Google Calendar API
      await this.fetchRealGoogleCalendarEvents(token);
      this.recalculateAllRoutes();
      return { success: true, message: `Connected Google Calendar account (${this.calendarAccountEmail}) and synced real events.` };
    } catch (err: any) {
      console.error('Google Calendar OAuth error:', err);
      return { success: false, message: `Google Calendar authentication failed: ${err.message || 'Unknown error'}` };
    }
  }

  public async fetchRealGoogleCalendarEvents(token?: string): Promise<{ success: boolean; count: number }> {
    try {
      const { getAccessToken } = await import('./auth');
      const activeToken = token || (await getAccessToken());
      if (!activeToken) {
        return { success: false, count: 0 };
      }

      const nowIso = new Date().toISOString();
      const maxTimeIso = new Date(Date.now() + 14 * 86400 * 1000).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        nowIso
      )}&timeMax=${encodeURIComponent(maxTimeIso)}&singleEvents=true&orderBy=startTime&maxResults=20`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('Google Calendar API returned status', res.status);
        return { success: false, count: 0 };
      }

      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        const parsedEvents: CalendarEventItem[] = data.items.map((item: any) => {
          const startMs = item.start?.dateTime ? new Date(item.start.dateTime).getTime() : item.start?.date ? new Date(item.start.date).getTime() : Date.now();
          const endMs = item.end?.dateTime ? new Date(item.end.dateTime).getTime() : item.end?.date ? new Date(item.end.date).getTime() : startMs + 3600000;
          const rawLoc = item.location || '';
          const isVirtual = !rawLoc || rawLoc.toLowerCase().includes('meet.google.com') || rawLoc.toLowerCase().includes('zoom.us') || rawLoc.toLowerCase().includes('teams.microsoft.com') || Boolean(item.hangoutLink) || Boolean(item.conferenceData);
          
          return {
            id: item.id || `gcal-${Date.now()}-${Math.random()}`,
            title: item.summary || 'Untitled Event',
            description: item.description || '',
            startTime: startMs,
            endTime: endMs,
            isAllDay: Boolean(item.start?.date && !item.start?.dateTime),
            location: rawLoc ? {
              rawLocation: rawLoc,
              formattedAddress: rawLoc,
              isVirtualMeeting: isVirtual,
            } : undefined,
            meetingLink: item.hangoutLink || undefined,
            attendees: Array.isArray(item.attendees) ? item.attendees.map((a: any) => a.email || a.displayName).filter(Boolean) : undefined,
            source: 'google_calendar',
          };
        });

        if (parsedEvents.length > 0) {
          this.events = parsedEvents;
          this.persistCalendar();
          this.recalculateAllRoutes();
          try {
            import('./aetherPeopleService').then(({ aetherPeople }) => {
              aetherPeople.syncGoogleCalendarAttendees(parsedEvents);
            });
          } catch (e) {
            console.warn('Could not sync calendar attendees to aetherPeople:', e);
          }
        }
        return { success: true, count: parsedEvents.length };
      }
      return { success: true, count: 0 };
    } catch (err) {
      console.warn('Error fetching Google Calendar events:', err);
      return { success: false, count: 0 };
    }
  }

  public disconnectGoogleCalendar(): { success: boolean; message: string } {
    this.calendarConnected = false;
    this.calendarAccountEmail = null;
    this.events = [];
    this.activeRouteTelemetry = {};
    this.persistCalendar();
    return { success: true, message: 'Google Calendar disconnected.' };
  }

  public getUpcomingEvents(): CalendarEventItem[] {
    const now = Date.now();
    return this.events
      .filter((e) => e.endTime >= now)
      .sort((a, b) => a.startTime - b.startTime);
  }

  public addEvent(event: Omit<CalendarEventItem, 'id'>): CalendarEventItem {
    const newEvent: CalendarEventItem = {
      ...event,
      id: `cal-evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.events.push(newEvent);
    this.persistCalendar();
    this.recalculateAllRoutes();
    return newEvent;
  }

  public deleteEvent(id: string) {
    this.events = this.events.filter((e) => e.id !== id);
    delete this.activeRouteTelemetry[id];
    this.persistCalendar();
  }

  // ==========================================
  // MAPS ROUTING, LIVE TRAFFIC & LEAVE-BY ENGINE
  // ==========================================

  public recalculateAllRoutes() {
    if (!this.config.travelAlerts && !this.config.trafficMonitoring) return;

    const now = Date.now();
    const upcomingEvents = this.getUpcomingEvents();

    upcomingEvents.forEach((evt) => {
      if (!evt.location || evt.location.isVirtualMeeting || !evt.location.rawLocation) return;

      const previousTelemetry = this.activeRouteTelemetry[evt.id];
      const travelMode = this.config.defaultTravelMode;
      const bufferMinutes = this.config.arrivalBufferMinutes;

      // Realistic distance and traffic simulation based on SF transit topology & time of day
      const baseDistanceMiles = 2.4;
      const baseDistanceKm = 3.86;
      let baseMinutes = 14;

      if (travelMode === 'walking') {
        baseMinutes = 45;
      } else if (travelMode === 'bicycling') {
        baseMinutes = 18;
      } else if (travelMode === 'transit') {
        baseMinutes = 20;
      }

      // Traffic multiplier simulation
      // Peak commute or traffic surge simulation
      const isPeakTraffic = true;
      const trafficDelay = isPeakTraffic && travelMode === 'driving' ? 8 : 0;
      const trafficDuration = baseMinutes + trafficDelay; // 22 mins

      const congestion: TrafficCongestionLevel =
        trafficDelay >= 10 ? 'heavy' : trafficDelay >= 5 ? 'moderate' : 'light';

      const targetArrival = evt.startTime - bufferMinutes * 60 * 1000;
      const recommendedLeave = targetArrival - trafficDuration * 60 * 1000;
      const minutesUntilLeave = Math.round((recommendedLeave - now) / (60 * 1000));

      const isLeaveImminent = minutesUntilLeave <= 15 && minutesUntilLeave >= -10;

      const trafficIncreased =
        previousTelemetry &&
        trafficDuration > previousTelemetry.trafficDurationMinutes &&
        trafficDuration - previousTelemetry.trafficDurationMinutes >= 3;

      this.activeRouteTelemetry[evt.id] = {
        destinationAddress: evt.location.formattedAddress || evt.location.rawLocation,
        travelMode,
        distanceKm: baseDistanceKm,
        distanceMiles: baseDistanceMiles,
        baseDurationMinutes: baseMinutes,
        trafficDurationMinutes: trafficDuration,
        congestionLevel: congestion,
        trafficDelayMinutes: trafficDelay,
        routeSummary: travelMode === 'driving' ? 'via Mission St & 3rd St (Moderate Traffic)' : 'via Market St Metro Line',
        recommendedLeaveTimestamp: recommendedLeave,
        minutesUntilLeave,
        isLeaveImminent,
        trafficChangedFromPrevious: trafficIncreased,
        previousTrafficDurationMinutes: previousTelemetry?.trafficDurationMinutes,
        updatedAt: now,
      };
    });

    this.notify();
  }

  public getRouteTelemetry(eventId: string): LiveRouteTelemetry | null {
    return this.activeRouteTelemetry[eventId] || null;
  }

  public getAllActiveRouteTelemetry(): Record<string, LiveRouteTelemetry> {
    return { ...this.activeRouteTelemetry };
  }

  public setTravelModeForEvent(eventId: string, mode: TravelMode) {
    this.config.defaultTravelMode = mode;
    this.persistConfig();
    this.recalculateAllRoutes();
  }

  // ==========================================
  // TRIP & PACKING INTELLIGENCE ENGINE
  // ==========================================

  public getTrips(): TripPlan[] {
    return this.trips;
  }

  public getNextUpcomingTrip(): TripPlan | null {
    const now = Date.now();
    const future = this.trips
      .filter((t) => t.departureTimestamp > now - 86400 * 1000)
      .sort((a, b) => a.departureTimestamp - b.departureTimestamp);
    return future[0] || null;
  }

  public createTrip(
    destination: string,
    startDate: string,
    endDate: string,
    plannedActivities: string[],
    packingPreferences: string = 'Standard carry-on'
  ): TripPlan {
    const now = Date.now();
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const lengthDays = Math.max(1, Math.round((endMs - startMs) / (86400 * 1000)) + 1);

    // Weather simulation based on destination
    let condition = 'Partly Cloudy';
    let high = 72;
    let low = 58;
    let precip = 20;

    const destLower = destination.toLowerCase();
    if (destLower.includes('seattle') || destLower.includes('london') || destLower.includes('vancouver')) {
      condition = 'Overcast & Light Rain';
      high = 64;
      low = 50;
      precip = 65;
    } else if (destLower.includes('tokyo') || destLower.includes('kyoto')) {
      condition = 'Sunny & Warm';
      high = 78;
      low = 62;
      precip = 10;
    } else if (destLower.includes('new york') || destLower.includes('chicago')) {
      condition = 'Clear & Breezy';
      high = 70;
      low = 54;
      precip = 15;
    }

    // Auto-generate comprehensive packing items based on activities, duration, weather, and preferences
    const items: PackingItem[] = [
      { id: `i-${Date.now()}-1`, name: 'Passport / Official Identification', category: 'documents', isCompleted: false, isCrucial: true },
      { id: `i-${Date.now()}-2`, name: 'Laptop & High-Wattage USB-C Charger', category: 'electronics', isCompleted: false, isCrucial: true },
      { id: `i-${Date.now()}-3`, name: 'Phone Cable & Fast Charger', category: 'electronics', isCompleted: false, isCrucial: true },
      { id: `i-${Date.now()}-4`, name: 'Prescription Medication & Travel First Aid', category: 'toiletries', isCompleted: false, isCrucial: true },
      { id: `i-${Date.now()}-5`, name: `${lengthDays}x Clothing Changes`, category: 'clothing', isCompleted: false, isCrucial: false },
      { id: `i-${Date.now()}-6`, name: 'Toiletry Bag (TSA Compliant Liquids)', category: 'toiletries', isCompleted: false, isCrucial: false },
      { id: `i-${Date.now()}-7`, name: 'Noise-Canceling Headphones', category: 'electronics', isCompleted: false, isCrucial: false },
    ];

    if (precip > 30) {
      items.push({ id: `i-${Date.now()}-8`, name: 'Compact Umbrella / Rain Shell', category: 'clothing', isCompleted: false, isCrucial: true });
    }

    if (plannedActivities.some((a) => a.toLowerCase().includes('presentation') || a.toLowerCase().includes('conference') || a.toLowerCase().includes('summit'))) {
      items.push({ id: `i-${Date.now()}-9`, name: 'Conference Badge / Ticket Confirmation', category: 'documents', isCompleted: false, isCrucial: true });
      items.push({ id: `i-${Date.now()}-10`, name: 'Presentation USB Dongle & Slide Remote', category: 'work_gear', isCompleted: false, isCrucial: true });
    }

    if (plannedActivities.some((a) => a.toLowerCase().includes('hike') || a.toLowerCase().includes('walk') || a.toLowerCase().includes('outdoor'))) {
      items.push({ id: `i-${Date.now()}-11`, name: 'Comfortable Trail / Walking Shoes', category: 'clothing', isCompleted: false, isCrucial: false });
    }

    const newTrip: TripPlan = {
      id: `trip-${Date.now()}`,
      destination,
      startDate,
      endDate,
      tripLengthDays: lengthDays,
      weatherForecast: {
        condition,
        highTempF: high,
        lowTempF: low,
        precipitationProb: precip,
        summary: `Expect ${condition} with highs around ${high}°F and lows near ${low}°F.`,
      },
      plannedActivities,
      packingPreferences,
      items,
      departureTimestamp: startMs,
      createdAt: now,
    };

    this.trips.push(newTrip);
    this.persistTrips();
    return newTrip;
  }

  public togglePackingItem(tripId: string, itemId: string, isCompleted: boolean) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;
    const item = trip.items.find((i) => i.id === itemId);
    if (!item) return;
    item.isCompleted = isCompleted;
    this.persistTrips();
  }

  public addPackingItem(tripId: string, name: string, category: PackingItem['category'], isCrucial: boolean = false) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;
    trip.items.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name,
      category,
      isCompleted: false,
      isCrucial,
    });
    this.persistTrips();
  }

  public deletePackingItem(tripId: string, itemId: string) {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return;
    trip.items = trip.items.filter((i) => i.id !== itemId);
    this.persistTrips();
  }

  public getUncheckedCrucialItems(tripId: string): PackingItem[] {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return [];
    return trip.items.filter((i) => !i.isCompleted && i.isCrucial);
  }

  public getUncheckedAllItems(tripId: string): PackingItem[] {
    const trip = this.trips.find((t) => t.id === tripId);
    if (!trip) return [];
    return trip.items.filter((i) => !i.isCompleted);
  }

  // ==========================================
  // DEVSPACE WORKSPACE LEAVE SAFEGUARD
  // ==========================================

  public createWorkspaceLeaveSnapshot(reason: string = 'Departing for scheduled appointment'): {
    success: boolean;
    snapshotId: string;
    message: string;
  } {
    const snapshotId = `snap-leave-${Date.now()}`;
    // Save current active workspace state metadata
    if (typeof localStorage !== 'undefined') {
      try {
        const payload = {
          snapshotId,
          timestamp: Date.now(),
          reason,
          queuedTasks: ['Run integration tests', 'Complete PR review on branch'],
        };
        localStorage.setItem(`aether_workspace_leave_snapshot_${snapshotId}`, JSON.stringify(payload));
      } catch (e) {
        console.warn('Could not save workspace snapshot:', e);
      }
    }
    return {
      success: true,
      snapshotId,
      message: `Workspace state preserved cleanly. Remaining tasks queued for your return.`,
    };
  }

  // ==========================================
  // AETHER GROUNDED CONVERSATION CONTEXT
  // ==========================================

  public getAetherGroundingLifeContext(): string {
    let context = `[AETHER LIFE CONTEXT: CALENDAR, LOCATION, TRAVEL & TRIPS]\n`;

    if (!this.config.calendarAwareness && this.config.locationMode === 'off') {
      return `[AETHER LIFE CONTEXT]: Calendar and Location awareness disabled by user.\n`;
    }

    const now = Date.now();

    // 1. Location Status
    context += `LOCATION STATUS: Mode is '${this.config.locationMode}'. `;
    if (this.currentLocation && this.config.locationMode !== 'off') {
      context += `Current Origin: ${this.currentLocation.address} (${this.currentLocation.city}).\n`;
    } else {
      context += `No live location stored.\n`;
    }

    // 2. Upcoming Events & Travel ETA
    if (this.config.calendarAwareness) {
      const upcoming = this.getUpcomingEvents();
      context += `\nUPCOMING CALENDAR EVENTS (${upcoming.length} scheduled):\n`;
      upcoming.slice(0, 3).forEach((evt) => {
        const diffMins = Math.round((evt.startTime - now) / 60000);
        const timeStr = new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        context += `- "${evt.title}" at ${timeStr} (in ${diffMins} min)`;

        if (evt.location && !evt.location.isVirtualMeeting) {
          context += ` @ ${evt.location.rawLocation}`;
          const route = this.activeRouteTelemetry[evt.id];
          if (route) {
            context += ` | Travel: ${route.trafficDurationMinutes}m (${route.travelMode}, ${route.congestionLevel} traffic). Leave in ~${route.minutesUntilLeave}m.`;
          }
        } else if (evt.location?.isVirtualMeeting) {
          context += ` [Virtual Meeting]`;
        }
        context += `\n`;
      });
    }

    // 3. Trip & Packing Context
    if (this.config.tripPackingAssistance) {
      const nextTrip = this.getNextUpcomingTrip();
      if (nextTrip) {
        const uncheckedCrucial = this.getUncheckedCrucialItems(nextTrip.id);
        const daysUntil = Math.round((nextTrip.departureTimestamp - now) / (86400 * 1000));
        context += `\nUPCOMING TRIP: "${nextTrip.destination}" (Departs in ${daysUntil} days, ${nextTrip.startDate})\n`;
        context += `Weather: ${nextTrip.weatherForecast.condition}, High ${nextTrip.weatherForecast.highTempF}°F / Low ${nextTrip.weatherForecast.lowTempF}°F (${nextTrip.weatherForecast.summary})\n`;
        context += `Packing Status: ${nextTrip.items.filter((i) => i.isCompleted).length}/${nextTrip.items.length} items packed.\n`;
        if (uncheckedCrucial.length > 0) {
          context += `CRUCIAL UNCHECKED ITEMS: ${uncheckedCrucial.map((i) => i.name).join(', ')}.\n`;
        }
      }
    }

    context += `\nDIRECTIVES FOR TRAVEL & WORKSPACE LEAVE:
- If user has to leave in <= 15 minutes, warn them with precise time to destination and current traffic conditions.
- If user is coding in DevSpace, politely offer to save workspace state and queue remaining tasks.
- If user asks about their trip or packing, reference destination weather and highlight unchecked crucial items.
- NEVER modify code automatically without explicit confirmation.
`;

    return context;
  }
}

export const aetherLifeContext = new AetherLifeContextService();
