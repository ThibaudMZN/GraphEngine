<script lang="ts">
  import Highlight from "svelte-highlight";
  import javascript from "svelte-highlight/languages/javascript";
  import { EngineRuntime } from "../runtime";
  import { generateCode } from "../../graph/CodeGen";
  import { generatedCodeStore, graphStore } from "../../graph/GraphStore";
  import PanelTitlebar from "../../components/PanelTitlebar.svelte";
  import IconButton from "../../components/IconButton.svelte";
  import Button from "../../components/Button.svelte";

  let canvas: HTMLCanvasElement | undefined = $state();
  let engine: EngineRuntime | undefined = $state();
  let viewMode: "Game" | "Code" = $state("Game");
  let running: boolean = $state(false);

  const startEngine = async () => {
    running = true;
    if (!canvas) return;
    if (!engine) engine = new EngineRuntime(canvas);
    const jsCode = await generateCode($graphStore);

    await engine.loadScript(jsCode);
    engine.init();
  };

  // onMount(async () => {
  //   await startEngine();
  // });
  //
  // generatedCodeStore.subscribe(async (g) => {
  //   await startEngine();
  // });
</script>

<div class="canvas-container">
  <PanelTitlebar title="Game Preview">
    <Button
      iconName="play-circle-line"
      label="Run"
      variant="green"
      onclick={async () => await startEngine()}
    />
    <IconButton
      iconName="stop-circle-line"
      label="Stop game"
      variant={running ? "red" : undefined}
      onclick={() => {
        running = false;
      }}
    />
    <IconButton
      iconName="refresh-line"
      label="Auto reload"
      onclick={async () => await startEngine()}
    />

    {#if viewMode === "Game"}
      <IconButton
        iconName="code-s-slash-line"
        label="Show code"
        onclick={() => {
          viewMode = "Code";
        }}
      />
    {:else}
      <IconButton
        iconName="gamepad-line"
        label="Show game"
        onclick={() => {
          viewMode = "Game";
        }}
      />
    {/if}
  </PanelTitlebar>
  <div class="canvas-game-container" class:hidden={viewMode === "Code"}>
    <canvas
      bind:this={canvas}
      width="600"
      height="600"
      class:hidden={viewMode === "Code" || !running}
    ></canvas>
    {#if !running && viewMode === "Game"}
      <div class="canvas-placeholder">
        <i class="ri-play-circle-line"></i>
        <span class="alt-text">Press Run to preview your game</span>
      </div>
    {/if}
  </div>
  {#if viewMode === "Code"}
    <Highlight language={javascript} code={$generatedCodeStore} />
  {/if}
</div>

<style lang="scss">
  .canvas-container {
    display: flex;
    flex-direction: column;
    position: relative;
    background: #030712;

    .canvas-game-container {
      padding: 0 36px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.hidden {
        display: none;
      }

      canvas {
        box-sizing: border-box;
        width: 100%;
        height: auto;
        border: 1px solid var(--border);
        border-radius: 8px;

        &.hidden {
          display: none;
        }
      }

      .canvas-placeholder {
        border: 1px solid var(--border);
        box-sizing: border-box;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 16px;
        font-size: 64px;
        color: var(--border);

        span {
          font-size: 14px;
          line-height: 20px;
        }
      }
    }
  }

  :global(pre[data-language="javascript"]) {
    margin: 0;
    height: 100%;
  }

  :global(code.hljs) {
    background: #111827;
    height: 100%;
  }
</style>
