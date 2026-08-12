import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('shows the club and tournament name', () => {
    render(<App />)

    expect(screen.getByText('PRINCETON POKER CLUB')).toBeVisible()
    expect(screen.getByText('Princeton Poker Club Standard')).toBeVisible()
  })
})
