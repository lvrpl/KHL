<script lang="ts">
  import debug from 'debug';
  import { enhance } from '$app/forms';

  const log = debug('app:home');

  const { data } = $props();

  let poem = $state('');

  log('heeeey, this is the data', data);
</script>

<p>{data.message}</p>

<form
  class="form"
  method="POST"
  use:enhance={({ formElement, formData, action, cancel }) => {
    return async ({ result }) => {
      log('got this result', result);
      log('formElement', formElement);
      log('formData', formData);
      log('action', action);
      log('cancel', cancel);

      // URGENT: can we make the typing better here?
      const message = (result as any).data.message as string;
      poem = message
        .split('\n')
        .map((line) => `<p>${line.trim()}</p>`)
        .join('');
    };
  }}
>
  <input type="text" name="topic" placeholder="Elevator music" required />
  <button type="submit">Submit</button>
</form>

{@html poem}
