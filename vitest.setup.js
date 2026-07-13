import '@testing-library/jest-dom'

// Глобальні мок-функції для fetch
beforeEach(() => {
  console.error = vi.fn()
  console.log = vi.fn()
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
}) 
