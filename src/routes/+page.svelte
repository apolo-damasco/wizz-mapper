<script lang="ts">
    import { type Flight, parseWizzSchedule } from "../lib/data-parser";
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

    type Result = {
        connections: Flight[];
    };

    const results: Result[] = $derived.by(() => {
        if (missingParams.length > 0) {
            return [];
        }
        return [];
    });
</script>


<div class="flex flex-col gap-4  my-5 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold"  >Wizz Mapper</h1>
    
    <AirportSelection flights={flights} bind:selectedAirport={selectedOrigin} placeholder="Select origin..." />
    <AirportSelection flights={flights} bind:selectedAirport={selectedDestination} placeholder="Select destination..." />

    <pre>{JSON.stringify(results, null, 2)}</pre>
</div>
