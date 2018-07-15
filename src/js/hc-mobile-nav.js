/*!
 * jQuery HC-MobileNav
 * ===================
 * Version: 2.0.4
 * Author: Some Web Media
 * Author URL: http://somewebmedia.com
 * Plugin URL: https://github.com/somewebmedia/hc-mobile-nav
 * Description: jQuery plugin for converting menus to mobile navigations
 * License: MIT
 */

(function($, window) {
  "use strict";

  const document = window.document;

  const hasScrollBar = () => {
    return document.body.scrollHeight > document.body.offsetHeight;
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

  const printStyle = (() => {
    const $head = $('head');
    const id = 'hc-mobile-nav-style';

    return (css) => {
      const $style = $head.find(`style#${id}`);

      if ($style.length) {
        $style.html(css);
      }
      else {
        $(`<style id="${id}">${css}</style>`).appendTo($head);
      }
    };
  })();

  let navCount = 0;

  $.fn.extend({
    hcMobileNav: function(options) {
      if (!this.length) return this;

      const defaults = {
        maxWidth:         1024,
        transitionSide:   'left',
        levelType:        'transform', // inline/transform/none
        levelSpacing:     40,
        disableBody:      true,
        closeOnNavClick:  true,
        customToggle:     null,
        navClass:         '',
        labels: {
          close:          'Close',
          back:           'Back'
        }
      };

      let SETTINGS = $.extend({}, defaults, options);

      const $html = $(document.getElementsByTagName('html')[0]);
      const $document = $(document);
      const $body = $(document.body);
      const touchHandler = 'ontouchstart' in window ? 'touchstart' : 'click';

      const setTransform = (() => {
        const transform = browserPrefix('transform');

        return ($el, val) => {
          if (transform) {
            const x = SETTINGS.transitionSide === 'left' ? val : -val;
            $el.css(transform, `translate3d(${x}px,0,0)`);
          }
          else {
            $el.css(SETTINGS.transitionSide, val);
          }
        };
      })();

      return this.each(function() {
        const $this = $(this);
        let $nav;
        let _open = false;
        let _top = 0;

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
            console.log('%c! HC MobileNav:' + `%c There is no <nav> or <ul> elements in your menu.`, 'color: red', 'color: black');
            return;
          }
        }

        const $ul = $nav.find('ul');

        if (!$ul.length) {
          console.log('%c! HC MobileNav:' + `%c Menu must contain <ul> element.`, 'color: red', 'color: black');
          return;
        }

        // count our nav
        navCount++;

        let Levels = {};
        const uniqClass = 'hc-nav-' + navCount;

        // wrap first level
        const $main_wrap = $nav.children('ul').wrapAll('<div class="nav-wrapper">').parent().on('click', stopPropagation);

        // insert styles
        let css = `
          .hc-nav-trigger.${uniqClass},
          .hc-mobile-nav.${uniqClass} {
            display: block;
          }
          .hc-nav.${uniqClass} {
            display: none;
          }`;

        if (SETTINGS.maxWidth) {
          css = `@media screen and (max-width: ${SETTINGS.maxWidth - 1}px) {
            ${css}
          }`;
        }

        printStyle(css, 'hc-mobile-nav-style');

        // prepare our nav
        $nav
          .on(touchHandler, stopPropagation) // prevent menu close on self click
          .removeAttr('id') // remove id's so we don't have duplicates after cloning
          .removeClass() // remove all classes
          .addClass(`hc-mobile-nav ${uniqClass} ${SETTINGS.navClass || ''} nav-levels-${SETTINGS.levelType} transform-${SETTINGS.transitionSide} ${SETTINGS.disableBody ? 'disable-body' : ''}`)
          .find('[id]').removeAttr('id'); // remove all children id's

        // close menu on body click
        if (SETTINGS.disableBody) {
          $nav.on(touchHandler, closeNav);
        }

        // close menu on item click
        if (SETTINGS.closeOnNavClick) {
          $ul.find('li').children('a').on('click', closeNav);
        }

        // insert close link
        if (SETTINGS.labels.close !== false) {
          $(`<li class="nav-close"><a href="#">${SETTINGS.labels.close || ''}<span></span></a></li>`)
            .prependTo($ul.first())
            .children('a').on('click', preventClick(true, true, closeNav));
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
            $menu.wrap('<div class="nav-wrapper">').parent().on('click', stopPropagation);

            const $next_span = $('<span class="nav-next">').appendTo($a);
            const $next_label = $(`<label for="${uniqClass}-${level}-${index}">`).on('click', stopPropagation);

            const $checkbox = $(`<input type="checkbox" id="${uniqClass}-${level}-${index}">`)
              .attr('data-level', level)
              .attr('data-index', index)
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
            if (SETTINGS.labels.back !== false && SETTINGS.levelType !== 'inline') {
              $(`<li class="nav-back"><a href="#">${SETTINGS.labels.back || ''}<span></span></a></li>`)
                .prependTo($menu)
                .children('a').on('click', preventClick(true, true, () => closeLevel(level, index)));
            }
          }
        });

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

          if (SETTINGS.disableBody) {
            _top = $html.scrollTop() || $body.scrollTop(); // remember the scroll position

            $body.addClass('hc-nav-open');

            if (_top) {
              $body.css('top', -_top);
            }

            if (hasScrollBar()) {
              $html.addClass('hc-yscroll');
            }
          }
        }

        function closeNav() {
          _open = false;

          $nav.removeClass('nav-open');
          $main_wrap.removeAttr('style');

          closeLevel(0);

          if (SETTINGS.disableBody) {
            $body.removeClass('hc-nav-open');
            $html.removeClass('hc-yscroll');

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
          const $wrap = l === 1 ? $main_wrap : Levels[l][i].wrapper;

          $wrap.addClass('sub-level-open');
          $li.addClass('level-open');

          if (SETTINGS.levelType === 'transform') {
            $wrap.on('click', () => closeLevel(l, i))
            setTransform($main_wrap, l * SETTINGS.levelSpacing);
          }
        }

        var _closeLevel = (l, i) => {
          if (!Levels[l] || !Levels[l][i]) return;

          let $checkbox = Levels[l][i].checkbox;
          let $li = $checkbox.parent('li');
          let $wrap = l === 1 ? $main_wrap : Levels[l][i].wrapper;

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

                if (SETTINGS.levelType === 'transform') {
                  let $wrap = l === 1 ? $main_wrap : Levels[level][i].wrapper;
                  $wrap.off('click').on('click', stopPropagation);
                  setTransform($main_wrap, (level - 1) * SETTINGS.levelSpacing);
                }
              }
              else {
                for (let index in Levels[level]) {
                  _closeLevel(level, index);

                  if (SETTINGS.levelType === 'transform') {
                    let $wrap = l === 1 ? $main_wrap : Levels[level][index].wrapper;

                    $wrap.off('click').on('click', stopPropagation);

                    if (level == l) {
                      setTransform($main_wrap, (level - 1) * SETTINGS.levelSpacing);
                    }
                  }
                }
              }
            }
          }
        }

        // insert menu to body
        $body.prepend($nav);

        if (!SETTINGS.customToggle) {
          // insert menu trigger link
          const $toggle = $(`<a class="hc-nav-trigger ${uniqClass}"><span></span></a>`).on('click', toggleNav);

          $this.addClass(`hc-nav ${uniqClass}`).after($toggle);
        }
        else {
          $(SETTINGS.customToggle).addClass(uniqClass).on('click', toggleNav);
        }
      });
    }
  });
})(jQuery, typeof window !== 'undefined' ? window : this);