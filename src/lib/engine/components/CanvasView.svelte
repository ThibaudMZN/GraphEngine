<script lang="ts">
  import { onMount } from "svelte";
  import Highlight from "svelte-highlight";
  import javascript from "svelte-highlight/languages/javascript";
  import { EngineRuntime } from "../runtime";
  import { generateCode } from "../../graph/CodeGen";
  import { generatedCodeStore, graphStore } from "../../graph/GraphStore";

  let canvas: HTMLCanvasElement | undefined = $state();
  let engine: EngineRuntime | undefined = $state();
  let viewMode: "Game" | "Code" = $state("Game");

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

<button
  onclick={() => {
    viewMode = viewMode === "Game" ? "Code" : "Game";
  }}>{viewMode === "Game" ? "Code" : "Game"}</button
>

<canvas
  bind:this={canvas}
  width="600"
  height="600"
  class:hidden={viewMode === "Code"}
></canvas>
{#if viewMode === "Code"}
  <Highlight language={javascript} code={$generatedCodeStore} />
{/if}

<style>
  canvas {
    border: 1px solid white;
    box-sizing: border-box;
    width: 100%;
    height: auto;
  }

  canvas.hidden {
    display: none;
  }

  button {
    position: absolute;
    top: 0;
    right: 0;
  }
</style>
