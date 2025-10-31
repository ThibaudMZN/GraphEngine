<script lang="ts">
  import { onMount } from "svelte";
  import { EngineRuntime } from "../runtime";
  import { generateCode } from "../../graph/CodeGen";
  import { generatedCodeStore, graphStore } from "../../graph/GraphStore";

  let canvas: HTMLCanvasElement | undefined = $state();
  let engine: EngineRuntime | undefined = $state();

  const startEngine = async () => {
    if (!canvas) return;
    if (!engine) engine = new EngineRuntime(canvas);
    const jsCode = await generateCode($graphStore);

    await engine.loadScript(jsCode);
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

<style>
  canvas {
    border: 1px solid white;
  }
</style>
