<script lang="ts">
  import { onMount } from "svelte";
  import { EngineRuntime } from "../runtime";
  import { generatedCodeStore } from "../../graph/GraphStore";

  let canvas: HTMLCanvasElement | undefined = $state();
  let engine: EngineRuntime | undefined = $state();

  const startEngine = async () => {
    if (!canvas) return;
    if (!engine) engine = new EngineRuntime(canvas);

    await engine.loadScript($generatedCodeStore);
    engine.init();
  };

  onMount(async () => {
    await startEngine();
  });

  //TODO: We should create a derived store that only compiles code when node or connections or parameters are changed
  generatedCodeStore.subscribe(async (g) => {
    await startEngine();
  });
</script>

<canvas bind:this={canvas} width="600" height="400"></canvas>
