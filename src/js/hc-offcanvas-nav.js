/*
 * HC Off-canvas Nav
 * ===================
 * Version: 5.0.2
 * Author: Some Web Media
 * Author URL: https://github.com/somewebmedia/
 * Plugin URL: https://github.com/somewebmedia/hc-offcanvas-nav
 * Description: jQuery plugin for creating off-canvas multi-level navigations
 * License: MIT
 */

'use strict';

(function(global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    if (global.document) {
      module.exports = factory(global);
    }
    else {
      throw new Error('HC Off-canvas Nav requires a browser to run.');
    }
  }
  else if (typeof define === 'function' && define.amd) {
    define('hcOffcanvasNav', [], factory(global));
  }
  else {
    factory(global);
  }
})(typeof window !== 'undefined' ? window : this, (window) => {
  const document = window.document;
  const html = document.getElementsByTagName('html')[0];

  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: function() {
        supportsPassive = {passive: false};
      }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}

  const hasScrollBar = () => document.documentElement.scrollHeight > document.documentElement.clientHeight;

  const isIos = (() => ((/iPad|iPhone|iPod/.test(navigator.userAgent)) || (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform))) && !window.MSStream)();

  const isTouchDevice = (() => 'ontouchstart' in window || navigator.maxTouchPoints || (window.DocumentTouch && document instanceof DocumentTouch))();

  const isNumeric = (n) => !isNaN(parseFloat(n)) && isFinite(n);

  const formatSizeVal = (n) => (n === 'auto') ? n : isNumeric(n) ? `${n}px` : n;

  const toMs = (s) => parseFloat(s) * (/\ds$/.test(s) ? 1000 : 1);

  const ID = () => Math.random().toString(36).substr(2);

  const disableScroll = () => window.addEventListener('touchmove', preventDefault, supportsPassive);
  const enableScroll = () => window.removeEventListener('touchmove', preventDefault, supportsPassive);

  const stopPropagation = (e) => e.stopPropagation();
  const preventDefault = (e) => e.preventDefault();

  const preventClick = (cb) => {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof cb === 'function') cb();
    };
  };

  const browserPrefix = (prop) => {
    const prefixes = ['Webkit', 'Moz', 'Ms', 'O'];
    const thisBody = document.body || document.documentElement;
    const thisStyle = thisBody.style;
    const Prop = prop.charAt(0).toUpperCase() + prop.slice(1);

    if (typeof thisStyle[prop] !== 'undefined') {
      return prop;
    }

    for (let i = 0; i < prefixes.length; i++) {
      if (typeof thisStyle[prefixes[i] + Prop] !== 'undefined') {
        return prefixes[i] + Prop;
      }
    }

    return false;
  };

  var matches = (el, selector) => {
    return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
  };

  const children = (el, selector) => {
    if (el instanceof Element) {
      return selector ? Array.prototype.filter.call(el.children, (child) => matches(child, selector)) : el.children;
    }
    else {
      let children = [];

      Array.prototype.forEach.call(el, (n) => {
        children = selector
          ? children.concat(Array.prototype.filter.call(n.children, (child) => matches(child, selector)))
          : children.concat(Array.prototype.slice.call(n.children));
      });

      return children;
    }
  };

  const wrap = (el, wrapper) => {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  };

  const data = (el, prop, val) => {
    if (typeof el.hcOffcanvasNav === 'undefined') {
      el.hcOffcanvasNav = {};
    }

    if (typeof val !== 'undefined') {
      el.hcOffcanvasNav[prop] = val;
    }
    else {
      return el.hcOffcanvasNav[prop];
    }
  };

  if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
      let el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  if (!Array.prototype.flat) {
    Object.defineProperty(Array.prototype, 'flat', {
      configurable: true,
      value: function flat () {
        var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

        return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
          if (Array.isArray(cur)) {
            acc.push.apply(acc, flat.call(cur, depth - 1));
          } else {
            acc.push(cur);
          }

          return acc;
        }, []) : Array.prototype.slice.call(this);
      },
      writable: true
    });
  }

  const cloneNodeWithEvents = (el, withEvents, deepWithEvents) => {
    const cloned = el.cloneNode(deepWithEvents || false);
    const srcElements = el instanceof Element ? [el].concat(Array.prototype.slice.call(el.getElementsByTagName('*'))) : [];
    const destElements = cloned instanceof Element ? [cloned].concat(Array.prototype.slice.call(cloned.getElementsByTagName('*'))) : [];

    const cloneCopyEvent = (src, dest) => {
      for (let s = 0; s < src.length; s++) {
        if (hasListener(src[s])) {
          for (const type in src[s]._eventListeners) {
            for (let i = 0; i < src[s]._eventListeners[type].length; i++) {
              dest[i].addEventListener(type, src[s]._eventListeners[type][i].fn, src[s]._eventListeners[type][i].options);
            }
          }
        }
      }
    };

    if (!withEvents) {
      srcElements.shift();
      destElements.shift();
    }

    if (deepWithEvents) {
      cloneCopyEvent(srcElements, destElements);
    }

    return cloned;
  };

  const customEventObject = (type, target, currentTarget, args) => {
    function Event(type) {
      this.bubbles = false;
      this.cancelable = false;
      this.composed = false;
      this.currentTarget = currentTarget;
      this.data = args ? {} : null;
      this.defaultPrevented = false;
      this.eventPhase = 0;
      this.isTrusted = false;
      this.target = target;
      this.timeStamp = Date.now();
      this.type = type;

      for (const prop in args) {
        this.data[prop] = args[prop];
      }
    }

    return new Event(type);
  };

  const hasListener = (el, type) => {
    return (type ? (el._eventListeners || {})[type] : el._eventListeners) || false;
  };

  const addRemoveListener = (op, add) => {
    const f = EventTarget.prototype[op + 'EventListener'];

    return function (type, cb, opts) {
      if (!this) return;

      const name = type.split('.')[0];

      this._eventListeners = this._eventListeners || {};

      if (op === 'add') {
        this._eventListeners[type] = this._eventListeners[type] || [];

        const lstn = {fn: cb};

        if (opts) {
          lstn.options = opts;
        }

        this._eventListeners[type].push(lstn);

        // call native addEventListener
        f.call(this, name, cb, opts);
      }
      else {
        // remove single event listener
        if (typeof cb === 'function') {
          // call native addEventListener
          f.call(this, name, cb, opts);

          for (const e in this._eventListeners) {
            this._eventListeners[e] = this._eventListeners[e].filter((l) => {
              return l.fn !== cb;
            });

            if (!this._eventListeners[e].length) {
              delete this._eventListeners[e];
            }
          }
        }
        else {
          // remove all event listeners
          if (this._eventListeners[type]) {
            for (let i = this._eventListeners[type].length; i--;) {
              // call native addEventListener
              f.call(this, name, this._eventListeners[type][i].fn, this._eventListeners[type][i].options);

              this._eventListeners[type].splice(i, 1);
            }

            if (!this._eventListeners[type].length) {
              delete this._eventListeners[type];
            }
          }
        }
      }

      return;
    };
  };

  EventTarget.prototype.addEventListener = addRemoveListener('add');
  EventTarget.prototype.removeEventListener = addRemoveListener('remove');

  const createElement = (tag, props = {}, content) => {
    const el = document.createElement(tag);

    for (const p in props) {
      if (p !== 'class') {
        el.setAttribute(p, props[p]);
      }
      else {
        el.className = props[p];
      }
    }

    if (content) {
      if (!Array.isArray(content)) {
        content = [content];
      }

      for (let i = 0; i < content.length; i++) {
        if (typeof content[i] === 'object' && content[i].length && !content[i].nodeType) {
          for (let l = 0; l < content[i].length; l++) {
            el.appendChild(content[i][l]);
          }
        }
        else {
          el.appendChild(typeof content[i] === 'string' ? document.createTextNode(content[i]) : content[i]);
        }
      }
    }

    return el;
  };

  const getElementCssTag = (el) => {
    return typeof el === 'string'
      ? el
      : el.getAttribute('id')
        ? `#${el.getAttribute('id')}`
        : el.getAttribute('class')
          ? el.tagName.toLowerCase() + '.' + el.getAttribute('class').replace(/\s+/g, '.')
          : getElementCssTag(el.parentNode) + ' > ' + el.tagName.toLowerCase();
  };

  const printStyle = (id) => {
    const $style = createElement('style', {id: id});
    let rules = {};
    let media = {};

    document.head.appendChild($style);

    const parseRules = (text) => {
      if (text.substr(-1) !== ';') {
        text += text.substr(-1) !== ';' ? ';' : '';
      }
      return text;
    };

    return {
      reset: () => {
        rules = {};
        media = {};
      },
      add: (selector, declarations, query) => {
        selector = selector.trim();
        declarations = declarations.trim();

        if (query) {
          query = query.trim();
          media[query] = media[query] || {};
          media[query][selector] = parseRules(declarations);
        }
        else {
          rules[selector] = parseRules(declarations);
        }
      },
      remove: (selector, query) => {
        selector = selector.trim();

        if (query) {
          query = query.trim();
          if (typeof media[query][selector] !== 'undefined') {
            delete media[query][selector];
          }
        }
        else {
          if (typeof rules[selector] !== 'undefined') {
            delete rules[selector];
          }
        }
      },
      insert: () => {
        let cssText = '';

        for (let breakpoint in media) {
          cssText += `@media screen and (${breakpoint}) {\n`;

          for (let key in media[breakpoint]) {
            cssText += `${key} { ${media[breakpoint][key]} }\n`;
          }

          cssText += '}\n';
        }

        for (let key in rules) {
          cssText += `${key} { ${rules[key]} }\n`;
        }

        $style.innerHTML = cssText;
      }
    };
  };

  const insertAt = ($insert, n, $parent) => {
    const $children = children($parent);
    const count = $children.length;
    const i = n > -1
      ? Math.max(0, Math.min(n - 1, count))
      : Math.max(0, Math.min(count + n + 1, count));

    if (i === 0) {
      $parent.insertBefore($insert, $parent.firstChild);
    } else {
      $children[i - 1].insertAdjacentElement('afterend', $insert);
    }
  };

  const getAxis = (position) => ['left', 'right'].indexOf(position) !== -1 ? 'x' : 'y';

  const setTransform = (() => {
    const transform = browserPrefix('transform');

    return ($el, val, position) => {
      if (transform) {
        if (val === false) {
          $el.style.transform = '';
        }
        else {
          if (getAxis(position) === 'x') {
            const x = position === 'left' ? val : 0 - val;
            $el.style.transform = `translate3d(${x}px,0,0)`;
          }
          else {
            const y = position === 'top' ? val : 0 - val;
            $el.style.transform = `translate3d(0,${y}px,0)`;
          }
        }
      }
      else {
        $el.style.position = val;
      }
    };
  })();

  const deprecated = (() => {
    const pluginName = 'HC Off-canvas Nav';

    return (what, instead, type) => {
      console.warn(
        '%c' + pluginName + ':'
        + '%c ' + type
        + "%c '"+ what + "'"
        + '%c is now deprecated and will be removed in the future. Use'
        + "%c '" + instead + "'"
        + '%c option instead. See details about plugin usage at https://github.com/somewebmedia/hc-offcanvas-nav.',
        'color: #fa253b',
        'color: default',
        'color: #5595c6',
        'color: default',
        'color: #5595c6',
        'color: default');
    };
  })();

  let navCount = 0;

  const hcOffcanvasNav = (elem, options = {}) => {
    // use querySelector if string is passed
    if (typeof elem === 'string') {
      elem = elem.charAt(0) === '#' && elem.indexOf(' ') === -1 ? document.querySelector(elem) : document.querySelectorAll(elem);
    }

    // check if element exist
    if (!elem) return false;

    const defaults = {
      width:              280,
      height:             'auto',
      disableAt:          false,
      pushContent:        null,
      swipeGestures:      true,
      expanded:           false,
      position:           'left', // left, right, top, bottom
      levelOpen:          'overlap', // overlap, expand, none/false
      levelSpacing:       40,
      levelTitles:        true,
      closeOpenLevels:    true,
      closeActiveLevel:   false,
      navTitle:           null,
      navClass:           '',
      disableBody:        true,
      closeOnClick:       true,
      customToggle:       null,
      bodyInsert:         'prepend', // prepend/append
      keepClasses:        true,
      removeOriginalNav:  false,
      rtl:                false,
      insertClose:        true,
      insertBack:         true,
      levelTitleAsBack:   true,
      labelClose:         'Close',
      labelBack:          'Back'
    };

    // show deprecated messages
    if (typeof options.maxWidth !== 'undefined') {
      deprecated('maxWidth', 'disableAt', 'option');
      options.disableAt = options.maxWidth;
    }

    let Settings = Object.assign({}, defaults, options);
    let UpdatedSettings = [];

    const navOpenClass = 'nav-open';

    const checkForUpdate = (options) => {
      if (!UpdatedSettings.length) {
        return false;
      }

      let hasUpdated = false;

      if (typeof options === 'string') {
        options = [options];
      }

      let l = options.length;
      for (let i = 0; i < l; i++) {
        if (UpdatedSettings.indexOf(options[i]) !== -1) {
          hasUpdated = true;
        }
      }

      return hasUpdated;
    };

    const Plugin = function($originalNav) {
      if (!$originalNav.querySelector('ul') && $originalNav.tagName !== 'UL') {
        console.error('%c! HC Offcanvas Nav:' + `%c Menu must contain <ul> element.`, 'color: #fa253b', 'color: default');
        return;
      }

      // count our nav
      navCount++;

      const navUniqId = `hc-nav-${navCount}`;
      const Styles = printStyle(`hc-offcanvas-${navCount}-style`);
      const keydownEventName = 'keydown.hcOffcanvasNav';

      // this is our new nav element
      const $nav = createElement('nav', {role: 'navigation'});
      const $nav_container = createElement('div', {class: 'nav-container'});

      $nav.addEventListener('click', stopPropagation);
      $nav.appendChild($nav_container);

      let $toggle = null;
      let $push_content = null;

      let Model = {};

      let _open = false; // is nav currently open
      let _initExpanded = false; // should nav be opened on init
      let _nextActiveLevel = null; // level that should be open next
      let _top = 0; // to remember scroll position
      let _containerWidth = 0;
      let _containerHeight = 0;
      let _transitionProperty;
      let _transitionDuration;
      let _transitionFunction;
      let _closeLevelsTimeout = null;
      let _indexes = {}; // object with level indexes
      const _openLevels = []; // array with current open levels ids
      let _keyboard = false;
      const _focusEls = []; // array to store keyboard accessed items
      let _xStart = null; // the X touch point
      let _yStart = null; // the Y touch point
      let _touchMoved = false;
      let _touchNavTriggered = false;

      if (!Settings.customToggle) {
        // our toggle
        $toggle = createElement('a', {
          href: '#',
          class: `hc-nav-trigger ${navUniqId}`,
          'aria-label': 'Open Menu'
        }, createElement('span'));

        $toggle.addEventListener('click', toggleNav);
        $originalNav.insertAdjacentElement('afterend', $toggle);
      }
      else {
        // user toggle
        if (typeof Settings.customToggle === 'string') {
          $toggle = document.querySelector(Settings.customToggle);
        }
        else if (window.jQuery && Settings.customToggle instanceof jQuery && Settings.customToggle.length) {
          $toggle = Settings.customToggle[0];
        }
        else if (Settings.customToggle instanceof Element) {
          $toggle = Settings.customToggle;
        }

        if ($toggle) {
          $toggle.classList.add('hc-nav-trigger', navUniqId);
          $toggle.addEventListener('click', toggleNav);
        }
      }

      // ARIA
      $toggle.setAttribute('role', 'button');
      $toggle.setAttribute('aria-controls', navUniqId);

      // make nav opening keyboard accessible
      $toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          // trap focus inside nav
          setTimeout(() => {
            trapFocus(0, 0);
          }, 0);
        }
      });

      /* ARIA Keyboard Focus */

      const trapFocus = (n, l, i) => {
        if (typeof l !== 'number' || (typeof n !== 'number' && !_focusEls.length)) {
          return;
        }

        const focusableSelector = '[tabindex="0"], a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';

        let $focusable = Array.prototype.filter.call($nav_container.querySelectorAll('.nav-wrapper'), (el) => {
          return el.getAttribute('data-level') == l && (typeof i !== 'number' || (typeof i === 'number' && el.getAttribute('data-index') == i));
        })[0];
        $focusable = children($focusable, '.nav-content')[0];
        $focusable = children($focusable, 'ul');
        $focusable = children($focusable, 'li');
        $focusable = children($focusable, ':not(.nav-wrapper)');
        $focusable = Array.prototype.map.call($focusable, (el) => {
          return Array.prototype.slice.call(el.querySelectorAll(focusableSelector));
        }).flat();
        $focusable = Array.prototype.filter.call($focusable, (el) => el.getAttribute('tabindex') !== '-1');

        if (!$focusable) {
          return;
        }

        const $first = $focusable[0];
        const $last = $focusable[$focusable.length - 1];

        if (typeof n === 'number') {
          // put focus on item with desired index
          $focusable[n].focus();
        }
        else {
          // focus last focusable element
          _focusEls[_focusEls.length - 1].focus();
          // remove last element from focusable array
          _focusEls.pop();
        }

        // remove previous keydown event
        document.removeEventListener(keydownEventName);

        document.addEventListener(keydownEventName, (e) => {
          if (!(e.key === 'Tab' || e.keyCode === 9)) {
            return;
          }

          /* shift + tab */
          if (e.shiftKey) {
            if (document.activeElement === $first) {
              e.preventDefault();
              $last.focus();
            }
          }
          /* tab */
          else {
            if (document.activeElement === $last) {
              e.preventDefault();
              $first.focus();
            }
          }
        });
      };

      const untrapFocus = () => {
        document.removeEventListener(keydownEventName);

        setTimeout(() => {
          $toggle.focus();
        }, _transitionDuration);
      };

      /* Build methods */

      const calcNav = () => {
        // remove transition from the nav container so we can update the nav without flickering
        $nav_container.style.transition = 'none';

        _containerWidth = $nav_container.offsetWidth;
        _containerHeight = $nav_container.offsetHeight;

        // fix 100% transform glitching
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-left .nav-container`, `transform: translate3d(-${_containerWidth}px, 0, 0)`);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-right .nav-container`, `transform: translate3d(${_containerWidth}px, 0, 0)`);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-top .nav-container`, `transform: translate3d(0, -${_containerHeight}px, 0)`);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-bottom .nav-container`, `transform: translate3d(0, ${_containerHeight}px, 0)`);

        Styles.insert();

        // clear our 'none' inline transition
        $nav_container.style.transition = '';

        _transitionProperty = window.getComputedStyle($nav_container).transitionProperty;
        _transitionDuration = toMs(window.getComputedStyle($nav_container).transitionDuration);
        _transitionFunction = window.getComputedStyle($nav_container).transitionTimingFunction;

        if (Settings.pushContent && $push_content && _transitionProperty) {
          Styles.add(getElementCssTag($push_content), `transition: ${_transitionProperty} ${_transitionDuration}ms ${_transitionFunction}`);
        }

        Styles.insert();
      };

      // init function
      const initNav = (reinit) => {
        const toggleDisplay = window.getComputedStyle($toggle).display;
        const mediaquery = Settings.disableAt ? `max-width: ${Settings.disableAt - 1}px` : false;
        const width = formatSizeVal(Settings.width);
        const height = formatSizeVal(Settings.height);

        if (width.indexOf('px') !== -1) {
          _containerWidth = parseInt(width);
        }

        if (height.indexOf('px') !== -1) {
          _containerHeight = parseInt(height);
        }

        if (checkForUpdate(['disableAt', 'position'])) {
          // clear media queries from previous run
          Styles.reset();
        }

        // create styles
        Styles.add(`.hc-offcanvas-nav.${navUniqId}`, 'display: block', mediaquery);

        // hide original
        Styles.add(`.hc-nav-original.${navUniqId}`, 'display: none', mediaquery);

        // trigger
        Styles.add(`.hc-nav-trigger.${navUniqId}`, `display: ${toggleDisplay && toggleDisplay !== 'none' ? toggleDisplay : 'block'}`, mediaquery);

        if (['left', 'right'].indexOf(Settings.position) !== -1) {
          // container width
          Styles.add(`.hc-offcanvas-nav.${navUniqId} .nav-container`, `width: ${width}`);
        }
        else {
          // container height
          Styles.add(`.hc-offcanvas-nav.${navUniqId} .nav-container`, `height: ${height}`);
        }

        // container transform
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-left .nav-container`, `transform: translate3d(-${width === 'auto' ? '100%' : width}, 0, 0);`);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-right .nav-container`, `transform: translate3d(${width === 'auto' ? '100%' : width}, 0, 0);`);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-top .nav-container`, `transform: translate3d(0, -${height === 'auto' ? '100%' : height}, 0);`);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-bottom .nav-container`, `transform: translate3d(0, ${height === 'auto' ? '100%' : height}, 0);`);

        // wrappers
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-levels-overlap.nav-position-left li.level-open > .nav-wrapper`, `transform: translate3d(-${Settings.levelSpacing}px,0,0)`, mediaquery);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-levels-overlap.nav-position-right li.level-open > .nav-wrapper`, `transform: translate3d(${Settings.levelSpacing}px,0,0)`, mediaquery);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-levels-overlap.nav-position-top li.level-open > .nav-wrapper`, `transform: translate3d(0,-${Settings.levelSpacing}px,0)`, mediaquery);
        Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-levels-overlap.nav-position-bottom li.level-open > .nav-wrapper`, `transform: translate3d(0,${Settings.levelSpacing}px,0)`, mediaquery);

        Styles.insert();

        // get page content
        if (!reinit || (reinit && checkForUpdate('pushContent'))) {
          if (Settings.pushContent instanceof Element) {
            // we're good
          }
          else if (typeof Settings.pushContent === 'string') {
            $push_content = document.querySelector(Settings.pushContent);
          }
          else if (window.jQuery && Settings.pushContent instanceof jQuery && $push_content.length) {
            $push_content = Settings.pushContent[0];
          }
          else {
            $push_content = null;
          }
        }

        // remove transition from the nav container so we can update the nav without flickering
        $nav_container.style.transition = 'none';

        const wasOpen = $nav.classList.contains(navOpenClass);

        const navClasses = [
          'hc-offcanvas-nav',
          Settings.navClass || '',
          navUniqId,
          Settings.navClass || '',
          'nav-levels-' + Settings.levelOpen || 'none',
          'nav-position-' + Settings.position,
          Settings.disableBody ? 'disable-body' : '',
          isIos ? 'is-ios' : '',
          isTouchDevice ? 'touch-device' : '',
          wasOpen ? navOpenClass : '',
          Settings.rtl ? 'rtl' : ''
        ].join(' ').trim();

        $nav.removeEventListener('click');
        $nav.className = navClasses;
        $nav.setAttribute('aria-hidden', true);
        $nav.setAttribute('aria-labelledby', navUniqId);

        // close menu on body click (nav::after)
        if (Settings.disableBody) {
          $nav.addEventListener('click', closeNav);
        }

        if (reinit) {
          calcNav();
        }
        else {
          // timed out so we can get computed data
          setTimeout(calcNav, 0);
        }
      };

      // create nav model function
      const createModel = () => {

        // get first level menus
        const $first_level = () => {
          const $ul = Array.prototype.slice.call($originalNav.querySelectorAll('ul')); // original nav menus

          if ($originalNav.tagName === 'UL') {
            $ul.unshift($originalNav);
          }

          return [$ul[0]].concat(Array.prototype.filter.call($ul[0].parentNode.children, (child) => child !== $ul[0]));
        };

        // call
        Model = getModel($first_level(), null);

        function getModel($menu, id) {
          const level = [];

          Array.prototype.forEach.call($menu, ($ul) => {
            const nav = {
              id: id,
              classes: $ul.getAttribute('class') || null,
              items: []
            };

            // this submenu should be open next
            if ($ul.getAttribute('data-nav-active') !== null) {
              _nextActiveLevel = id;
              // remove data attribute
              $ul.removeAttribute('data-nav-active');
            }

            Array.prototype.forEach.call($ul.children, ($li) => {
              const customContent = $li.getAttribute('data-nav-custom-content') !== null;
              const $content = customContent ? $li.children : Array.prototype.filter.call($li.children, (child) => child.tagName !== 'UL' && !child.querySelector('ul')).concat($li.children.length ? [] : [$li.firstChild]);
              const $nested_navs = customContent ? [] : Array.prototype.slice.call($li.querySelectorAll('ul'));
              const $subnav = !$nested_navs.length ? [] : [$nested_navs[0]].concat(Array.prototype.filter.call($nested_navs[0].parentNode.children, (child) => child.tagName === 'UL' && child !== $nested_navs[0]));

              let uniqid = null;

              // save unique identifier for remembering open sub menus
              if ($subnav.length) {
                if (!data($li, 'hc-uniqid')) {
                  uniqid = ID();
                  data($li, 'hc-uniqid', uniqid);
                }
                else {
                  uniqid = data($li, 'hc-uniqid');
                }
              }

              // submenu of this list element should be open next
              if ($li.getAttribute('data-nav-active') !== null) {
                _nextActiveLevel = uniqid;
                // remove data attribute
                $li.removeAttribute('data-nav-active');
              }

              // add elements to this level
              nav.items.push({
                id: uniqid,
                classes: $li.getAttribute('class') || '',
                content: $content,
                custom: customContent,
                subnav: $subnav.length ? getModel($subnav, uniqid) : [],
                highlight: $li.getAttribute('data-nav-highlight') !== null
              });
            });

            level.push(nav);
          });

          return level;
        }
      };

      // create nav DOM function
      const createNavDom = (reinit) => {
        if (reinit) {
          // empty the container
          while ($nav_container.firstChild) $nav_container.removeChild($nav_container.firstChild);
          // reset indexes
          _indexes = {};
        }

        // call
        createDom(Model, $nav_container, 0, Settings.navTitle);

        function createDom(menu, $container, level, title, backIndex, backTitle) {
          const $wrapper = createElement('div', {
            class: `nav-wrapper nav-wrapper-${level}`,
            'data-level': level,
            'data-index': backIndex || 0
          });
          const $content = createElement('div', {class: 'nav-content'});

          $wrapper.addEventListener('click', stopPropagation);
          $wrapper.appendChild($content);
          $container.appendChild($wrapper);

          // titles
          if (title) {
            $content.insertBefore(createElement('h2', {}, title), $content.firstChild);
          }

          menu.forEach((nav, i_nav) => {
            const $menu = createElement('ul', {
              role: 'menu',
              'aria-level': level + 1
            });

            $content.appendChild($menu);

            // keep original menu classes
            if (Settings.keepClasses && nav.classes) {
              $menu.classList.add(...nav.classes.split(' '));
            }

            if (i_nav === 0 && title) {
              $menu.setAttribute('aria-label', title);
            }

            if (nav.id) {
              $menu.setAttribute('aria-labelledby', `menu-${nav.id}`);
            }

            nav.items.forEach((item, i_item) => {
              const $item_content = item.content;

              // item has custom content
              if (item.custom) {

                const $custom_item = createElement('li', {class: 'custom-content'},
                  createElement('div', {class: 'nav-item nav-item-custom'}, Array.prototype.map.call($item_content, (el) => {
                    return cloneNodeWithEvents(el, true, true);
                  }))
                );

                // keep original menu item classes
                if (Settings.keepClasses && item.classes) {
                  $custom_item.classList.add(...item.classes.split(' '));
                }

                // insert item
                $menu.appendChild($custom_item);

                // stop here
                return;
              }

              const $original_link = Array.prototype.filter.call($item_content, (child) => {
                return child.tagName === 'A' || (child.nodeType !== 3 && child.querySelector('a'));
              })[0];

              let $item_link;

              if ($original_link) {
                $item_link = cloneNodeWithEvents($original_link, false, true);
                $item_link.classList.add('nav-item');
              }
              else {
                $item_link = createElement(item.subnav.length ? 'a' : 'span', {
                  class: 'nav-item'
                }, Array.prototype.map.call($item_content, (el) => {
                  return cloneNodeWithEvents(el, true, true);
                }));
              }

              if ($item_link.tagName === 'A') {
                $item_link.setAttribute('tabindex', '0');
                $item_link.setAttribute('role', 'menuitem');

                if (!$item_link.getAttribute('href')) {
                  $item_link.setAttribute('href', '#');
                }
              }

              if ($original_link) {
                $item_link.addEventListener('click', (e) => {
                  e.stopPropagation();

                  // trigger original click event
                  if (hasListener($original_link, 'click')) {
                    $original_link.click();
                  }
                });
              }

              if ($item_link.getAttribute('href') === '#') {
                // prevent page jumping
                $item_link.addEventListener('click', preventDefault);
              }

              // close nav on item click
              if (Settings.closeOnClick) {
                if (!areLevelsOpenable()) {
                  // every item should close the nav except disabled
                  if (
                    $item_link.tagName === 'A' &&
                    $item_link.dataset.navClose !== 'false' &&
                    ($item_link.getAttribute('disabled') === null || $item_link.getAttribute('disabled') === 'false')
                  ) {
                    $item_link.addEventListener('click', closeNav);
                  }
                }
                else {
                  // only items without submenus
                  // or with submenus but with valid links
                  if (
                    $item_link.tagName === 'A' &&
                    $item_link.dataset.navClose !== 'false' &&
                    ($item_link.getAttribute('disabled') === null || $item_link.getAttribute('disabled') === 'false') &&
                    (!item.subnav.length || ($item_link.getAttribute('href') && $item_link.getAttribute('href').charAt(0) !== '#'))
                  ) {
                    $item_link.addEventListener('click', closeNav);
                  }
                }
              }

              // our nav item
              const $item = createElement('li');

              $item.appendChild($item_link);
              $menu.appendChild($item);

              // keep original menu item classes
              if (Settings.keepClasses && item.classes) {
                $item.className = item.classes;
              }

              // is nav item highlighted?
              if (item.highlight) {
                $item.classList.add('nav-highlight');
              }

              // wrap item link
              wrap($item_link, createElement('div', {class: 'nav-item-wrapper'}));

              // indent levels in expanded levels
              if (Settings.levelSpacing && (Settings.levelOpen === 'expand' || (Settings.levelOpen === false || Settings.levelOpen === 'none'))) {
                const indent = Settings.levelSpacing * level;

                if (indent) {
                  $menu.style.textIndent = `${indent}px`;
                }
              }

              // do subnav
              if (item.subnav.length) {
                const nextLevel = level + 1;
                const uniqid = item.id;
                let nav_title = '';

                // create new level
                if (!_indexes[nextLevel]) {
                  _indexes[nextLevel] = 0;
                }

                // li parent class
                $item.classList.add('nav-parent');

                if (!areLevelsOpenable()) {
                  $item_link.setAttribute('aria-expanded', true);
                }
                // if we can open levels
                else {
                  const index = _indexes[nextLevel];

                  const $checkbox = createElement('input', {
                    type: 'checkbox',
                    id: `${navUniqId}-${nextLevel}-${index}`,
                    class: 'hc-chk',
                    tabindex: -1,
                    'data-level': nextLevel,
                    'data-index': index,
                    value: uniqid
                  });

                  $checkbox.addEventListener('click', stopPropagation);
                  $checkbox.addEventListener('change', checkboxChange);
                  $item.insertBefore($checkbox, $item.firstChild);

                  const attachToLink = ($el) => {
                    $el.addEventListener('click', (e) => {
                      e.stopPropagation();
                      // trigger checkbox to toggle level
                      $checkbox.setAttribute('checked', $checkbox.getAttribute('checked') === 'true' ? false : true);

                      if ('createEvent' in document) {
                        const evt = document.createEvent('HTMLEvents');
                        evt.initEvent('change', false, true);
                        $checkbox.dispatchEvent(evt);
                      }
                    });

                    $el.addEventListener('keydown', function(e) {
                      if (e.key === 'Enter' || e.keyCode === 13) {
                        // remember we are accessing via keyboard
                        _keyboard = true;
                        _focusEls.push(this);
                      }
                    });

                    // ARIA
                    $el.setAttribute('aria-controls', `menu-${uniqid}`);
                    $el.setAttribute('aria-haspopup', Settings.levelOpen === 'overlap');
                    $el.setAttribute('aria-expanded', false);
                  }

                  // nav is updated, we should keep this level open
                  if (_openLevels.indexOf(uniqid) !== -1) {
                    $wrapper.classList.add('sub-level-open');
                    $wrapper.addEventListener('click', () => closeLevel(nextLevel, index)); // close on self click
                    $item.classList.add('level-open');
                    $checkbox.setAttribute('checked', true);
                  }

                  // subnav title
                  nav_title = Settings.levelTitles === true ? $item_content[0].textContent.trim() : '';

                  // item has no actual link
                  if (!$item_link.getAttribute('href') || $item_link.getAttribute('href') === '#') {
                    $item_link.appendChild(createElement('span', {class: 'nav-next'}, createElement('span')));
                    attachToLink($item_link);
                  }
                  // item has valid link, create our next link
                  else {
                    const $a_next = createElement('a', {
                      href: '#',
                      class: 'nav-next',
                      'aria-label': `${nav_title} Submenu`,
                      role: 'menuitem',
                      tabindex: 0
                    }, createElement('span'));

                    $a_next.addEventListener('click', preventClick());
                    $item_link.parentNode.insertBefore($a_next, $item_link.nextSibling)
                    attachToLink($a_next);
                  }
                }

                _indexes[nextLevel]++;

                createDom(item.subnav, $item, nextLevel, nav_title, _indexes[nextLevel]-1, title);
              }
            });
          });

          // insert back links
          if (level && typeof backIndex !== 'undefined') {
            if (Settings.insertBack !== false && Settings.levelOpen === 'overlap') {
              const $children_menus = children($content, 'ul');
              const backLabel = (Settings.levelTitleAsBack ? (backTitle || Settings.labelBack) : Settings.labelBack) || '';
              const $back_a = createElement('a', {href: '#', role: 'menuitem', tabindex: 0}, [
                backLabel,
                createElement('span')
              ]);
              const $back = createElement('li', {class: 'nav-back'}, $back_a);
              const closeThisLevel = () => closeLevel(level, backIndex);

              wrap($back_a, createElement('div', {class: 'nav-item-wrapper'}));
              $back_a.addEventListener('click', preventClick(closeThisLevel));
              $back_a.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                  // remember we are accessing via keyboard
                  _keyboard = true;
                }
              });

              if (Settings.insertBack === true) {
                $children_menus[0].insertBefore($back, $children_menus[0].firstChild);
              }
              else if (isNumeric(Settings.insertBack)) {
                insertAt($back, Settings.insertBack, $children_menus);
              }
            }
          }

          // insert close link
          if (level === 0 && Settings.insertClose !== false) {
            const $nav_ul = children($content, 'ul');
            const $close = createElement('li', {class: 'nav-close'},
              createElement('a', {href: '#', role: 'menuitem', tabindex: 0}, Settings.labelClose || '')
            );
            const $close_a = $close.querySelector('li > a');

            wrap($close_a, createElement('div', {class: 'nav-item-wrapper'}));
            $close_a.addEventListener('click', preventClick(closeNav));
            $close_a.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.keyCode === 13) {
                untrapFocus();
              }
            });

            if (Settings.insertClose === true) {
              $nav_ul[0].insertBefore($close, $nav_ul[0].firstChild);
            }
            else if (isNumeric(Settings.insertClose)) {
              insertAt($close, Settings.insertClose, $nav_ul);
            }
          }
        }
      };

      /* Touch swipe gestures */

      const touchStart = (target) => {
        return (e) => {
          if (Settings.position !== 'left' && Settings.position !== 'right') {
            return;
          }

          _xStart = e.touches[0].clientX;
          _yStart = e.touches[0].clientY;

          // temporary attach touch listeners
          if (target === 'doc') {
            if (!_touchNavTriggered) {
              document.addEventListener('touchmove', touchMove_open, supportsPassive);
              document.addEventListener('touchend', touchEnd_open, supportsPassive);
            }
          }
          else {
            _touchNavTriggered = true;
            $nav_container.addEventListener('touchmove', touchMove_close, supportsPassive);
            $nav_container.addEventListener('touchend', touchEnd_close, supportsPassive);
          }
        };
      };

      const touchCaptureNav = (transNav, transContent) => {
        disableScroll();
        $nav.style.visibility = 'visible';
        $nav_container.style[browserPrefix('transition')] = 'none';
        setTransform($nav_container, transNav, Settings.position);

        if ($push_content) {
          $push_content.style[browserPrefix('transition')] = 'none';
          setTransform($push_content, transContent, Settings.position);
        }
      };

      const touchReleaseNav = (action, timeoutVsb = true, transNav = false, transContent = false) => {
        enableScroll();
        $nav_container.style[browserPrefix('transition')] = '';
        setTransform($nav_container, transNav, Settings.position);

        if ($push_content) {
          $push_content.style[browserPrefix('transition')] = '';
          setTransform($push_content, transContent, Settings.position);
        }

        if (action === 'open') {
          openNav();
        }
        else {
          closeNav();

          if (timeoutVsb) {
            setTimeout(() => {
              $nav.style.visibility = '';
            }, _transitionDuration);
          }
          else {
            $nav.style.visibility = '';
          }
        }
      };

      const touchMove_open = (e) => {
        let xDiff = 0 - (_xStart - e.touches[0].clientX);
        const levelSpacing = Settings.levelOpen === 'overlap' ? activeLevel() * Settings.levelSpacing : 0;
        const swipeWidth = _containerWidth + levelSpacing;
        const maxStart = 30; // from the edge of the screen

        if (Settings.position === 'left') {
          xDiff = Math.min(Math.max(xDiff, 0), swipeWidth);
        }
        else {
          xDiff = Math.abs(Math.min(Math.max(xDiff, -swipeWidth), 0));
        }

        if (
          (Settings.position === 'left' && _xStart < maxStart) || // swipe right
          (Settings.position === 'right' && _xStart > document.clientWidth - maxStart) // swipe left
        ) {
          _touchMoved = true;
          touchCaptureNav(0 - (_containerWidth - xDiff), Math.abs(xDiff));
        }
      };

      const touchEnd_open = (e) => {
        // remove touch listeners from document
        document.removeEventListener('touchmove', touchMove_open);
        document.removeEventListener('touchend', touchEnd_open);

        if (!_touchMoved) {
          return;
        }

        const lastTouch = e.changedTouches[e.changedTouches.length-1];
        let xDiff = 0 - (_xStart - lastTouch.clientX);
        const levelSpacing = Settings.levelOpen === 'overlap' ? activeLevel() * Settings.levelSpacing : 0;
        const swipeWidth = _containerWidth + levelSpacing;
        const diffTrashold = 50; // swipe distance required

        if (Settings.position === 'left') {
          xDiff = Math.min(Math.max(xDiff, 0), swipeWidth);
        }
        else {
          xDiff = Math.abs(Math.min(Math.max(xDiff, -swipeWidth), 0));
        }

        if (!xDiff) {
          touchReleaseNav('close', false);
        }
        else if (xDiff > diffTrashold) {
          touchReleaseNav('open');
        }
        else {
          touchReleaseNav('close');
        }

        // reset touch
        _xStart = null;
        _yStart = null;
        _touchMoved = false;
      };

      const touchMove_close = (e) => {
        let xDiff = 0 - (_xStart - e.touches[0].clientX);
        let yDiff = 0 - (_yStart - e.touches[0].clientY);

        if (Math.abs(xDiff) < Math.abs(yDiff)) {
          return;
        }

        const levelSpacing = Settings.levelOpen === 'overlap' ? activeLevel() * Settings.levelSpacing : 0;
        const swipeWidth = _containerWidth + levelSpacing;

        if (Settings.position === 'left') {
          xDiff = Math.min(Math.max(xDiff, -swipeWidth), 0);
        }
        else {
          xDiff = Math.min(Math.max(xDiff, 0), swipeWidth);
        }

        if (
          (Settings.position === 'left' && xDiff < 0) || // swipe right
          (Settings.position === 'right' && xDiff > 0) // swipe left
        ) {
          _touchMoved = true;
          touchCaptureNav(-Math.abs(xDiff) + levelSpacing, swipeWidth - Math.abs(xDiff));
        }
      };

      const touchEnd_close = (e) => {
        // remove touch listeners from nav
        $nav_container.removeEventListener('touchmove', touchMove_close);
        $nav_container.removeEventListener('touchend', touchEnd_close);
        _touchNavTriggered = false;

        if (!_touchMoved) {
          return;
        }

        const lastTouch = e.changedTouches[e.changedTouches.length-1];
        let xDiff = 0 - (_xStart - lastTouch.clientX);
        const levelSpacing = Settings.levelOpen === 'overlap' ? activeLevel() * Settings.levelSpacing : 0;
        const swipeWidth = _containerWidth + levelSpacing;
        const diffTrashold = 50;

        if (Settings.position === 'left') {
          xDiff = Math.abs(Math.min(Math.max(xDiff, -swipeWidth), 0));
        }
        else {
          xDiff = Math.abs(Math.min(Math.max(xDiff, 0), swipeWidth));
        }

        if (xDiff === swipeWidth) {
          touchReleaseNav('close', false);
        }
        else if (xDiff > diffTrashold) {
          touchReleaseNav('close');
        }
        else {
          touchReleaseNav('open', true, levelSpacing, swipeWidth);
        }

        // reset touch
        _xStart = null;
        _yStart = null;
        _touchMoved = false;
      };

      /* Setup our nav */

      // init nav
      initNav();

      // init our Model
      createModel();

      // create view from model
      createNavDom();

      // remove original nav
      if (Settings.removeOriginalNav === true) {
        $originalNav.parentNode.removeChild($originalNav);
      }
      else {
        // add classes to original menu so we know it's connected to our copy
        $originalNav.classList.add('hc-nav-original', navUniqId);
      }

      // insert nav to DOM
      if (Settings.bodyInsert === 'prepend') {
        document.body.insertBefore($nav, document.body.firstChild);
      }
      else if (Settings.bodyInsert === 'append') {
        document.body.appendChild($nav);
      }

      // opened nav right away
      if (Settings.expanded === true) {
        _initExpanded = true; // set flag
        openNav();
      }

      if (Settings.swipeGestures) {
        // close touch event on nav swipe
        // trigger before document touch
        $nav_container.addEventListener('touchstart', touchStart('nav'), supportsPassive);
        // open touch event on document swipe
        document.addEventListener('touchstart', touchStart('doc'), supportsPassive);
      }

      // close levels on escape
      document.addEventListener('keydown', checkEsc);

      /* Private methods */

      function checkEsc(e) {
        if (isOpen() && (e.key === 'Escape' || e.keyCode === 27)) {
          const level = activeLevel();

          if (level === 0) {
            closeNav();
            untrapFocus();
          }
          else {
            closeLevel(level, activeIndex());
            trapFocus(null, level-1);
          }
        }
      };

      function checkboxChange() {
        const l = Number(this.dataset.level);
        const i = Number(this.dataset.index);

        if (this.getAttribute('checked') === 'true') {
          openLevel(l, i);
        }
        else {
          closeLevel(l, i);
        }
      }

      function areLevelsOpenable() {
        return Settings.levelOpen !== false && Settings.levelOpen !== 'none';
      }

      function isOpen() {
        return _open;
      }

      function activeLevel() {
        return _openLevels.length
          ? Number(
              Array.prototype.filter.call($nav_container.querySelectorAll('.hc-chk'), (el) => {
                return el.value == _openLevels[_openLevels.length - 1];
              })[0].dataset.level
            )
          : 0;
      }

      function activeIndex() {
        return _openLevels.length
          ? Number(
              Array.prototype.filter.call($nav_container.querySelectorAll('.hc-chk'), (el) => {
                return el.value == _openLevels[_openLevels.length - 1];
              })[0].dataset.index
            )
          : 0;
      }

      function openNav(l, i) {
        // check if already open
        if (isOpen() && typeof i === 'undefined') {
          return;
        }

        // open main nav
        _openNav();

        if (!areLevelsOpenable()) {
          return;
        }

        let $checkbox;

        if ((typeof l === 'number' || isNumeric(l)) && (typeof i === 'number' || isNumeric(i))) {

          $checkbox = document.querySelector(`#${navUniqId}-${l}-${i}`);

          if (!$checkbox) {
            console.warn(`HC Offcanvas Nav: level ${l} doesn't have index ${i}`);
            return;
          }
        }
        else if (_nextActiveLevel) {
          // get level to open from [data-nav-active]
          $checkbox = Array.prototype.filter.call($nav_container.querySelectorAll('.hc-chk'), (el) => {
            return el.value == _nextActiveLevel;
          })[0];

          // reset flag
          if (Settings.closeActiveLevel || !Settings.closeOpenLevels) {
            _nextActiveLevel = null;
          }
        }
        else if (Settings.closeOpenLevels === false) {
          // get last checked level
          $checkbox = Array.prototype.filter.call($nav_container.querySelectorAll('.hc-chk'), (el) => {
            return el.getAttribute('checked') === 'true';
          });
          $checkbox = $checkbox[$checkbox.length - 1];
        }

        // open sub levels as well
        if ($checkbox) {
          let levels = [];
          l = Number($checkbox.dataset.level);
          i = Number($checkbox.dataset.index);

          if (l > 1) {
            const $parents = [];

            for (; $checkbox && $checkbox !== document; $checkbox = $checkbox.parentNode) {
              if ($checkbox.matches('.nav-wrapper')) {
                $parents.push($checkbox);
              }
              continue;
            }

            // get parent levels to open
            for (let i = 0; i < $parents.length; i++) {
              const $this = $parents[i];
              const level = Number($this.dataset.level);

              if (level > 0) {
                levels.push({
                  level: level,
                  index: Number($this.dataset.index)
                });
              }
            };

            levels = levels.reverse();
          }

          levels.push({
            level: l,
            index: i
          });

          for (let n = 0; n < levels.length; n++) {
            // open each level without transition
            openLevel(levels[n].level, levels[n].index, false);
          }
        }
      }

      function _openNav() {
        // check if already open
        if (isOpen()) {
          return;
        }

        _open = true;

        $nav.style.visibility = 'visible';
        $nav.setAttribute('aria-hidden', false);
        $nav.classList.add(navOpenClass);

        $toggle.classList.add('toggle-open');

        if (Settings.levelOpen === 'expand' && _closeLevelsTimeout) {
          clearTimeout(_closeLevelsTimeout);
        }

        if (Settings.disableBody) {
          // remember scroll position
          _top = window.pageYOffset || document.getElementsByTagName('html')[0].scrollTop || document.documentElement.scrollTop || document.body.scrollTop;

          if (hasScrollBar()) {
            html.classList.add('hc-nav-yscroll');
          }

          document.body.classList.add('hc-nav-open');

          if (_top) {
            // leave page in place
            document.body.style.top = `${-_top}px`;
          }
        }

        if ($push_content) {
          const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
          setTransform($push_content, transformVal, Settings.position);
        }

        if (_initExpanded) {
          // reset flag
          _initExpanded = false;
          // don't trigger open event if nav is initially expanded
          return;
        }

        setTimeout(() => {
          // trigger open event
          if ($nav._eventListeners.open) {
            $nav._eventListeners.open.forEach((ev) => {
              ev.fn(customEventObject('open', $nav, $nav), Object.assign({}, Settings));
            });
          }
        }, _transitionDuration);
      }

      function closeNav() {
        // check if already closed
        if (!isOpen()) {
          return;
        }

        _open = false;

        if ($push_content) {
          setTransform($push_content, false);
        }

        $nav.classList.remove(navOpenClass);
        $nav.setAttribute('aria-hidden', true);
        $nav_container.removeAttribute('style');
        $toggle.classList.remove('toggle-open');

        if (Settings.levelOpen === 'expand' && ['top', 'bottom'].indexOf(Settings.position) !== -1) {
          // close all levels before closing the nav because the nav height changed
          closeLevel(0);
        }
        else if (areLevelsOpenable()) {
          // close all levels when nav closes
          _closeLevelsTimeout = setTimeout(() => {
            // keep timeout so we can prevent it if nav opens again before it's closed
            closeLevel(0);
          }, Settings.levelOpen === 'expand' ? _transitionDuration : 0);
        }

        if (Settings.disableBody) {
          document.body.classList.remove('hc-nav-open');
          html.classList.remove('hc-nav-yscroll');

          if (_top) {
            document.body.style.top = '';
            document.body.scrollTop = _top;
            html.scrollTop = _top;

            // for some reason we need timeout if position is bottom
            if (Settings.position === 'bottom') {
              const t = _top;
              setTimeout(() => {
                // reset page position
                document.body.scrollTop = t;
                html.scrollTop = t;
              }, 0);
            }

            // reset top
            _top = 0;
          }
        }

        setTimeout(() => {
          $nav.style.visibility = '';

          // trigger "close" event
          if ($nav._eventListeners.close) {
            $nav._eventListeners.close.forEach((ev) => {
              ev.fn(customEventObject('close', $nav, $nav), Object.assign({}, Settings));
            });
          }

          // only trigger this "close" event once and then remove it
          if ($nav._eventListeners['close.once']) {
            $nav._eventListeners['close.once'].forEach((ev) => {
              ev.fn(customEventObject('close.once', $nav, $nav), Object.assign({}, Settings));
            });
          }
          $nav.removeEventListener('close.once');
        }, _transitionDuration);
      }

      function toggleNav(e) {
        e.preventDefault();
        e.stopPropagation();

        if (_open) closeNav();
        else openNav();
      }

      function openLevel(l, i, transition = true) {
        const $checkbox = document.querySelector(`#${navUniqId}-${l}-${i}`);
        const uniqid = $checkbox.value;
        const $li = $checkbox.parentNode;
        const $wrap = $li.closest('.nav-wrapper');
        const $sub_wrap = children($li, '.nav-wrapper')[0];

        if (transition === false) {
          // disable level transition
          $sub_wrap.style.transition = 'none';
        }

        $checkbox.setAttribute('checked', true); // ensure it is checked
        $wrap.classList.add('sub-level-open');
        $li.classList.add('level-open');
        $li.querySelectorAll('[aria-controls]')[0].setAttribute('aria-expanded', true);

        if (transition === false) {
          setTimeout(() => {
            // re-enable level transition after nav open
            $sub_wrap.style.transition = '';
          }, _transitionDuration);
        }

        // remember what is open
        if (_openLevels.indexOf(uniqid) === -1) {
          _openLevels.push(uniqid);
        }

        if (Settings.levelOpen === 'overlap') {
          // close on self click
          $wrap.addEventListener('click', () => closeLevel(l, i));
          // expand the nav
          setTransform($nav_container, l * Settings.levelSpacing, Settings.position);

          // push content
          if ($push_content) {
            const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
            setTransform($push_content, transformVal + l * Settings.levelSpacing, Settings.position);
          }
        }

        // trigger level open event
        if ($nav._eventListeners['open.level']) {
          $nav._eventListeners['open.level'].forEach((ev) => {
            ev.fn(customEventObject('open.level', $nav, $sub_wrap, {
              currentLevel: l,
              currentIndex: i
            }), Object.assign({}, Settings));
          });
        }

        if (_keyboard) {
          // trap focus inside level when keyboard accessing
          trapFocus(0, l, i);
          // reset keyboard flag
          _keyboard = false;
        }
      }

      const _closeLevel = (l, i, transform) => {
        const $checkbox = document.querySelector(`#${navUniqId}-${l}-${i}`);

        if (!$checkbox) return;

        const uniqid = $checkbox.value;
        const $li = $checkbox.parentNode;
        const $wrap = $li.closest('.nav-wrapper');

        $checkbox.setAttribute('checked', false); // ensure it is unchecked
        $wrap.classList.remove('sub-level-open');
        $li.classList.remove('level-open');
        $li.querySelectorAll('[aria-controls]')[0].setAttribute('aria-expanded', false);

        // this is not open anymore
        if (_openLevels.indexOf(uniqid) !== -1) {
          _openLevels.splice(_openLevels.indexOf(uniqid), 1);
        }

        if (transform && Settings.levelOpen === 'overlap') {
          //level closed, remove wrapper click
          $wrap.removeEventListener('click');
          $wrap.addEventListener('click', stopPropagation);
          // collapse the nav
          setTransform($nav_container, (l - 1) * Settings.levelSpacing, Settings.position);

          // push back content
          if ($push_content) {
            const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
            setTransform($push_content, transformVal + (l - 1) * Settings.levelSpacing, Settings.position);
          }
        }
      };

      function closeLevel(l, i) {
        for (let level = l; level <= Object.keys(_indexes).length; level++) {
          if (level === l && typeof i !== 'undefined') {
            // close specified level with index
            _closeLevel(l, i, true);
          }
          else {
            if (l === 0 && !Settings.closeOpenLevels) {
              // do nothing
            } else {
              // close all sub sub levels
              for (let index = 0; index < _indexes[level]; index++) {
                _closeLevel(level, index, level === l);
              }
            }
          }
        }

        // trigger level open event
        if (l > 0 && $nav._eventListeners['close.level']) {
          const $wrap = document.querySelector(`#${navUniqId}-${l}-${i}`).closest('.nav-wrapper');

          $nav._eventListeners['close.level'].forEach((ev) => {
            ev.fn(customEventObject('close.level', $nav, $wrap, {
              currentLevel: l - 1,
              currentIndex: activeIndex()
            }), Object.assign({}, Settings));
          });
        }

        if (_keyboard) {
          // trap focus back one level when keyboard accessing
          trapFocus(null, l-1);
          // reset keyboard flag
          _keyboard = false;
        }
      }

      /* Public methods */

      $nav.on = (type, cb) => {
        $nav.addEventListener(type, cb);
      };

      $nav.off = (type, cb) => {
        $nav.removeEventListener(type, cb);
      };

      $nav.getSettings = () => Object.assign({}, Settings);

      $nav.isOpen = isOpen;

      $nav.open = openNav;

      $nav.close = closeNav;

      $nav.update = (options, updateDom) => {
        // clear updated array
        UpdatedSettings = [];

        // update our settings
        if (typeof options === 'object') {
          // only get what's been actually updated
          for (let prop in options) {
            if (Settings[prop] !== options[prop]) {
              UpdatedSettings.push(prop);
            }
          }

          Settings = Object.assign({}, Settings, options);
        }

        if (options === true || updateDom === true) {
          // can't update Model if original nav is removed
          if (Settings.removeOriginalNav) {
            console.warn('%c! HC Offcanvas Nav:' + `%c Can't update because original navigation has been removed. Disable \`removeOriginalNav\` option.`, 'color: #fa253b', 'color: default');
            return;
          }

          // hard update, reinit Model and DOM
          initNav(true);
          createModel();
          createNavDom(true);
        }
        else {
          // soft update just reinit DOM from existing Model
          initNav(true);
          createNavDom(true);
        }
      };

      return $nav; // return our nav element
    };

    if (Array.isArray(elem) || elem instanceof NodeList) {
      const navs = [];
      // call the plugin on each element
      for (let i = 0; i < elem.length; i++) {
        navs.push(Plugin(elem[i]));
      }

      return navs.length > 1 ? navs : navs[0];
    }
    else {
      return Plugin(elem);
    }
  };

  // jQuery Plugin
  if (typeof window.jQuery !== 'undefined') {
    const $ = window.jQuery;
    const namespace = 'hcOffcanvasNav';

    $.fn.extend({
      hcOffcanvasNav: function(args) {
        // check if selected element exist
        if (!this.length) return this;

        return this.each(function() {
          let instance = $.data(this, namespace);

          if (instance) {
            // already created, just update
            instance.update(args);
          }
          else {
            // create new instance
            instance = new hcOffcanvasNav(this, args);
            $.data(this, namespace, instance);
          }
        });
      }
    });
  }

  // browser global
  window.hcOffcanvasNav = window.hcOffcanvasNav || hcOffcanvasNav;
});