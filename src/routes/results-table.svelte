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
    import {
        addHours,
        format,
        formatDistance,
        formatDistanceStrict,
    } from "date-fns";
    import { queryParameters } from "sveltekit-search-params";
    import { parseWizzSchedule } from "../lib/data-parser";
    import {
        type FlightItinerary,
        type FlightSearchResult,
        findFlights,
    } from "../lib/flight-search";
    import {
        countConnections,
        computeLayoverTotalMs,
        isItineraryDaytimeOnly,
    } from "../lib/itinerary-utils";
    import AirportSelection from "./airport-selection.svelte";
    import { exampleData } from "./example-data";
    import * as Accordion from "$lib/components/ui/accordion/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    let { flightSearchResults }: { flightSearchResults: FlightSearchResult } =
        $props();

    let open = $state(false);

    let selectedItinerary: FlightItinerary | null = $state(null);
</script>

<Table.Root>
    <Table.Header>
        <Table.Row>
            <Table.Head>Departure</Table.Head>
            <Table.Head>Arrival</Table.Head>
            <Table.Head>Duration</Table.Head>
            <Table.Head>Layover Duration</Table.Head>
            <Table.Head>Connections</Table.Head>
            <Table.Head>Daytime Only</Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each flightSearchResults as itinerary (itinerary)}
            {@const departure = new Date(itinerary[0].departure)}
            {@const arrival = new Date(itinerary[itinerary.length - 1].arrival)}
            {@const connections = countConnections(itinerary)}
            {@const layoverTotalMs = computeLayoverTotalMs(itinerary)}
            {@const daytimeOnly = isItineraryDaytimeOnly(itinerary, -2)}

            <Table.Row
                class="cursor-pointer"
                onclick={() => {
                    selectedItinerary = itinerary;
                    open = true;
                }}
            >
                <Table.Cell class="font-medium">
                    {format(addHours(departure, -2), " EEE HH:mm")}
                </Table.Cell>
                <Table.Cell class="font-medium">
                    {format(addHours(arrival, -2), " EEE HH:mm")}
                </Table.Cell>
                <Table.Cell class="font-medium">
                    {formatDistanceStrict(departure, arrival, {
                        unit: "hour",
                    })}
                    ({formatDistance(departure, arrival)})
                </Table.Cell>
                <Table.Cell class="font-medium">
                    {#if connections > 0}
                        {formatDistanceStrict(
                            new Date(0),
                            new Date(layoverTotalMs),
                            { unit: "hour" },
                        )}
                        ({formatDistance(
                            new Date(0),
                            new Date(layoverTotalMs),
                        )})
                    {:else}-{/if}
                </Table.Cell>
                <Table.Cell class="font-medium">{connections}</Table.Cell>
                <Table.Cell class="font-medium"
                    >{daytimeOnly ? "Yes" : "No"}</Table.Cell
                >
            </Table.Row>
        {/each}
    </Table.Body>
    <Table.Footer>
        <Table.Row>
            <Table.Cell colspan={5}>Total</Table.Cell>
            <Table.Cell class="text-right">
                {flightSearchResults.filter((i) => i.length === 1).length} direct
                flights
                {flightSearchResults.filter((i) => i.length > 1).length}
                connecting flights</Table.Cell
            >
        </Table.Row>
    </Table.Footer>
</Table.Root>

<Dialog.Root
    bind:open
    onOpenChange={(open) => {
        if (!open) {
            selectedItinerary = null;
        }
    }}
>
    <Dialog.Content>
        <Dialog.Header>
            {#if selectedItinerary}
                {@const dep = new Date(selectedItinerary[0].departure)}
                {@const arr = new Date(
                    selectedItinerary[selectedItinerary.length - 1].arrival,
                )}
                <Dialog.Title>
                    {format(addHours(dep, -2), "EEE HH:mm")} · {selectedItinerary[0]
                        .from}
                    — {format(addHours(arr, -2), "EEE HH:mm")} · {selectedItinerary[
                        selectedItinerary.length - 1
                    ].to}
                </Dialog.Title>
                <Dialog.Description>
                    Total travel time: {formatDistance(dep, arr)}
                </Dialog.Description>
            {/if}
        </Dialog.Header>
        {#if selectedItinerary}
            <div class="space-y-4">
                {#each selectedItinerary as leg, idx (leg)}
                    {@const legDep = new Date(leg.departure)}
                    {@const legArr = new Date(leg.arrival)}
                    <div class="grid grid-cols-[16px_1fr] gap-x-3">
                        <div class="flex justify-center">
                            <div
                                class="mt-1 h-2 w-2 rounded-full bg-foreground/70"
                            ></div>
                        </div>
                        <div class="font-medium">
                            {format(addHours(legDep, -2), "EEE HH:mm")} · {leg.from}
                        </div>

                        <div class="flex justify-center">
                            <div class="my-1 h-4 w-px bg-border"></div>
                        </div>
                        <div class="text-sm text-muted-foreground">
                            Travel time: {formatDistanceStrict(legDep, legArr)} ({formatDistance(
                                legDep,
                                legArr,
                            )})
                        </div>

                        <div class="flex justify-center">
                            <div
                                class="mt-1 h-2 w-2 rounded-full bg-foreground/70"
                            ></div>
                        </div>
                        <div class="font-medium">
                            {format(addHours(legArr, -2), "EEE HH:mm")} · {leg.to}
                        </div>
                    </div>

                    {#if idx < selectedItinerary.length - 1}
                        {@const nextDep = new Date(
                            selectedItinerary[idx + 1].departure,
                        )}
                        {@const layoverMs =
                            nextDep.getTime() - legArr.getTime()}
                        <div class="grid grid-cols-[16px_1fr] gap-x-3 mt-2">
                            <div class="flex justify-center">
                                <div class="h-6 w-px bg-border"></div>
                            </div>
                            <div class="text-sm text-muted-foreground">
                                {formatDistanceStrict(
                                    new Date(0),
                                    new Date(layoverMs),
                                )} layover · {leg.to}
                            </div>
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
