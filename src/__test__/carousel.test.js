import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

// Отримуємо шлях до main.js
const mainJsPath = path.resolve(__dirname, '../main.js')
const carouselCode = fs.readFileSync(mainJsPath, 'utf-8')

// Налаштування DOM перед тестами
function setupDOM() {
  document.body.innerHTML = `
    <div id="carousel">
      <div id="slides-container">
        <div class="slide active"></div>
        <div class="slide"></div>
        <div class="slide"></div>
      </div>
      <div id="indicators-container">
        <div class="indicator active" data-slide-to="0"></div>
        <div class="indicator" data-slide-to="1"></div>
        <div class="indicator" data-slide-to="2"></div>
      </div>
      <div id="controls-container">
        <button id="pause-btn"><i class="fas fa-pause"></i></button>
        <button id="prev-btn"></button>
        <button id="next-btn"></button>
      </div>
    </div>
  `
}

describe('Carousel Functionality', () => {
  let container, slides, indicators, pauseBtn, prevBtn, nextBtn, slidesContainer

  beforeEach(() => {
    // Налаштовуємо DOM
    setupDOM()

    // Використовуємо фіктивні таймери
    vi.useFakeTimers()

    // Мокуємо setInterval і clearInterval як шпигуни
    vi.spyOn(window, 'setInterval')
    vi.spyOn(window, 'clearInterval')

    // Виконуємо код із main.js
    eval(carouselCode)

    // Отримуємо елементи
    container = document.querySelector('#carousel')
    slidesContainer = container.querySelector('#slides-container')
    slides = container.querySelectorAll('.slide')
    indicators = container.querySelectorAll('.indicator')
    pauseBtn = document.querySelector('#pause-btn')
    prevBtn = document.querySelector('#prev-btn')
    nextBtn = document.querySelector('#next-btn')
  })

  afterEach(() => {
    vi.clearAllTimers() // Очищаємо всі таймери
    vi.useRealTimers() // Повертаємо реальні таймери
    vi.restoreAllMocks() // Відновлюємо всі моковані функції
    document.body.innerHTML = ''
  })

  test('Ініціалізація: перший слайд активний', () => {
    expect(slides[0].classList.contains('active')).toBe(true)
    expect(indicators[0].classList.contains('active')).toBe(true)
    expect(window.setInterval).toHaveBeenCalled()
  })

  test('Перехід до наступного слайда кнопкою', () => {
    nextBtn.click()
    expect(slides[0].classList.contains('active')).toBe(false)
    expect(slides[1].classList.contains('active')).toBe(true)
    expect(indicators[1].classList.contains('active')).toBe(true)
    expect(window.clearInterval).toHaveBeenCalled()
  })

  test('Перехід до попереднього слайда кнопкою', () => {
    prevBtn.click()
    expect(slides[0].classList.contains('active')).toBe(false)
    expect(slides[2].classList.contains('active')).toBe(true)
    expect(indicators[2].classList.contains('active')).toBe(true)
    expect(window.clearInterval).toHaveBeenCalled()
  })

  test('Пауза та відтворення', () => {
    pauseBtn.click()
    expect(pauseBtn.innerHTML).toContain('fa-play')
    expect(window.clearInterval).toHaveBeenCalled()

    pauseBtn.click()
    expect(pauseBtn.innerHTML).toContain('fa-pause')
    expect(window.setInterval).toHaveBeenCalledTimes(2)
  })

  test('Перехід через індикатори', () => {
    indicators[1].click()
    expect(slides[1].classList.contains('active')).toBe(true)
    expect(indicators[1].classList.contains('active')).toBe(true)
    expect(window.clearInterval).toHaveBeenCalled()
  })

  test('Керування клавіатурою', () => {
    // Перевірка стрілки вправо
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }))
    expect(slides[1].classList.contains('active')).toBe(true)

    // Повернення до початкового слайда
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }))
    expect(slides[0].classList.contains('active')).toBe(true)

    // Перевіряємо, що preventDefault викликається при натисканні пробілу
    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space', bubbles: true })
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault')
    document.dispatchEvent(spaceEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()

    // Перевіряємо, що clearInterval викликається при натисканні пробілу
    expect(window.clearInterval).toHaveBeenCalled()
  })

  test('Свайп', () => {
    slidesContainer.dispatchEvent(new MouseEvent('mousedown', { clientX: 300 }))
    slidesContainer.dispatchEvent(new MouseEvent('mouseup', { clientX: 450 }))
    expect(slides[2].classList.contains('active')).toBe(true)

    slidesContainer.dispatchEvent(new MouseEvent('mousedown', { clientX: 300 }))
    slidesContainer.dispatchEvent(new MouseEvent('mouseup', { clientX: 150 }))
    expect(slides[0].classList.contains('active')).toBe(true)
  })

  test('Автоматичне перемикання', () => {
    vi.advanceTimersByTime(2000)
    expect(slides[1].classList.contains('active')).toBe(true)
  })

  test('Циклічний перехід вперед (з останнього на перший)', () => {
    // Спочатку переходимо до другого слайду
    nextBtn.click()
    expect(slides[1].classList.contains('active')).toBe(true)

    // Потім переходимо до третього (останнього) слайду
    nextBtn.click()
    expect(slides[2].classList.contains('active')).toBe(true)

    // Клікаємо на кнопку Далі для переходу з останнього на перший
    nextBtn.click()

    // Перевіряємо, що відбувся перехід на перший слайд
    expect(slides[0].classList.contains('active')).toBe(true)
    expect(indicators[0].classList.contains('active')).toBe(true)
  })

  test('Циклічний перехід назад (з першого на останній)', () => {
    // Перевіряємо, що ми на першому слайді
    expect(slides[0].classList.contains('active')).toBe(true)

    // Клікаємо на кнопку Назад для переходу з першого на останній
    prevBtn.click()

    // Перевіряємо, що відбувся перехід на останній слайд
    expect(slides[2].classList.contains('active')).toBe(true)
    expect(indicators[2].classList.contains('active')).toBe(true)
  })

  test('Свайпи для настільних і сенсорних пристроїв', () => {
    // Тестування свайпу миші вліво (для переходу вперед)
    slidesContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 300 }))
    slidesContainer.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 150 }))
    expect(slides[1].classList.contains('active')).toBe(true)
    expect(window.clearInterval).toHaveBeenCalled()

    // Тестування свайпу миші вправо (для переходу назад)
    slidesContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 300 }))
    slidesContainer.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 450 }))
    expect(slides[0].classList.contains('active')).toBe(true)
    expect(window.clearInterval).toHaveBeenCalled()

    // Імітуємо TouchEvent для сенсорних пристроїв
    const createTouchStartEvent = (clientX) => {
      const event = new Event('touchstart', { bubbles: true })
      Object.defineProperty(event, 'changedTouches', {
        value: [{ clientX }]
      })
      return event
    }

    const createTouchEndEvent = (clientX) => {
      const event = new Event('touchend', { bubbles: true })
      Object.defineProperty(event, 'changedTouches', {
        value: [{ clientX }]
      })
      return event
    }

    // Тестування свайпу сенсорного екрану вліво (для переходу вперед)
    slidesContainer.dispatchEvent(createTouchStartEvent(300))
    slidesContainer.dispatchEvent(createTouchEndEvent(150))
    expect(slides[1].classList.contains('active')).toBe(true)

    // Тестування свайпу сенсорного екрану вправо (для переходу назад)
    slidesContainer.dispatchEvent(createTouchStartEvent(300))
    slidesContainer.dispatchEvent(createTouchEndEvent(450))
    expect(slides[0].classList.contains('active')).toBe(true)
  })
})
