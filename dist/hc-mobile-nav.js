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

(function ($, window) {
  "use strict";

  var document = window.document;

  var hasScrollBar = function hasScrollBar() {
    return document.body.scrollHeight > document.body.offsetHeight;
  };

  var browserPrefix = function browserPrefix(prop) {
    var prefixes = ['Webkit', 'Moz', 'Ms', 'O'];
    var thisBody = document.body || document.documentElement;
    var thisStyle = thisBody.style;
    var Prop = prop.charAt(0).toUpperCase() + prop.slice(1);

    if (typeof thisStyle[prop] !== 'undefined') {
      return prop;
    }

    for (var i = 0; i < prefixes.length; i++) {
      if (typeof thisStyle[prefixes[i] + Prop] !== 'undefined') {
        return prefixes[i] + Prop;
      }
    }

    return false;
  };

  var printStyle = function () {
    var $head = $('head');

    return function (css, id, prepend) {
      var $style = $head.find('style#' + id);

      if ($style.length) {
        $style.html(css);
      } else {
        if (prepend) {
          $('<style id="' + id + '">' + css + '</style>').prependTo($head);
        } else {
          $('<style id="' + id + '">' + css + '</style>').appendTo($head);
        }
      }
    };
  }();

  $.fn.extend({
    hcMobileNav: function hcMobileNav(options) {
      if (!this.length) return this;

      var defaults = {
        maxWidth: 1024,
        transition: true,
        transitionSide: 'left',
        disableBody: true,
        customClass: '',
        levelSpacing: 40,
        labels: {
          close: 'Close',
          back: 'Back'
        }
      };

      var SETTINGS = $.extend({}, defaults, options);

      var $html = $(document.getElementsByTagName('html')[0]);
      var $document = $(document);
      var $body = $(document.body);

      var setTransform = function () {
        var transform = browserPrefix('transform');

        return function ($el, val) {
          if (transform && SETTINGS.transition) {
            var x = SETTINGS.transitionSide === 'left' ? val : -val;
            $el[0].style[transform] = 'translate3d(' + x + 'px,0,0)';
          }
        };
      }();

      return this.each(function () {
        var $this = $(this);
        var $nav = void 0;
        var _open = false;
        var _top = 0;

        // clone menu
        if ($this.is('ul')) {
          $nav = $this.clone().wrap('<nav></nav>').parent();
        } else if ($this.is('nav')) {
          $nav = $this.clone();
        } else {
          $nav = $this.find('nav, ul').first().clone();

          if (!$nav.length) {
            console.log('%c! HC MobileNav:' + '%c There is no <nav> or <ul> elements in your menu.', 'color: red', 'color: black');
            return;
          }
        }

        var $ul = $nav.find('ul');

        if (!$ul.length) {
          console.log('%c! HC MobileNav:' + '%c Menu must contain <ul> element.', 'color: red', 'color: black');
          return;
        }

        var $li = $ul.find('li');
        var levels = {};

        // prepare our nav
        $nav.on('click touchstart', function (e) {
          // prevent menu close on self click
          e.stopPropagation();
        }).removeAttr('id') // remove id's so we don't have duplicates after cloning
        .removeClass() // remove all classes
        .addClass('hc-mobile-nav').addClass(SETTINGS.customClass).find('[id]').removeAttr('id'); // remove all children id's

        if (SETTINGS.transition) {
          $nav.addClass('transform-' + SETTINGS.transitionSide);
        }

        // set levels for menus
        $ul.each(function () {
          var $menu = $(this);
          var level = $menu.parents('li').length;

          if (!levels[level]) {
            levels[level] = $menu;
          } else {
            levels[level] = levels[level].add($menu);
          }
        });

        var _loop = function _loop(l) {
          var level = Number(l);

          // wrap all menus and submenus
          if (level === 0) {
            levels[level].wrapAll('<div class="menu-wrap"></div>');
          } else {
            levels[level].wrap('<div class="menu-wrap"></div>');
          }

          levels[level].each(function (i) {
            var $menu = $(this);
            var index = level !== 0 ? i : 0;

            // save some data
            $menu.parent().attr('data-level', level).attr('data-index', index);

            var $li_next = $menu.children('li').filter(function () {
              return $(this).find('ul').length;
            });

            // insert next level links
            $('<span class="next">').click(openSubNav(level, index)).appendTo($li_next.addClass('has-subnav').children('a'));

            if (level === 0) return;

            // insert back links
            $('<li class="menu-item back"><a href="#">' + SETTINGS.labels.back + '<span></span></a></li>').prependTo($menu).children('a').click(goBack(level - 1, index));
          });
        };

        for (var l in levels) {
          _loop(l);
        }

        // now save our menu wrappers
        var $wrappers = $nav.find('.menu-wrap').on('click', function (e) {
          return e.stopPropagation();
        });
        var $main_wrap = $wrappers.first();

        // Methods

        function openNav(e) {
          e.preventDefault();
          e.stopPropagation();

          _open = true;
          _top = $html.scrollTop() || $body.scrollTop(); // remember the scroll position

          $nav.addClass('nav-open');

          if (SETTINGS.disableBody) {
            $body.addClass('hc-nav-open');

            if (hasScrollBar()) {
              $html.addClass('hc-yscroll');
            }
          }

          if (_top) {
            $body.css('top', -_top);
          }
        }

        function openSubNav(l, i) {
          return function (e) {
            e.stopPropagation();
            e.preventDefault();

            var $this = $(this);
            var $wrap = $wrappers.filter('[data-level=' + l + '][data-index=' + i + ']');

            $this.closest('li').addClass('level-open');
            $wrap.addClass('sub-level-open').on('click', goBack(l, i));

            setTransform($main_wrap, (l + 1) * SETTINGS.levelSpacing);

            return false;
          };
        }

        function closeNav(preventLink) {
          return function (e) {
            e.stopPropagation();

            if (preventLink === true) {
              e.preventDefault();
            }

            _open = false;

            $html.removeClass('hc-yscroll');
            $nav.removeClass('nav-open');
            $main_wrap.removeAttr('style');
            $li.filter('.level-open').removeClass('level-open');
            $nav.find('.sub-level-open').removeClass('sub-level-open');

            if (SETTINGS.disableBody) {
              $body.removeClass('hc-nav-open');
            }

            if (_top) {
              $body.css('top', '').scrollTop(_top);
              $html.scrollTop(_top);

              _top = 0; // reset top
            }
          };
        }

        function goBack(l, i) {
          return function (e) {
            e.stopPropagation();
            e.preventDefault();

            var $wrap = $wrappers.filter('[data-level=' + l + ']');

            $wrap.off('click').removeClass('sub-level-open');
            $wrap.find('.level-open').removeClass('level-open');
            $wrap.find('.sub-level-open').removeClass('sub-level-open');

            setTransform($main_wrap, l * SETTINGS.levelSpacing);
          };
        }

        function toggleNav(e) {
          if (_open) {
            closeNav()(e);
          } else {
            openNav(e);
          }
        }

        // do the rest

        var $trigger = $('<a class="hc-menu-trigger"><span></span></a>').on('click', toggleNav);

        // insert close link
        $('<li class="menu-item close"><a href="#">' + SETTINGS.labels.close + '<span></span></a></li>').prependTo(levels[0].first()).children('a').click(closeNav(true));

        // when menu links clicked close menu (in case of #anchors)
        $li.children('a').click(closeNav());

        // close menu on body click
        if (SETTINGS.disableBody) {
          var touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click';
          $nav.on(touchEvent, closeNav());
        }

        // insert menu to body
        $body.prepend($nav);

        // insert menu trigger link
        $this.addClass('hc-nav').after($trigger);

        // insert style
        var css = '@media screen and (max-width: ' + (SETTINGS.maxWidth - 1) + 'px) {\n          .hc-menu-trigger,\n          .hc-mobile-nav,\n          body:after {\n            display: block;\n          }\n          .hc-nav {\n            display: none;\n          }\n        }';

        printStyle(css, 'hc-mobile-nav-style');
      });
    }
  });
})(jQuery, typeof window !== 'undefined' ? window : this);