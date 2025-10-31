<script lang="ts">
  import Logo from "../../assets/logo.svg";
  import Button from "./Button.svelte";
  import { graphStore } from "../graph/GraphStore";
  import IconButton from "./IconButton.svelte";

  const saveProject = () => {
    const json = JSON.stringify($graphStore, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  };
</script>

<header>
  <div>
    <img src={Logo} alt="Game Engine Studio" />
    <h1>Graph Engine</h1>
  </div>
  <div>
    <Button
      label="Save Project"
      variant="purple"
      onclick={() => saveProject()}
    />
    <IconButton
      label="Settings"
      iconName="settings-3-line"
      onclick={() => {}}
    />
  </div>
</header>

<style lang="scss">
  header {
    background: var(--background);
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    height: 60px;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    & > div {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    h1 {
      font-size: 20px;
      line-height: 28px;
      margin: 0;
      white-space: nowrap;
    }
  }
</style>
