<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { cn } from "$lib/utils.js";
    import CheckIcon from "@lucide/svelte/icons/check";
    import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
    import { tick } from "svelte";
    import type { Flight } from "../lib/data-parser";

    let {
        flights,
        selectedAirport = $bindable(),
        placeholder
    }: { flights: Flight[]; selectedAirport: string, placeholder:string } = $props();

    const airports = $derived.by(() => {
        const airports = new Set<string>();
        flights.map((flight) => {
            airports.add(flight.from);
            airports.add(flight.to);
        });
        // create a set of unique airports
        return Array.from(airports).sort();
    });

    let open = $state(false);
    let value = $state("");
    let triggerRef = $state<HTMLButtonElement>(null as unknown as HTMLButtonElement);

    function closeAndFocusTrigger() {
        open = false;
        tick().then(() => {
            triggerRef.focus();
        });
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger bind:ref={triggerRef}>
        {#snippet child({ props }: { props: any })}
            <Button
                {...props}
                variant="outline"
                class="w-[200px] justify-between"
                role="combobox"
                aria-expanded={open}
            >
                {selectedAirport || "Select an airport..."}
                <ChevronsUpDownIcon class="opacity-50" />
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-[200px] p-0">
        <Command.Root>
            <Command.Input placeholder={placeholder} />
            <Command.List>
                <Command.Empty>No airport found.</Command.Empty>
                <Command.Group value="airports">
                    {#each airports as airport (airport)}
                        <Command.Item
                            value={airport}
                            onSelect={() => {
                                selectedAirport = airport;
                                closeAndFocusTrigger();
                            }}
                        >
                            <CheckIcon
                                class={cn(
                                    value !== airport && "text-transparent",
                                )}
                            />
                            {airport}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
