<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import * as Field from "$lib/components/ui/field/index.js";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
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
            {
                maxConnections: maxFlights,
                showUnavaliableFlights,
            },
        );
    }

    let maxFlights = $state(3);

    let showUnavaliableFlights = $state(false);
</script>

<div class="flex flex-col gap-4 my-5 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold">Wizz Mapper</h1>

    <div class="w-full max-w-md">
        <form>
            <Field.Group>
                <Field.Set>
                    <Field.Group>
                        <div class="grid grid-cols-2 gap-4">
                            <Field.Field>
                                <Field.Label for="checkout-exp-month-ts6"
                                    >Origin</Field.Label
                                >
                                <AirportSelection
                                    {flights}
                                    bind:selectedAirport={selectedOrigin}
                                    placeholder="Select origin..."
                                />
                            </Field.Field>
                            <Field.Field>
                                <Field.Label for="checkout-exp-month-ts6"
                                    >Destination</Field.Label
                                >
                                <AirportSelection
                                    {flights}
                                    bind:selectedAirport={selectedDestination}
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
                                bind:checked={showUnavaliableFlights}
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
                                min={1}
                                max={10}
                                bind:value={maxFlights}
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

    <pre>{JSON.stringify(flightSearchResults, null, 2)}</pre>
</div>
