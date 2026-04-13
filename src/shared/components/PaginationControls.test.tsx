import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PaginationControls from './PaginationControls'

describe('PaginationControls', () => {
  it('renders page text and calls handlers on click', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()

    render(
      <PaginationControls
        page={2}
        totalPages={5}
        hasPrevPage
        hasNextPage
        onPrev={onPrev}
        onNext={onNext}
      />,
    )

    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('disables navigation buttons when no page available', () => {
    render(
      <PaginationControls
        page={1}
        totalPages={1}
        hasPrevPage={false}
        hasNextPage={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
