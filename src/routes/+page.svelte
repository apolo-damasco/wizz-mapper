<script lang="ts">
    import { exampleData } from "./example-data";
    import { parseWizzSchedule } from "../lib/data-parser";


    const flights = parseWizzSchedule(exampleData);
</script>

<h1>Welcome to SvelteKit</h1>
<p>
    Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the
    documentation
</p>
