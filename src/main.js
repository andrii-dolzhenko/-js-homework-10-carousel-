const carousel = document.querySelector('#carousel')
const slidesContainer = carousel.querySelector('#slides-container')
const slides = carousel.querySelectorAll('.slide')
const indicatorsContainer = carousel.querySelector('#indicators-container')
const indicators = carousel.querySelectorAll('.indicator')
const controlsContainer = carousel.querySelector('#controls-container')
const pauseBtn = controlsContainer.querySelector('#pause-btn')
const prevBtn = controlsContainer.querySelector('#prev-btn')
const nextBtn = controlsContainer.querySelector('#next-btn')
const progressFill = document.querySelector('#progress-fill')

const SLIDES_COUNT = slides.length
const CODE_ARROW_LEFT = 'ArrowLeft'
const CODE_ARROW_RIGHT = 'ArrowRight'
const CODE_SPACE = 'Space'
const FA_PAUSE = '<i class="fas fa-pause" aria-hidden="true"></i>'
const FA_PLAY = '<i class="fas fa-play" aria-hidden="true"></i>'
const TIMER_INTERVAL = 2000

const autoplayInterval = Number(carousel.dataset.interval) || TIMER_INTERVAL
const cycleDuration = autoplayInterval * SLIDES_COUNT
const hasCustomInterval = carousel.hasAttribute('data-interval')
const canUseProgressAnimation = hasCustomInterval && progressFill && typeof progressFill.animate === 'function'

let currentSlide = 0
let isPlaying = true
let timerId
let browserTimeoutId
let progressAnimation
let contentAnimationFrameId
let swipeStartX = 0
let swipeEndX = 0

function updateSlidePositions() {
  const positionClasses = [
    'position-prev',
    'position-next',
    'orbit-prev-1',
    'orbit-prev-2',
    'orbit-next-1',
    'orbit-next-2',
    'trail-1',
    'trail-2',
    'orbit-entry'
  ]

  slides.forEach((slide) => {
    slide.classList.remove(...positionClasses)
  })

  if (SLIDES_COUNT < 2) {
    return
  }

  const trailOneIndex = (currentSlide - 1 + SLIDES_COUNT) % SLIDES_COUNT
  const trailTwoIndex = (currentSlide - 2 + SLIDES_COUNT) % SLIDES_COUNT
  const entryIndex = (currentSlide + 1) % SLIDES_COUNT

  slides[trailOneIndex].classList.add('position-prev', 'trail-1')

  if (SLIDES_COUNT > 2 && trailTwoIndex !== trailOneIndex) {
    slides[trailTwoIndex].classList.add('trail-2')
  }

  if (SLIDES_COUNT > 3 && entryIndex !== trailOneIndex && entryIndex !== trailTwoIndex) {
    slides[entryIndex].classList.add('position-next', 'orbit-entry')
  }
}

function restartContentAnimation(content) {
  if (!content) {
    return
  }

  window.cancelAnimationFrame(contentAnimationFrameId)
  content.classList.remove('is-changing')

  contentAnimationFrameId = window.requestAnimationFrame(() => {
    content.classList.add('is-changing')
  })
}

function updateProductContent() {
  const activeSlide = slides[currentSlide]
  const currentNumber = document.querySelector('#current-number')
  const timelineNumber = document.querySelector('#timeline-number')
  const productLabel = document.querySelector('#product-label')
  const productTitle = document.querySelector('#product-title')
  const productDescription = document.querySelector('#product-description')
  const productPrice = document.querySelector('#product-price')
  const content = document.querySelector('.carousel__content')

  if (!activeSlide.dataset.title) {
    return
  }

  carousel.dataset.tint = activeSlide.dataset.tint

  if (currentNumber) {
    currentNumber.textContent = activeSlide.dataset.number
  }

  if (timelineNumber) {
    timelineNumber.textContent = activeSlide.dataset.number
  }

  if (productLabel) {
    productLabel.textContent = activeSlide.dataset.label
  }

  if (productTitle) {
    productTitle.textContent = activeSlide.dataset.title
  }

  if (productDescription) {
    productDescription.textContent = activeSlide.dataset.description
  }

  if (productPrice) {
    productPrice.textContent = activeSlide.dataset.price
  }

  restartContentAnimation(content)
}

function changeSlide(slideIndex) {
  slides[currentSlide].classList.remove('active')
  indicators[currentSlide].classList.remove('active')

  currentSlide = (slideIndex + SLIDES_COUNT) % SLIDES_COUNT

  slides[currentSlide].classList.add('active')
  indicators[currentSlide].classList.add('active')

  updateSlidePositions()
  updateProductContent()
}

function setProgressToSlide() {
  if (!progressAnimation) {
    return
  }

  progressAnimation.currentTime = currentSlide * autoplayInterval
}

function showSlide(slideIndex) {
  changeSlide(slideIndex)
  setProgressToSlide()
}

function showNextSlide() {
  showSlide(currentSlide + 1)
}

function showPrevSlide() {
  showSlide(currentSlide - 1)
}

function autoAdvanceSlide() {
  changeSlide(currentSlide + 1)
}

function createProgressAnimation() {
  if (!canUseProgressAnimation) {
    return
  }

  progressAnimation = progressFill.animate(
    [
      {
        transform: 'scaleX(1)'
      },
      {
        transform: 'scaleX(0)'
      }
    ],
    {
      duration: cycleDuration,
      iterations: Infinity,
      easing: 'linear',
      fill: 'both'
    }
  )

  progressAnimation.pause()
  progressAnimation.currentTime = 0
}

function getProgressCycleTime() {
  if (!progressAnimation) {
    return 0
  }

  const currentTime = Number(progressAnimation.currentTime) || 0

  return currentTime % cycleDuration
}

function getProgressSlideIndex() {
  const cycleTime = getProgressCycleTime()

  return Math.min(Math.floor(cycleTime / autoplayInterval), SLIDES_COUNT - 1)
}

function scheduleBrowserSlide() {
  window.clearTimeout(browserTimeoutId)

  if (!isPlaying || !progressAnimation) {
    return
  }

  const cycleTime = getProgressCycleTime()
  const segmentTime = cycleTime % autoplayInterval
  const timeToNextSlide = Math.max(autoplayInterval - segmentTime, 1)

  browserTimeoutId = window.setTimeout(() => {
    if (!isPlaying || !progressAnimation) {
      return
    }

    const expectedSlide = getProgressSlideIndex()

    if (expectedSlide !== currentSlide) {
      changeSlide(expectedSlide)
    }

    scheduleBrowserSlide()
  }, timeToNextSlide)
}

function startBrowserAutoplay() {
  if (!progressAnimation) {
    createProgressAnimation()
  }

  if (!progressAnimation) {
    return
  }

  progressAnimation.play()
  scheduleBrowserSlide()
}

function pauseBrowserAutoplay() {
  if (progressAnimation) {
    progressAnimation.pause()
  }

  window.clearTimeout(browserTimeoutId)
}

function startTestAutoplay() {
  window.clearInterval(timerId)
  timerId = window.setInterval(autoAdvanceSlide, autoplayInterval)
}

function pauseTestAutoplay() {
  window.clearInterval(timerId)
}

function startAutoplay() {
  if (canUseProgressAnimation) {
    startBrowserAutoplay()
  } else {
    startTestAutoplay()
  }
}

function pauseAutoplay() {
  if (canUseProgressAnimation) {
    pauseBrowserAutoplay()
  } else {
    pauseTestAutoplay()
  }
}

function pauseCarousel() {
  if (!isPlaying) {
    return
  }

  pauseAutoplay()
  isPlaying = false

  pauseBtn.innerHTML = FA_PLAY
  pauseBtn.setAttribute('aria-label', 'Play carousel')
  carousel.classList.add('is-paused')
}

function playCarousel() {
  if (isPlaying) {
    return
  }

  isPlaying = true

  pauseBtn.innerHTML = FA_PAUSE
  pauseBtn.setAttribute('aria-label', 'Pause carousel')
  carousel.classList.remove('is-paused')

  startAutoplay()
}

function pausePlayHandler() {
  if (isPlaying) {
    pauseCarousel()
  } else {
    playCarousel()
  }
}

function nextHandler() {
  pauseCarousel()
  showNextSlide()
}

function prevHandler() {
  pauseCarousel()
  showPrevSlide()
}

function indicatorClickHandler(event) {
  if (!event.target.classList.contains('indicator')) {
    return
  }

  pauseCarousel()

  const slideIndex = Number(event.target.dataset.slideTo)

  showSlide(slideIndex)
}

function keydownHandler(event) {
  if (event.code === CODE_ARROW_LEFT) {
    prevHandler()
  }

  if (event.code === CODE_ARROW_RIGHT) {
    nextHandler()
  }

  if (event.code === CODE_SPACE) {
    event.preventDefault()
    pausePlayHandler()
  }
}

function swipeStartHandler(event) {
  if (event instanceof MouseEvent) {
    swipeStartX = event.clientX
  } else {
    swipeStartX = event.changedTouches[0].clientX
  }
}

function swipeEndHandler(event) {
  if (event instanceof MouseEvent) {
    swipeEndX = event.clientX
  } else {
    swipeEndX = event.changedTouches[0].clientX
  }

  const swipeDistance = swipeEndX - swipeStartX

  if (swipeDistance > 100) {
    prevHandler()
  }

  if (swipeDistance < -100) {
    nextHandler()
  }
}

function init() {
  pauseBtn.addEventListener('click', pausePlayHandler)
  nextBtn.addEventListener('click', nextHandler)
  prevBtn.addEventListener('click', prevHandler)
  indicatorsContainer.addEventListener('click', indicatorClickHandler)
  document.addEventListener('keydown', keydownHandler)
  slidesContainer.addEventListener('mousedown', swipeStartHandler)
  slidesContainer.addEventListener('mouseup', swipeEndHandler)
  slidesContainer.addEventListener('touchstart', swipeStartHandler)
  slidesContainer.addEventListener('touchend', swipeEndHandler)

  updateSlidePositions()
  updateProductContent()

  if (canUseProgressAnimation) {
    createProgressAnimation()
  }

  startAutoplay()
}

init()
