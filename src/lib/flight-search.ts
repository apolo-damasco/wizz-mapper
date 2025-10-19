import type { Flight } from "./data-parser";

export type FlightItinerary = Flight[];

export type FlightSearchResult = FlightItinerary[];

const MIN_LAYOVER_MS = 60 * 60 * 1000;
const DEFAULT_MAX_CONNECTIONS = 2;
const MAX_ALLOWED_CONNECTIONS = 4;

type TimedFlight = {
  flight: Flight;
  departureMs: number;
  arrivalMs: number;
};

const now =
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();

function parseTime(value: string): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid date string received: ${value}`);
  }
  return timestamp;
}

export function findFlights(
  flights: Flight[],
  origin: string,
  destination: string,
  options: {
    maxConnections?: number;
    showUnavaliableFlights?: boolean;
  } = {},
): FlightSearchResult {
  const requestedConnections =
    options.maxConnections ?? DEFAULT_MAX_CONNECTIONS;
  const maxConnections = Math.max(
    0,
    Math.min(requestedConnections, MAX_ALLOWED_CONNECTIONS),
  );
  const maxLegs = maxConnections + 1;

  const startTs = now();
  console.log(
    `[findFlights] start origin="${origin}" destination="${destination}" candidates=${flights.length} maxConnections=${maxConnections} showUnavaliableFlights=${options.showUnavaliableFlights}`,
  );

  const flightsByOrigin = new Map<string, TimedFlight[]>();
  const flightTimes = new Map<Flight, TimedFlight>();

  const filteredFlights = options.showUnavaliableFlights
    ? flights
    : flights.filter((flight) => flight.availability === "Available");

  for (const flight of filteredFlights) {
    const items = flightsByOrigin.get(flight.from);
    const timedFlight: TimedFlight = {
      flight,
      departureMs: parseTime(flight.departure),
      arrivalMs: parseTime(flight.arrival),
    };
    flightTimes.set(flight, timedFlight);
    if (items) items.push(timedFlight);
    else flightsByOrigin.set(flight.from, [timedFlight]);
  }

  for (const [, items] of flightsByOrigin) {
    items.sort((a, b) => a.departureMs - b.departureMs);
  }

  const directFlights = (flightsByOrigin.get(origin) ?? [])
    .filter((item) => item.flight.to === destination)
    .map((item) => item.flight);

  let evaluatedLegs = 0;

  const connectingFlights: FlightItinerary[] = [];
  const visitedAirports = new Set<string>([origin]);

  const explore = (currentAirport: string, path: TimedFlight[]): void => {
    if (path.length >= maxLegs) return;
    const options = flightsByOrigin.get(currentAirport);
    if (!options) return;

    for (const timed of options) {
      evaluatedLegs++;
      const { flight, departureMs } = timed;

      if (path.some((segment) => segment.flight === flight)) {
        continue;
      }

      const lastArrival =
        path.length > 0 ? path[path.length - 1].arrivalMs : null;

      if (lastArrival !== null && departureMs < lastArrival + MIN_LAYOVER_MS) {
        continue;
      }

      const isDestination = flight.to === destination;
      const alreadyVisited = visitedAirports.has(flight.to);

      if (!isDestination && alreadyVisited) {
        continue;
      }

      path.push(timed);

      if (!isDestination && !alreadyVisited) {
        visitedAirports.add(flight.to);
      }

      if (isDestination) {
        if (path.length > 1) {
          connectingFlights.push(path.map((segment) => segment.flight));
        }
      } else {
        explore(flight.to, path);
      }

      path.pop();

      if (!isDestination && !alreadyVisited) {
        visitedAirports.delete(flight.to);
      }
    }
  };

  explore(origin, []);

  const compareItineraries = (
    a: FlightItinerary,
    b: FlightItinerary,
  ): number => {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const aStart = flightTimes.get(a[0])!.departureMs;
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const bStart = flightTimes.get(b[0])!.departureMs;
    if (aStart !== bStart) return aStart - bStart;

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const aEnd = flightTimes.get(a[a.length - 1])!.arrivalMs;
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const bEnd = flightTimes.get(b[b.length - 1])!.arrivalMs;
    if (aEnd !== bEnd) return aEnd - bEnd;

    return a.length - b.length;
  };

  const allItineraries: FlightItinerary[] = [
    ...directFlights.map((f) => [f]),
    ...connectingFlights,
  ];
  allItineraries.sort(compareItineraries);

  const elapsed = now() - startTs;
  console.log(
    `[findFlights] end origin="${origin}" destination="${destination}" itineraries=${allItineraries.length} evaluatedLegs=${evaluatedLegs} elapsedMs=${elapsed.toFixed(
      2,
    )}`,
  );

  return allItineraries;
}
