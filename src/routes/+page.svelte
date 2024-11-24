<script lang="ts">
  import debug from 'debug';
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';
  import { getRandomSuggestion, splitLines } from '$lib/junk';
  import { isKevinState, type LimerickResponse } from '$lib/kevin.types.js';

  const log = debug('app:home');

  const { data } = $props();

  log('load data', data);

  // states
  let topicInput;
  let isLoading = $state(false);
  let greeting = $state(data.greeting);
  let lyrics = $state([] as string[]);
  let flavor = $state([] as string[]);
  let warnings = $state(0);
  let timeout = $state(0);

  // elements
  let shareDialog: HTMLDialogElement;

  function handleResponse(data: LimerickResponse) {
    lyrics = splitLines(data.lyrics || '');
    flavor = splitLines(data.flavor);
    updateServerState(data);
  }

  function suggest() {
    topicInput!.value = getRandomSuggestion();
  }

  function updateServerState(state: any) {
    if (isKevinState(state)) {
      // start countdown if a new timeout is set
      if (!timeout && state.timeout) {
        const interval = setInterval(() => {
          if (timeout > 0) timeout--;
          else {
            clearInterval(interval);
            location.reload();
          }
        }, 1000);
      }
      warnings = state.warnings;
      timeout = state.timeout;
    }
  }

  onMount(() => {
    updateServerState(data);
  });
</script>

<section class="mx-auto my-8 max-w-4xl rounded-md bg-white p-6 shadow-md">
  <h1 class="mb-4 text-center text-2xl font-bold"></h1>

  <p class="mb-4">{greeting}</p>

  {#if !timeout}
    <form
      class="form center mx-auto grid max-w-96"
      method="POST"
      action="?/limerick"
      use:enhance={({ cancel }) => {
        lyrics = [];
        flavor = [];
        if (isLoading) {
          cancel();
          return;
        }
        isLoading = true;
        return async ({ result }) => {
          isLoading = false;
          log('got this result', result);
          if (result.type === 'success') {
            handleResponse(result.data as LimerickResponse);
          }
        };
      }}>
      <input
        type="text"
        name="topic"
        placeholder="Short, fun limerick topic"
        class="flex-auto"
        bind:this={topicInput} />
      <div class="flex justify-center">
        <button type="button" class="h-12 w-24" onclick={suggest}>Suggest</button>
        <button type="submit" class="h-12 w-24">Submit</button>
      </div>
    </form>
  {/if}

  {#if warnings > 0}
    <p class="text-xl text-red-900">Warning {warnings} / 3</p>
  {/if}
  {#if timeout > 0}
    <p class="text-xl text-red-900">You're in TIME-OUT!</p>
    <p>For {timeout} more seconds...</p>
  {/if}

  {#if isLoading}
    <p class="my-4 text-center">You got Kevin thinking right now...</p>
  {/if}

  <div>
    <div class="my-4 text-center">
      {#each lyrics as line}
        <p>{line}</p>
      {/each}
      <!--
      {#if lyrics.length}
        <form
          method="POST"
          action="?/share"
          use:enhance={({ cancel }) => {
            return async ({ result }) => {
              isLoading = false;
              log('got this result', result);
              if (result.type === 'success') {
              }
            };
          }}>
          <input type="hidden" name="id" value="hiddenValue" />
          <input type="hidden" name="name" value="hiddenValue" />
          <button type="submit" class="h-12 w-24">Share</button>
        </form>
      {/if}
    -->
    </div>
    <div class="my-4">
      {#each flavor as line}
        <p class="mb-4">{line}</p>
      {/each}
    </div>
  </div>
</section>
