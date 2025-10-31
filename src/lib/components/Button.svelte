<script lang="ts">
  interface Props {
    iconName?: string;
    label: string;
    variant: "green" | "purple";
    onclick: () => void;
  }

  let { iconName, label, variant, onclick }: Props = $props();
</script>

<button aria-label={label} {onclick} class={variant}>
  {#if iconName}
    <i class="ri-{iconName}"></i>
  {/if}
  <span>{label}</span>
</button>

<style lang="scss">
  button {
    font-family: "Open Sans", sans-serif;
    border: none;
    padding: 6px 12px;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    border-radius: 8px;
    background: none;

    &.green {
      background: var(--green);
    }

    &.purple {
      background: var(--purple);
    }
  }
</style>
