<script lang="ts">
  import {
    type AnimationType,
    Textimation,
    type TextimationTag,
  } from '@textimation/svelte'
  import '@textimation/svelte/styles.css'

  let text = $state('Hello from Svelte!')
  let animationSpeed = $state(50)
  let type = $state<AnimationType>('random')
  let keepCorrectChars = $state(false)
  let Comp = $state<TextimationTag>('p')
  let replay = $state(0)
  let showScroll = $state(false)
  const presets = [
    { label: 'Greeting', text: 'Hello from Svelte!' },
    { label: 'Whitespace', text: 'Decoding signal…\n\tindented line\nReady.' },
    { label: 'Emoji', text: 'Ship it 🚀 with sparkles ✨' },
    { label: 'Short', text: 'Hi!' },
    { label: 'Empty', text: '' },
  ]
  const tags: TextimationTag[] = ['span', 'p', 'div', 'h1', 'h2', 'code', 'pre']
  const snippet = $derived(
    `<Textimation\n  text={${JSON.stringify(text)}}\n  animationSpeed={${animationSpeed}}\n  type="${type}"\n  keepCorrectChars={${keepCorrectChars}}\n  Comp="${Comp}"\n/>`,
  )
</script>

<svelte:head>
  <title>textimation · Svelte playground</title>
  <meta
    name="description"
    content="Explore the Svelte 5 text scramble component."
  />
</svelte:head>

<main>
  <header>
    <div>
      <p class="eyebrow">SVELTE 5 · COMPONENT PLAYGROUND</p>
      <h1>textimation<span class="accent">.</span></h1>
    </div>
    <a href="https://github.com/TheeKia/textimation">GitHub ↗</a>
  </header>

  <div class="workspace">
    <section class="controls" aria-label="Animation controls">
      <label for="text"
        >Text <small>{Array.from(text).length} code points</small></label
      >
      <textarea id="text" bind:value={text} rows="4" spellcheck="false"
      ></textarea>
      <div class="presets" aria-label="Text presets">
        {#each presets as preset}
          <button
            type="button"
            aria-pressed={text === preset.text}
            onclick={() => (text = preset.text)}>{preset.label}</button
          >
        {/each}
      </div>

      <label for="speed">Speed <small>{animationSpeed}ms / step</small></label>
      <input
        id="speed"
        type="range"
        min="0"
        max="300"
        step="5"
        bind:value={animationSpeed}
      />
      <p class="hint">Speed changes apply live. Lower is faster.</p>

      <label for="type">Animation type</label>
      <select id="type" bind:value={type}>
        <option value="random">Random</option>
        <option value="incremental">Incremental</option>
      </select>

      <label class="checkbox">
        <input type="checkbox" bind:checked={keepCorrectChars} />
        Keep correct characters
      </label>
      <p class="hint">
        Type and character locking apply to the next text change or replay.
      </p>

      <label for="wrapper">Wrapper element</label>
      <select id="wrapper" bind:value={Comp}>
        {#each tags as tag}<option value={tag}>{tag}</option>{/each}
      </select>
      <button class="replay" type="button" onclick={() => (replay += 1)}
        >Replay animation ↻</button
      >
    </section>

    <section class="stage" aria-label="Component preview">
      <p class="eyebrow">LIVE PREVIEW</p>
      <div class="preview">
        {#key replay}
          <Textimation
            {text}
            {animationSpeed}
            {type}
            {keepCorrectChars}
            {Comp}
            class="preview-text"
          />
        {/key}
      </div>
      <p class="hint">
        Change the text mid-animation to see it transition from the current
        characters.
      </p>
      <div class="snippet">
        <p class="eyebrow">USAGE</p>
        <pre><code>{snippet}</code></pre>
      </div>
      <label class="checkbox">
        <input type="checkbox" bind:checked={showScroll} />
        Show scroll-trigger test
      </label>
    </section>
  </div>

  {#if showScroll}
    <section class="scroll-test" aria-label="Scroll-trigger preview">
      <p class="hint">
        Scroll down. The second instance waits until it enters the viewport.
      </p>
      <div class="spacer"></div>
      <Textimation
        {text}
        {animationSpeed}
        {type}
        {keepCorrectChars}
        Comp="p"
        class="preview-text"
      />
    </section>
  {/if}
  <footer>
    Respects reduced motion · Accessible target text · No per-frame component
    updates
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    color: #e9e9ed;
    background: #151518;
    font-family: system-ui, sans-serif;
  }
  :global(*) {
    box-sizing: border-box;
  }
  main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
  }
  h1 {
    margin: 4px 0;
    font-size: clamp(32px, 5vw, 48px);
    letter-spacing: -0.05em;
  }
  a {
    color: #c9c9d0;
    text-decoration: none;
  }
  .accent {
    color: #ff8566;
  }
  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.14em;
    color: #aaaab4;
  }
  .workspace {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    border: 1px solid #34343d;
    border-radius: 16px;
    overflow: hidden;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 26px;
    background: #1b1b20;
    border-right: 1px solid #34343d;
  }
  label {
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  small {
    color: #aaaab4;
    font-size: 11px;
  }
  textarea,
  select {
    width: 100%;
    background: #222228;
    color: inherit;
    border: 1px solid #45454f;
    border-radius: 8px;
    padding: 10px;
    font: inherit;
    font-size: 13px;
  }
  textarea {
    resize: vertical;
    line-height: 1.5;
  }
  input {
    accent-color: #ff8566;
  }
  button {
    border: 1px solid #45454f;
    color: inherit;
    background: transparent;
    border-radius: 6px;
    padding: 7px 9px;
    font: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  button:hover {
    background: #34343d;
  }
  button[aria-pressed='true'] {
    border-color: #ff8566;
    color: #ffb5a2;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .hint {
    color: #aaaab4;
    font-size: 12px;
    line-height: 1.6;
    margin: 0 0 10px;
  }
  .checkbox {
    justify-content: flex-start;
  }
  .replay {
    background: #ff8566;
    color: #1b1b20;
    border-color: #ff8566;
    padding: 12px;
    font-size: 13px;
    font-weight: 600;
    margin-top: 8px;
  }
  .replay:hover {
    background: #ffab94;
  }
  .stage {
    padding: 26px;
    min-width: 0;
  }
  .preview {
    min-height: 220px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #34343d;
    margin-bottom: 20px;
    overflow-wrap: anywhere;
  }
  :global(.preview-text) {
    font-family: ui-monospace, monospace;
    font-size: 26px;
    line-height: 1.5;
    margin: 0;
  }
  .snippet {
    margin: 28px 0;
  }
  pre {
    overflow: auto;
    font-size: 12px;
    line-height: 1.7;
    color: #ffc6b7;
  }
  .scroll-test {
    margin: 32px 0;
    padding: 24px;
    border: 1px solid #34343d;
    border-radius: 12px;
  }
  .spacer {
    height: 110vh;
  }
  footer {
    margin-top: 24px;
    color: #aaaab4;
    font-size: 11px;
  }
  @media (max-width: 720px) {
    .workspace {
      grid-template-columns: 1fr;
    }
    .controls {
      border-right: 0;
      border-bottom: 1px solid #34343d;
    }
    main {
      padding: 24px 16px;
    }
  }
</style>
