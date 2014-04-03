// jQuery HC-MobileNav
// =============
// Version: 1.1
// Copyright: Some Web Media
// Author: Some Web Guy
// Author URL: http://twitter.com/some_web_guy
// Website: http://someweblog.com/
// License: Released under the MIT License www.opensource.org/licenses/mit-license.php

(function($, window, undefined) {
	"use strict";

	var $window = $(window),
		document = window.document,
		$document = $(document);

	var supportTransition = (function(){
		var thisBody = document.body || document.documentElement,
			thisStyle = thisBody.style,
			support = thisStyle.transition !== undefined || thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.MsTransition !== undefined || thisStyle.OTransition !== undefined;
		return support;
	})();

	$.fn.extend({

		hcMobileNav: function(options) {

			// check if selected element exist in DOM, user doesn't have to worry about that
			if (this.length == 0) return this;

			// create mobileNav object to store data
			if (!this.data('mobileNav')) {
				this.data('mobileNav', {});
			}
			// settings
			this.each(function(){
				var $this = $(this);
				if (!$this.data('mobileNav').settings) {
					// init our settings and attach to element
					$this.data('mobileNav', {settings: $.extend({
						close: 'Close',
						back: 'Back'
					}, options || {})});
				} else {
					// update existing settings
					$this.data('mobileNav', $.extend($this.data('mobileNav'), {settings: $.extend($this.data('mobileNav').settings, options || {})}));
				}
			});

			return this.each(function() {

				var $this = $(this),
					settings = $this.data('mobileNav').settings;

				// insert trigger
				$this.after('<a id="menu-trigger">');

				// clone menu
				var $nav = $this.clone().click(function(e){e.stopPropagation()});

				// remove id's
				$nav.removeAttr('id').addClass('mobile-nav').find('*').removeAttr('id');

				// wrap all menus
				$nav.find('ul').wrap('<div class="menu-wrap"></div>');

				// check for transition support
				if (!supportTransition) $nav.addClass('no-transition');

				// funciton to open menu
				var _openMenu = function(e){
					e.stopPropagation();
					e.preventDefault();

					var $this = $(this),
						level = $this.parents('li').length,
						$wrap = $this.closest('li').addClass('open').closest('.menu-wrap');

					if (level === 1 && $wrap.length === 0) { // if selected element is <ul>
						$nav.addClass('submenu-open');
					} else {
						$wrap.addClass('submenu-open');
					}
					_setTransform(level * 40);
					return false;
				};

				// insert next level links
				$('<span class="next">').click(_openMenu).appendTo($nav.find('li.parent').children('a'));

				// insert back links
				var $ul = $nav.find('ul');
				if ($nav.is('ul')) {// if selected element is <ul>
					$ul.prepend('<li class="menu-item back"><a href="#">' + settings.back + '<span /></a></li>');
					$nav.prepend('<li class="menu-item close"><a href="#">' + settings.close + '<span /></a></li>');
				} else {
					$ul.not(':first').prepend('<li class="menu-item back"><a href="#">' + settings.back + '<span /></a></li>');
					$ul.first().prepend('<li class="menu-item close"><a href="#">' + settings.close + '<span /></a></li>');
				}

				// main menu back
				$nav.find('li.close').first().children('a').click(function(e){
					e.preventDefault();
					$('body').removeClass('open-menu');
					$nav.removeAttr('style');
				});

				// funciton to animate menu
				var _setTransform = function(val){
					if (supportTransition) {
						$nav[0].style.WebkitTransform = 'translate3d(' + val + 'px,0,0)';
						$nav[0].style.MozTransform = 'translate3d(' + val + 'px,0,0)';
						$nav[0].style.transform = 'translate3d(' + val + 'px,0,0)';
					} else {
						$nav.css({left:val});
					}
				};

				// funciton to close menu
				var _closeMenu = function(){
					$('html').removeClass('noscroll');
					$('body').removeClass('open-menu');
					$nav.find('li.open').removeClass('open');
					$nav.find('.submenu-open').removeClass('submenu-open');
					// if selected element is <ul>
					if ($nav.is('ul')) $nav.removeClass('submenu-open');
					$nav.removeAttr('style');
				};

				// submenus back
				$nav.find('li.back').children('a').click(function(e){
					e.preventDefault();
					var $this = $(this);
					$this.closest('li.open').removeClass('open');
					$this.closest('.submenu-open').removeClass('submenu-open');
					var level = $(this).parents('li').length - 2;
					_setTransform(level * 40);
				});

				// insert menu to body
				$('body').prepend($nav);

				// on document click close menu
				$document.on('click', 'body.open-menu', _closeMenu);

				// when clicked links close menu (in case of anchors)
				$nav.find('li:not(".close"):not(".back")').children('a').click(_closeMenu);

				// add class to body when menu is open
				$document.on('click', '#menu-trigger', function(){
					$('html').addClass('noscroll');
					$('body').addClass('open-menu');
				});

				// add our class to regular menus so we can hide them
				$this.addClass('hc-menu');
			});
		}

	});

})(jQuery, this);