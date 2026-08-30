import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Navigation,
  Luggage,
  Clock,
  Shield,
  Car,
  Train,
  Footprints,
  Bike,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Sparkles,
  Save,
  Compass,
  CloudSun,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  aetherLifeContext,
  LifeContextConfig,
  LocationPermissionMode,
  TravelMode,
  CalendarEventItem,
  LiveRouteTelemetry,
  TripPlan,
  UserCurrentLocation,
  PackingItem,
} from '../lib/aetherLifeContextService';

export const LifeContextSettingsTab: React.FC = () => {
  const [config, setConfig] = useState<LifeContextConfig>(aetherLifeContext.getConfig());
  const [calendarConnected, setCalendarConnected] = useState<boolean>(aetherLifeContext.isCalendarConnected());
  const [accountEmail, setAccountEmail] = useState<string | null>(aetherLifeContext.getCalendarAccountEmail());
  const [events, setEvents] = useState<CalendarEventItem[]>(aetherLifeContext.getUpcomingEvents());
  const [routes, setRoutes] = useState<Record<string, LiveRouteTelemetry>>(aetherLifeContext.getAllActiveRouteTelemetry());
  const [trips, setTrips] = useState<TripPlan[]>(aetherLifeContext.getTrips());
  const [currentLocation, setCurrentLocation] = useState<UserCurrentLocation | null>(aetherLifeContext.getCurrentLocation());
  const [isResolvingLoc, setIsResolvingLoc] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'travel' | 'trips' | 'privacy'>('travel');

  // New trip modal state
  const [showNewTripModal, setShowNewTripModal] = useState<boolean>(false);
  const [newTripDest, setNewTripDest] = useState<string>('');
  const [newTripStart, setNewTripStart] = useState<string>('');
  const [newTripEnd, setNewTripEnd] = useState<string>('');
  const [newTripActivities, setNewTripActivities] = useState<string>('Conference, Workshops, Dining');
  const [newTripPref, setNewTripPref] = useState<string>('Carry-on only, lightweight tech accessories');

  // New event modal state
  const [showNewEventModal, setShowNewEventModal] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventMinutesAhead, setNewEventMinutesAhead] = useState<number>(40);
  const [newEventLocation, setNewEventLocation] = useState<string>('450 Sutter St, San Francisco, CA');
  const [newEventIsVirtual, setNewEventIsVirtual] = useState<boolean>(false);

  // New packing item input per trip
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<PackingItem['category']>('essentials');
  const [newItemCrucial, setNewItemCrucial] = useState<boolean>(true);

  // Status notification message
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'warn'; text: string } | null>(null);

  useEffect(() => {
    const unsub = aetherLifeContext.subscribe(() => {
      setConfig(aetherLifeContext.getConfig());
      setCalendarConnected(aetherLifeContext.isCalendarConnected());
      setAccountEmail(aetherLifeContext.getCalendarAccountEmail());
      setEvents(aetherLifeContext.getUpcomingEvents());
      setRoutes(aetherLifeContext.getAllActiveRouteTelemetry());
      setTrips(aetherLifeContext.getTrips());
      setCurrentLocation(aetherLifeContext.getCurrentLocation());
      setIsResolvingLoc(aetherLifeContext.isResolvingLoc());
    });
    return () => unsub();
  }, []);

  const showBanner = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLocationModeChange = (mode: LocationPermissionMode) => {
    aetherLifeContext.setLocationMode(mode);
    showBanner(`Location mode set to "${mode === 'off' ? 'Off' : mode === 'while_using' ? 'Only While Using DevSpace' : 'Proactive Travel Assistance'}".`);
  };

  const handleRefreshLocation = async () => {
    setIsResolvingLoc(true);
    const res = await aetherLifeContext.requestLiveLocation();
    setIsResolvingLoc(false);
    showBanner(res.message, res.success ? 'success' : 'warn');
  };

  const handleTogglePacking = (tripId: string, itemId: string, currentVal: boolean) => {
    aetherLifeContext.togglePackingItem(tripId, itemId, !currentVal);
  };

  const handleAddPackingItem = (tripId: string) => {
    if (!newItemName.trim()) return;
    aetherLifeContext.addPackingItem(tripId, newItemName.trim(), newItemCategory, newItemCrucial);
    setNewItemName('');
    showBanner('Added packing item to checklist.');
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripDest || !newTripStart || !newTripEnd) return;
    const actList = newTripActivities.split(',').map((s) => s.trim()).filter(Boolean);
    aetherLifeContext.createTrip(newTripDest, newTripStart, newTripEnd, actList, newTripPref);
    setShowNewTripModal(false);
    setNewTripDest('');
    setNewTripStart('');
    setNewTripEnd('');
    showBanner(`Trip to ${newTripDest} created with smart packing checklist!`);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const now = Date.now();
    const start = now + newEventMinutesAhead * 60 * 1000;
    aetherLifeContext.addEvent({
      title: newEventTitle.trim(),
      startTime: start,
      endTime: start + 60 * 60 * 1000,
      location: {
        rawLocation: newEventIsVirtual ? 'Google Meet' : newEventLocation.trim(),
        formattedAddress: newEventIsVirtual ? undefined : newEventLocation.trim(),
        isVirtualMeeting: newEventIsVirtual,
      },
      source: 'google_calendar',
    });
    setShowNewEventModal(false);
    setNewEventTitle('');
    showBanner(`Calendar event "${newEventTitle}" added.`);
  };

  const handleSaveWorkspaceState = (eventId: string, title: string) => {
    const res = aetherLifeContext.createWorkspaceLeaveSnapshot(`Departure for: ${title}`);
    showBanner(`Saved workspace snapshot (${res.snapshotId}). Tasks safely deferred!`, 'success');
  };

  const selectedTrip = trips[0] || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Life Context, Calendar & Travel Intelligence</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Aether Proactive Core
            </span>
          </div>
          <p className="text-sm text-neutral-400">
            Grounds Aether in where you need to be, when to leave, real-time traffic spikes, and intelligent trip packing lists.
          </p>
        </div>

        {/* Live Geolocation / Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {calendarConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>Google Calendar: {accountEmail || 'Connected'}</span>
            </div>
          ) : (
            <button
              onClick={() => aetherLifeContext.connectGoogleCalendar()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Connect Google Calendar</span>
            </button>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
              config.locationMode !== 'off'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>
              Location:{' '}
              {config.locationMode === 'off'
                ? 'Off'
                : config.locationMode === 'while_using'
                ? 'While Using'
                : 'Proactive Travel'}
            </span>
            {config.locationMode !== 'off' && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-sm flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : notification.type === 'warn'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
              : 'bg-blue-500/15 border-blue-500/30 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveSubTab('travel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeSubTab === 'travel'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Navigation className="w-4 h-4 text-amber-400" />
          <span>Calendar & Travel Leave-By ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trips')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeSubTab === 'trips'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Luggage className="w-4 h-4 text-emerald-400" />
          <span>Trip & Packing Intelligence ({trips.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeSubTab === 'privacy'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Privacy & Permissions</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CALENDAR & TRAVEL LEAVE-BY */}
      {/* ========================================================================= */}
      {activeSubTab === 'travel' && (
        <div className="space-y-6">
          {/* Origin & Routing Telemetry Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-neutral-500">Current Origin</span>
                <button
                  onClick={handleRefreshLocation}
                  disabled={isResolvingLoc || config.locationMode === 'off'}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3 h-3 ${isResolvingLoc ? 'animate-spin' : ''}`} />
                  <span>{isResolvingLoc ? 'Locating...' : 'Refresh GPS'}</span>
                </button>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {currentLocation ? currentLocation.address : 'Location disabled by user'}
              </p>
              <div className="text-xs text-neutral-500">
                {currentLocation
                  ? `Accuracy: ±${currentLocation.accuracyMeters}m • Updated ${new Date(currentLocation.timestamp).toLocaleTimeString()}`
                  : 'Enable location in Privacy tab to compute route ETAs'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Travel Mode</span>
              <div className="flex items-center gap-1">
                {(['driving', 'transit', 'walking', 'bicycling'] as TravelMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      aetherLifeContext.setConfig({ defaultTravelMode: mode });
                      showBanner(`Default travel mode updated to ${mode}.`);
                    }}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-xs font-medium capitalize transition-all ${
                      config.defaultTravelMode === mode
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {mode === 'driving' && <Car className="w-3 h-3" />}
                    {mode === 'transit' && <Train className="w-3 h-3" />}
                    {mode === 'walking' && <Footprints className="w-3 h-3" />}
                    {mode === 'bicycling' && <Bike className="w-3 h-3" />}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Arrival Buffer</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{config.arrivalBufferMinutes} min buffer</span>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={5}
                  value={config.arrivalBufferMinutes}
                  onChange={(e) => {
                    aetherLifeContext.setConfig({ arrivalBufferMinutes: Number(e.target.value) });
                  }}
                  className="w-28 accent-amber-500"
                />
              </div>
              <p className="text-xs text-neutral-500">Extra safety margin before meeting start</p>
            </div>
          </div>

          {/* Upcoming Calendar Events & Leave-By Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Today's Calendar Schedule & Live Route ETAs</span>
              </h3>
              <button
                onClick={() => setShowNewEventModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            <div className="space-y-3">
              {events.map((evt) => {
                const route = routes[evt.id];
                const now = Date.now();
                const diffMins = Math.round((evt.startTime - now) / 60000);
                const isImminent = route && route.isLeaveImminent;

                return (
                  <div
                    key={evt.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isImminent
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-neutral-900/90 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{evt.title}</h4>
                          {evt.isRecurring && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Recurring
                            </span>
                          )}
                          {isImminent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black animate-pulse">
                              Leave Soon
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>
                              {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                              {new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (in{' '}
                              {diffMins} min)
                            </span>
                          </div>

                          {evt.location?.isVirtualMeeting ? (
                            <div className="flex items-center gap-1 text-blue-400">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Virtual Meeting (Google Meet)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-300 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span>{evt.location?.formattedAddress || evt.location?.rawLocation}</span>
                            </div>
                          )}
                        </div>

                        {evt.description && <p className="text-xs text-neutral-500 pt-1">{evt.description}</p>}
                      </div>

                      {/* Travel ETA telemetry box */}
                      {route && !evt.location?.isVirtualMeeting && (
                        <div className="flex flex-col md:items-end gap-2 bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700 min-w-[260px]">
                          <div className="flex items-center justify-between w-full text-xs">
                            <span className="text-neutral-400">Live Travel Duration:</span>
                            <span className="font-bold text-white">{route.trafficDurationMinutes} mins</span>
                          </div>

                          <div className="flex items-center justify-between w-full text-xs">
                            <span className="text-neutral-400">Traffic Condition:</span>
                            <span
                              className={`font-semibold capitalize ${
                                route.congestionLevel === 'heavy' || route.congestionLevel === 'severe'
                                  ? 'text-red-400'
                                  : route.congestionLevel === 'moderate'
                                  ? 'text-amber-300'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {route.congestionLevel} (+{route.trafficDelayMinutes}m delay)
                            </span>
                          </div>

                          <div className="flex items-center justify-between w-full text-xs pt-1 border-t border-neutral-700">
                            <span className="text-amber-300 font-semibold">Recommended Leave:</span>
                            <span className="font-extrabold text-amber-200">
                              {new Date(route.recommendedLeaveTimestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              ({route.minutesUntilLeave <= 0 ? 'Leave Now' : `in ${route.minutesUntilLeave}m`})
                            </span>
                          </div>

                          {/* DevSpace Workspace State Saver action */}
                          <button
                            onClick={() => handleSaveWorkspaceState(evt.id, evt.title)}
                            className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5 text-blue-400" />
                            <span>Save Workspace & Queue Tasks</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TRIP & PACKING INTELLIGENCE */}
      {/* ========================================================================= */}
      {activeSubTab === 'trips' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Upcoming Trips & Smart Packing Assistance</h3>
              <p className="text-xs text-neutral-400">
                Aether dynamically considers destination climate, length, itinerary, and previous packing habits.
              </p>
            </div>
            <button
              onClick={() => setShowNewTripModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plan New Trip</span>
            </button>
          </div>

          {selectedTrip ? (
            <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-6">
              {/* Trip summary header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Luggage className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-lg font-bold text-white">{selectedTrip.destination}</h4>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedTrip.tripLengthDays} Days
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {selectedTrip.startDate} → {selectedTrip.endDate} • Activities: {selectedTrip.plannedActivities.join(', ')}
                  </p>
                </div>

                {/* Weather Forecast Card */}
                <div className="p-3 rounded-xl bg-neutral-800/70 border border-neutral-700 flex items-center gap-3">
                  <CloudSun className="w-6 h-6 text-amber-400" />
                  <div className="text-xs">
                    <div className="font-semibold text-white">{selectedTrip.weatherForecast.condition}</div>
                    <div className="text-neutral-400">
                      High {selectedTrip.weatherForecast.highTempF}°F / Low {selectedTrip.weatherForecast.lowTempF}°F (
                      {selectedTrip.weatherForecast.precipitationProb}% rain)
                    </div>
                  </div>
                </div>
              </div>

              {/* Crucial Item Proactive Reminder Alert */}
              {aetherLifeContext.getUncheckedCrucialItems(selectedTrip.id).length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <h5 className="font-bold text-amber-200">Aether Proactive Departure Check</h5>
                    <p className="text-amber-300/90">
                      Before you leave, you still haven’t checked off:{' '}
                      <span className="font-semibold text-white">
                        {aetherLifeContext
                          .getUncheckedCrucialItems(selectedTrip.id)
                          .map((i) => i.name)
                          .join(', ')}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Packing Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider text-neutral-400">
                    Packing Checklist ({selectedTrip.items.filter((i) => i.isCompleted).length} / {selectedTrip.items.length}{' '}
                    Completed)
                  </span>
                  <span className="text-neutral-500">Preferences: {selectedTrip.packingPreferences}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedTrip.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePacking(selectedTrip.id, item.id, item.isCompleted)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        item.isCompleted
                          ? 'bg-neutral-900/50 border-neutral-800/80 text-neutral-500 opacity-60'
                          : 'bg-neutral-800/80 border-neutral-700 text-white hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-neutral-500 shrink-0" />
                        )}
                        <span className={`text-xs font-medium ${item.isCompleted ? 'line-through' : ''}`}>{item.name}</span>
                        {item.isCrucial && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Crucial
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{item.category}</span>
                    </div>
                  ))}
                </div>

                {/* Add new packing item row */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom packing item..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPackingItem(selectedTrip.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as PackingItem['category'])}
                    className="px-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-300"
                  >
                    <option value="essentials">Essentials</option>
                    <option value="electronics">Electronics</option>
                    <option value="documents">Documents</option>
                    <option value="clothing">Clothing</option>
                    <option value="toiletries">Toiletries</option>
                    <option value="work_gear">Work Gear</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newItemCrucial}
                      onChange={(e) => setNewItemCrucial(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Crucial</span>
                  </label>
                  <button
                    onClick={() => handleAddPackingItem(selectedTrip.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-3">
              <Luggage className="w-8 h-8 text-neutral-600 mx-auto" />
              <h4 className="text-sm font-semibold text-neutral-300">No Trips Scheduled</h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Plan an upcoming trip to generate automated packing checklists grounded in local weather and planned activities.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PRIVACY & PERMISSIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Privacy Architecture & Data Isolation</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Aether Life Context strictly adheres to the Principle of Least Privilege:
              <br />• <strong>Opt-In Geolocation:</strong> Your device coordinates are requested solely on-demand to compute
              travel ETAs to scheduled events.
              <br />• <strong>No Unnecessary Tracking:</strong> Continuous background breadcrumb storage is disabled by default.
              <br />• <strong>Isolated Security Sandbox:</strong> Location, calendar entries, and wellness metrics are
              partitioned and never shared with third-party extensions or external integrations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-5">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Granular Life Context Toggles</h4>

            <div className="space-y-4">
              {/* Location Mode Option */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">Location Permission Mode</h5>
                  <p className="text-[11px] text-neutral-400">Controls when Aether is permitted to read device origin.</p>
                </div>
                <div className="flex items-center gap-1">
                  {(['off', 'while_using', 'proactive_travel'] as LocationPermissionMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleLocationModeChange(mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        config.locationMode === mode
                          ? 'bg-blue-600 text-white font-semibold shadow'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {mode === 'off' ? 'Off' : mode === 'while_using' ? 'While Using DevSpace' : 'Proactive Travel'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Awareness */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">Calendar Awareness</h5>
                  <p className="text-[11px] text-neutral-400">Allow Aether to read event times and physical destinations.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.calendarAwareness}
                  onChange={(e) => aetherLifeContext.setConfig({ calendarAwareness: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
              </div>

              {/* Travel / Leave-Time Alerts */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">Travel & Leave-By Alerts</h5>
                  <p className="text-[11px] text-neutral-400">
                    Proactively warn before scheduled departures with live traffic.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.travelAlerts}
                  onChange={(e) => aetherLifeContext.setConfig({ travelAlerts: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
              </div>

              {/* Traffic Monitoring */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">Real-Time Traffic Spike Monitoring</h5>
                  <p className="text-[11px] text-neutral-400">Detect route slowdowns and recommend earlier departure.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.trafficMonitoring}
                  onChange={(e) => aetherLifeContext.setConfig({ trafficMonitoring: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
              </div>

              {/* Trip & Packing Assistance */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">Trip & Packing Assistance</h5>
                  <p className="text-[11px] text-neutral-400">
                    Generate packing checklists and audit unchecked crucial items.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.tripPackingAssistance}
                  onChange={(e) => aetherLifeContext.setConfig({ tripPackingAssistance: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
              </div>

              {/* Workspace Leave Safeguard */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div>
                  <h5 className="text-xs font-bold text-white">DevSpace Workspace Leave Safeguard</h5>
                  <p className="text-[11px] text-neutral-400">
                    Offer to snapshot work state and queue tasks when leaving for an appointment.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.workspaceLeaveSafeguard}
                  onChange={(e) => aetherLifeContext.setConfig({ workspaceLeaveSafeguard: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
              </div>
            </div>

            {/* Wipe / Purge Button */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-red-400">Purge Life Context Data</h5>
                <p className="text-[11px] text-neutral-500">
                  Instantly disconnect calendar and wipe all cached locations, trips, and routes.
                </p>
              </div>
              <button
                onClick={() => {
                  aetherLifeContext.purgeAllLifeContextData();
                  showBanner('All Life Context telemetry wiped.', 'warn');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
              >
                Disconnect & Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PLAN NEW TRIP */}
      {/* ========================================================================= */}
      {showNewTripModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Luggage className="w-4 h-4 text-emerald-400" />
                <span>Plan New Trip & Packing List</span>
              </h3>
              <button onClick={() => setShowNewTripModal(false)} className="text-neutral-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seattle, WA (Tech Summit)"
                  value={newTripDest}
                  onChange={(e) => setNewTripDest(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newTripStart}
                    onChange={(e) => setNewTripStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newTripEnd}
                    onChange={(e) => setNewTripEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Planned Activities</label>
                <input
                  type="text"
                  placeholder="e.g. Keynote Presentation, Hiking, Networking Dinners"
                  value={newTripActivities}
                  onChange={(e) => setNewTripActivities(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Packing Preferences</label>
                <input
                  type="text"
                  placeholder="e.g. Carry-on only, extra USB-C cords, rain gear"
                  value={newTripPref}
                  onChange={(e) => setNewTripPref(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white shadow"
                >
                  Create & Generate Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CALENDAR EVENT */}
      {/* ========================================================================= */}
      {showNewEventModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Add Calendar Event</span>
              </h3>
              <button onClick={() => setShowNewEventModal(false)} className="text-neutral-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doctor's Appointment or Client Review"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Minutes from now</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={newEventMinutesAhead}
                  onChange={(e) => setNewEventMinutesAhead(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="virt"
                  checked={newEventIsVirtual}
                  onChange={(e) => setNewEventIsVirtual(e.target.checked)}
                  className="accent-blue-500"
                />
                <label htmlFor="virt" className="text-xs text-neutral-300 cursor-pointer">
                  Virtual Meeting (Google Meet)
                </label>
              </div>

              {!newEventIsVirtual && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Destination Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 450 Sutter St, San Francisco, CA"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
