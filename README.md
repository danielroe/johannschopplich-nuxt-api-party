![Nuxt API Party module](./.github/og.png)

# nuxt-api-party

[![npm version](https://img.shields.io/npm/v/nuxt-api-party?color=a1b858&label=)](https://www.npmjs.com/package/nuxt-api-party)

This module enables you to securely fetch data from any API by proxying the request in a Nuxt server route. Composable names are dynamic – given `json-placeholder` set as the module option `name` in your Nuxt config, the composables `$jsonPlaceholder` and `useJsonPlaceholderData` will be available globally.

## Features

- 🪅 [Dynamic composable names](#composables)
- 🔒 Protected API credentials in the client
- 🪢 Token-based authentication built-in or bring your own headers
- 🍱 Feels just like [`useFetch`](https://v3.nuxtjs.org/api/composables/use-fetch)
- 🗃 Cached responses
- 🦾 Strongly typed

## Setup

```bash
# pnpm
pnpm add -D nuxt-api-party

# npm
npm i -D nuxt-api-party
```

## How It Works

Composables will initiate a POST request to the Nuxt server route `/api/__api_party__`, which then fetches the actual data for a given route from your API and passes the response back to the template/client. This proxy behavior has the benefit of omitting CORS issues, since data is sent from server to server.

During server-side rendering, calls to the Nuxt server route will directly call the relevant function (emulating the request), saving an additional API call.

> ℹ️ Responses are cached and hydrated to the client. Subsequent calls will return cached responses, saving duplicated requests.

## Basic Usage

Add `nuxt-api-party` to your Nuxt config and tell the module options the name of your API:

```ts
// `nuxt.config.ts`
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    // Needed for the names of the composables
    name: 'json-placeholder'
  }
})
```

Set the following environment variables in your project's `.env` file:

```bash
API_PARTY_BASE_URL=https://jsonplaceholder.typicode.com
# Optionally, add a bearer token
# API_PARTY_TOKEN=test
```

If you were to call your API `json-placeholder`, the generated composables are:

- `$jsonPlaceholder` – Returns the response data, similar to `$fetch`
- `useJsonPlaceholderData` – Returns [multiple values](#usepartydata-respectively-pascal-cased-api-name) similar to `useFetch`

Finally, fetch data from your API in your template:

```vue
<script setup lang="ts">
interface Post {
  userId: number
  id: number
  title: string
  body: string
}

// `data` will be typed as `Ref<Post | null>`
const { data, pending, refresh, error } = await useJsonPlaceholderData<Post>('posts/1')
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
    <pre>{{ JSON.stringify(data, undefined, 2) }}</pre>
  </div>
</template>
```

## Module Options

<table>

<thead>
<tr>
<th>Option</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>

<tr>
<td valign="top">

`name`

</td><td valign="top">

`string`

</td><td valign="top">

**API name used for composables**

For example, if you set it to `foo`, the composables will be called `$foo` and `useFooData`.

Default value: `party`

</td>
</tr>

<tr>
<td valign="top">

`url`

</td><td valign="top">

`string`

</td><td valign="top">

**API base URL**

For example, if you set it to `foo`, the composables will be called `$foo` and `useFooData`.

Default value: `process.env.API_PARTY_BASE_URL`

</td>
</tr>

<tr>
<td valign="top">

`token`

</td><td valign="top">

`string`

</td><td valign="top">

**Optional API token for bearer authentication**

You can set a custom header with the `headers` module option instead.

Default value: `process.env.API_PARTY_TOKEN`

</td>
</tr>

<tr>
<td valign="top">

`headers`

</td><td valign="top">

`Record<string, string>`

</td><td valign="top">

**Custom headers sent with every request to the API**

Add authorization headers if you want to use a custom authorization method.

Default value: `{}`

Example:

```ts
const username = 'foo'
const password = 'bar'

export default defineNuxtConfig({
  apiParty: {
    headers: {
      'Custom-Api-Header': 'foo',
      'Authorization': Buffer
        .from(`${username}:${password}`)
        .toString('base64')
    }
  }
})
```

</td>
</tr>

</table>

## Composables

Customize your API's composable names with the `name` in your Nuxt config module option. Given it is set to `json-placeholder`, the composables `$jsonPlaceholder` and `useJsonPlaceholderData` will be available globally.

> ℹ️ The headings of the following sections aren't available as-is. As an example, the module option `name` is set to `party`.

### `$party` (Respectively Camel-Cased API Name)

Returns the API response data.

**Type Declarations**

```ts
function $party<T = any>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T>

type ApiFetchOptions = Pick<
  FetchOptions,
  'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError' | 'headers'
>
```

**Example**

```vue
<script setup lang="ts">
const data = await $party(
  'posts/1',
  {
    async onRequest({ request }) {
      console.log(request)
    },
    async onResponse({ response }) {
      console.log(response)
    },
    async onRequestError({ error }) {
      console.log(error)
    },
    async onResponseError({ error }) {
      console.log(error)
    },
  }
)
</script>

<template>
  <div>
    <h1>{{ data?.title }}</h1>
  </div>
</template>
```

### `usePartyData` (Respectively Pascal-Cased API Name)

Return values:

- **data**: the response of the API request
- **pending**: a boolean indicating whether the data is still being fetched
- **refresh**: a function that can be used to refresh the data returned by the handler function
- **error**: an error object if the data fetching failed

By default, Nuxt waits until a `refresh` is finished before it can be executed again. Passing `true` as parameter skips that wait.

**Type Declarations**

```ts
function usePartyData<T = any>(
  path: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T> = {},
): AsyncData<T, FetchError | null | true>

type UseApiDataOptions<T> = Pick<
  UseFetchOptions<T>,
  // Pick from `AsyncDataOptions`
  | 'server'
  | 'lazy'
  | 'default'
  | 'watch'
  | 'initialCache'
  | 'immediate'
  // Pick from `FetchOptions`
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  // Pick from `globalThis.RequestInit`
  | 'headers'
>
```

The composable infers most of the [`useAsyncData` options](https://v3.nuxtjs.org/api/composables/use-async-data/#params).

**Example**

```vue
<script setup lang="ts">
const { data, pending, error, refresh } = await usePartyData('posts/1')
</script>

<template>
  <div>
    <h1>{{ data?.result?.title }}</h1>
    <button @click="refresh()">
      Refresh
    </button>
  </div>
</template>
```

## 💻 Development

1. Clone this repository
2. Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
3. Install dependencies using `pnpm install`
4. Run `pnpm run dev:prepare`
5. Start development server using `pnpm run dev`

## Special Thanks

- [Dennis Baum](https://github.com/dennisbaum) for sponsoring this package!
- [SVGBackgrounds.com](https://www.svgbackgrounds.com) for the OpenGraph image background pattern.

## License

[MIT](./LICENSE) License © 2022 [Johann Schopplich](https://github.com/johannschopplich)
