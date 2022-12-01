import { computed, unref } from 'vue'
import { hash } from 'ohash'
import type { FetchError, FetchOptions } from 'ofetch'
import type { QueryObject } from 'ufo'
import type { AsyncData, AsyncDataOptions } from 'nuxt/app'
import { headersToObject, resolveUnref } from '../utils'
import type { MaybeComputedRef } from '../utils'
import { useAsyncData } from '#imports'

export type UseApiDataOptions<T> = Pick<
  AsyncDataOptions<T>,
  | 'server'
  | 'lazy'
  | 'default'
  | 'watch'
  | 'immediate'
> & Pick<
  FetchOptions,
  | 'onRequest'
  | 'onRequestError'
  | 'onResponse'
  | 'onResponseError'
  // Pick from `globalThis.RequestInit`
  | 'headers'
  | 'method'
> & {
  query?: QueryObject
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
  const _path = computed(() => resolveUnref(path))

  const {
    lazy,
    default: defaultFn,
    immediate,
    headers,
    query,
    method,
    body,
    ...fetchOptions
  } = opts

  const asyncDataOptions: AsyncDataOptions<T> = {
    lazy,
    default: defaultFn,
    immediate,
    watch: [
      _path,
    ],
  }

  return useAsyncData<T, FetchError>(
    `$party${hash([endpointId, _path.value, query, method, body, headers])}`,
    () => {
      return $fetch(`/api/__api_party__/${endpointId}`, {
        ...fetchOptions,
        method: 'POST',
        body: {
          path: _path.value,
          headers: headersToObject(unref(headers)),
          query,
          method,
          body,
        },
      }) as Promise<T>
    },
    asyncDataOptions,
  ) as AsyncData<T, FetchError | null | true>
}
