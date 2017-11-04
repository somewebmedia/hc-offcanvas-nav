// jQuery HC-MobileNav
// =============
// Version: 2.0.2
// Author: Some Web Media
// Author URL: http://somewebmedia.com
// Plugin URL: https://github.com/somewebmedia/hc-mobile-nav
// Description: jQuery plugin for converting menus to mobile navigations
// License: MIT

(function($, window, undefined) {
  'use strict';

  var document = window.document;

  var supportTransition = (function() {
    var thisBody = document.body || document.documentElement;
    var thisStyle = thisBody.style;
    var support = thisStyle.transition !== undefined
      || thisStyle.WebkitTransition !== undefined
      || thisStyle.MozTransition !== undefined
      || thisStyle.MsTransition !== undefined
      || thisStyle.OTransition !== undefined;

    return support;
  })();

  var hasScrollBar = function() {
    return document.body.scrollHeight > document.body.offsetHeight;
  };

  var setTransform = function($el, val) {
    if (supportTransition) {
      $el[0].style.WebkitTransform = 'translate3d(' + val + 'px,0,0)';
      $el[0].style.MozTransform = 'translate3d(' + val + 'px,0,0)';
      $el[0].style.MsTransform = 'translate3d(' + val + 'px,0,0)';
      $el[0].style.OTransform = 'translate3d(' + val + 'px,0,0)';
      $el[0].style.transform = 'translate3d(' + val + 'px,0,0)';
    }
    else {
      $el.css({
        'left': val
      });
    }
  };

  $.fn.extend({
    'hcPrintStyle': function(css, id, prepend) {
      var $this = $(this);
      var $style = $this.find('style#' + id);

      if ($style.length) {
        $style.html(css);
      }
      else {
        if (prepend) {
          $('<style id="' + id + '">' + css + '</style>').prependTo($this);
        }
        else {
          $('<style id="' + id + '">' + css + '</style>').appendTo($this);
        }
      }
    }
  });

  $.fn.extend({
    'hcMobileNav': function(user_settings) {
      if (!this.length) {
        return this;
      }

      var $html = $(document.getElementsByTagName('html')[0]);
      var $document = $(document);
      var $body = $(document.body);

      return this.each(function() {
        var $this = $(this).addClass('hc-nav');
        var settings = $this.data('hc-mobile-nav') || {};
        var $nav;
        var open = false;
        var top = 0;

        if ($.isEmptyObject(settings)) {
          $.extend(settings, {
            'maxWidth': 1024,
            'labels': {
              'close': 'Close',
              'back': 'Back'
            }
          }, user_settings || {});
        }
        else {
          $.extend(settings, user_settings || {});
        }

        // update settings
        $this.data('hc-mobile-nav', settings);

        // clone menu
        if ($this.is('ul')) {
          var $tmp_nav = $this.clone();

          $nav = $tmp_nav.wrap('<nav></nav>').parent();
        }
        else if ($this.is('nav')) {
          $nav = $this.clone();
        }
        else {
          console.error('HC-MobileNav: Menu element must be <ul> or <nav>');
          return;
        }

        var $ul = $nav.find('ul');
        var $li = $ul.find('li');

        $nav.on('click touchstart', function(e) {
          // prevent menu close on self click
          e.stopPropagation();
        })
          .removeAttr('id') // remove id's so we don't have duplicates after cloning
          .removeClass() // remove all classes
          .addClass('hc-mobile-nav')
          .find('[id]').removeAttr('id');

        // wrap all menus
        $ul.wrap('<div class="menu-wrap"></div>');

        // check for transition support
        if (!supportTransition) {
          $nav.addClass('no-transition');
        }

        // open main menu
        var openMenu = function(e) {
          e.preventDefault();
          e.stopPropagation();

          top = $html.scrollTop() || $body.scrollTop();
          open = true;
          $body.addClass('hc-nav-open notouchmove');

          if (hasScrollBar()) {
            $html.addClass('yscroll');
          }

          if (top) {
            $body.css('top', -top);
          }
        };

        // open nested menus
        var openSubMenu = function(e) {
          e.stopPropagation();
          e.preventDefault();

          var $this = $(this);
          var level = $this.parents('li').length;
          var $wrap = $this.closest('li').addClass('open').closest('.menu-wrap');

          if (level === 1 && !$wrap.length) {
            // if selected element is <ul>
            $nav.addClass('submenu-open');
          }
          else {
            $wrap.addClass('submenu-open');
          }

          setTransform($nav, level * 40);

          return false;
        };

        // close menu
        var closeMenu = function(preventLink) {
          return function(e) {
            if (preventLink === true) {
              e.preventDefault();
            }

            open = false;
            $html.removeClass('yscroll');
            $body.removeClass('hc-nav-open notouchmove');
            $li.filter('.open').removeClass('open');
            $nav.find('.submenu-open').removeClass('submenu-open');
            $nav.removeAttr('style');

            if (top) {
              $body.css('top', '').scrollTop(top);
              $html.scrollTop(top);
              top = 0;
            }
          };
        };

        // submenus back
        var goBack = function(e) {
          var $this = $(this);
          var level = $this.parents('li').length - 2;

          e.preventDefault();
          $this.closest('li.open').removeClass('open');
          $this.closest('.submenu-open').removeClass('submenu-open');
          setTransform($nav, level * 40);
        };

        var $trigger = $('<a id="menu-trigger">').on('click', openMenu);

        // insert next level links
        $('<span class="next">')
          .click(openSubMenu)
          .appendTo($nav.find('li').filter(function() {
            return $(this).find('ul').length > 0;
          }).addClass('parent').children('a'));

        // insert back links
        $('<li class="menu-item back"><a href="#">' + settings.labels.back + '<span></span></a></li>')
          .prependTo($ul.not(':first'))
          .children('a').click(goBack);

        // insert close link
        $('<li class="menu-item close"><a href="#">' + settings.labels.close + '<span></span></a></li>')
          .prependTo($ul.first())
          .children('a').click(closeMenu(true));

        // when menu links clicked close menu (in case of #anchors)
        $li.children('a').click(closeMenu());

        // close menu on body click
        $document.on('click touchstart', 'body.hc-nav-open', closeMenu());

        // insert menu to body
        $body.prepend($nav);

        // insert menu trigger link
        $this.after($trigger);

        // insert style
        var css = '@media screen and (max-width:' + (settings.maxWidth - 1) + 'px) { ' +
          '#menu-trigger, .hc-mobile-nav, body:after { display: block; }' +
          '.hc-nav { display: none; }' +
        '}';

        $('head').hcPrintStyle(css, 'hc-mobile-nav-style');
      });
    }
  });
})(jQuery, this);
