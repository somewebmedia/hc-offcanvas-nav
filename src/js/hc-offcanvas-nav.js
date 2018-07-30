/*!
 * HC Off-canvas Nav
 * ===================
 * Version: 3.1.0
 * Author: Some Web Media
 * Author URL: http://somewebmedia.com
 * Plugin URL: https://github.com/somewebmedia/hc-offcanvas-nav
 * Description: jQuery plugin for creating off-canvas multi-level navigations
 * License: MIT
 */

(function($, window) {
  'use strict';

  const document = window.document;

  const hasScrollBar = () => {
    return document.documentElement.scrollHeight > document.documentElement.offsetHeight;
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

  const stopPropagation = (e) => e.stopPropagation();

  const preventClick = (preventDefault, stopPropagation, cb) => {
    return (e) => {
      if (preventDefault) e.preventDefault();
      if (stopPropagation) e.stopPropagation();
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

  const printStyle = (() => {
    const $head = $('head');
    const id = 'hc-offcanvas-nav-style';

    return (css) => {
      const $style = $head.find(`style#${id}`);

      if ($style.length) {
        $style.html($style.html() + css);
      }
      else {
        $(`<style id="${id}">${css}</style>`).appendTo($head);
      }
    };
  })();

  const insertAt = ($insert, n, $parent) => {
    const $children = $parent.children('li');
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

  let navCount = 0;

  $.fn.extend({
    hcOffcanvasNav: function(options) {
      if (!this.length) return this;

      const defaults = {
        maxWidth:         1024,
        pushContent:      false,
        side:             'left',

        levelOpen:        'overlap', // overlap / expand / none
        levelSpacing:     40,
        levelTitles:      false,

        navTitle:         null,
        navClass:         '',
        disableBody:      true,
        closeOnClick:     true,
        customToggle:     null,

        insertClose:      true,
        insertBack:       true,
        labelClose:       'Close',
        labelBack:        'Back'
      };

      let SETTINGS = $.extend({}, defaults, options);

      const $html = $(document.getElementsByTagName('html')[0]);
      const $document = $(document);
      const $body = $(document.body);

      const setTransform = (() => {
        const transform = browserPrefix('transform');

        return ($el, val) => {
          if (transform) {
            const x = SETTINGS.side === 'left' ? val : -val;
            $el.css(transform, `translate3d(${x}px,0,0)`);
          }
          else {
            $el.css(SETTINGS.side, val);
          }
        };
      })();

      return this.each(function() {
        const $this = $(this);
        let $nav;

        // clone menu
        if ($this.is('ul')) {
          $nav = $this.clone().wrap('<nav>').parent();
        }
        else if ($this.is('nav')) {
          $nav = $this.clone();
        }
        else {
          $nav = $this.find('nav, ul').first().clone();

          if (!$nav.length) {
            console.log('%c! HC Offcanvas Nav:' + `%c There is no <nav> or <ul> elements in your menu.`, 'color: red', 'color: black');
            return;
          }
        }

        const $ul = $nav.find('ul');

        if (!$ul.length) {
          console.log('%c! HC Offcanvas Nav:' + `%c Menu must contain <ul> element.`, 'color: red', 'color: black');
          return;
        }

        // count our nav
        navCount++;

        const uniqClass = 'hc-nav-' + navCount;

        let Levels = {};

        let _open = false;
        let _top = 0;
        let _containerWidth = 0;
        let _transitionDuration;
        let _closeLevelsTimeout = null;

        let $toggle;
        let $content;

        // add class to default menu
        $this.addClass(`hc-nav ${uniqClass}`);

        // toggle
        if (!SETTINGS.customToggle) {
          $toggle = $(`<a class="hc-nav-trigger ${uniqClass}"><span></span></a>`).on('click', toggleNav);
          $this.after($toggle);
        }
        else {
          $toggle = $(SETTINGS.customToggle).addClass(`hc-nav-trigger ${uniqClass}`).on('click', toggleNav);
        }

        const toggleDisplay = $toggle.css('display');

        // insert styles
        let css = `
          .hc-offcanvas-nav.${uniqClass} {
            display: block;
          }
          .hc-nav-trigger.${uniqClass} {
            display: ${toggleDisplay && toggleDisplay !== 'none' ? toggleDisplay : 'block'}
          }
          .hc-nav.${uniqClass} {
            display: none;
          }
          `;

        if (SETTINGS.maxWidth) {
          css = `@media screen and (max-width: ${SETTINGS.maxWidth - 1}px) {
            ${css}
          }`;
        }

        printStyle(css);

        // wrap first level
        const $container = $nav.children('ul').wrapAll('<div class="nav-wrapper nav-wrapper-1">').parent().on('click', stopPropagation).wrap('<div class="nav-container">').parent();

        // first level title
        if (SETTINGS.navTitle) {
          $container.children().prepend(`<h2>${SETTINGS.navTitle}</h2>`);
        }

        // prepare our nav
        $nav
          .on('click', stopPropagation) // prevent menu close on self click
          .removeAttr('id') // remove id's so we don't have duplicates after cloning
          .removeClass() // remove all classes
          .addClass(`
            hc-offcanvas-nav
            ${uniqClass}
            ${SETTINGS.navClass || ''}
            nav-levels-${SETTINGS.levelOpen || 'none'}
            side-${SETTINGS.side}
            ${SETTINGS.disableBody ? 'disable-body' : ''}
            ${isIos ? 'is-ios' : ''}
            ${isTouchDevice ? 'touch-device' : ''}
          `)
          .find('[id]').removeAttr('id'); // remove all children id's

        // get some computed data
        setTimeout(() => {
          _containerWidth = $container.width();
          _transitionDuration = toMs($container.css('transition-duration'));

          if (typeof SETTINGS.pushContent !== 'boolean') {
            $content = $(SETTINGS.pushContent);

            if ($content.length) {
              printStyle(`${getElementCssTag(SETTINGS.pushContent)} {
                transition: ${$container.css('transition-property')} ${$container.css('transition-duration')} ${$container.css('transition-timing-function')};
              }`);
            }
          }
        }, 1);

        // close menu on body click (nav::after)
        if (SETTINGS.disableBody) {
          $nav.on('click', closeNav);
        }

        // close menu on item click
        if (SETTINGS.closeOnClick) {
          $ul.find('li').children('a').on('click', closeNav);
        }

        // insert close link
        if (SETTINGS.insertClose !== false) {
          const $close = $(`<li class="nav-close"><a href="#">${SETTINGS.labelClose || ''}<span></span></a></li>`);

          $close.children('a').on('click', preventClick(true, true, closeNav));

          if (SETTINGS.insertClose === true) {
            $ul.first().prepend($close);
          }
          else if (isNumeric(SETTINGS.insertClose)) {
            insertAt($close, SETTINGS.insertClose, $ul.first().add($ul.siblings('ul')));
          }
        }

        // get levels for submenus
        $ul.each(function() {
          const $menu = $(this);
          const level = $menu.parents('li').length;

          if (level !== 0) {
            const $li = $menu.parent().addClass('nav-parent');
            const $a = $li.children('a');

            // create new level
            if (!Levels[level]) {
              Levels[level] = [];
            }

            // add elements to this level
            Levels[level].push({
              nav: $menu
            });

            // what's the submenu index
            const index = Levels[level].length - 1;

            // save parent wrapper
            Levels[level][index]['wrapper'] = $menu.closest('.nav-wrapper');

            // wrap submenus
            let $wrap = $menu.wrap(`<div class="nav-wrapper nav-wrapper-${level+1}">`).parent().on('click', stopPropagation);

            if (SETTINGS.levelSpacing && (SETTINGS.levelOpen === 'expand' || (SETTINGS.levelOpen === false || SETTINGS.levelOpen === 'none'))) {
              $menu.css('text-indent', `${SETTINGS.levelSpacing * level}px`);
            }

            if (SETTINGS.levelOpen === false || SETTINGS.levelOpen === 'none') {
              // stop here
              return;
            }

            // sublevel titles
            if (SETTINGS.levelTitles === true) {
              $wrap.prepend(`<h2>${$a.text()}</h2>`);
            }

            const $next_span = $('<span class="nav-next">').appendTo($a);
            const $next_label = $(`<label for="${uniqClass}-${level}-${index}">`).on('click', stopPropagation);

            const $checkbox = $(`<input type="checkbox" id="${uniqClass}-${level}-${index}">`)
              .attr('data-level', level)
              .attr('data-index', index)
              .on('click', stopPropagation)
              .on('change', checkboxChange);

            // add checkboxes to our levels list
            Levels[level][index]['checkbox'] = $checkbox;

            $li.prepend($checkbox);

            if (!$a.attr('href') || $a.attr('href') === '#') {
              $a.on('click', preventClick(true, true)).prepend($next_label);
            }
            else {
              $next_span.append($next_label);
            }

            // insert back links
            if (SETTINGS.insertBack !== false && SETTINGS.levelOpen === 'overlap') {
              let $back = $(`<li class="nav-back"><a href="#">${SETTINGS.labelBack || ''}<span></span></a></li>`);

              $back.children('a').on('click', preventClick(true, true, () => closeLevel(level, index)));

              if (SETTINGS.insertBack === true) {
                $menu.prepend($back);
              }
              else if (isNumeric(SETTINGS.insertBack)) {
                insertAt($back, SETTINGS.insertBack, $menu);
              }
            }
          }
        });

        // insert menu to DOM
        $body.append($nav);

        // checkbox event
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

        // Methods

        function openNav() {
          _open = true;

          $nav.addClass('nav-open');
          $toggle.addClass('toggle-open');

          if (SETTINGS.levelOpen === 'expand' && _closeLevelsTimeout) {
            clearTimeout(_closeLevelsTimeout);
          }

          if (SETTINGS.disableBody) {
            _top = $html.scrollTop() || $body.scrollTop(); // remember the scroll position

            if (hasScrollBar()) {
              $html.addClass('hc-nav-yscroll');
            }

            $body.addClass('hc-nav-open');

            if (_top) {
              $body.css('top', -_top);
            }
          }

          if ($content && $content.length) {
            setTransform($content, _containerWidth);
          }
        }

        function closeNav() {
          _open = false;

          if ($content && $content.length) {
            setTransform($content, 0);
          }

          $nav.removeClass('nav-open');
          $container.removeAttr('style');
          $toggle.removeClass('toggle-open');

          if (SETTINGS.levelOpen !== false && SETTINGS.levelOpen !== 'none') {
            _closeLevelsTimeout = setTimeout(() => {
              closeLevel(0);
            }, SETTINGS.levelOpen === 'expand' ? _transitionDuration : 0);
          }

          if (SETTINGS.disableBody) {
            $body.removeClass('hc-nav-open');
            $html.removeClass('hc-nav-yscroll');

            if (_top) {
              $body.css('top', '').scrollTop(_top);
              $html.scrollTop(_top);

              _top = 0; // reset top
            }
          }
        }

        function toggleNav(e) {
          e.preventDefault();
          e.stopPropagation();

          if (_open) closeNav();
          else openNav();
        }

        function openLevel(l, i) {
          const $checkbox = Levels[l][i].checkbox;
          const $li = $checkbox.parent('li');
          const $wrap = Levels[l][i].wrapper;

          $wrap.addClass('sub-level-open');
          $li.addClass('level-open');

          if (SETTINGS.levelOpen === 'overlap') {
            $wrap.on('click', () => closeLevel(l, i))
            setTransform($container, l * SETTINGS.levelSpacing);

            if ($content && $content.length) {
              setTransform($content, _containerWidth + l * SETTINGS.levelSpacing);
            }
          }
        }

        const _closeLevel = (l, i) => {
          if (!Levels[l] || !Levels[l][i]) return;

          const $checkbox = Levels[l][i].checkbox;
          const $li = $checkbox.parent('li');
          const $wrap = Levels[l][i].wrapper;

          $checkbox.prop('checked', false);
          $wrap.removeClass('sub-level-open');
          $li.removeClass('level-open');
        };

        function closeLevel(l, i) {
          // also close ol sub sub levels
          for (let level = l; level <= Object.keys(Levels).length; level++) {
            if (level !== 0) {
              if (level == l && typeof i !== 'undefined') {
                _closeLevel(level, i);

                if (SETTINGS.levelOpen === 'overlap') {
                  let $wrap = Levels[level][i].wrapper;
                  $wrap.off('click').on('click', stopPropagation);
                  setTransform($container, (level - 1) * SETTINGS.levelSpacing);

                  if ($content && $content.length) {
                    setTransform($content, _containerWidth + (level - 1) * SETTINGS.levelSpacing);
                  }
                }
              }
              else {
                for (let index in Levels[level]) {
                  _closeLevel(level, index);

                  if (SETTINGS.levelOpen === 'overlap') {
                    let $wrap = Levels[level][index].wrapper;

                    $wrap.off('click').on('click', stopPropagation);

                    if (level == l) {
                      setTransform($container, (level - 1) * SETTINGS.levelSpacing);

                      if ($content && $content.length) {
                        setTransform($content, _containerWidth + (level - 1) * SETTINGS.levelSpacing);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
  });
})(jQuery, typeof window !== 'undefined' ? window : this);