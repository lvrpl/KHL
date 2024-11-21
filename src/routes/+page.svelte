<script lang="ts">
  import debug from 'debug';
  import { enhance } from '$app/forms';
  import { isKevinLimerick, isKevinRejection, type KevinLimerick, type KevinRejection } from '$lib/kevin.types';
  import { getRandomSuggestion, splitLines } from '$lib/junk';

  const log = debug('app:home');

  const { data } = $props();

  log('load data', data);

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
  <h1 class="mb-4 text-center text-2xl font-bold"></h1>
  <p class="mb-4">{data.greeting}</p>

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
          if (isKevinLimerick(result.data)) handleLimerick(result.data);
          else if (isKevinRejection(result.data)) handleRejection(result.data);
        }
      };
    }}>
    <p>Write a quick, fun suggestion...</p>
    <input type="text" name="topic" placeholder="" class="flex-auto" bind:this={topicInput} required />
    <div class="flex justify-center">
      <button type="button" class="h-12 w-24" onclick={suggest}>Suggest</button>
      <button type="submit" class="h-12 w-24">Submit</button>
    </div>
  </form>

  {#if isLoading}
    <p class="my-4 text-center">You got Kevin thinking right now...</p>
  {/if}

  <div>
    <div class="my-4 text-center">
      {#each lyrics as line}
        <p>{line}</p>
      {/each}
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
    </div>
    <div class="my-4">
      {#each flavor as line}
        <p class="mb-4">{line}</p>
      {/each}
    </div>
  </div>
</section>
