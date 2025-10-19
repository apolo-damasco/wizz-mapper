<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { parseWizzSchedule } from "../lib/data-parser";
    import { type FlightSearchResult, findFlights } from "../lib/flight-search";
    import AirportSelection from "./airport-selection.svelte";
    import { exampleData } from "./example-data";

    const flights = parseWizzSchedule(exampleData);

    let selectedOrigin = $state("");
    let selectedDestination = $state("");

    let missingParams: string[] = $derived.by(() => {
        const params = [];
        if (!selectedOrigin) {
            params.push("origin");
        }
        if (!selectedDestination) {
            params.push("destination");
        }
        return params;
    });

    let flightSearchResults: FlightSearchResult | null = $state(null);

    function findResults() {
        if (missingParams.length > 0) {
            return null;
        }
        flightSearchResults = findFlights(
            flights,
            selectedOrigin,
            selectedDestination,
        );
    }

    let maxFlights = $state(1);
</script>

<div class="flex flex-col gap-4 my-5 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold">Wizz Mapper</h1>

    <AirportSelection
        {flights}
        bind:selectedAirport={selectedOrigin}
        placeholder="Select origin..."
    />
    <AirportSelection
        {flights}
        bind:selectedAirport={selectedDestination}
        placeholder="Select destination..."
    />

    <Input
        type="number"
        min={1}
        max={10}
        bind:value={maxFlights}
        placeholder="Max flights"
    />

    <Button variant="outline" onclick={findResults}>Find flights</Button>

    <pre>{JSON.stringify(flightSearchResults, null, 2)}</pre>
</div>
