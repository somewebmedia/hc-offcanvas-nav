/*
 * HC Off-canvas Nav
 * ===================
 * Version: 4.2.3
 * Author: Some Web Media
 * Author URL: https://github.com/somewebmedia/
 * Plugin URL: https://github.com/somewebmedia/hc-offcanvas-nav
 * Description: jQuery plugin for creating off-canvas multi-level navigations
 * License: MIT
 */

'use strict';

(function($, window) {
  const document = window.document;
  const $window = $(window);
  const $html = $(document.getElementsByTagName('html')[0]);
  const $document = $(document);

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

  const formatSizeVal = (n) => (n === 'auto') ? n : isNumeric(n) ? n + 'px' : n;

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

  const getElementCssTag = (el) => {
    return typeof el === 'string'
      ? el
      : el.attr('id')
        ? '#' + el.attr('id')
        : el.attr('class')
          ? el.prop('tagName').toLowerCase() + '.' + el.attr('class').replace(/\s+/g, '.')
          : getElementCssTag(el.parent()) + ' ' + el.prop('tagName').toLowerCase();
  };

  const printStyle = (id) => {
    const $style = $(`<style id="${id}">`).appendTo($('head'))
    let rules = {};
    let media = {};

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

        $style.html(cssText);
      }
    };
  };

  const insertAt = ($insert, n, $parent) => {
    const $children = $parent.children();
    const count = $children.length;
    const i = n > -1
      ? Math.max(0, Math.min(n - 1, count))
      : Math.max(0, Math.min(count + n + 1, count));

    if (i === 0) {
      $parent.prepend($insert);
    } else {
      $children.eq(i - 1).after($insert);
    }
  };

  const getAxis = (position) => ['left', 'right'].indexOf(position) !== -1 ? 'x' : 'y';

  const setTransform = (() => {
    const transform = browserPrefix('transform');

    return ($el, val, position) => {
      if (transform) {
        if (val === false) {
          $el.css(transform, '');
        }
        else {
          if (getAxis(position) === 'x') {
            const x = position === 'left' ? val : 0 - val;
            $el.css(transform, `translate3d(${x}px,0,0)`);
          }
          else {
            const y = position === 'top' ? val : 0 - val;
            $el.css(transform, `translate3d(0,${y}px,0)`);
          }
        }
      }
      else {
        $el.css(position, val);
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

  $.fn.extend({
    hcOffcanvasNav: function(options = {}) {
      if (!this.length) return this;

      const self = this;

      // get body of the current document
      const $body = $(document.body);

      const defaults = {
        width:              280,
        height:             'auto',
        disableAt:          false,
        pushContent:        false,
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

      let Settings = $.extend({}, defaults, options);
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

      const Plugin = function() {
        const $originalNav = $(this);

        if (!$originalNav.find('ul').addBack('ul').length) {
          console.error('%c! HC Offcanvas Nav:' + `%c Menu must contain <ul> element.`, 'color: #fa253b', 'color: default');
          return;
        }

        // count our nav
        navCount++;

        const navUniqId = `hc-nav-${navCount}`;
        const Styles = printStyle(`hc-offcanvas-${navCount}-style`);
        const keydownEventName = 'keydown.hc-offcanvas-nav';

        // this is our nav
        const $nav = $('<nav role="navigation">').on('click', stopPropagation); // prevent menu close on self click
        const $nav_container = $('<div class="nav-container">').appendTo($nav);

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

        // add classes to original menu so we know it's connected to our copy
        $originalNav.addClass(`hc-nav-original ${navUniqId}`);

        if (!Settings.customToggle) {
          // our toggle
          $toggle = $(`<a href="#" aria-label="Open Menu" class="hc-nav-trigger ${navUniqId}"><span></span></a>`)
            .on('click', toggleNav);
          $originalNav.after($toggle);
        }
        else {
          // user toggle
          $toggle = $(Settings.customToggle)
            .addClass(`hc-nav-trigger ${navUniqId}`)
            .on('click', toggleNav);
        }

        $toggle
          // ARIA
          .attr('role', 'button')
          .attr('aria-controls', navUniqId)
          // make nav opening keyboard accessible
          .on('keydown', (e) => {
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

          const focusableSelector = '[tabindex=0], a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';

          const $focusable = $nav_container
            .find('.nav-wrapper')
            .filter(`[data-level=${l}]`)
            .filter(function() {
              if (typeof i === 'number') {
                return $(this).is(`[data-index=${i}]`);
              }
              return true;
            })
            .children('.nav-content')
            .children('ul')
            .children('li')
            .children(':not(.nav-wrapper)')
            .find(focusableSelector)
            .addBack(focusableSelector)
            .filter(':not([tabindex=-1])');

          if (!$focusable.length) {
            return;
          }

          const $first = $focusable.first();
          const $last = $focusable.last();

          if (typeof n === 'number') {
            // put focus on item with desired index
            $focusable.eq(n).focus();
          }
          else {
            // focus last focusable element
            _focusEls[_focusEls.length - 1].focus();
            // remove last element from focusable array
            _focusEls.pop();
          }

          // unbind previous keydown event
          $document.off(keydownEventName);

          $document.on(keydownEventName, (e) => {
            const isTabPressed = (e.key === 'Tab' || e.keyCode === 9);

            if (!isTabPressed) {
              return;
            }

            /* shift + tab */
            if (e.shiftKey) {
              if (document.activeElement === $first[0]) {
                e.preventDefault();
                $last.focus();
              }
            }
            /* tab */
            else {
              if (document.activeElement === $last[0]) {
                e.preventDefault();
                $first.focus();
              }
            }
          });
        };

        const untrapFocus = () => {
          $document.off(keydownEventName);

          setTimeout(() => {
            $toggle.focus();
          }, _transitionDuration);
        };

        /* Build methods */

        const calcNav = () => {
          // remove transition from the nav container so we can update the nav without flickering
          $nav_container.css('transition', 'none');

          _containerWidth = $nav_container.outerWidth();
          _containerHeight = $nav_container.outerHeight();

          // fix 100% transform glitching
          Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-left .nav-container`, `transform: translate3d(-${_containerWidth}px, 0, 0)`);
          Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-right .nav-container`, `transform: translate3d(${_containerWidth}px, 0, 0)`);
          Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-top .nav-container`, `transform: translate3d(0, -${_containerHeight}px, 0)`);
          Styles.add(`.hc-offcanvas-nav.${navUniqId}.nav-position-bottom .nav-container`, `transform: translate3d(0, ${_containerHeight}px, 0)`);

          Styles.insert();

          // clear our 'none' inline transition
          $nav_container.css('transition', '');

          _transitionProperty = $nav_container.css('transition-property').split(',')[0];
          _transitionDuration = toMs($nav_container.css('transition-duration').split(',')[0]);
          _transitionFunction = $nav_container.css('transition-timing-function').split(',')[0];

          if (Settings.pushContent && $push_content && _transitionProperty) {
            Styles.add(getElementCssTag(Settings.pushContent), `transition: ${_transitionProperty} ${_transitionDuration}ms ${_transitionFunction}`);
          }

          Styles.insert();
        };

        // init function
        const initNav = (reinit) => {
          const toggleDisplay = $toggle.css('display');
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
            if (typeof Settings.pushContent === 'string') {
              $push_content = $(Settings.pushContent);

              if (!$push_content.length) {
                $push_content = null;
              }
            }
            else if (Settings.pushContent instanceof jQuery) {
              $push_content = Settings.pushContent;
            }
            else {
              $push_content = null;
            }
          }

          // remove transition from the nav container so we can update the nav without flickering
          $nav_container.css('transition', 'none');

          const wasOpen = $nav.hasClass(navOpenClass);

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
          ].join(' ');

          $nav
            .off('click')
            .attr('class', '')
            .attr('aria-hidden', true)
            .attr('aria-labelledby', navUniqId)
            .addClass(navClasses);

          // close menu on body click (nav::after)
          if (Settings.disableBody) {
            $nav.on('click', closeNav);
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
            const $ul = $originalNav.find('ul').addBack('ul'); // original nav menus
            return $ul.first().add($ul.first().siblings('ul'));
          };

          // call
          Model = getModel($first_level(), null);

          function getModel($menu, id) {
            const level = [];

            $menu.each(function() {
              const $ul = $(this);

              const nav = {
                id: id,
                classes: $ul.attr('class') || null,
                items: []
              };

              // this submenu should be open next
              if (typeof $ul.attr('data-nav-active') !== 'undefined') {
                _nextActiveLevel = id;
                // remove data attribute
                $ul.removeAttr('data-nav-active');
              }

              $ul.children('li').each(function() {
                const $li = $(this);
                const customContent = typeof $li.attr('data-nav-custom-content') !== 'undefined';
                const $content = customContent ? $li.children() : $li.children().filter(function() {
                  const $this = $(this);
                  return $this.is(':not(ul)') && !$this.find('ul').length;
                }).add($li.contents().filter(function() {
                  // text node
                  return this.nodeType === 3 && this.nodeValue.trim();
                }));
                const $nested_navs = !customContent ? $li.find('ul') : $();
                const $subnav = $nested_navs.first().add($nested_navs.first().siblings('ul'));

                let uniqid = null;

                // save unique identifier for remembering open sub menus
                if ($subnav.length) {
                  if (!$li.data('hc-uniqid')) {
                    uniqid = ID();
                    $li.data('hc-uniqid', uniqid);
                  }
                  else {
                    uniqid = $li.data('hc-uniqid');
                  }
                }

                // submenu of this list element should be open next
                if (typeof $li.attr('data-nav-active') !== 'undefined') {
                  _nextActiveLevel = uniqid;
                  // remove data attribute
                  $li.removeAttr('data-nav-active');
                }

                // add elements to this level
                nav.items.push({
                  id: uniqid,
                  classes: $li.attr('class') || null,
                  content: $content,
                  custom: customContent,
                  subnav: $subnav.length ? getModel($subnav, uniqid) : [],
                  highlight: typeof $li.attr('data-nav-highlight') !== 'undefined'
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
            $nav_container.empty();
            // reset indexes
            _indexes = {};
          }

          // call
          createDom(Model, $nav_container, 0, Settings.navTitle);

          function createDom(menu, $container, level, title, backIndex, backTitle) {
            const $wrapper = $(`<div class="nav-wrapper nav-wrapper-${level}" data-level="${level}" data-index="${backIndex || 0}">`)
              .appendTo($container)
              .on('click', stopPropagation);
            const $content = $('<div class="nav-content">').appendTo($wrapper);

            // titles
            if (title) {
              $content.prepend(`<h2>${title}</h2>`);
            }

            $.each(menu, (i_nav, nav) => {
              const $menu = $(`<ul role="menu" aria-level="${level+1}">`).addClass(nav.classes).appendTo($content);

              if (i_nav === 0 && title) {
                $menu.attr('aria-label', title);
              }

              if (nav.id) {
                $menu.attr('aria-labelledby', 'menu-' + nav.id);
              }

              $.each(nav.items, (i_item, item) => {
                const $item_content = item.content;

                // item has custom content
                if (item.custom) {
                  const $custom_item = $(`<li class="custom-content">`)
                    .addClass(item.classes)
                    .append($(`<div class="nav-item nav-item-custom">`)
                    .append($item_content.clone(true, true)));

                  // insert item
                  $menu.append($custom_item);

                  // stop here
                  return;
                }

                let $item_link = $item_content.find('a').addBack('a');

                const $a = $item_link.length
                  ? $item_link.clone(false, true).addClass('nav-item')
                  : $(`<${item.subnav.length ? 'a href="#"' : 'span'} class="nav-item">`).append($item_content.clone(true, true)).on('click', stopPropagation);

                if ($a.is('a')) {
                  $a
                    .attr('tabindex', '0')
                    .attr('role', 'menuitem');
                }

                if ($item_link.length) {
                  $a.on('click', (e) => {
                    e.stopPropagation();

                    // on click trigger original click event
                    if (($._data($item_link[0], 'events') || {}).click) {
                      $item_link[0].click();
                    }
                  });
                }

                if ($a.attr('href') === '#') {
                  // prevent page jumping
                  $a.on('click', (e) => {
                    e.preventDefault();
                  });
                }

                // close nav on item click
                if (Settings.closeOnClick) {
                  if (!areLevelsOpenable()) {
                    // every item should close the nav except disabled
                    $a.filter('a').filter('[data-nav-close!="false"]:not([disabled])').on('click', closeNav);
                  }
                  else {
                    // only items without submenus
                    // or with submenus but with valid links
                    $a.filter('a').filter('[data-nav-close!="false"]:not([disabled])').filter(function() {
                      const $this = $(this);
                      return !item.subnav.length || ($this.attr('href') && $this.attr('href').charAt(0) !== '#');
                    }).on('click', closeNav);
                  }
                }

                // our nav item
                const $item = $(`<li>`)
                  .addClass(item.classes)
                  .append($a)
                  .appendTo($menu);

                // is nav item highlighted?
                if (item.highlight) {
                  $item.addClass('nav-highlight');
                }

                // wrap item link
                $a.wrap('<div class="nav-item-wrapper">');

                // indent levels in expanded levels
                if (Settings.levelSpacing && (Settings.levelOpen === 'expand' || (Settings.levelOpen === false || Settings.levelOpen === 'none'))) {
                  const indent = Settings.levelSpacing * level;

                  if (indent) {
                    $menu.css('text-indent', `${indent}px`);
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
                  $item.addClass('nav-parent');

                  if (!areLevelsOpenable()) {
                    $a.attr('aria-expanded', true);
                  }
                  // if we can open levels
                  else {
                    const index = _indexes[nextLevel];

                    const $checkbox = $(`<input type="checkbox" id="${navUniqId}-${nextLevel}-${index}" class="hc-chk" tabindex="-1">`)
                      .attr('data-level', nextLevel)
                      .attr('data-index', index)
                      .val(uniqid)
                      .on('click', stopPropagation)
                      .on('change', checkboxChange)
                      .prependTo($item);

                    const attachToLink = ($el) => {
                      $el
                        .on('click', () => {
                          // trigger checkbox to toggle level
                          $checkbox
                            .prop('checked', !$checkbox.prop('checked'))
                            .trigger('change');
                        })
                        .on('keydown', function(e) {
                          if (e.key === 'Enter' || e.keyCode === 13) {
                            // remember we are accessing via keyboard
                            _keyboard = true;
                            _focusEls.push($(this));
                          }
                        })
                        // ARIA
                        .attr('aria-controls', 'menu-' + uniqid)
                        .attr('aria-haspopup', Settings.levelOpen === 'overlap')
                        .attr('aria-expanded', false);
                    }

                    // nav is updated, we should keep this level open
                    if (_openLevels.indexOf(uniqid) !== -1) {
                      $wrapper.addClass('sub-level-open').on('click', () => closeLevel(nextLevel, index)); // close on self click
                      $item.addClass('level-open');
                      $checkbox.prop('checked', true);
                    }

                    // subnav title
                    nav_title = Settings.levelTitles === true ? $item_content.text().trim() : '';

                    // item has no actual link
                    if (!$a.attr('href') || $a.attr('href') === '#') {
                      $('<span class="nav-next"><span>').appendTo($a);

                      attachToLink($a);
                    }
                    // item has real link
                    else {
                      attachToLink(
                        // create "next" link separately
                        $(`<a href="#" class="nav-next" aria-label="${nav_title} Submenu" role="menuitem" tabindex="0"><span>`)
                          .on('click', preventClick())
                          .insertAfter($a)
                      );
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
                const $children_menus = $content.children('ul');
                const backLabel = (Settings.levelTitleAsBack ? (backTitle || Settings.labelBack) : Settings.labelBack) || '';
                let $back = $(`<li class="nav-back"><a href="#" role="menuitem" tabindex="0">${backLabel}<span></span></a></li>`);
                const closeThisLevel = () => closeLevel(level, backIndex);

                $back
                  .children('a')
                  .on('click', preventClick(closeThisLevel))
                  .on('keydown', (e) => {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                      // remember we are accessing via keyboard
                      _keyboard = true;
                    }
                  })
                  .wrap('<div class="nav-item-wrapper">');

                if (Settings.insertBack === true) {
                  $children_menus.first().prepend($back);
                }
                else if (isNumeric(Settings.insertBack)) {
                  insertAt($back, Settings.insertBack, $children_menus);
                }
              }
            }

            // insert close link
            if (level === 0 && Settings.insertClose !== false) {
              const $nav_ul = $content.children('ul');
              const $close = $(`<li class="nav-close"><a href="#" role="menuitem" tabindex="0">${Settings.labelClose || ''}<span></span></a></li>`);

              $close
                .children('a')
                .on('click', preventClick(closeNav))
                .on('keydown', (e) => {
                  if (e.key === 'Enter' || e.keyCode === 13) {
                    untrapFocus();
                  }
                })
                .wrap('<div class="nav-item-wrapper">');

              if (Settings.insertClose === true) {
                $nav_ul.first().prepend($close);
              }
              else if (isNumeric(Settings.insertClose)) {
                insertAt($close, Settings.insertClose, $nav_ul.first().add($nav_ul.first().siblings('ul')));
              }
            }
          }
        };

        /* Touch swipe gestures */

        const touchStart = (target) => {
          return (e) => {
            if (Settings.position != 'left' && Settings.position != 'right') {
              return;
            }

            _xStart = e.touches[0].clientX;
            _yStart = e.touches[0].clientY;

            // temporary attach touch listeners
            if (target == 'doc') {
              if (!_touchNavTriggered) {
                document.addEventListener('touchmove', touchMove_open, supportsPassive);
                document.addEventListener('touchend', touchEnd_open, supportsPassive);
              }
            }
            else {
              _touchNavTriggered = true;
              $nav_container[0].addEventListener('touchmove', touchMove_close, supportsPassive);
              $nav_container[0].addEventListener('touchend', touchEnd_close, supportsPassive);
            }
          };
        };

        const touchCaptureNav = (transNav, transContent) => {
          disableScroll();
          $nav.css('visibility', 'visible');
          $nav_container.css(browserPrefix('transition'), 'none');
          setTransform($nav_container, transNav, Settings.position);

          if ($push_content) {
            $push_content.css(browserPrefix('transition'), 'none');
            setTransform($push_content, transContent, Settings.position);
          }
        };

        const touchReleaseNav = (action, timeoutVsb = true, transNav = false, transContent = false) => {
          enableScroll();
          $nav_container.css(browserPrefix('transition'), '');
          setTransform($nav_container, transNav, Settings.position);

          if ($push_content) {
            $push_content.css(browserPrefix('transition'), '');
            setTransform($push_content, transContent, Settings.position);
          }

          if (action == 'open') {
            openNav();
          }
          else {
            closeNav();

            if (timeoutVsb) {
              setTimeout(() => {
                $nav.css('visibility', '');
              }, _transitionDuration);
            }
            else {
              $nav.css('visibility', '');
            }
          }
        };

        const touchMove_open = (e) => {
          let xDiff = 0 - (_xStart - e.touches[0].clientX);
          const levelSpacing = Settings.levelOpen === 'overlap' ? whatLevelIsActive() * Settings.levelSpacing : 0;
          const swipeWidth = _containerWidth + levelSpacing;
          const maxStart = 20;

          if (Settings.position == 'left') {
            xDiff = Math.min(Math.max(xDiff, 0), swipeWidth);
          }
          else {
            xDiff = Math.abs(Math.min(Math.max(xDiff, -swipeWidth), 0));
          }

          if (
            (Settings.position == 'left' && _xStart < maxStart) || // swipe right
            (Settings.position == 'right' && _xStart > $document.width() - maxStart) // swipe left
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
          const levelSpacing = Settings.levelOpen === 'overlap' ? whatLevelIsActive() * Settings.levelSpacing : 0;
          const swipeWidth = _containerWidth + levelSpacing;
          const diffTrashold = 70;

          if (Settings.position == 'left') {
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

          const levelSpacing = Settings.levelOpen === 'overlap' ? whatLevelIsActive() * Settings.levelSpacing : 0;
          const swipeWidth = _containerWidth + levelSpacing;

          if (Settings.position == 'left') {
            xDiff = Math.min(Math.max(xDiff, -swipeWidth), 0);
          }
          else {
            xDiff = Math.min(Math.max(xDiff, 0), swipeWidth);
          }

          if (
            (Settings.position == 'left' && xDiff < 0) || // swipe right
            (Settings.position == 'right' && xDiff > 0) // swipe left
          ) {
            _touchMoved = true;
            touchCaptureNav(-Math.abs(xDiff) + levelSpacing, swipeWidth - Math.abs(xDiff));
          }
        };

        const touchEnd_close = (e) => {
          // remove touch listeners from nav
          $nav_container[0].removeEventListener('touchmove', touchMove_close);
          $nav_container[0].removeEventListener('touchend', touchEnd_close);
          _touchNavTriggered = false;

          if (!_touchMoved) {
            return;
          }

          const lastTouch = e.changedTouches[e.changedTouches.length-1];
          let xDiff = 0 - (_xStart - lastTouch.clientX);
          const levelSpacing = Settings.levelOpen === 'overlap' ? whatLevelIsActive() * Settings.levelSpacing : 0;
          const swipeWidth = _containerWidth + levelSpacing;
          const diffTrashold = 50;

          if (Settings.position == 'left') {
            xDiff = Math.abs(Math.min(Math.max(xDiff, -swipeWidth), 0));
          }
          else {
            xDiff = Math.abs(Math.min(Math.max(xDiff, 0), swipeWidth));
          }

          if (xDiff == swipeWidth) {
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
          $originalNav.remove();
        }

        // insert nav to DOM
        if (Settings.bodyInsert === 'prepend') {
          $body.prepend($nav);
        }
        else if (Settings.bodyInsert === 'append') {
          $body.append($nav);
        }

        // opened nav right away
        if (Settings.expanded === true) {
          _initExpanded = true; // set flag
          openNav();
        }

        if (Settings.swipeGestures) {
          // close touch event on nav swipe
          // trigger before document touch
          $nav_container[0].addEventListener('touchstart', touchStart('nav'), supportsPassive);
          // open touch event on document swipe
          document.addEventListener('touchstart', touchStart('doc'), supportsPassive);
        }

        // close levels on escape
        $document.on('keydown', checkEsc);

        /* Private methods */

        function checkEsc(e) {
          if (isOpen() && (e.key === 'Escape' || e.keyCode === 27)) {
            const level = whatLevelIsActive();

            if (level === 0) {
              closeNav();
              untrapFocus();
            }
            else {
              closeLevel(level);
              trapFocus(null, level-1);
            }
          }
        };

        function checkboxChange() {
          const $checkbox = $(this);
          const l = $checkbox.data('level');
          const i = $checkbox.data('index');

          if ($checkbox.prop('checked')) {
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

        function whatLevelIsActive() {
          return _openLevels.length
            ? $nav_container.find('.hc-chk').filter(`[value=${_openLevels[_openLevels.length - 1]}]`).data('level')
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

          if (typeof l === 'number' && typeof i === 'number') {
            $checkbox = $(`#${navUniqId}-${l}-${i}`);

            if (!$checkbox.length) {
              console.warn(`HC Offcanvas Nav: level ${l} doesn't have index ${i}`);
              return;
            }
          }
          else if (_nextActiveLevel) {
            // get level to open from [data-nav-active]
            $checkbox = $nav_container.find('.hc-chk').filter(`[value=${_nextActiveLevel}]`);
            // reset flag
            if (Settings.closeActiveLevel || !Settings.closeOpenLevels) {
              _nextActiveLevel = null;
            }
          }
          else if (Settings.closeOpenLevels === false) {
            // get last checked level
            $checkbox = $nav_container.find('.hc-chk').filter(':checked').last();
          }

          // open sub levels as well
          if ($checkbox && $checkbox.length) {
            let levels = [];
            l = $checkbox.data('level');
            i = $checkbox.data('index');

            if (l > 1) {
              // get parent levels to open
              $checkbox.parents('.nav-wrapper').each(function() {
                const $this = $(this);
                const level = $this.data('level');

                if (level > 0) {
                  levels.push({
                    level: level,
                    index: $this.data('index')
                  });
                }
              });

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

          $nav
            .css('visibility', 'visible')
            .attr('aria-hidden', false)
            .addClass(navOpenClass);

          $toggle.addClass('toggle-open');

          if (Settings.levelOpen === 'expand' && _closeLevelsTimeout) {
            clearTimeout(_closeLevelsTimeout);
          }

          if (Settings.disableBody) {
            // remember scroll position
            _top = $window.scrollTop() || $html.scrollTop() || $body.scrollTop();

            if (hasScrollBar()) {
              $html.addClass('hc-nav-yscroll');
            }

            $body.addClass('hc-nav-open');

            if (_top) {
              // leave page in place
              $body.css('top', -_top);
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
            self.trigger('open', $.extend({}, Settings));
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

          $nav.removeClass(navOpenClass).attr('aria-hidden', true);
          $nav_container.removeAttr('style');
          $toggle.removeClass('toggle-open');

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
            $body.removeClass('hc-nav-open');
            $html.removeClass('hc-nav-yscroll');

            if (_top) {
              $body.css('top', '').scrollTop(_top)
              $html.scrollTop(_top);

              // for some reason we need timeout if position is bottom
              if (Settings.position === 'bottom') {
                const t = _top;
                setTimeout(() => {
                  // reset page position
                  $body.scrollTop(t);
                  $html.scrollTop(t);
                }, 0);
              }

              // reset top
              _top = 0;
            }
          }

          setTimeout(() => {
            $nav.css('visibility', '');

            // trigger close event
            self.trigger('close.$', $.extend({}, Settings));

            // only trigger this close event once and detach it
            self.trigger('close.once', $.extend({}, Settings)).off('close.once');
          }, _transitionDuration);
        }

        function toggleNav(e) {
          e.preventDefault();
          e.stopPropagation();

          if (_open) closeNav();
          else openNav();
        }

        function openLevel(l, i, transition = true) {
          const $checkbox = $(`#${navUniqId}-${l}-${i}`);
          const uniqid = $checkbox.val();
          const $li = $checkbox.parent('li');
          const $wrap = $li.closest('.nav-wrapper');
          const $subWrap = $li.children('.nav-wrapper');

          if (transition === false) {
            // disable level transition
            $subWrap.css('transition', 'none');
          }

          $checkbox.prop('checked', true); // ensure it is checked
          $wrap.addClass('sub-level-open');
          $li.addClass('level-open');
          $li.children('.nav-item-wrapper').children('[aria-controls]').attr('aria-expanded', true);

          if (transition === false) {
            setTimeout(() => {
              // re-enable level transition after nav open
              $subWrap.css('transition', '');
            }, _transitionDuration);
          }

          // remember what is open
          if (_openLevels.indexOf(uniqid) === -1) {
            _openLevels.push(uniqid);
          }

          if (Settings.levelOpen === 'overlap') {
            // close on self click
            $wrap.on('click', () => closeLevel(l, i));
            // expand the nav
            setTransform($nav_container, l * Settings.levelSpacing, Settings.position);

            // push content
            if ($push_content) {
              const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
              setTransform($push_content, transformVal + l * Settings.levelSpacing, Settings.position);
            }
          }

          if (_keyboard) {
            // trap focus inside level when keyboard accessing
            trapFocus(0, l, i);
            // reset keyboard flag
            _keyboard = false;
          }
        }

        const _closeLevel = (l, i, transform) => {
          const $checkbox = $(`#${navUniqId}-${l}-${i}`);

          if (!$checkbox.length) return;

          const uniqid = $checkbox.val();
          const $li = $checkbox.parent('li');
          const $wrap = $li.closest('.nav-wrapper');

          $checkbox.prop('checked', false); // ensure it is unchecked
          $wrap.removeClass('sub-level-open');
          $li.removeClass('level-open');
          $li.children('.nav-item-wrapper').children('[aria-controls]').attr('aria-expanded', false);

          // this is not open anymore
          if (_openLevels.indexOf(uniqid) !== -1) {
            _openLevels.splice(_openLevels.indexOf(uniqid), 1);
          }

          if (transform && Settings.levelOpen === 'overlap') {
            //level closed, remove wrapper click
            $wrap.off('click').on('click', stopPropagation);
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
            if (level == l && typeof i !== 'undefined') {
              // close specified level with index
              _closeLevel(l, i, true);
            }
            else {
              if (l === 0 && !Settings.closeOpenLevels) {
                // do nothing
              } else {
                // close all sub sub levels
                for (let index = 0; index < _indexes[level]; index++) {
                  _closeLevel(level, index, level == l);
                }
              }
            }
          }

          if (_keyboard) {
            // trap focus back one level when keyboard accessing
            trapFocus(null, l-1);
            // reset keyboard flag
            _keyboard = false;
          }
        }

        /* Public methods */

        self.getSettings = () => Object.assign({}, Settings);

        self.isOpen = isOpen;

        self.open = openNav;

        self.close = closeNav;

        self.update = (options, updateDom) => {
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

            Settings = $.extend({}, Settings, options);
          }

          if (options === true || updateDom === true) {
            // can't update Model if original nav removed
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
      };

      return this.each(Plugin);
    }
  });
})(jQuery, typeof window !== 'undefined' ? window : this);