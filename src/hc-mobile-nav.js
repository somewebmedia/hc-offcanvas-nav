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

    return (css, id, prepend) => {
      const $style = $head.find('style#' + id);

      if ($style.length) {
        $style.html(css);
      }
      else {
        if (prepend) {
          $('<style id="' + id + '">' + css + '</style>').prependTo($head);
        }
        else {
          $('<style id="' + id + '">' + css + '</style>').appendTo($head);
        }
      }
    };
  })();

  $.fn.extend({
    hcMobileNav: function(options) {
      if (!this.length) return this;

      const defaults = {
        maxWidth: 1024,
        transition: true,
        transitionSide: 'left',
        levelSpacing: 40,
        labels: {
          close: 'Close',
          back: 'Back'
        }
      };

      let SETTINGS = $.extend({}, defaults, options);

      const $html = $(document.getElementsByTagName('html')[0]);
      const $document = $(document);
      const $body = $(document.body);

      const setTransform = (() => {
        const transform = browserPrefix('transform');

        return ($el, val) => {
          if (transform && SETTINGS.transition) {
            const x = SETTINGS.transitionSide === 'left' ? val : -val;
            $el[0].style[transform] = `translate3d(${x}px,0,0)`;
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
          $nav = $this.clone().wrap('<nav></nav>').parent();
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

        const $li = $ul.find('li');
        const levels = {};
        let $wrappers;

        // Methods

        const openMenu = (e) => {
          e.preventDefault();
          e.stopPropagation();

          _open = true;
          _top = $html.scrollTop() || $body.scrollTop(); // remember the scroll position

          $body.addClass('hc-nav-open');

          if (hasScrollBar()) {
            $html.addClass('hc-yscroll');
          }

          if (_top) {
            $body.css('top', -_top);
          }
        };

        const openSubNav = (l, i) => {
          return function(e) {
            e.stopPropagation();
            e.preventDefault();

            const $this = $(this);
            const $wrap = $wrappers.filter(`[data-level=${l}][data-index=${i}]`);

            $this.closest('li').addClass('level-open');
            $wrap.addClass('sub-level-open').on('click', goBack(l, i));

            setTransform($nav, (l + 1) * SETTINGS.levelSpacing);

            return false;
          };
        };

        const closeNav = (preventLink) => {
          return (e) => {
            e.stopPropagation();

            if (preventLink === true) {
              e.preventDefault();
            }

            _open = false;

            $html.removeClass('hc-yscroll');
            $body.removeClass('hc-nav-open');
            $li.filter('.level-open').removeClass('level-open');
            $nav.find('.sub-level-open').removeClass('sub-level-open');
            $nav.removeAttr('style');

            if (_top) {
              $body.css('top', '').scrollTop(_top);
              $html.scrollTop(_top);

              _top = 0; // reset top
            }
          };
        };

        const goBack = (l, i) => {
          return function(e) {
            e.stopPropagation();
            e.preventDefault();

            const $wrap = $wrappers.filter(`[data-level=${l}]`);

            $wrap.off('click').removeClass('sub-level-open');
            $wrap.find('.level-open').removeClass('level-open');
            $wrap.find('.sub-level-open').removeClass('sub-level-open');

            setTransform($nav, l * SETTINGS.levelSpacing);
          };
        };


        // prepare our nav
        $nav
          .on('click touchstart', (e) => {
            // prevent menu close on self click
            e.stopPropagation();
          })
          .removeAttr('id') // remove id's so we don't have duplicates after cloning
          .removeClass() // remove all classes
          .addClass('hc-mobile-nav')
          .find('[id]').removeAttr('id'); // remove all children id's

        if (SETTINGS.transition) {
          $nav.addClass(`transform-${SETTINGS.transitionSide}`);
        }

        // set levels for menus
        $ul.each(function() {
          const $menu = $(this);
          const level = $menu.parents('li').length;

          if (!levels[level]) {
            levels[level] = $menu;
          }
          else {
            levels[level] = levels[level].add($menu);
          }
        });

        for (let l in levels) {
          const level = Number(l);

          // wrap all menus and submenus
          if (level === 0) {
            levels[level].wrapAll('<div class="menu-wrap"></div>');
          }
          else {
            levels[level].wrap('<div class="menu-wrap"></div>');
          }

          levels[level].each(function(i) {
            const $menu = $(this);
            const index = level !== 0 ? i : 0;

            // save some data
            $menu.parent()
              .attr('data-level', level)
              .attr('data-index', index);

            const $li_next = $menu.children('li').filter(function() {
              return $(this).find('ul').length;
            });

            // insert next level links
            $('<span class="next">')
              .click(openSubNav(level, index))
              .appendTo($li_next.addClass('has-subnav').children('a'));

            if (level === 0) return;

            // insert back links
            $('<li class="menu-item back"><a href="#">' + SETTINGS.labels.back + '<span></span></a></li>')
              .prependTo($menu)
              .children('a').click(goBack(level - 1, index));
          });
        }

        // now save our menu wrappers
        $wrappers = $nav.find('.menu-wrap');

        const $trigger = $('<a class="hc-menu-trigger"><span></span></a>').on('click', openMenu);

        // insert close link
        $('<li class="menu-item close"><a href="#">' + SETTINGS.labels.close + '<span></span></a></li>')
          .prependTo(levels[0].first())
          .children('a').click(closeNav(true));

        // when menu links clicked close menu (in case of #anchors)
        $li.children('a').click(closeNav());

        // close menu on body click
        const touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click';
        $document.on(touchEvent, 'body.hc-nav-open', closeNav());

        // insert menu to body
        $body.prepend($nav);

        // insert menu trigger link
        $this.addClass('hc-nav').after($trigger);

        // insert style
        const css = `@media screen and (max-width: ${SETTINGS.maxWidth - 1}px) {
          .hc-menu-trigger,
          .hc-mobile-nav,
          body:after {
            display: block;
          }
          .hc-nav {
            display: none;
          }
        }`;

        printStyle(css, 'hc-mobile-nav-style');
      });
    }
  });
})(jQuery, typeof window !== 'undefined' ? window : this);