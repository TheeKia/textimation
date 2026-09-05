<script lang="ts">
  import { Textimation } from '@textimation/svelte'

  let text = $state('Hello from Svelte!')
</script>

<main>
  <h1>textimation · Svelte playground</h1>
  <p>
    The Svelte package is ready for development. Animation is not implemented
    yet.
  </p>
  <label>
    Preview text
    <input bind:value={text} />
  </label>
  <section aria-label="Component preview">
    <Textimation {text} />
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #18181b;
    color: #fafafa;
    font-family: system-ui, sans-serif;
  }
  main {
    max-width: 48rem;
    margin: 4rem auto;
    padding: 0 1.5rem;
  }
  label {
    display: grid;
    gap: 0.5rem;
  }
  input {
    padding: 0.75rem;
    font: inherit;
  }
  section {
    margin-top: 2rem;
    padding: 2rem;
    border: 1px solid #52525b;
    font-family: monospace;
    white-space: pre-wrap;
  }
</style>
