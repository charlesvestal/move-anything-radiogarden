import * as std from 'std';
import * as os from 'os';

import {
  MidiNoteOn,
  MoveShift,
  MoveKnob1, MoveKnob7,
  MoveKnob1Touch, MoveKnob7Touch
} from '/data/UserData/move-anything/shared/constants.mjs';

import { isCapacitiveTouchMessage, decodeDelta } from '/data/UserData/move-anything/shared/input_filter.mjs';

import { createAction } from '/data/UserData/move-anything/shared/menu_items.mjs';
import { createMenuState, handleMenuInput } from '/data/UserData/move-anything/shared/menu_nav.mjs';
import { createMenuStack } from '/data/UserData/move-anything/shared/menu_stack.mjs';
import { drawStackMenu } from '/data/UserData/move-anything/shared/menu_render.mjs';

/* ── Radio Garden API ─────────────────────────────────────────────── */

const RG_API = 'https://radio.garden/api';
const SPINNER = ['-', '/', '|', '\\'];

/* ── City Database ────────────────────────────────────────────────── */
/* ~200 major cities organized by continent and country */

const CITIES = [
  /* ── Africa ──────────────────────────────────────────────────────── */
  { continent: 'Africa', country: 'Algeria', city: 'Algiers' },
  { continent: 'Africa', country: 'Angola', city: 'Luanda' },
  { continent: 'Africa', country: 'Cameroon', city: 'Douala' },
  { continent: 'Africa', country: 'DR Congo', city: 'Kinshasa' },
  { continent: 'Africa', country: 'Egypt', city: 'Cairo' },
  { continent: 'Africa', country: 'Egypt', city: 'Alexandria' },
  { continent: 'Africa', country: 'Ethiopia', city: 'Addis Ababa' },
  { continent: 'Africa', country: 'Ghana', city: 'Accra' },
  { continent: 'Africa', country: 'Ivory Coast', city: 'Abidjan' },
  { continent: 'Africa', country: 'Kenya', city: 'Nairobi' },
  { continent: 'Africa', country: 'Libya', city: 'Tripoli' },
  { continent: 'Africa', country: 'Morocco', city: 'Casablanca' },
  { continent: 'Africa', country: 'Morocco', city: 'Marrakech' },
  { continent: 'Africa', country: 'Mozambique', city: 'Maputo' },
  { continent: 'Africa', country: 'Nigeria', city: 'Lagos' },
  { continent: 'Africa', country: 'Nigeria', city: 'Abuja' },
  { continent: 'Africa', country: 'Rwanda', city: 'Kigali' },
  { continent: 'Africa', country: 'Senegal', city: 'Dakar' },
  { continent: 'Africa', country: 'South Africa', city: 'Johannesburg' },
  { continent: 'Africa', country: 'South Africa', city: 'Cape Town' },
  { continent: 'Africa', country: 'Tanzania', city: 'Dar es Salaam' },
  { continent: 'Africa', country: 'Tunisia', city: 'Tunis' },
  { continent: 'Africa', country: 'Uganda', city: 'Kampala' },
  { continent: 'Africa', country: 'Zimbabwe', city: 'Harare' },
  { continent: 'Africa', country: 'Sudan', city: 'Khartoum' },

  /* ── Asia ─────────────────────────────────────────────────────────── */
  { continent: 'Asia', country: 'Bangladesh', city: 'Dhaka' },
  { continent: 'Asia', country: 'Cambodia', city: 'Phnom Penh' },
  { continent: 'Asia', country: 'China', city: 'Beijing' },
  { continent: 'Asia', country: 'China', city: 'Shanghai' },
  { continent: 'Asia', country: 'China', city: 'Guangzhou' },
  { continent: 'Asia', country: 'China', city: 'Hong Kong' },
  { continent: 'Asia', country: 'India', city: 'Mumbai' },
  { continent: 'Asia', country: 'India', city: 'Delhi' },
  { continent: 'Asia', country: 'India', city: 'Bangalore' },
  { continent: 'Asia', country: 'India', city: 'Chennai' },
  { continent: 'Asia', country: 'India', city: 'Kolkata' },
  { continent: 'Asia', country: 'Indonesia', city: 'Jakarta' },
  { continent: 'Asia', country: 'Indonesia', city: 'Bali' },
  { continent: 'Asia', country: 'Iran', city: 'Tehran' },
  { continent: 'Asia', country: 'Iraq', city: 'Baghdad' },
  { continent: 'Asia', country: 'Israel', city: 'Tel Aviv' },
  { continent: 'Asia', country: 'Israel', city: 'Jerusalem' },
  { continent: 'Asia', country: 'Japan', city: 'Tokyo' },
  { continent: 'Asia', country: 'Japan', city: 'Osaka' },
  { continent: 'Asia', country: 'Japan', city: 'Kyoto' },
  { continent: 'Asia', country: 'Jordan', city: 'Amman' },
  { continent: 'Asia', country: 'Kuwait', city: 'Kuwait City' },
  { continent: 'Asia', country: 'Lebanon', city: 'Beirut' },
  { continent: 'Asia', country: 'Malaysia', city: 'Kuala Lumpur' },
  { continent: 'Asia', country: 'Myanmar', city: 'Yangon' },
  { continent: 'Asia', country: 'Nepal', city: 'Kathmandu' },
  { continent: 'Asia', country: 'Pakistan', city: 'Karachi' },
  { continent: 'Asia', country: 'Pakistan', city: 'Lahore' },
  { continent: 'Asia', country: 'Pakistan', city: 'Islamabad' },
  { continent: 'Asia', country: 'Philippines', city: 'Manila' },
  { continent: 'Asia', country: 'Qatar', city: 'Doha' },
  { continent: 'Asia', country: 'Saudi Arabia', city: 'Riyadh' },
  { continent: 'Asia', country: 'Saudi Arabia', city: 'Jeddah' },
  { continent: 'Asia', country: 'Singapore', city: 'Singapore' },
  { continent: 'Asia', country: 'South Korea', city: 'Seoul' },
  { continent: 'Asia', country: 'South Korea', city: 'Busan' },
  { continent: 'Asia', country: 'Sri Lanka', city: 'Colombo' },
  { continent: 'Asia', country: 'Taiwan', city: 'Taipei' },
  { continent: 'Asia', country: 'Thailand', city: 'Bangkok' },
  { continent: 'Asia', country: 'Thailand', city: 'Chiang Mai' },
  { continent: 'Asia', country: 'Turkey', city: 'Istanbul' },
  { continent: 'Asia', country: 'Turkey', city: 'Ankara' },
  { continent: 'Asia', country: 'UAE', city: 'Dubai' },
  { continent: 'Asia', country: 'UAE', city: 'Abu Dhabi' },
  { continent: 'Asia', country: 'Vietnam', city: 'Hanoi' },
  { continent: 'Asia', country: 'Vietnam', city: 'Ho Chi Minh City' },
  { continent: 'Asia', country: 'Uzbekistan', city: 'Tashkent' },
  { continent: 'Asia', country: 'Georgia', city: 'Tbilisi' },

  /* ── Europe ──────────────────────────────────────────────────────── */
  { continent: 'Europe', country: 'Austria', city: 'Vienna' },
  { continent: 'Europe', country: 'Belgium', city: 'Brussels' },
  { continent: 'Europe', country: 'Bulgaria', city: 'Sofia' },
  { continent: 'Europe', country: 'Croatia', city: 'Zagreb' },
  { continent: 'Europe', country: 'Czech Republic', city: 'Prague' },
  { continent: 'Europe', country: 'Denmark', city: 'Copenhagen' },
  { continent: 'Europe', country: 'Estonia', city: 'Tallinn' },
  { continent: 'Europe', country: 'Finland', city: 'Helsinki' },
  { continent: 'Europe', country: 'France', city: 'Paris' },
  { continent: 'Europe', country: 'France', city: 'Lyon' },
  { continent: 'Europe', country: 'France', city: 'Marseille' },
  { continent: 'Europe', country: 'France', city: 'Toulouse' },
  { continent: 'Europe', country: 'Germany', city: 'Berlin' },
  { continent: 'Europe', country: 'Germany', city: 'Munich' },
  { continent: 'Europe', country: 'Germany', city: 'Hamburg' },
  { continent: 'Europe', country: 'Germany', city: 'Frankfurt' },
  { continent: 'Europe', country: 'Germany', city: 'Cologne' },
  { continent: 'Europe', country: 'Greece', city: 'Athens' },
  { continent: 'Europe', country: 'Greece', city: 'Thessaloniki' },
  { continent: 'Europe', country: 'Hungary', city: 'Budapest' },
  { continent: 'Europe', country: 'Iceland', city: 'Reykjavik' },
  { continent: 'Europe', country: 'Ireland', city: 'Dublin' },
  { continent: 'Europe', country: 'Italy', city: 'Rome' },
  { continent: 'Europe', country: 'Italy', city: 'Milan' },
  { continent: 'Europe', country: 'Italy', city: 'Naples' },
  { continent: 'Europe', country: 'Italy', city: 'Florence' },
  { continent: 'Europe', country: 'Latvia', city: 'Riga' },
  { continent: 'Europe', country: 'Lithuania', city: 'Vilnius' },
  { continent: 'Europe', country: 'Netherlands', city: 'Amsterdam' },
  { continent: 'Europe', country: 'Netherlands', city: 'Rotterdam' },
  { continent: 'Europe', country: 'Norway', city: 'Oslo' },
  { continent: 'Europe', country: 'Norway', city: 'Bergen' },
  { continent: 'Europe', country: 'Poland', city: 'Warsaw' },
  { continent: 'Europe', country: 'Poland', city: 'Krakow' },
  { continent: 'Europe', country: 'Portugal', city: 'Lisbon' },
  { continent: 'Europe', country: 'Portugal', city: 'Porto' },
  { continent: 'Europe', country: 'Romania', city: 'Bucharest' },
  { continent: 'Europe', country: 'Russia', city: 'Moscow' },
  { continent: 'Europe', country: 'Russia', city: 'St Petersburg' },
  { continent: 'Europe', country: 'Serbia', city: 'Belgrade' },
  { continent: 'Europe', country: 'Spain', city: 'Madrid' },
  { continent: 'Europe', country: 'Spain', city: 'Barcelona' },
  { continent: 'Europe', country: 'Spain', city: 'Seville' },
  { continent: 'Europe', country: 'Spain', city: 'Valencia' },
  { continent: 'Europe', country: 'Sweden', city: 'Stockholm' },
  { continent: 'Europe', country: 'Sweden', city: 'Gothenburg' },
  { continent: 'Europe', country: 'Switzerland', city: 'Zurich' },
  { continent: 'Europe', country: 'Switzerland', city: 'Geneva' },
  { continent: 'Europe', country: 'UK', city: 'London' },
  { continent: 'Europe', country: 'UK', city: 'Manchester' },
  { continent: 'Europe', country: 'UK', city: 'Edinburgh' },
  { continent: 'Europe', country: 'UK', city: 'Birmingham' },
  { continent: 'Europe', country: 'Ukraine', city: 'Kyiv' },
  { continent: 'Europe', country: 'Slovakia', city: 'Bratislava' },
  { continent: 'Europe', country: 'Slovenia', city: 'Ljubljana' },

  /* ── North America ───────────────────────────────────────────────── */
  { continent: 'N. America', country: 'Canada', city: 'Toronto' },
  { continent: 'N. America', country: 'Canada', city: 'Vancouver' },
  { continent: 'N. America', country: 'Canada', city: 'Montreal' },
  { continent: 'N. America', country: 'Canada', city: 'Calgary' },
  { continent: 'N. America', country: 'Canada', city: 'Ottawa' },
  { continent: 'N. America', country: 'Costa Rica', city: 'San Jose' },
  { continent: 'N. America', country: 'Cuba', city: 'Havana' },
  { continent: 'N. America', country: 'Dominican Rep.', city: 'Santo Domingo' },
  { continent: 'N. America', country: 'Guatemala', city: 'Guatemala City' },
  { continent: 'N. America', country: 'Jamaica', city: 'Kingston' },
  { continent: 'N. America', country: 'Mexico', city: 'Mexico City' },
  { continent: 'N. America', country: 'Mexico', city: 'Guadalajara' },
  { continent: 'N. America', country: 'Mexico', city: 'Monterrey' },
  { continent: 'N. America', country: 'Mexico', city: 'Cancun' },
  { continent: 'N. America', country: 'Panama', city: 'Panama City' },
  { continent: 'N. America', country: 'Puerto Rico', city: 'San Juan' },
  { continent: 'N. America', country: 'Trinidad', city: 'Port of Spain' },
  { continent: 'N. America', country: 'USA', city: 'New York' },
  { continent: 'N. America', country: 'USA', city: 'Los Angeles' },
  { continent: 'N. America', country: 'USA', city: 'Chicago' },
  { continent: 'N. America', country: 'USA', city: 'Houston' },
  { continent: 'N. America', country: 'USA', city: 'San Francisco' },
  { continent: 'N. America', country: 'USA', city: 'Miami' },
  { continent: 'N. America', country: 'USA', city: 'Seattle' },
  { continent: 'N. America', country: 'USA', city: 'Boston' },
  { continent: 'N. America', country: 'USA', city: 'Denver' },
  { continent: 'N. America', country: 'USA', city: 'Nashville' },
  { continent: 'N. America', country: 'USA', city: 'Portland' },
  { continent: 'N. America', country: 'USA', city: 'Austin' },
  { continent: 'N. America', country: 'USA', city: 'Atlanta' },
  { continent: 'N. America', country: 'USA', city: 'Detroit' },
  { continent: 'N. America', country: 'USA', city: 'Minneapolis' },
  { continent: 'N. America', country: 'USA', city: 'Philadelphia' },
  { continent: 'N. America', country: 'USA', city: 'Washington DC' },
  { continent: 'N. America', country: 'USA', city: 'New Orleans' },
  { continent: 'N. America', country: 'Honduras', city: 'Tegucigalpa' },
  { continent: 'N. America', country: 'El Salvador', city: 'San Salvador' },

  /* ── South America ───────────────────────────────────────────────── */
  { continent: 'S. America', country: 'Argentina', city: 'Buenos Aires' },
  { continent: 'S. America', country: 'Argentina', city: 'Cordoba' },
  { continent: 'S. America', country: 'Bolivia', city: 'La Paz' },
  { continent: 'S. America', country: 'Brazil', city: 'Sao Paulo' },
  { continent: 'S. America', country: 'Brazil', city: 'Rio de Janeiro' },
  { continent: 'S. America', country: 'Brazil', city: 'Brasilia' },
  { continent: 'S. America', country: 'Brazil', city: 'Salvador' },
  { continent: 'S. America', country: 'Chile', city: 'Santiago' },
  { continent: 'S. America', country: 'Chile', city: 'Valparaiso' },
  { continent: 'S. America', country: 'Colombia', city: 'Bogota' },
  { continent: 'S. America', country: 'Colombia', city: 'Medellin' },
  { continent: 'S. America', country: 'Ecuador', city: 'Quito' },
  { continent: 'S. America', country: 'Paraguay', city: 'Asuncion' },
  { continent: 'S. America', country: 'Peru', city: 'Lima' },
  { continent: 'S. America', country: 'Peru', city: 'Cusco' },
  { continent: 'S. America', country: 'Uruguay', city: 'Montevideo' },
  { continent: 'S. America', country: 'Venezuela', city: 'Caracas' },
  { continent: 'S. America', country: 'Colombia', city: 'Cali' },
  { continent: 'S. America', country: 'Brazil', city: 'Belo Horizonte' },
  { continent: 'S. America', country: 'Brazil', city: 'Recife' },

  /* ── Oceania ─────────────────────────────────────────────────────── */
  { continent: 'Oceania', country: 'Australia', city: 'Sydney' },
  { continent: 'Oceania', country: 'Australia', city: 'Melbourne' },
  { continent: 'Oceania', country: 'Australia', city: 'Brisbane' },
  { continent: 'Oceania', country: 'Australia', city: 'Perth' },
  { continent: 'Oceania', country: 'Australia', city: 'Adelaide' },
  { continent: 'Oceania', country: 'Fiji', city: 'Suva' },
  { continent: 'Oceania', country: 'French Polynesia', city: 'Papeete' },
  { continent: 'Oceania', country: 'Guam', city: 'Hagatna' },
  { continent: 'Oceania', country: 'Hawaii', city: 'Honolulu' },
  { continent: 'Oceania', country: 'New Caledonia', city: 'Noumea' },
  { continent: 'Oceania', country: 'New Zealand', city: 'Auckland' },
  { continent: 'Oceania', country: 'New Zealand', city: 'Wellington' },
  { continent: 'Oceania', country: 'New Zealand', city: 'Christchurch' },
  { continent: 'Oceania', country: 'Papua New Guinea', city: 'Port Moresby' },
  { continent: 'Oceania', country: 'Samoa', city: 'Apia' },
];

/* ── state ────────────────────────────────────────────────────────── */

let menuState = createMenuState();
let menuStack = createMenuStack();
let shiftHeld = false;
let needsRedraw = true;
let tickCounter = 0;
let spinnerTick = 0;
let spinnerFrame = 0;
let statusMessage = 'Select a city';
let streamStatus = 'stopped';
let currentStationName = '';
let pendingKnobAction = null;

/* Async fetch state machine */
let fetchPhase = 'idle';     /* idle | draw_loading | searching | draw_channels | fetching | done | error */
let fetchCityName = '';
let fetchCountryName = '';

/* Cached stations from last fetch */
let stations = [];

/* ── helpers ──────────────────────────────────────────────────────── */

function cleanLabel(text, maxLen) {
  maxLen = maxLen || 22;
  let s = String(text || '');
  s = s.replace(/[^\x20-\x7E]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) s = '(untitled)';
  if (s.length > maxLen) s = s.slice(0, Math.max(0, maxLen - 1)) + '\u2026';
  return s;
}

function unique(arr) {
  const seen = {};
  const out = [];
  for (const item of arr) {
    if (!seen[item]) {
      seen[item] = true;
      out.push(item);
    }
  }
  return out;
}

function currentActivityLabel() {
  if (fetchPhase === 'draw_loading' || fetchPhase === 'searching' ||
      fetchPhase === 'draw_channels' || fetchPhase === 'fetching')
    return 'Loading';
  if (streamStatus === 'loading') return 'Loading';
  if (streamStatus === 'buffering') return 'Buffering';
  return '';
}

function currentFooter() {
  const activity = currentActivityLabel();
  if (activity) return activity + ' ' + SPINNER[spinnerFrame];
  if (streamStatus === 'streaming' && currentStationName)
    return 'Playing: ' + cleanLabel(currentStationName, 18);
  if (streamStatus === 'paused') return 'Paused';
  if (statusMessage) return statusMessage;
  return 'Jog:browse Click:select';
}

/* ── Radio Garden API helpers ─────────────────────────────────────── */

function urlEncode(str) {
  /* Minimal percent-encoding for query strings */
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) ||
        (c >= 0x30 && c <= 0x39) || c === 0x2D || c === 0x5F ||
        c === 0x2E || c === 0x7E) {
      out += str[i];
    } else if (c === 0x20) {
      out += '+';
    } else {
      const hex = c.toString(16).toUpperCase();
      out += '%' + (hex.length < 2 ? '0' : '') + hex;
    }
  }
  return out;
}

function httpGetJson(url) {
  /* Use wget with a browser User-Agent to bypass Cloudflare.
   * std.popen runs wget synchronously and reads stdout. */
  const UA = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36';
  const cmd = 'wget -U "' + UA + '" -q -O - "' + url + '"';
  let f;
  try {
    f = std.popen(cmd, 'r');
    if (!f) return null;
    let raw = '';
    let chunk;
    while ((chunk = f.readAsString(4096)) !== null && chunk.length > 0)
      raw += chunk;
    f.close();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    if (f) try { f.close(); } catch (_) {}
    return null;
  }
}

/* ── Station fetching (two-phase: search → channels) ──────────────── */

function searchForCity(cityName, countryName) {
  /* Search Radio Garden for the city to find its place ID.
   * API response format:
   *   { hits: { hits: [{ _source: { type: "place", page: { url: "/visit/berlin/6lcXHtKK" } } }] } }
   */
  const query = cityName + ' ' + countryName;
  const url = RG_API + '/search?q=' + urlEncode(query);

  const data = httpGetJson(url);
  if (!data) return null;

  const hits = data.hits && data.hits.hits;
  if (!Array.isArray(hits)) return null;

  /* Look for place type hits — extract place ID from page.url */
  for (const hit of hits) {
    const src = hit._source || hit;
    if (src.type === 'place') {
      const pageUrl = (src.page && src.page.url) || '';
      const parts = pageUrl.split('/');
      const placeId = parts[parts.length - 1];
      if (placeId && placeId.length > 2) return placeId;
    }
  }

  /* Fallback: extract place ID from a channel hit's page.place.id */
  for (const hit of hits) {
    const src = hit._source || hit;
    if (src.type === 'channel' && src.page && src.page.place && src.page.place.id)
      return src.page.place.id;
  }

  return null;
}

function fetchChannelsForPlace(placeId) {
  /* API response format:
   *   { data: { content: [{ items: [{ page: { url: "/listen/slug/channelId", title: "Name" } }] }] } }
   */
  const url = RG_API + '/ara/content/page/' + placeId + '/channels';

  const data = httpGetJson(url);
  if (!data) return [];

  const result = [];
  const content = (data.data && data.data.content) || [];

  for (const section of content) {
    const items = section.items || [];
    for (const item of items) {
      const page = item.page || {};
      const pageUrl = page.url || '';
      const title = page.title || '(Unknown Station)';

      /* Extract channel ID: last segment of /listen/{slug}/{channelId} */
      const parts = pageUrl.split('/');
      const channelId = parts.length >= 3 ? parts[parts.length - 1] : null;
      if (channelId) {
        result.push({
          id: channelId,
          title: title,
          streamUrl: RG_API + '/ara/content/listen/' + channelId + '/channel.mp3'
        });
      }
    }
  }

  return result;
}

function doFetchStations() {
  /* Phase 1: search for city to get placeId */
  const placeId = searchForCity(fetchCityName, fetchCountryName);
  if (!placeId) {
    statusMessage = 'City not found';
    fetchPhase = 'error';
    return;
  }

  /* Phase 2: fetch channels for the place */
  stations = fetchChannelsForPlace(placeId);
  if (stations.length === 0) {
    statusMessage = 'No stations found';
    fetchPhase = 'error';
    return;
  }

  fetchPhase = 'done';
  statusMessage = stations.length + ' stations';
}

/* ── menu building ────────────────────────────────────────────────── */

function buildRootMenu() {
  const continents = unique(CITIES.map(c => c.continent));
  const items = continents.map(cont =>
    createAction(cont, () => openCountryMenu(cont))
  );
  return { title: 'Radio Garden', items };
}

function openCountryMenu(continent) {
  const countries = unique(
    CITIES.filter(c => c.continent === continent).map(c => c.country)
  );
  const items = countries.map(country =>
    createAction(country, () => openCityMenu(continent, country))
  );
  menuStack.push({ title: continent, items, selectedIndex: 0 });
  menuState.selectedIndex = 0;
  needsRedraw = true;
}

function openCityMenu(continent, country) {
  const cities = CITIES.filter(
    c => c.continent === continent && c.country === country
  );
  const items = cities.map(entry =>
    createAction(entry.city, () => startFetchStations(entry.city, entry.country))
  );
  menuStack.push({ title: country, items, selectedIndex: 0 });
  menuState.selectedIndex = 0;
  needsRedraw = true;
}

function startFetchStations(cityName, countryName) {
  fetchCityName = cityName;
  fetchCountryName = countryName;
  fetchPhase = 'draw_loading';
  statusMessage = 'Loading ' + cityName + '...';
  needsRedraw = true;
}

function openStationMenu() {
  const items = stations.map(st =>
    createAction(cleanLabel(st.title), () => playStation(st))
  );
  menuStack.push({
    title: fetchCityName + ' Radio',
    items,
    selectedIndex: 0
  });
  menuState.selectedIndex = 0;
  needsRedraw = true;
}

function playStation(station) {
  currentStationName = station.title;
  host_module_set_param('station_name', station.title);
  host_module_set_param('stream_url', station.streamUrl);
  statusMessage = 'Loading...';
  needsRedraw = true;
}

/* ── knob actions (play/pause on knob 1, stop on knob 7) ─────────── */

function setPendingKnobAction(cc, action, prompt) {
  pendingKnobAction = { cc, action };
  statusMessage = prompt;
  needsRedraw = true;
}

function runKnobAction(action) {
  if (action === 'play_pause') {
    host_module_set_param('play_pause_step', 'trigger');
    statusMessage = streamStatus === 'paused' ? 'Resuming...' : 'Pausing...';
  } else if (action === 'stop') {
    host_module_set_param('stop_step', 'trigger');
    statusMessage = 'Stopping...';
    currentStationName = '';
  }
  needsRedraw = true;
}

/* ── refresh stream status ────────────────────────────────────────── */

function refreshState() {
  const prev = streamStatus;
  streamStatus = host_module_get_param('stream_status') || 'stopped';
  if (prev !== streamStatus) {
    if (streamStatus === 'loading') statusMessage = 'Loading stream...';
    else if (streamStatus === 'buffering') statusMessage = 'Buffering...';
    else if (streamStatus === 'paused') statusMessage = 'Paused';
    else if (streamStatus === 'streaming') statusMessage = 'Playing';
    else if (streamStatus === 'eof') statusMessage = 'Stream ended';
    else if (streamStatus === 'stopped') statusMessage = 'Stopped';
    needsRedraw = true;
  }
}

/* ── lifecycle ────────────────────────────────────────────────────── */

globalThis.init = function () {
  menuState = createMenuState();
  menuStack = createMenuStack();
  shiftHeld = false;
  needsRedraw = true;
  tickCounter = 0;
  spinnerTick = 0;
  spinnerFrame = 0;
  statusMessage = 'Select a city';
  streamStatus = 'stopped';
  currentStationName = '';
  pendingKnobAction = null;
  fetchPhase = 'idle';
  fetchCityName = '';
  fetchCountryName = '';
  stations = [];

  /* Build root menu: continent list */
  const root = buildRootMenu();
  menuStack.push({ title: root.title, items: root.items, selectedIndex: 0 });
  menuState.selectedIndex = 0;
};

globalThis.tick = function () {
  tickCounter = (tickCounter + 1) % 6;
  if (tickCounter === 0) refreshState();

  /* Async fetch state machine */
  if (fetchPhase === 'draw_loading') {
    /* This tick: draw the loading message, next tick: do the blocking fetch */
    clear_screen();
    drawStackMenu({
      stack: menuStack,
      state: menuState,
      footer: 'Loading ' + fetchCityName + '...'
    });
    host_flush_display();
    fetchPhase = 'searching';
    return;
  }

  if (fetchPhase === 'searching') {
    /* Blocking fetch happens here — UI already shows "Loading..." */
    doFetchStations();
    if (fetchPhase === 'done') {
      openStationMenu();
      fetchPhase = 'idle';
    } else {
      fetchPhase = 'idle';
    }
    needsRedraw = true;
    return;
  }

  /* Spinner animation */
  if (currentActivityLabel()) {
    spinnerTick = (spinnerTick + 1) % 3;
    if (spinnerTick === 0) {
      spinnerFrame = (spinnerFrame + 1) % SPINNER.length;
      needsRedraw = true;
    }
  }

  if (needsRedraw) {
    clear_screen();
    drawStackMenu({
      stack: menuStack,
      state: menuState,
      footer: currentFooter()
    });
    needsRedraw = false;
  }
};

globalThis.onMidiMessageInternal = function (data) {
  const status = data[0] & 0xF0;
  const cc = data[1];
  const val = data[2];

  /* Knob touch: stage a pending action */
  if (status === MidiNoteOn && val > 0) {
    if (cc === MoveKnob1Touch) {
      setPendingKnobAction(MoveKnob1, 'play_pause',
        streamStatus === 'paused' ? 'Resume?' : 'Pause?');
      return;
    }
    if (cc === MoveKnob7Touch) {
      setPendingKnobAction(MoveKnob7, 'stop', 'Stop stream?');
      return;
    }
  }

  if (status !== 0xB0) return;

  /* Knob turn: confirm/cancel pending action */
  if (cc === MoveKnob1 || cc === MoveKnob7) {
    const delta = decodeDelta(val);
    if (delta > 0 && pendingKnobAction && pendingKnobAction.cc === cc) {
      runKnobAction(pendingKnobAction.action);
      pendingKnobAction = null;
      needsRedraw = true;
    } else if (delta < 0 && pendingKnobAction && pendingKnobAction.cc === cc) {
      pendingKnobAction = null;
      statusMessage = 'Cancelled';
      needsRedraw = true;
    }
    return;
  }

  if (isCapacitiveTouchMessage(data)) return;

  if (cc === MoveShift) {
    shiftHeld = val > 0;
    return;
  }

  /* Menu navigation */
  const current = menuStack.current();
  if (!current) return;

  const result = handleMenuInput({
    cc,
    value: val,
    items: current.items,
    state: menuState,
    stack: menuStack,
    onBack: () => {
      if (menuStack.depth() <= 1) {
        host_return_to_menu();
      } else {
        menuStack.pop();
        const prev = menuStack.current();
        if (prev && typeof prev.selectedIndex === 'number') {
          menuState.selectedIndex = prev.selectedIndex;
        } else {
          menuState.selectedIndex = 0;
        }
      }
    },
    shiftHeld
  });

  if (result.needsRedraw) {
    /* Save selected index for restoration when popping */
    if (current) current.selectedIndex = menuState.selectedIndex;
    needsRedraw = true;
  }
};

globalThis.onMidiMessageExternal = function () {};

/* Expose chain_ui for shadow component loader compatibility. */
globalThis.chain_ui = {
  init: globalThis.init,
  tick: globalThis.tick,
  onMidiMessageInternal: globalThis.onMidiMessageInternal,
  onMidiMessageExternal: globalThis.onMidiMessageExternal
};
