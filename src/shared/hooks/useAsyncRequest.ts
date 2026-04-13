import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '../api/httpClient'

type UseAsyncRequestOptions<TData> = {
  request: (signal: AbortSignal) => Promise<TData>
  onSuccess: (data: TData) => void
  onError?: (error: unknown) => void
  getErrorMessage: (error: unknown) => string
}

type UseAsyncRequestResult = {
  loading: boolean
  error: string | null
  retry: () => void
}

export function useAsyncRequest<TData>({
  request,
  onSuccess,
  onError,
  getErrorMessage,
}: UseAsyncRequestOptions<TData>): UseAsyncRequestResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const retry = useCallback(() => {
    setRetryCount((currentCount) => currentCount + 1)
  }, [])

  const requestRef = useRef(request)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const getErrorMessageRef = useRef(getErrorMessage)

  useEffect(() => {
    requestRef.current = request
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
    getErrorMessageRef.current = getErrorMessage
  }, [request, onSuccess, onError, getErrorMessage])

  useEffect(() => {
    const abortController = new AbortController()
    let isCancelled = false

    async function runRequest() {
      try {
        setLoading(true)
        setError(null)
        const response = await requestRef.current(abortController.signal)

        if (isCancelled) {
          return
        }

        onSuccessRef.current(response)
      } catch (err) {
        if (isCancelled || isAbortError(err)) {
          return
        }

        onErrorRef.current?.(err)
        setError(getErrorMessageRef.current(err))
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    void runRequest()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [retryCount, request])

  return { loading, error, retry }
}
