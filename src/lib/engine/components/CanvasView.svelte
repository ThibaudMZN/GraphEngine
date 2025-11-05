<script lang="ts">
  import Highlight from "svelte-highlight";
  import javascript from "svelte-highlight/languages/javascript";
  import { EngineRuntime } from "../runtime";
  import { generateCode } from "../../graph/CodeGen";
  import { generatedCodeStore, projetStore } from "../../graph/GraphStore";
  import PanelTitlebar from "../../components/PanelTitlebar.svelte";
  import IconButton from "../../components/IconButton.svelte";
  import Button from "../../components/Button.svelte";
  import { capitalizeFirstLetter } from "../../data/strings";

  let canvas: HTMLCanvasElement | undefined = $state();
  let engine: EngineRuntime | undefined = $state();
  let viewMode: "Game" | "Code" = $state("Game");
  let running: boolean = $state(false);

  const startEngine = async () => {
    running = true;
    if (!canvas) return;
    if (!engine) engine = new EngineRuntime(canvas);
    const jsCode = await generateCode($projetStore.scenes);

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

<div class="container">
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
          engine?.stop();
        }}
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
        class:hidden={viewMode === "Code"}
        class:dimmed={!running}
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
  <div class="assets-container">
    <PanelTitlebar title="Assets manager">
      <Button
        iconName="import-line"
        label="Import"
        variant="purple"
        onclick={async () => {}}
      />
    </PanelTitlebar>
    <div>
      {#each Object.keys($projetStore.scenes) as sceneId (sceneId)}
        <div>
          <input
            type="radio"
            id={sceneId}
            name="selectedScene"
            value={sceneId}
            bind:group={$projetStore.activeSceneId}
          />
          <label for={sceneId}>{capitalizeFirstLetter(sceneId)}</label>
        </div>
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
  }

  .canvas-container {
    display: flex;
    flex-direction: column;
    position: relative;
    background: #030712;
    flex: 2;

    .canvas-game-container {
      padding: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      &.hidden {
        display: none;
      }

      canvas {
        box-sizing: border-box;
        width: 100%;
        max-width: 500px;
        height: auto;
        border: 1px solid var(--border);
        border-radius: 8px;

        &.hidden {
          display: none;
        }

        &.dimmed {
          filter: brightness(0.2);
        }
      }

      .canvas-placeholder {
        position: absolute;
        box-sizing: border-box;
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

  .assets-container {
    flex: 1;
    background: #111827;

    & > div {
      padding: 16px;
    }
  }

  :global(pre[data-language="javascript"]) {
    margin: 0;
    overflow-y: scroll;
    max-height: 572px;
    height: 100%;
  }

  :global(code.hljs) {
    background: #111827;
    height: 100%;
  }
</style>
