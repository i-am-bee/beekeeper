import { Cache } from "beeai-framework/cache/decoratorCache";
import { RateLimiter, RateLimiterConfig } from "../helpers/rate-limiter.js";

export const F1_AVAILABLE_FIRST_SEASON_YEAR = 2023;

export function listAvailableSeasonsYear(): readonly number[] {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = F1_AVAILABLE_FIRST_SEASON_YEAR; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
}

export interface CarDataParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** Speed in km/h (can use comparison operators like '>200') */
  speed?: number | string;
  /** Engine RPM (revolutions per minute) */
  rpm?: number | string;
  /** Current gear number */
  nGear?: number | string;
  /** Throttle percentage (0-100) */
  throttle?: number | string;
  /** Brake percentage (0-100) */
  brake?: number | string;
  /** DRS status (0 = closed, 1 = open) */
  drs?: number | string;
  /** ISO 8601 date string for filtering */
  date?: string;
}

export interface CarData {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** ISO 8601 timestamp when the data was recorded */
  date: string;
  /** Speed in km/h */
  speed: number;
  /** Engine RPM (revolutions per minute) */
  rpm: number;
  /** Current gear number */
  n_gear: number;
  /** Throttle percentage (0-100) */
  throttle: number;
  /** Brake percentage (0-100) */
  brake: number;
  /** DRS status (0 = closed, 1 = open) */
  drs: number;
}

export interface DriversParams {
  /** Racing number of the driver */
  driverNumber?: number;
  /** Driver name as shown on TV broadcasts */
  broadcastName?: string;
  /** Driver's full name */
  fullName?: string;
  /** Three-letter acronym for the driver's name */
  nameAcronym?: string;
  /** Name of the team the driver is racing for */
  teamName?: string;
  /** Hexadecimal color code of the team */
  teamColour?: string;
  /** Driver's first name */
  firstName?: string;
  /** Driver's last name */
  lastName?: string;
  /** URL to the driver's headshot image */
  headshotUrl?: string;
  /** ISO 3166-1 alpha-3 country code */
  countryCode?: string;
  /** Unique identifier for the session */
  sessionKey?: number | "latest";
}

export interface Driver {
  /** Racing number of the driver */
  driver_number: number;
  /** Driver name as shown on TV broadcasts */
  broadcast_name: string;
  /** Driver's full name */
  full_name: string;
  /** Three-letter acronym for the driver's name */
  name_acronym: string;
  /** Name of the team the driver is racing for */
  team_name: string;
  /** Hexadecimal color code of the team */
  team_colour: string;
  /** Driver's first name */
  first_name: string;
  /** Driver's last name */
  last_name: string;
  /** URL to the driver's headshot image */
  headshot_url: string;
  /** ISO 3166-1 alpha-3 country code */
  country_code: string;
  /** Unique identifier for the session */
  session_key: number;
}

export interface IntervalsParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** ISO 8601 date string for filtering */
  date?: string;
  /** Time interval to the car ahead (in seconds) */
  interval?: number | string;
  /** Time gap to the race leader (in seconds) */
  gapToLeader?: number | string;
}

export interface Interval {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** ISO 8601 timestamp when the interval was recorded */
  date: string;
  /** Time interval to the car ahead (in seconds) */
  interval: number;
  /** Time gap to the race leader (in seconds) */
  gap_to_leader: number;
}

export interface LapsParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** Sequential number of the lap within the session */
  lapNumber?: number;
  /** Duration of the lap in seconds */
  lapDuration?: number | string;
  /** Whether this lap is a pit out lap */
  isPitOutLap?: boolean;
  /** Number of the stint this lap belongs to */
  stintNumber?: number;
  /** Compound of the tyres used (e.g., SOFT, MEDIUM, HARD) */
  tyreCompound?: string;
  /** Age of the tyres in laps */
  tyreAge?: number;
  /** Local time when the lap started (HH:MM:SS format) */
  lapStartTime?: string;
  /** Date when the lap started (YYYY-MM-DD format) */
  lapStartDate?: string;
  /** ISO 8601 date string for filtering */
  date?: string;
}

export interface Lap {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** Sequential number of the lap within the session */
  lap_number: number;
  /** Duration of the lap in seconds */
  lap_duration: number;
  /** Whether this lap is a pit out lap */
  is_pit_out_lap: boolean;
  /** Number of the stint this lap belongs to */
  stint_number: number;
  /** Compound of the tyres used (e.g., SOFT, MEDIUM, HARD) */
  tyre_compound: string;
  /** Age of the tyres in laps */
  tyre_age: number;
  /** Local time when the lap started (HH:MM:SS format) */
  lap_start_time: string;
  /** Date when the lap started (YYYY-MM-DD format) */
  lap_start_date: string;
  /** ISO 8601 timestamp when the lap data was recorded */
  date: string;
}

export interface LocationParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** ISO 8601 date string for filtering */
  date?: string;
  /** X coordinate on the track map */
  x?: number | string;
  /** Y coordinate on the track map */
  y?: number | string;
  /** Z coordinate (elevation) on the track map */
  z?: number | string;
}

export interface Location {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** ISO 8601 timestamp when the location was recorded */
  date: string;
  /** X coordinate on the track map */
  x: number;
  /** Y coordinate on the track map */
  y: number;
  /** Z coordinate (elevation) on the track map */
  z: number;
}

export interface MeetingsParams {
  /** Year of the championship */
  year?: number;
  /** Unique identifier for the country */
  countryKey?: number;
  /** ISO 3166-1 alpha-2 country code */
  countryCode?: string;
  /** Full name of the country */
  countryName?: string;
  /** Unique identifier for the circuit */
  circuitKey?: number;
  /** Short name of the circuit */
  circuitShortName?: string;
  /** City or region where the meeting takes place */
  location?: string;
  /** Unique identifier for the meeting */
  meetingKey?: number;
  /** Common name of the meeting */
  meetingName?: string;
  /** Official name of the meeting */
  meetingOfficialName?: string;
  /** Start date of the meeting (YYYY-MM-DD format) */
  dateStart?: string;
  /** GMT offset for the meeting location */
  gmtOffset?: string;
}

export interface Meeting {
  /** Unique identifier for the meeting */
  meeting_key: number;
  /** Common name of the meeting */
  meeting_name: string;
  /** Official name of the meeting */
  meeting_official_name: string;
  /** City or region where the meeting takes place */
  location: string;
  /** Unique identifier for the country */
  country_key: number;
  /** ISO 3166-1 alpha-2 country code */
  country_code: string;
  /** Full name of the country */
  country_name: string;
  /** Unique identifier for the circuit */
  circuit_key: number;
  /** Short name of the circuit */
  circuit_short_name: string;
  /** Start date of the meeting (YYYY-MM-DD format) */
  date_start: string;
  /** GMT offset for the meeting location */
  gmt_offset: string;
  /** Year of the championship */
  year: number;
}

export interface PitParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** Lap number when the pit stop occurred */
  lapNumber?: number;
  /** Duration of the pit stop in seconds */
  pitDuration?: number | string;
  /** ISO 8601 date string for filtering */
  date?: string;
}

export interface Pit {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** Lap number when the pit stop occurred */
  lap_number: number;
  /** Duration of the pit stop in seconds */
  pit_duration: number;
  /** ISO 8601 timestamp when the pit stop was recorded */
  date: string;
}

export interface PositionParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** ISO 8601 date string for filtering */
  date?: string;
  /** Current race position (1st, 2nd, etc.) */
  position?: number;
}

export interface Position {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** ISO 8601 timestamp when the position was recorded */
  date: string;
  /** Current race position (1st, 2nd, etc.) */
  position: number;
}

export interface RaceControlParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver (null for general messages) */
  driverNumber?: number;
  /** ISO 8601 date string for filtering */
  date?: string;
  /** Lap number when the message was issued */
  lapNumber?: number;
  /** Category of the race control message */
  category?: string;
  /** Type of flag shown (e.g., YELLOW, RED, GREEN) */
  flag?: string;
  /** Scope of the message (e.g., DRIVER, TRACK, SECTOR) */
  scope?: string;
  /** Track sector number (1, 2, or 3) */
  sector?: number;
  /** Content of the race control message */
  message?: string;
}

export interface RaceControl {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver (null for general messages) */
  driver_number: number;
  /** ISO 8601 timestamp when the message was issued */
  date: string;
  /** Lap number when the message was issued */
  lap_number: number;
  /** Category of the race control message */
  category: string;
  /** Type of flag shown (e.g., YELLOW, RED, GREEN) */
  flag: string;
  /** Scope of the message (e.g., DRIVER, TRACK, SECTOR) */
  scope: string;
  /** Track sector number (1, 2, or 3) */
  sector: number;
  /** Content of the race control message */
  message: string;
}

export interface SessionsParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Name of the session (e.g., Practice 1, Qualifying, Race) */
  sessionName?: string;
  /** Start date and time of the session (ISO 8601 format) */
  dateStart?: string;
  /** End date and time of the session (ISO 8601 format) */
  dateEnd?: string;
  /** GMT offset for the session location */
  gmtOffset?: string;
  /** Type of session (e.g., Practice, Qualifying, Race) */
  sessionType?: "Practice" | "Qualifying" | "Race";
  /** City or region where the session takes place */
  location?: string;
  /** ISO 3166-1 alpha-2 country code */
  countryCode?: string;
  /** Full name of the country */
  countryName?: string;
  /** Unique identifier for the circuit */
  circuitKey?: number;
  /** Short name of the circuit */
  circuitShortName?: string;
  /** Year of the championship */
  year?: number;
  /** Unique identifier for the meeting */
  meetingKey?: number;
}

export interface Session {
  /** Unique identifier for the session */
  session_key: number;
  /** Name of the session (e.g., Practice 1, Qualifying, Race) */
  session_name: string;
  /** Start date and time of the session (ISO 8601 format) */
  date_start: string;
  /** End date and time of the session (ISO 8601 format) */
  date_end: string;
  /** GMT offset for the session location */
  gmt_offset: string;
  /** Type of session (e.g., Practice, Qualifying, Race) */
  session_type: string;
  /** City or region where the session takes place */
  location: string;
  /** ISO 3166-1 alpha-2 country code */
  country_code: string;
  /** Country key */
  country_key: number;
  /** Full name of the country */
  country_name: string;
  /** Unique identifier for the circuit */
  circuit_key: number;
  /** Short name of the circuit */
  circuit_short_name: string;
  /** Year of the championship */
  year: number;
  /** Unique identifier for the meeting */
  meeting_key: number;
}

export interface StintsParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** Sequential number of the stint within the session */
  stintNumber?: number;
  /** Lap number when the stint started */
  lapStart?: number;
  /** Lap number when the stint ended */
  lapEnd?: number;
  /** Tyre compound used during the stint (e.g., SOFT, MEDIUM, HARD) */
  compound?: string;
  /** Age of the tyres at the start of the stint (in laps) */
  tyreAgeAtStart?: number;
}

export interface Stint {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** Sequential number of the stint within the session */
  stint_number: number;
  /** Lap number when the stint started */
  lap_start: number;
  /** Lap number when the stint ended */
  lap_end: number;
  /** Tyre compound used during the stint (e.g., SOFT, MEDIUM, HARD) */
  compound: string;
  /** Age of the tyres at the start of the stint (in laps) */
  tyre_age_at_start: number;
}

export interface TeamRadioParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** Racing number of the driver */
  driverNumber?: number;
  /** ISO 8601 date string for filtering */
  date?: string;
  /** URL to the audio recording of the team radio */
  recordingUrl?: string;
}

export interface TeamRadio {
  /** Unique identifier for the session */
  session_key: number;
  /** Racing number of the driver */
  driver_number: number;
  /** ISO 8601 timestamp when the team radio was recorded */
  date: string;
  /** URL to the audio recording of the team radio */
  recording_url: string;
}

export interface WeatherParams {
  /** Unique identifier for the session */
  sessionKey?: number;
  /** ISO 8601 date string for filtering */
  date?: string;
  /** Air temperature in Celsius */
  airTemperature?: number | string;
  /** Relative humidity percentage (0-100) */
  humidity?: number | string;
  /** Atmospheric pressure in mbar */
  pressure?: number | string;
  /** Rainfall in mm */
  rainfall?: number | string;
  /** Track surface temperature in Celsius */
  trackTemperature?: number | string;
  /** Wind direction in degrees (0-360) */
  windDirection?: number | string;
  /** Wind speed in m/s */
  windSpeed?: number | string;
}

export interface Weather {
  /** Unique identifier for the session */
  session_key: number;
  /** ISO 8601 timestamp when the weather data was recorded */
  date: string;
  /** Air temperature in Celsius */
  air_temperature: number;
  /** Relative humidity percentage (0-100) */
  humidity: number;
  /** Atmospheric pressure in mbar */
  pressure: number;
  /** Rainfall in mm */
  rainfall: number;
  /** Track surface temperature in Celsius */
  track_temperature: number;
  /** Wind direction in degrees (0-360) */
  wind_direction: number;
  /** Wind speed in m/s */
  wind_speed: number;
}

export interface ClientConfig {
  /** Base URL for the OpenF1 API (default: https://api.openf1.org/v1) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Additional HTTP headers to include in requests */
  headers?: Record<string, string>;
  /** Rate limiting configuration */
  rateLimiter?: RateLimiterConfig;
}

// Enhanced Client Configuration
export interface EnhancedClientConfig extends ClientConfig {
  /** Rate limiting configuration */
  rateLimiter?: RateLimiterConfig;
}

export class OpenF1ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status code if available */
    public status?: number,
    /** Raw response data if available */
    public response?: any,
  ) {
    super(message);
    this.name = "OpenF1ApiError";
  }
}

export class OpenF1Client {
  /**
   * Singleton instance of the OpenF1Client
   * @private
   */
  private static instance: OpenF1Client;

  /** Base URL for the OpenF1 API */
  private baseURL: string;
  /** Request timeout in milliseconds */
  private timeout: number;
  /** HTTP headers to include in requests */
  private headers: Record<string, string>;
  /** Optional rate limiter for controlling request rates */
  private rateLimiter?: RateLimiter;

  private constructor(config: ClientConfig = {}) {
    this.baseURL = config.baseURL || "https://api.openf1.org/v1";
    this.timeout = config.timeout || 10000;
    this.headers = {
      "Content-Type": "application/json",
      "User-Agent": "OpenF1-TypeScript-Client/1.0.0",
      ...config.headers,
    };

    // Initialize rate limiter if configuration is provided
    if (config.rateLimiter) {
      this.rateLimiter = new RateLimiter(config.rateLimiter);
    }
  }

  static getInstance(): OpenF1Client {
    if (!OpenF1Client.instance) {
      OpenF1Client.instance = new OpenF1Client({
        rateLimiter: {
          maxRequests: 10,
          windowMs: 10000, // 1 minute
          strategy: "queue" as const,
          maxQueueSize: 1000,
        },
      });
    }
    return OpenF1Client.instance;
  }

  /**
   * Converts camelCase parameters to snake_case and builds URLSearchParams
   * @param params - Object with camelCase parameter names
   * @returns URLSearchParams object with snake_case parameter names
   */
  private buildParams(params: Record<string, any>): URLSearchParams {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        searchParams.append(snakeKey, String(value));
      }
    });

    return searchParams;
  }

  private async makeHttpRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<T[]> {
    const searchParams = this.buildParams(params);
    const url = `${this.baseURL}${endpoint}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text().catch(() => "Unknown error");
        throw new OpenF1ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OpenF1ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new OpenF1ApiError(`Request timeout after ${this.timeout}ms`);
        }
        throw new OpenF1ApiError(`Network error: ${error.message}`);
      }

      throw new OpenF1ApiError("Unknown error occurred");
    }
  }

  /**
   * Makes a generic HTTP request to the OpenF1 API
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @returns Promise resolving to an array of API response objects
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<T[]> {
    const requestFn = () => this.makeHttpRequest<T>(endpoint, params);

    if (this.rateLimiter) {
      return this.rateLimiter.executeRequest(requestFn);
    }

    return requestFn();
  }

  // API Methods
  /** Get car telemetry data including speed, RPM, throttle, brake, and DRS status */
  @Cache()
  async getCarData(params: CarDataParams = {}): Promise<CarData[]> {
    return this.request<CarData>("/car_data", params);
  }

  /** Get information about drivers including names, team details, and nationality */
  @Cache()
  async getDrivers(params: DriversParams = {}): Promise<Driver[]> {
    return this.request<Driver>("/drivers", params);
  }

  /** Get timing intervals between drivers and gaps to the leader */
  @Cache()
  async getIntervals(params: IntervalsParams = {}): Promise<Interval[]> {
    return this.request<Interval>("/intervals", params);
  }

  /** Get lap-by-lap data including lap times, pit stops, and tyre information */
  @Cache()
  async getLaps(params: LapsParams = {}): Promise<Lap[]> {
    return this.request<Lap>("/laps", params);
  }

  /** Get real-time car positions on the track with X, Y, Z coordinates */
  @Cache()
  async getLocation(params: LocationParams = {}): Promise<Location[]> {
    return this.request<Location>("/location", params);
  }

  /** Get information about race meetings including dates, locations, and circuits */
  @Cache()
  async getMeetings(params: MeetingsParams = {}): Promise<Meeting[]> {
    return this.request<Meeting>("/meetings", params);
  }

  /** Get pit stop data including duration and lap numbers */
  @Cache()
  async getPit(params: PitParams = {}): Promise<Pit[]> {
    return this.request<Pit>("/pit", params);
  }

  /** Get driver positions throughout the session */
  @Cache()
  async getPosition(params: PositionParams = {}): Promise<Position[]> {
    return this.request<Position>("/position", params);
  }

  /** Get race control messages including flags, penalties, and safety car periods */
  @Cache()
  async getRaceControl(params: RaceControlParams = {}): Promise<RaceControl[]> {
    return this.request<RaceControl>("/race_control", params);
  }

  /** Get session information including practice, qualifying, and race sessions */
  @Cache()
  async getSessions(params: SessionsParams = {}): Promise<Session[]> {
    return this.request<Session>("/sessions", params);
  }

  /** Get stint data including tyre compounds and stint lengths */
  @Cache()
  async getStints(params: StintsParams = {}): Promise<Stint[]> {
    return this.request<Stint>("/stints", params);
  }

  /** Get team radio communications with audio recording URLs */
  @Cache()
  async getTeamRadio(params: TeamRadioParams = {}): Promise<TeamRadio[]> {
    return this.request<TeamRadio>("/team_radio", params);
  }

  /** Get weather conditions including temperature, humidity, and wind data */
  @Cache()
  async getWeather(params: WeatherParams = {}): Promise<Weather[]> {
    return this.request<Weather>("/weather", params);
  }

  // Convenience methods
  /** Get the most recent Formula 1 meeting based on start date */
  @Cache()
  async getLatestMeeting(): Promise<Meeting | null> {
    const meetings = await this.getMeetings();
    if (meetings.length === 0) {
      return null;
    }

    return meetings.sort(
      (a, b) =>
        new Date(b.date_start).getTime() - new Date(a.date_start).getTime(),
    )[0];
  }

  /** Get all drivers participating in a specific session */
  @Cache()
  async getDriversForSession(sessionKey: number): Promise<Driver[]> {
    return this.getDrivers({ sessionKey });
  }

  /** Get all sessions for a specific championship year */
  @Cache()
  async getSessionsForYear(year: number): Promise<Session[]> {
    return this.getSessions({ year });
  }

  /** Get all laps completed by a specific driver in a session */
  @Cache()
  async getLapsForDriver(
    sessionKey: number,
    driverNumber: number,
  ): Promise<Lap[]> {
    return this.getLaps({ sessionKey, driverNumber });
  }

  /** Get weather conditions for a specific session */
  @Cache()
  async getWeatherForSession(sessionKey: number): Promise<Weather[]> {
    return this.getWeather({ sessionKey });
  }

  /** Get drivers participating in the current/latest session */
  @Cache()
  async getCurrentSessionDrivers(): Promise<Driver[]> {
    const latestMeeting = await this.getLatestMeeting();
    if (!latestMeeting) {
      return [];
    }

    const sessions = await this.getSessions({
      meetingKey: latestMeeting.meeting_key,
    });
    if (sessions.length === 0) {
      return [];
    }

    const latestSession = sessions.sort(
      (a, b) =>
        new Date(b.date_start).getTime() - new Date(a.date_start).getTime(),
    )[0];

    return this.getDriversForSession(latestSession.session_key);
  }

  // Rate limiter utility methods
  /**
   * Get rate limiter statistics
   */
  getRateLimiterStats() {
    return this.rateLimiter?.getStats() || null;
  }

  /**
   * Reset the rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter?.reset();
  }

  /**
   * Update rate limiter configuration
   */
  updateRateLimiter(config: RateLimiterConfig): void {
    this.rateLimiter = new RateLimiter(config);
  }

  /**
   * Disable rate limiting
   */
  disableRateLimiter(): void {
    this.rateLimiter?.reset();
    this.rateLimiter = undefined;
  }
}

// Usage example:
/*
import { OpenF1Client, OpenF1ApiError } from './openf1-client';

async function example(): Promise<void> {
  const client = new OpenF1Client({
    timeout: 15000, // 15 seconds
    headers: {
      'Custom-Header': 'MyApp/1.0'
    }
  });
  
  try {
    // Get latest meeting
    const latestMeeting = await client.getLatestMeeting();
    console.log('Latest meeting:', latestMeeting);
    
    // Get sessions for 2024 with full type safety
    const sessions2024 = await client.getSessionsForYear(2024);
    console.log(`Found ${sessions2024.length} sessions in 2024`);
    
    // Get drivers for a specific session
    if (sessions2024.length > 0) {
      const drivers = await client.getDriversForSession(sessions2024[0].session_key);
      console.log('Drivers:', drivers.map(d => d.full_name));
    }
    
    // Get car data with type-safe parameters
    const carData = await client.getCarData({
      sessionKey: 9158,
      driverNumber: 1,
      speed: '>200'
    });
    console.log(`Found ${carData.length} car data points`);
    
    // Get current session drivers
    const currentDrivers = await client.getCurrentSessionDrivers();
    console.log('Current drivers:', currentDrivers);
    
  } catch (error) {
    if (error instanceof OpenF1ApiError) {
      console.error('API Error:', error.message, 'Status:', error.status);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Export the client and types
export default OpenF1Client;
*/

export function getClient() {
  return OpenF1Client.getInstance();
}
