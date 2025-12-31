/**
 * DOM Helper Utilities
 * Vanilla JS replacements for common jQuery operations
 */

// ==========================================================================
// Selection
// ==========================================================================

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {Element|Document} context - Context to search within
 * @returns {Element|null}
 */
export function $(selector, context = document) {
  if (typeof selector !== 'string') return selector;
  return context.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {Element|Document} context - Context to search within
 * @returns {Element[]}
 */
export function $$(selector, context = document) {
  if (typeof selector !== 'string') return [selector];
  return [...context.querySelectorAll(selector)];
}

// ==========================================================================
// Events
// ==========================================================================

/**
 * Add event listener with optional delegation
 * @param {Element} element - Target element
 * @param {string} event - Event type
 * @param {Function|string} selectorOrHandler - Delegate selector or handler
 * @param {Function} [handler] - Handler if using delegation
 * @returns {Function} Cleanup function to remove listener
 */
export function on(element, event, selectorOrHandler, handler) {
  if (typeof selectorOrHandler === 'function') {
    // Direct binding
    element.addEventListener(event, selectorOrHandler);
    return () => element.removeEventListener(event, selectorOrHandler);
  } else {
    // Event delegation
    const delegatedHandler = (e) => {
      const target = e.target.closest(selectorOrHandler);
      if (target && element.contains(target)) {
        handler.call(target, e);
      }
    };
    element.addEventListener(event, delegatedHandler);
    return () => element.removeEventListener(event, delegatedHandler);
  }
}

/**
 * Add one-time event listener
 * @param {Element} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 */
export function once(element, event, handler) {
  element.addEventListener(event, handler, { once: true });
}

/**
 * Remove event listener
 * @param {Element} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 */
export function off(element, event, handler) {
  element.removeEventListener(event, handler);
}

// ==========================================================================
// Classes
// ==========================================================================

/**
 * Add class(es) to element
 * @param {Element} element
 * @param {...string} classes
 */
export function addClass(element, ...classes) {
  element.classList.add(...classes.filter(Boolean));
}

/**
 * Remove class(es) from element
 * @param {Element} element
 * @param {...string} classes
 */
export function removeClass(element, ...classes) {
  element.classList.remove(...classes.filter(Boolean));
}

/**
 * Toggle class on element
 * @param {Element} element
 * @param {string} className
 * @param {boolean} [force] - Force add (true) or remove (false)
 * @returns {boolean} Whether class is now present
 */
export function toggleClass(element, className, force) {
  return element.classList.toggle(className, force);
}

/**
 * Check if element has class
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element.classList.contains(className);
}

// ==========================================================================
// Styles
// ==========================================================================

/**
 * Get or set CSS styles
 * @param {Element} element
 * @param {string|Object} propOrStyles - Property name or object of styles
 * @param {string} [value] - Value if setting single property
 * @returns {string|void}
 */
export function css(element, propOrStyles, value) {
  if (typeof propOrStyles === 'string') {
    if (value !== undefined) {
      element.style[propOrStyles] = value;
    } else {
      return getComputedStyle(element)[propOrStyles];
    }
  } else {
    Object.assign(element.style, propOrStyles);
  }
}

/**
 * Show element (remove display: none)
 * @param {Element} element
 * @param {string} [display='block'] - Display value to use
 */
export function show(element, display = 'block') {
  element.style.display = display;
}

/**
 * Hide element (display: none)
 * @param {Element} element
 */
export function hide(element) {
  element.style.display = 'none';
}

// ==========================================================================
// Attributes & Properties
// ==========================================================================

/**
 * Get or set attribute
 * @param {Element} element
 * @param {string|Object} nameOrAttrs - Attribute name or object of attributes
 * @param {string} [value] - Value if setting single attribute
 * @returns {string|void}
 */
export function attr(element, nameOrAttrs, value) {
  if (typeof nameOrAttrs === 'string') {
    if (value !== undefined) {
      element.setAttribute(nameOrAttrs, value);
    } else {
      return element.getAttribute(nameOrAttrs);
    }
  } else {
    for (const [key, val] of Object.entries(nameOrAttrs)) {
      element.setAttribute(key, val);
    }
  }
}

/**
 * Get or set property
 * @param {Element} element
 * @param {string|Object} nameOrProps - Property name or object of properties
 * @param {*} [value] - Value if setting single property
 * @returns {*}
 */
export function prop(element, nameOrProps, value) {
  if (typeof nameOrProps === 'string') {
    if (value !== undefined) {
      element[nameOrProps] = value;
    } else {
      return element[nameOrProps];
    }
  } else {
    Object.assign(element, nameOrProps);
  }
}

/**
 * Get or set input value
 * @param {HTMLInputElement} element
 * @param {string} [value] - Value to set
 * @returns {string|void}
 */
export function val(element, value) {
  if (value !== undefined) {
    element.value = value;
  } else {
    return element.value;
  }
}

// ==========================================================================
// Content
// ==========================================================================

/**
 * Get or set innerHTML
 * @param {Element} element
 * @param {string} [content] - HTML content to set
 * @returns {string|void}
 */
export function html(element, content) {
  if (content !== undefined) {
    element.innerHTML = content;
  } else {
    return element.innerHTML;
  }
}

/**
 * Get or set textContent
 * @param {Element} element
 * @param {string} [content] - Text content to set
 * @returns {string|void}
 */
export function text(element, content) {
  if (content !== undefined) {
    element.textContent = content;
  } else {
    return element.textContent;
  }
}

// ==========================================================================
// Traversal
// ==========================================================================

/**
 * Find elements within context
 * @param {Element} element - Context element
 * @param {string} selector - CSS selector
 * @returns {Element[]}
 */
export function find(element, selector) {
  return [...element.querySelectorAll(selector)];
}

/**
 * Get parent element
 * @param {Element} element
 * @param {string} [selector] - Optional selector to match
 * @returns {Element|null}
 */
export function parent(element, selector) {
  const parentEl = element.parentElement;
  if (!selector) return parentEl;
  return parentEl?.matches(selector) ? parentEl : null;
}

/**
 * Get closest ancestor matching selector
 * @param {Element} element
 * @param {string} selector
 * @returns {Element|null}
 */
export function closest(element, selector) {
  return element.closest(selector);
}

/**
 * Get sibling elements
 * @param {Element} element
 * @returns {Element[]}
 */
export function siblings(element) {
  return [...element.parentElement.children].filter(child => child !== element);
}

/**
 * Get element at index from NodeList/Array
 * @param {Element[]|NodeList} elements
 * @param {number} index
 * @returns {Element|undefined}
 */
export function eq(elements, index) {
  return elements[index];
}

/**
 * Get index of element among siblings
 * @param {Element} element
 * @returns {number}
 */
export function index(element) {
  return [...element.parentElement.children].indexOf(element);
}

// ==========================================================================
// Position & Dimensions
// ==========================================================================

/**
 * Get element position relative to offset parent
 * @param {Element} element
 * @returns {{top: number, left: number}}
 */
export function position(element) {
  return {
    top: element.offsetTop,
    left: element.offsetLeft
  };
}

/**
 * Get element position relative to document
 * @param {Element} element
 * @returns {{top: number, left: number}}
 */
export function offset(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
}

// ==========================================================================
// Utilities
// ==========================================================================

/**
 * Deep extend/merge objects (replaces $.extend)
 * @param {boolean|Object} deepOrTarget - Deep flag or target object
 * @param {...Object} sources - Source objects
 * @returns {Object}
 */
export function extend(deepOrTarget, ...sources) {
  let deep = false;
  let target;

  if (typeof deepOrTarget === 'boolean') {
    deep = deepOrTarget;
    target = sources.shift() || {};
  } else {
    target = deepOrTarget || {};
  }

  for (const source of sources) {
    if (!source) continue;

    for (const key of Object.keys(source)) {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (deep && sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
        target[key] = extend(true, targetVal || {}, sourceVal);
      } else {
        target[key] = sourceVal;
      }
    }
  }

  return target;
}

/**
 * Filter array (replaces $.grep)
 * @param {Array} array
 * @param {Function} callback
 * @param {boolean} [invert=false]
 * @returns {Array}
 */
export function grep(array, callback, invert = false) {
  return array.filter((item, index) => {
    const result = callback(item, index);
    return invert ? !result : result;
  });
}

/**
 * Find index in array (replaces $.inArray)
 * @param {*} value
 * @param {Array} array
 * @returns {number} Index or -1 if not found
 */
export function inArray(value, array) {
  return array.indexOf(value);
}

/**
 * Iterate over array or object (replaces $.each)
 * @param {Array|Object} collection
 * @param {Function} callback
 */
export function each(collection, callback) {
  if (Array.isArray(collection)) {
    collection.forEach((item, index) => callback(index, item));
  } else {
    for (const [key, value] of Object.entries(collection)) {
      callback(key, value);
    }
  }
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in ms
 * @returns {Function}
 */
export function debounce(func, wait = 200) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Debounce with ID (matches legacy Yambo.fn.debounce)
 */
export const debounceById = (() => {
  const timers = {};
  return (func, wait = 200, id = 'anonymous') => {
    if (timers[id]) {
      clearTimeout(timers[id]);
    }
    timers[id] = setTimeout(func, wait);
  };
})();

/**
 * Find object property by value (replaces Yambo.fn.getObjectProperty)
 * @param {Object} obj
 * @param {*} value
 * @returns {string} Property name or empty string
 */
export function getObjectProperty(obj, value) {
  for (const [key, val] of Object.entries(obj)) {
    if (val === value) return key;
    if (val && typeof val === 'object') {
      const nested = getObjectProperty(val, value);
      if (nested) return nested;
    }
  }
  return '';
}
