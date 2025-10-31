<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<div class="panel-header">
  <h2>{title}</h2>
  {#if children}
    <div>
      {@render children()}
    </div>
  {/if}
</div>

<style lang="scss">
  .panel-header {
    padding: 8px 16px;
    background: var(--background);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 14px;
      line-height: 20px;
    }

    div {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
</style>
