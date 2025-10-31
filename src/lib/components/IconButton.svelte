<script lang="ts">
  interface Props {
    iconName: string;
    label: string;
    onclick: () => void;
    variant?: "red";
  }

  let { iconName, label, variant, onclick }: Props = $props();
</script>

<button aria-label={label} {onclick} class={variant}>
  <i class="ri-{iconName}"></i>
</button>

<style lang="scss">
  button {
    cursor: pointer;
    border: none;
    background: none;
    margin: 0;
    padding: 8px;
    border-radius: 8px;

    &.red {
      color: var(--red-dimmed);
    }

    &:hover {
      background: var(--border);
    }
  }
</style>
