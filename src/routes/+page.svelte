<script lang="ts">
  import debug from 'debug';
  import { enhance } from '$app/forms';
  import { isKevinLimerick, isKevinRejection, type KevinLimerick, type KevinRejection } from '$lib/kevin.types';
  import { splitLines } from '$lib/junk.js';

  const log = debug('app:home');

  const { data } = $props();

  // states
  let isLoading = $state(false);
  let lyrics = $state([] as string[]);
  let flavor = $state([] as string[]);

  function handleLimerick(data: KevinLimerick) {
    lyrics = splitLines(data.lyrics);
    flavor = splitLines(data.flavor);
  }

  function handleRejection(data: KevinRejection) {}
</script>

<section class="mx-auto my-8 max-w-4xl rounded-md bg-white p-6 shadow-md dark:bg-gray-800">
  <p class="mb-4">{data.greeting}</p>

  <form
    class="form center mx-auto grid max-w-96"
    method="POST"
    use:enhance={({ cancel }) => {
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
    <input type="text" name="topic" placeholder="Elevator music" required />
    <button type="submit" class="w-32 justify-self-center">Submit</button>
  </form>

  {#if isLoading}
    <p class="text-center">You got Kevin thinking right now...</p>
  {/if}

  <div>
    <div class="my-4 text-center">
      {#each lyrics as line}
        <p>{line}</p>
      {/each}
    </div>

    <div class="my-4">
      {#each flavor as line}
        <p>{line}</p>
      {/each}
    </div>
  </div>
</section>
