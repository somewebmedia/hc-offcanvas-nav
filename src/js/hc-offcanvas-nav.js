/*
 * HC Off-canvas Nav
 * ===================
 * Version: 3.4.5
 * Author: Some Web Media
 * Author URL: https://github.com/somewebmedia/
 * Plugin URL: https://github.com/somewebmedia/hc-offcanvas-nav
 * Description: jQuery plugin for creating off-canvas multi-level navigations
 * License: MIT
 */

'use strict';

(function($, window) {
  const document = window.document;
  const $html = $(document.getElementsByTagName('html')[0]);
  const $document = $(document);

  const hasScrollBar = () => {
    return document.documentElement.scrollHeight > document.documentElement.clientHeight;
  };

  const isIos = (() => {
    return ((/iPad|iPhone|iPod/.test(navigator.userAgent)) || (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform))) && !window.MSStream;
  })();

  const isTouchDevice = (() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints || (window.DocumentTouch && document instanceof DocumentTouch);
  })();

  const isNumeric = (n) => {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  const toMs = (s) => {
    return parseFloat(s) * (/\ds$/.test(s) ? 1000 : 1);
  };

  const ID = () => {
    return Math.random().toString(36).substr(2) + '-' + Math.random().toString(36).substr(2);
  };

  const stopPropagation = (e) => e.stopPropagation();

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

  const getAxis = (position) => {
    return ['left', 'right'].indexOf(position) !== -1 ? 'x' : 'y';
  };

  const setTransform = (() => {
    const transform = browserPrefix('transform');

    return ($el, val, position) => {
      if (transform) {
        if (val === 0) {
          $el.css(transform, '');
        }
        else {
          if (getAxis(position) === 'x') {
            const x = position === 'left' ? val : -val;
            $el.css(transform, x ? `translate3d(${x}px,0,0)` : '');
          }
          else {
            const y = position === 'top' ? val : -val;
            $el.css(transform, y ? `translate3d(0,${y}px,0)` : '');
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
        + '%c is now deprecated and will be removed. Use'
        + "%c '" + instead + "'"
        + '%c instead.',
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
        maxWidth:           1024,
        pushContent:        false,
        position:           'left', // left, right, top

        levelOpen:          'overlap', // overlap, expand, none/false
        levelSpacing:       40,
        levelTitles:        false,
        levelTitlesAsBack:  false,

        navTitle:           null,
        navClass:           '',
        disableBody:        true,
        closeOnClick:       true,
        customToggle:       null,

        bodyInsert:         'prepend', // prepend/append to body
        removeOriginalNav:  false,

        rtl:                false,
        insertClose:        true,
        insertBack:         true,
        labelClose:         'Close',
        labelBack:          'Back'
      };

      if (options.side) {
        deprecated('side', 'position', 'option');
        options.position = options.side;
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

        let $toggle;

        // add classes to original menu so we know it's connected to our copy
        $originalNav.addClass(`hc-nav ${navUniqId}`);

        // this is our nav
        const $nav = $('<nav>').on('click', stopPropagation); // prevent menu close on self click
        const $nav_container = $('<div class="nav-container">').appendTo($nav);
        let $push_content = null;

        let Model = {};

        let _open = false;
        let _top = 0;
        let _containerWidth = 0;
        let _containerHeight = 0;
        let _transitionProperty;
        let _transitionDuration;
        let _transitionFunction;
        let _closeLevelsTimeout = null;
        let _indexes = {}; // object with level indexes
        const _openLevels = []; // array with current open levels

        let _keyboard = false;
        const _focusEls = []; // array to store keyboard accessed items

        // toggle
        if (!Settings.customToggle) {
          $toggle = $(`<a href="#" class="hc-nav-trigger ${navUniqId}"><span></span></a>`).on('click', toggleNav);
          $originalNav.after($toggle);
        }
        else {
          $toggle = $(Settings.customToggle).addClass(`hc-nav-trigger ${navUniqId}`).on('click', toggleNav);
        }

        // make nav opening keyboard accessible
        $toggle.on('keydown', (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            // trap focus inside nav
            setTimeout(() => {
              trapFocus($nav, 0);
            }, 10);
          }
        });

        // close nav on escape
        $document.on('keydown', (e) => {
          if (e.key === 'Escape' || e.keyCode === 27) {
            closeNav();
          }
        });

        function trapFocus($el, i) {
          if (typeof i === 'undefined' && !_focusEls.length) {
            return;
          }

          const focusableSelector = '[tabindex=0], a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';
          const $focusable = $el.find('.nav-content:first').children('ul').children('li').children(':not(.nav-wrapper)').find(focusableSelector).addBack(focusableSelector).filter(':not([tabindex=-1])');

          if (!$focusable.length) {
            return;
          }

          const $first = $focusable.first();
          const $last = $focusable.last();

          if (typeof i === 'undefined') {
            // focus last focusable element
            _focusEls[_focusEls.length - 1].focus();
            // remove last element from focusable array
            _focusEls.pop();
          }
          else {
            // put focus on item with desired index
            $focusable.eq(i).focus();
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
          $toggle[0].focus();
        };

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

          pageContentTransition();
        };

        const pageContentTransition = () => {
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
          const mediaquery = Settings.maxWidth ? `max-width: ${Settings.maxWidth - 1}px` : false;

          // clear media queries from previous run
          if (checkForUpdate('maxWidth')) {
            Styles.reset();
          }

          // create main styles
          Styles.add(`.hc-offcanvas-nav.${navUniqId}`, 'display: block', mediaquery);
          Styles.add(`.hc-nav-trigger.${navUniqId}`, `display: ${toggleDisplay && toggleDisplay !== 'none' ? toggleDisplay : 'block'}`, mediaquery);
          Styles.add(`.hc-nav.${navUniqId}`, 'display: none', mediaquery);
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
            setTimeout(calcNav, 1);
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
          Model = getModel($first_level());

          function getModel($menu) {
            const level = [];

            $menu.each(function() {
              const $ul = $(this);

              const nav = {
                classes: $ul.attr('class'),
                items: []
              };

              $ul.children('li').each(function() {
                const $li = $(this);
                const customContent = typeof $li.data('nav-custom-content') !== 'undefined';
                const $content = customContent ? $li.children() : $li.children().filter(function() {
                  const $this = $(this);
                  return $this.is(':not(ul)') && !$this.find('ul').length;
                }).add($li.contents().filter(function() {
                  // text node
                  return this.nodeType === 3 && this.nodeValue.trim();
                }));
                const $nested_navs = !customContent ? $li.find('ul') : $();
                const $subnav = $nested_navs.first().add($nested_navs.first().siblings('ul'));

                // save unique identifier for remembering open menus
                if ($subnav.length && !$li.data('hc-uniqid')) {
                  $li.data('hc-uniqid', ID());
                }

                // add elements to this level
                nav.items.push({
                  uniqid: $li.data('hc-uniqid') || null,
                  classes: $li.attr('class'),
                  $content: $content,
                  subnav: $subnav.length ? getModel($subnav) : [],
                  custom: customContent
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
            const $wrapper = $(`<div class="nav-wrapper nav-wrapper-${level}">`).appendTo($container).on('click', stopPropagation);
            const $content = $('<div class="nav-content">').appendTo($wrapper);

            // titles
            if (title) {
              $content.prepend(`<h2>${title}</h2>`);
            }

            $.each(menu, (i_nav, nav) => {
              const $menu = $(`<ul>`).addClass(nav.classes).appendTo($content);

              $.each(nav.items, (i_item, item) => {
                const $item_content = item.$content;

                // item has custom content
                if (item.custom) {
                  const $custom_item = $(`<li class="custom-content">`).addClass(item.classes).append($(`<div class="nav-item nav-item-custom">`).append($item_content.clone(true, true)));

                  // insert item
                  $menu.append($custom_item);

                  // stop here
                  return;
                }

                let $item_link = $item_content.find('a').addBack('a');

                const $a = $item_link.length
                  ? $item_link.clone(false, true).addClass('nav-item')
                  : $(`<${item.subnav.length ? 'a href="#"' : 'span'} class="nav-item">`).append($item_content.clone(true, true)).on('click', stopPropagation);

                if ($item_link.length) {
                  $a.on('click', (e) => {
                    e.stopPropagation();

                    // on click trigger original click event
                    if (($._data($item_link[0], 'events') || {}).click) {
                      $item_link[0].click();
                    }
                  });

                  if (typeof $a.attr('href') !== 'undefined' && $a.attr('href') !== '#') {
                    $a.attr('tabindex', '0');
                  }
                }

                if ($a.attr('href') === '#') {
                  // disable focus ability if no valid link and has subnav
                  $a.attr('tabindex', item.subnav.length ? '-1' : '0');

                  // prevent page jumping
                  $a.on('click', (e) => {
                    e.preventDefault();
                  });
                }

                // close nav on item click
                if (Settings.closeOnClick) {
                  if (Settings.levelOpen === false || Settings.levelOpen === 'none') {
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

                // our nav list item
                const $item = $(`<li>`).addClass(item.classes).append($a);

                // insert item into nav
                $menu.append($item);

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
                  const uniqid = item.uniqid;
                  let nav_title = '';

                  // create new level
                  if (!_indexes[nextLevel]) {
                    _indexes[nextLevel] = 0;
                  }

                  // li parent class
                  $item.addClass('nav-parent');

                  if (Settings.levelOpen !== false && Settings.levelOpen !== 'none') {
                    const index = _indexes[nextLevel];
                    const $next_span = $('<span class="nav-next">').appendTo($a);

                    const $next_label = $(`<label for="${navUniqId}-${nextLevel}-${index}" tabindex="0">`)
                      .on('click', stopPropagation)
                      .on('keydown', function(e) {
                        if (e.key === 'Enter' || e.keyCode === 13) {
                          const $this = $(this);
                          // remember we are accessing via keyboard
                          _keyboard = true;
                          _focusEls.push($this);
                          // trigger click by keyboard
                          $this.click();
                        }
                      });

                    const $checkbox = $(`<input type="checkbox" id="${navUniqId}-${nextLevel}-${index}" tabindex="-1">`)
                      .attr('data-level', nextLevel)
                      .attr('data-index', index)
                      .val(uniqid)
                      .on('click', stopPropagation)
                      .on('change', checkboxChange);

                    // nav is updated, we should keep this level open
                    if (_openLevels.indexOf(uniqid) !== -1) {
                      $wrapper.addClass('sub-level-open').on('click', () => closeLevel(nextLevel, index)); // close on self click
                      $item.addClass('level-open');
                      $checkbox.prop('checked', true);
                    }

                    $item.prepend($checkbox);

                    // subnav title
                    nav_title = Settings.levelTitles === true ? $item_content.text().trim() : '';

                    if (!$a.attr('href') || $a.attr('href') === '#') {
                      $a.prepend($next_label.on('click', function() {
                        // trigger parent click in case it has custom click events
                        $(this).parent().trigger('click');
                      }));
                    }
                    else {
                      $next_span.append($next_label);

                      // so we know not to focus it when manually assigning focus
                      $a.attr('data-focusable', false);
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
                const backLabel = (Settings.levelTitlesAsBack ? (backTitle || Settings.labelBack) : Settings.labelBack) || '';
                let $back = $(`<li class="nav-back"><a href="#" tabindex="0">${backLabel}<span></span></a></li>`);

                $back.children('a')
                  .on('click', preventClick(() => closeLevel(level, backIndex)))
                  .on('keydown', function(e) {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                      // remember we are accessing via keyboard
                      _keyboard = true;
                    }
                  });

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
              const $close = $(`<li class="nav-close"><a href="#" tabindex="0">${Settings.labelClose || ''}<span></span></a></li>`);

              $close.children('a').on('click', preventClick(closeNav));

              if (Settings.insertClose === true) {
                $nav_ul.first().prepend($close);
              }
              else if (isNumeric(Settings.insertClose)) {
                insertAt($close, Settings.insertClose, $nav_ul.first().add($nav_ul.first().siblings('ul')));
              }
            }
          }
        };

        // init nav
        initNav();

        // init our Model
        createModel();

        // create view from model
        createNavDom();

        // insert nav to DOM
        if (Settings.bodyInsert === 'prepend') {
          $body.prepend($nav);
        }
        else if (Settings.bodyInsert === 'append') {
          $body.append($nav);
        }

        // remove original nav
        if (Settings.removeOriginalNav === true) {
          $originalNav.remove();
        }

        // Private methods

        function checkboxChange() {
          const $checkbox = $(this);
          const l = Number($checkbox.attr('data-level'));
          const i = Number($checkbox.attr('data-index'));

          if ($checkbox.prop('checked')) {
            openLevel(l, i);
          }
          else {
            closeLevel(l, i);
          }
        }

        function openNav() {
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
            _top = $html.scrollTop() || $body.scrollTop(); // remember scroll position

            if (hasScrollBar()) {
              $html.addClass('hc-nav-yscroll');
            }

            $body.addClass('hc-nav-open');

            if (_top) {
              $body.css('top', -_top);
            }
          }

          if ($push_content) {
            const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
            setTransform($push_content, transformVal, Settings.position);
          }

          setTimeout(() => {
            // trigger open event
            self.trigger('open', $.extend({}, Settings));
          }, _transitionDuration + 1);
        }

        function closeNav() {
          _open = false;

          if ($push_content) {
            setTransform($push_content, 0);
          }

          $nav.removeClass(navOpenClass).attr('aria-hidden', true);
          $nav_container.removeAttr('style');
          $toggle.removeClass('toggle-open');

          if (Settings.levelOpen === 'expand' && ['top', 'bottom'].indexOf(Settings.position) !== -1) {
            // close all levels before closing the nav because the nav height changed
            closeLevel(0);
          }
          else if (Settings.levelOpen !== false && Settings.levelOpen !== 'none') {
            // close all levels when nav closes
            _closeLevelsTimeout = setTimeout(() => {
              // keep in timeout so we can prevent it if nav opens again before it's closed
              closeLevel(0);
            }, Settings.levelOpen === 'expand' ? _transitionDuration : 0);
          }

          if (Settings.disableBody) {
            $body.removeClass('hc-nav-open');
            $html.removeClass('hc-nav-yscroll');

            if (_top) {
              $body.css('top', '').scrollTop(_top);
              $html.scrollTop(_top);

              _top = 0; // reset top
            }
          }

          // put focus back to trigger
          untrapFocus();

          setTimeout(() => {
            $nav.css('visibility', '');

            // trigger close event
            self.trigger('close.$', $.extend({}, Settings));

            // only trigger close event once and detach it
            self.trigger('close.once', $.extend({}, Settings)).off('close.once');
          }, _transitionDuration + 1);
        }

        function toggleNav(e) {
          e.preventDefault();
          e.stopPropagation();

          if (_open) closeNav();
          else openNav();
        }

        function openLevel(l, i) {
          const $checkbox = $(`#${navUniqId}-${l}-${i}`);
          const uniqid = $checkbox.val();
          const $li = $checkbox.parent('li');
          const $wrap = $li.closest('.nav-wrapper');

          $wrap.addClass('sub-level-open');
          $li.addClass('level-open');

          // remember what is open
          if (_openLevels.indexOf(uniqid) === -1) {
            _openLevels.push(uniqid);
          }

          if (Settings.levelOpen === 'overlap') {
            $wrap.on('click', () => closeLevel(l, i)); // close on self click
            setTransform($nav_container, l * Settings.levelSpacing, Settings.position);

            if ($push_content) {
              const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
              setTransform($push_content, transformVal + l * Settings.levelSpacing, Settings.position);
            }
          }

          if (_keyboard) {
            // trap focus inside level when keyboard accessing
            trapFocus($li.children('.nav-wrapper'), 0);
            // reset keyboard flag
            _keyboard = false;
          }
        }

        const _closeLevel = (l, i, transform) => {
          const $checkbox = $(`#${navUniqId}-${l}-${i}`);
          const uniqid = $checkbox.val();
          const $li = $checkbox.parent('li');
          const $wrap = $li.closest('.nav-wrapper');

          $checkbox.prop('checked', false);
          $wrap.removeClass('sub-level-open');
          $li.removeClass('level-open');

          // this is not open anymore
          if (_openLevels.indexOf(uniqid) !== -1) {
            _openLevels.splice(_openLevels.indexOf(uniqid), 1);
          }

          if (transform && Settings.levelOpen === 'overlap') {
            $wrap.off('click').on('click', stopPropagation); //level closed, remove wrapper click
            setTransform($nav_container, (l - 1) * Settings.levelSpacing, Settings.position);

            if ($push_content) {
              const transformVal = getAxis(Settings.position) === 'x' ? _containerWidth : _containerHeight;
              setTransform($push_content, transformVal + (l - 1) * Settings.levelSpacing, Settings.position);
            }
          }
        };

        function closeLevel(l, i) {
          for (let level = l; level <= Object.keys(_indexes).length; level++) {
            if (level == l && typeof i !== 'undefined') {
              _closeLevel(l, i, true);
            }
            else {
              // also close all sub sub levels
              for (let index = 0; index < _indexes[level]; index++) {
                _closeLevel(level, index, level == l);
              }
            }
          }

          if (_keyboard) {
            // trap focus back one level when keyboard accessing
            trapFocus($(`#${navUniqId}-${l}-${i}`).closest('.nav-wrapper'));
            // reset keyboard flag
            _keyboard = false;
          }
        }

        // Public methods

        self.settings = (option) => {
          return option ? Settings[option] : Object.assign({}, Settings);
        };

        self.isOpen = () => $nav.hasClass(navOpenClass);

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