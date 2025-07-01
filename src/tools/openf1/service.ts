import { Cache } from "beeai-framework/cache/decoratorCache";
import { parseISO } from "date-fns";
import {
  F1_AVAILABLE_FIRST_SEASON_YEAR,
  getClient,
  listAvailableSeasonsYear,
  OpenF1Client,
} from "./client.js";
import * as dto from "./dto.js";

// meetings endpoint (produce: meeting_key) is used to get Grands Prix
// sessions endpoint (filter: meeting_key, produce: session_key) is used to list sessions like Practice, Qualifying, Race in a Grand Prix
// positions endpoint (filter: session_key, produce: driver_number) is used to get drivers and their positions in a specific session

// F1 Grand Prix Canada 2025 (meeting_key: 1263)
// Race (session_key: 9963)
// Winner - George RUSSELL (driver_number: 63)
// Second - Charles LECLERC (driver_number: 16)
// Crash - Lando Norris (driver_number: 4)

export class OpenF1Service {
  private static instance: OpenF1Service | null = null;
  private client: OpenF1Client;

  private constructor() {
    // Private constructor to prevent instantiation
    this.client = getClient();
  }

  public static getInstance(): OpenF1Service {
    if (!OpenF1Service.instance) {
      OpenF1Service.instance = new OpenF1Service();
    }
    return OpenF1Service.instance;
  }

  @Cache()
  public listSeasons(): dto.Season[] {
    const seasons = listAvailableSeasonsYear().map(
      (year) =>
        ({
          season_id: year,
          year: year,
          state: year === new Date().getFullYear() ? "active" : "completed",
        }) satisfies dto.Season,
    );
    return seasons;
  }

  @Cache()
  public getSeason(year: number): dto.Season {
    this.validateYear(year);
    const [season] = this.listSeasons().filter(
      (it) => !year || year === it.year,
    );
    return season;
  }

  @Cache()
  public async getGrandPrixDetail(
    grand_prix_id: number,
  ): Promise<dto.GrandPrixDetail> {
    const [meeting] = await this.client.getMeetings({
      meetingKey: grand_prix_id,
    });

    if (!meeting) {
      throw new Error(`Grand Prix with ID ${grand_prix_id} not found.`);
    }

    const sessions = await this.listSessionOnGrandPrix(meeting.meeting_key);
    const grandPrix: dto.GrandPrixDetail = {
      grand_prix_id: meeting.meeting_key,
      name: meeting.meeting_name,
      official_name: meeting.meeting_official_name,
      circuit: meeting.circuit_short_name,
      date: parseISO(meeting.date_start),
      country: meeting.country_name,
      location: meeting.location,
      sessions: sessions,
    };

    return grandPrix;
  }

  @Cache()
  public async getSeasonDetail(year: number): Promise<dto.SeasonDetail> {
    this.validateYear(year);

    const meetings = (await this.client.getMeetings({ year })).filter(
      ({ meeting_name }) =>
        meeting_name.toLocaleLowerCase().trimEnd().includes("grand prix"),
    );

    const grandsPrix = meetings
      .map(
        (m) =>
          ({
            grand_prix_id: m.meeting_key,
            name: m.meeting_name,
            date: parseISO(m.date_start),
          }) satisfies dto.GrandPrixRef,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const season: dto.SeasonDetail = {
      ...this.getSeason(year),
      grands_prix: grandsPrix,
    };

    return season;
  }

  @Cache()
  public async getDriver(driverId: number, session_id: number): Promise<dto.DriverDetail> {
    const [driver] = await this.client.getDrivers({
      sessionKey: session_id,
      driverNumber: driverId,
    });

    return {
      driver_id: driver.driver_number,
      broadcast_name: driver.broadcast_name,
      full_name: driver.full_name,
      name_acronym: driver.name_acronym,
      team_name: driver.team_name,
      team_colour: driver.team_colour,
      first_name: driver.first_name,
      last_name: driver.last_name,
      headshot_url: driver.headshot_url,
      country_code: driver.country_code || null,
    } satisfies dto.DriverDetail;
  }

  @Cache()
  public async listSessionOnGrandPrix(
    grandPrixId: number,
    type?: string,
  ): Promise<dto.SessionDetail[]> {
    const sessions = await this.client.getSessions({
      meetingKey: grandPrixId,
    });

    return sessions
      .filter(
        (s) =>
          !type ||
          type.toLocaleLowerCase() === s.session_type.toLocaleLowerCase(),
      )
      .map(
        (session) =>
          ({
            session_id: session.session_key,
            grand_prix_id: session.meeting_key,
            location: session.location,
            date_start: parseISO(session.date_start),
            date_end: parseISO(session.date_end),
            session_type: session.session_type,
            session_name: session.session_name,
            country_id: session.country_key,
            country_code: session.country_code,
            country_name: session.country_name,
            circuit_id: session.circuit_key,
            circuit_short_name: session.circuit_short_name,
            gmt_offset: session.gmt_offset,
            year: session.year,
          }) satisfies dto.SessionDetail,
      );
  }

  @Cache()
  public async listPositions(
    grandPrixId: number,
    type: dto.SessionPositionTypeEnum,
    when: "start" | "finish",
  ): Promise<dto.Position[]> {
    const [session] = await this.listSessionOnGrandPrix(grandPrixId, type);
    const positions = await this.client.getPosition({
      sessionKey: session.session_id,
    });

    const positionsMap = new Map<number, number>();
    for (const position of positions) {
      const { driver_number, position: currentPosition } = position;

      const lastPosition = positionsMap.get(driver_number);
      switch (when) {
        case "start":
          if (lastPosition !== undefined) {
            continue; // Skip if we are looking for the start and the current position is worse than the last one
          }
          // Save first position for the driver
          positionsMap.set(driver_number, currentPosition);
          break;
        case "finish":
          // Save last position for the driver
          positionsMap.set(driver_number, currentPosition);
          break;
      }
    }

    const result: dto.Position[] = [];
    for (const position of Array.from(positionsMap.entries())) {
      const [driverNumber, positionValue] = position;
      const driver = await this.getDriver(driverNumber, session.session_id);
      result.push({
        position: positionValue,
        driver: {
          driver_id: driver.driver_id,
          full_name: driver.full_name,
        },
      } satisfies dto.Position);
    }

    return result.sort((a, b) => a.position - b.position);
  }

  /** UTILS */
  private validateYear(year: number): void {
    if (
      year < F1_AVAILABLE_FIRST_SEASON_YEAR ||
      year > new Date().getFullYear()
    ) {
      throw new Error(
        `Year must be between ${F1_AVAILABLE_FIRST_SEASON_YEAR} and ${new Date().getFullYear()}`,
      );
    }
  }
}
