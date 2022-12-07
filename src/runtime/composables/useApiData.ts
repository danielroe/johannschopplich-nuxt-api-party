import { computed, reactive, unref } from 'vue'
import { hash } from 'ohash'
import type { FetchError, FetchOptions } from 'ofetch'
import type { Ref } from 'vue'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import { headersToObject, resolveUnref } from '../utils'
import type { EndpointFetchOptions, MaybeComputedRef } from '../utils'
import { useAsyncData, useNuxtApp } from '#imports'

type ComputedOptions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends Record<string, any>
      ? ComputedOptions<T[K]> | Ref<T[K]> | T[K]
      : Ref<T[K]> | T[K];
}

export type UseApiDataOptions<T> = Pick<
  AsyncDataOptions<T>,
  | 'server'
  | 'lazy'
  | 'default'
  | 'watch'
  | 'immediate'
> & Pick<
  ComputedOptions<FetchOptions>,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  // Pick from `globalThis.RequestInit`
  | 'query'
  | 'headers'
  | 'method'
> & {
  body?: Record<string, any>
}

export type UseApiData = <T = any>(
  path: MaybeComputedRef<string>,
  opts?: UseApiDataOptions<T>,
) => AsyncData<T, FetchError | null | true>

export function _useApiData<T = any>(
  endpointId: string,
  path: MaybeComputedRef<string>,
  opts: UseApiDataOptions<T> = {},
) {
  const nuxt = useNuxtApp()
  const _path = computed(() => resolveUnref(path))
  const key = `$party${hash([endpointId, _path.value, unref(opts.query)])}`

  const {
    server,
    lazy,
    default: defaultFn,
    immediate,
    watch,
    query,
    headers,
    method,
    body,
    ...fetchOptions
  } = opts

  const _fetchOptions = reactive(fetchOptions)

  const endpointFetchOptions: EndpointFetchOptions = reactive({
    path: _path.value,
    query,
    headers: headersToObject(unref(headers)),
    method,
    body,
  })

  const asyncDataOptions: AsyncDataOptions<T> = {
    server,
    lazy,
    default: defaultFn,
    immediate,
    watch: [
      _path,
      endpointFetchOptions,
      ...(watch || []),
    ],
  }

  let controller: AbortController

  return useAsyncData<T, FetchError>(
    key,
    async () => {
      controller?.abort?.()

      if (key in nuxt.payload.data)
        return nuxt.payload.data[key]

      if (key in nuxt.static.data)
        return nuxt.static.data[key]

      controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : ({} as AbortController)

      const result = (await $fetch<T>(
        `/api/__api_party/${endpointId}`,
        {
          ..._fetchOptions,
          signal: controller.signal,
          method: 'POST',
          body: endpointFetchOptions,
        },
      )) as T

      // Workaround to persist response client-side
      // https://github.com/nuxt/framework/issues/8917
      nuxt.static.data[key] = result

      return result
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
