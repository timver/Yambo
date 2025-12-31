/**
 * Animation Helper Utilities
 * GSAP wrappers for common animations
 * Replaces jQuery.animate() and $.fn.roll()
 */

import gsap from 'gsap';

// ==========================================================================
// Core Animation
// ==========================================================================

/**
 * Animate element properties (replaces jQuery.animate)
 * @param {Element} element - Target element
 * @param {Object} props - CSS properties to animate
 * @param {Object} [options] - Animation options
 * @param {number} [options.duration=200] - Duration in ms
 * @param {string} [options.easing='power2.out'] - GSAP easing
 * @param {Function} [options.onComplete] - Completion callback
 * @param {Function} [options.onUpdate] - Update callback (each frame)
 * @returns {gsap.core.Tween}
 */
export function animate(element, props, options = {}) {
  const {
    duration = 200,
    easing = 'power2.out',
    onComplete,
    onUpdate
  } = options;

  return gsap.to(element, {
    ...props,
    duration: duration / 1000, // GSAP uses seconds
    ease: easing,
    onComplete,
    onUpdate
  });
}

/**
 * Animate with promise
 * @param {Element} element
 * @param {Object} props
 * @param {Object} [options]
 * @returns {Promise<void>}
 */
export function animateAsync(element, props, options = {}) {
  return new Promise(resolve => {
    animate(element, props, {
      ...options,
      onComplete: () => {
        options.onComplete?.();
        resolve();
      }
    });
  });
}

/**
 * Stop all animations on element
 * @param {Element} element
 * @param {boolean} [jumpToEnd=false] - Jump to end state
 */
export function stop(element, jumpToEnd = false) {
  gsap.killTweensOf(element, jumpToEnd);
}

// ==========================================================================
// Dice Animation
// ==========================================================================

/**
 * Roll a single die with animation (replaces $.fn.roll)
 * @param {HTMLElement} dieElement - Die input element
 * @param {Object} options - Roll options
 * @param {number} options.colorOffset - Y offset for dice sprite (e.g., -300 for white)
 * @param {boolean} [options.keepJuggling=false] - Continue rolling indefinitely
 * @param {number} [options.duration=200] - Roll duration in ms
 * @param {Function} [onComplete] - Callback with final value
 * @returns {gsap.core.Tween}
 */
export function rollDie(dieElement, options, onComplete) {
  const {
    colorOffset = -300,
    keepJuggling = false,
    duration = 200
  } = options;

  let currentValue = 1;

  const tween = gsap.to(dieElement, {
    duration: duration / 1000,
    ease: 'none',
    onUpdate: () => {
      // Generate random value each frame
      currentValue = Math.floor(Math.random() * 6) + 1;

      // Update sprite position (each die face is 60px wide)
      const xOffset = (currentValue - 1) * -60;
      dieElement.style.backgroundPosition = `${xOffset}px ${colorOffset}px`;
    },
    onComplete: () => {
      if (keepJuggling) {
        // Continue rolling
        rollDie(dieElement, options, onComplete);
      } else {
        // Set final value
        dieElement.value = currentValue;
        dieElement.dataset.value = currentValue;
        onComplete?.(currentValue);
      }
    }
  });

  return tween;
}

/**
 * Roll multiple dice
 * @param {HTMLElement[]} diceElements - Array of die elements
 * @param {Object} options - Roll options (same as rollDie)
 * @returns {Promise<number[]>} Final values of all dice
 */
export function rollDice(diceElements, options) {
  return Promise.all(
    diceElements.map(die =>
      new Promise(resolve => rollDie(die, options, resolve))
    )
  );
}

/**
 * Stop dice juggling
 * @param {HTMLElement[]} diceElements - Array of die elements
 */
export function stopDice(diceElements) {
  diceElements.forEach(die => gsap.killTweensOf(die));
}

// ==========================================================================
// Show/Hide Animations
// ==========================================================================

/**
 * Fade in element
 * @param {Element} element
 * @param {number} [duration=200] - Duration in ms
 * @returns {Promise<void>}
 */
export function fadeIn(element, duration = 200) {
  element.style.display = '';
  element.style.opacity = '0';

  return animateAsync(element, { opacity: 1 }, { duration });
}

/**
 * Fade out element
 * @param {Element} element
 * @param {number} [duration=200] - Duration in ms
 * @returns {Promise<void>}
 */
export async function fadeOut(element, duration = 200) {
  await animateAsync(element, { opacity: 0 }, { duration });
  element.style.display = 'none';
}

/**
 * Slide down (show with height animation)
 * @param {Element} element
 * @param {number} [duration=200] - Duration in ms
 * @returns {Promise<void>}
 */
export function slideDown(element, duration = 200) {
  // Get natural height
  element.style.display = '';
  element.style.overflow = 'hidden';
  const height = element.scrollHeight;

  element.style.height = '0px';

  return animateAsync(element, { height }, {
    duration,
    onComplete: () => {
      element.style.height = '';
      element.style.overflow = '';
    }
  });
}

/**
 * Slide up (hide with height animation)
 * @param {Element} element
 * @param {number} [duration=200] - Duration in ms
 * @returns {Promise<void>}
 */
export async function slideUp(element, duration = 200) {
  element.style.overflow = 'hidden';
  const height = element.scrollHeight;
  element.style.height = `${height}px`;

  await animateAsync(element, { height: 0 }, { duration });

  element.style.display = 'none';
  element.style.height = '';
  element.style.overflow = '';
}

// ==========================================================================
// Panel Minimize Animation (replaces $.fn.minimizable)
// ==========================================================================

/**
 * Minimize panel to toolbar icon
 * @param {Element} panel - Panel element
 * @param {Element} icon - Target toolbar icon
 * @param {Object} [options]
 * @returns {Promise<void>}
 */
export async function minimizePanel(panel, icon, options = {}) {
  const { duration = 200 } = options;

  const panelPos = panel.getBoundingClientRect();
  const iconPos = icon.getBoundingClientRect();

  // Calculate offset to icon position
  const x = iconPos.left - panelPos.left - 15;
  const y = iconPos.top - panelPos.top - 15;

  // Hide content
  const content = panel.querySelector('fieldset');
  if (content) {
    await animateAsync(content, { opacity: 0, height: 0 }, { duration });
    content.style.display = 'none';
  }

  // Move minimize button to icon position
  const minimizeBtn = panel.querySelector('.minimize');
  if (minimizeBtn) {
    minimizeBtn.classList.add('minimized');
    await animateAsync(minimizeBtn, { left: x, top: y }, {
      duration,
      easing: 'back.out(1.7)' // Bounce effect
    });
  }
}

/**
 * Restore panel from minimized state
 * @param {Element} panel - Panel element
 * @param {Object} [options]
 * @returns {Promise<void>}
 */
export async function restorePanel(panel, options = {}) {
  const { duration = 200 } = options;

  // Move button back
  const minimizeBtn = panel.querySelector('.minimize');
  if (minimizeBtn) {
    minimizeBtn.classList.remove('minimized');
    await animateAsync(minimizeBtn, { left: -24, top: -22 }, {
      duration,
      easing: 'power3.out'
    });
  }

  // Show content
  const content = panel.querySelector('fieldset');
  if (content) {
    content.style.display = '';
    content.style.height = '0';
    content.style.opacity = '0';

    await animateAsync(content, { opacity: 1, height: 'auto' }, { duration });
    content.style.height = '';
  }
}

// ==========================================================================
// Easing Reference (GSAP built-in easings)
// ==========================================================================
// power1.in, power1.out, power1.inOut
// power2.in, power2.out, power2.inOut
// power3.in, power3.out, power3.inOut
// power4.in, power4.out, power4.inOut
// back.in, back.out, back.inOut
// elastic.in, elastic.out, elastic.inOut
// bounce.in, bounce.out, bounce.inOut
// circ.in, circ.out, circ.inOut
// expo.in, expo.out, expo.inOut
// sine.in, sine.out, sine.inOut

// jQuery UI easing equivalents:
// easeOutBounce -> bounce.out
// easeOutCubic -> power3.out
// easeInOutQuad -> power1.inOut
