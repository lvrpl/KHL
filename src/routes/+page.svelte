<script lang="ts">
  import debug from 'debug';
  import { enhance } from '$app/forms';
  import { isKevinLimerick, isKevinRejection, type KevinLimerick, type KevinRejection } from '$lib/kevin.types';
  import { getRandomSuggestion, splitLines } from '$lib/junk.js';

  const log = debug('app:home');

  const { data } = $props();

  // states
  let topicInput;
  let isLoading = $state(false);
  let lyrics = $state([] as string[]);
  let flavor = $state([] as string[]);

  function handleLimerick(data: KevinLimerick) {
    lyrics = splitLines(data.lyrics);
    flavor = splitLines(data.flavor);
  }

  function handleRejection(data: KevinRejection) {
    lyrics = [];
    flavor = splitLines(data.flavor);
  }

  function suggest() {
    topicInput!.value = getRandomSuggestion();
  }
</script>

<section class="mx-auto my-8 max-w-4xl rounded-md bg-white p-6 shadow-md">
  <p class="mb-4">{data.greeting}</p>

  <form
    class="form center mx-auto grid max-w-96"
    method="POST"
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
          if (isKevinLimerick(result.data)) handleLimerick(result.data);
          else if (isKevinRejection(result.data)) handleRejection(result.data);
        }
      };
    }}>
    <p>Write a quick, fun suggestion...</p>
    <div class="flex">
      <input type="text" name="topic" placeholder="" class="flex-auto" bind:this={topicInput} required />
      <button type="button" class="w-16 justify-self-center bg-slate-300" on:click={suggest}>Another</button>
    </div>
    <button type="submit" class="w-32 justify-self-center">Submit</button>
  </form>

  {#if isLoading}
    <p class="my-4 text-center">You got Kevin thinking right now...</p>
  {/if}

  <div>
    <div class="my-4 text-center">
      {#each lyrics as line}
        <p>{line}</p>
      {/each}
    </div>
    <div class="my-4">
      {#each flavor as line}
        <p class="mb-4">{line}</p>
      {/each}
    </div>
  </div>
</section>
