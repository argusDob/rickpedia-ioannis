import { useCallback, useEffect, useRef } from 'react'

type UseIntersectionObserverOptions = {
  onIntersect: () => void
  enabled?: boolean
  threshold?: number
  root?: Element | null
  rootMargin?: string
}

export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  threshold = 0,
  root = null,
  rootMargin = '0px',
}: UseIntersectionObserverOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setObservedElement = useCallback(
    (element: Element | null) => {
      observerRef.current?.disconnect()

      if (!enabled || !element) {
        return
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onIntersect()
          }
        },
        { threshold, root, rootMargin },
      )

      observerRef.current.observe(element)
    },
    [enabled, onIntersect, root, rootMargin, threshold],
  )

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return setObservedElement
}
