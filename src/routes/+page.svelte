<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import * as Empty from "$lib/components/ui/empty/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select/index.js";
    import * as Table from "$lib/components/ui/table/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import { addHours, format } from "date-fns";
    import { queryParameters } from "sveltekit-search-params";
    import { parseWizzSchedule } from "../lib/data-parser";
    import { type FlightSearchResult, findFlights } from "../lib/flight-search";
    import AirportSelection from "./airport-selection.svelte";
    import { exampleData } from "./example-data";

    const queryParams = queryParameters({
        origin: true,
        destination: true,
        maxConnections: true,
        showUnavaliableFlights: true,
    });

    let selectedOrigin = $derived(queryParams.origin);
    let selectedDestination = $derived(queryParams.destination);

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
            selectedOrigin ?? "",
            selectedDestination ?? "",
            {
                maxConnections: Number(maxFlights),
                showUnavaliableFlights: showUnavaliableFlights === "true",
            },
        );
    }

    let maxFlights = $derived(queryParams.maxConnections);

    let showUnavaliableFlights = $derived(queryParams.showUnavaliableFlights);

    let pdfString = $state("");

    const flights = $derived(parseWizzSchedule(pdfString));
</script>

<div class="flex flex-col gap-4 my-5 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold">Wizz Mapper</h1>

    <div class="w-full max-w-md">
        <form>
            <Field.Group>
                <Field.Set>
                    <Field.Group>
                        <Field.Field>
                            <Field.Label for="checkout-7j9-optional-comments"
                                >Paste PDF</Field.Label
                            >
                            <Textarea
                                bind:value={pdfString}
                                placeholder="Paste PDF here text here..."
                            />
                        </Field.Field>
                    </Field.Group>
                </Field.Set>
                <Field.Set>
                    <Field.Group>
                        <div class="grid grid-cols-2 gap-4">
                            <Field.Field>
                                <Field.Label for="checkout-exp-month-ts6"
                                    >Origin</Field.Label
                                >
                                <AirportSelection
                                    {flights}
                                    bind:selectedAirport={
                                        () => selectedOrigin ?? "",
                                        (value) => (queryParams.origin = value)
                                    }
                                    placeholder="Select origin..."
                                />
                            </Field.Field>
                            <Field.Field>
                                <Field.Label for="checkout-exp-month-ts6"
                                    >Destination</Field.Label
                                >
                                <AirportSelection
                                    {flights}
                                    bind:selectedAirport={
                                        () => selectedDestination ?? "",
                                        (value) =>
                                            (queryParams.destination = value)
                                    }
                                    placeholder="Select destination..."
                                />
                            </Field.Field>
                        </div>
                    </Field.Group>
                </Field.Set>
                <Field.Separator />
                <Field.Set>
                    <Field.Legend>Unavaliable flights</Field.Legend>
                    <Field.Description>
                        Flights that are not available
                    </Field.Description>
                    <Field.Group>
                        <Field.Field orientation="horizontal">
                            <Checkbox
                                id="checkout-7j9-same-as-shipping-wgm"
                                bind:checked={
                                    () => showUnavaliableFlights === "true",
                                    (value) =>
                                        (queryParams.showUnavaliableFlights =
                                            value ? "true" : "false")
                                }
                            />
                            <Field.Label
                                for="checkout-7j9-same-as-shipping-wgm"
                                class="font-normal"
                            >
                                Show unavaliable flights
                            </Field.Label>
                        </Field.Field>
                    </Field.Group>
                </Field.Set>
                <Field.Separator />
                <Field.Set>
                    <Field.Group>
                        <Field.Field>
                            <Field.Label for="checkout-7j9-optional-comments"
                                >Max connections</Field.Label
                            >
                            <Input
                                type="number"
                                min={0}
                                max={10}
                                bind:value={
                                    () => maxFlights,
                                    (value) =>
                                        (queryParams.maxConnections = value)
                                }
                                placeholder="Max flights"
                            />
                        </Field.Field>
                    </Field.Group>
                </Field.Set>
                <Field.Field orientation="horizontal">
                    <Button onclick={findResults}>Find flights</Button>
                </Field.Field>
            </Field.Group>
        </form>
    </div>
</div>
<div class="border my-4 rounded mx-4">
    {#if flightSearchResults}
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>First connection</Table.Head>
                    <Table.Head>Second connection</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each flightSearchResults.direct as flight (flight)}
                    {@const departure = new Date(flight.departure)}
                    {@const arrival = new Date(flight.arrival)}
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            {flight.from}
                            <Badge variant="default">
                                {format(addHours(departure, -2), "EEE HH:mm")}
                            </Badge>
                            -> {flight.to}
                            <Badge variant="default">
                                {format(addHours(arrival, -2), " EEE HH:mm")}
                            </Badge>
                        </Table.Cell>
                    </Table.Row>
                {/each}
                {#each flightSearchResults.connecting as itinerary (itinerary)}
                    <Table.Row>
                        {#each itinerary as flight (flight)}
                            {@const departure = new Date(flight.departure)}
                            {@const arrival = new Date(flight.arrival)}
                            <Table.Cell class="font-medium">
                                {flight.from}
                                <Badge variant="default">
                                    {format(
                                        addHours(departure, -2),
                                        " EEE HH:mm",
                                    )}
                                </Badge>
                                -> {flight.to}
                                <Badge variant="default">
                                    {format(
                                        addHours(arrival, -2),
                                        " EEE HH:mm",
                                    )}
                                </Badge>
                            </Table.Cell>
                        {/each}
                    </Table.Row>
                {/each}
            </Table.Body>
            <Table.Footer>
                <Table.Row>
                    <Table.Cell colspan={3}>Total</Table.Cell>
                    <Table.Cell class="text-right">
                        {flightSearchResults.direct.length} direct flights
                        {flightSearchResults.connecting.length} connecting flights</Table.Cell
                    >
                </Table.Row>
            </Table.Footer>
        </Table.Root>
    {:else}
        <Empty.Root>
            <Empty.Header>
                {#if missingParams.length > 0}
                    <Empty.Title>Missing parameters</Empty.Title>
                    <Empty.Description>
                        Please select an origin and destination
                    </Empty.Description>
                {:else}
                    <Empty.Title>No flights found</Empty.Title>
                    <Empty.Description>No flights found</Empty.Description>
                {/if}
            </Empty.Header>
        </Empty.Root>
    {/if}
</div>
