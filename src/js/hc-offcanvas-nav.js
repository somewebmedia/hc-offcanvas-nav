/*!
 * HC Off-canvas Nav
 * ===================
 * Version: 3.1.4
 * Author: Some Web Media
 * Author URL: http://somewebmedia.com
 * Plugin URL: https://github.com/somewebmedia/hc-offcanvas-nav
 * Description: jQuery plugin for creating off-canvas multi-level navigations
 * License: MIT
 */

(function($, window) {
  'use strict';

  const document = window.document;
  const $html = $(document.getElementsByTagName('html')[0]);
  const $document = $(document);

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

  const ID = function() {
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

  const setTransform = (() => {
    const transform = browserPrefix('transform');

    return ($el, val, side) => {
      if (transform) {
        const x = side === 'left' ? val : -val;
        $el.css(transform, x ? `translate3d(${x}px,0,0)` : '');
      }
      else {
        $el.css(side, val);
      }
    };
  })();

  let navCount = 0;

  $.fn.extend({
    hcOffcanvasNav: function(options) {
      if (!this.length) return this;

      const self = this;

      // get body of the current document
      const $body = $(document.body);

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

      let Settings = $.extend({}, defaults, options);

      const navOpenClass = 'nav-open';

      const Plugin = function() {
        const $this = $(this);

        if (!$this.find('ul').addBack('ul').length) {
          console.log('%c! HC Offcanvas Nav:' + `%c Menu must contain <ul> element.`, 'color: red', 'color: black');
          return;
        }

        // count our nav
        navCount++;

        const navUniqId = `hc-nav-${navCount}`;

        let $toggle;

        // add classes to original menu so we know it's connected to our copy
        $this.addClass(`hc-nav ${navUniqId}`);

        // toggle
        if (!Settings.customToggle) {
          $toggle = $(`<a class="hc-nav-trigger ${navUniqId}"><span></span></a>`).on('click', toggleNav);
          $this.after($toggle);
        }
        else {
          $toggle = $(Settings.customToggle).addClass(`hc-nav-trigger ${navUniqId}`).on('click', toggleNav);
        }

        const toggleDisplay = $toggle.css('display');

        // insert styles
        let css = `
          .hc-offcanvas-nav.${navUniqId} {
            display: block;
          }
          .hc-nav-trigger.${navUniqId} {
            display: ${toggleDisplay && toggleDisplay !== 'none' ? toggleDisplay : 'block'}
          }
          .hc-nav.${navUniqId} {
            display: none;
          }
        `;

        if (Settings.maxWidth) {
          css = `@media screen and (max-width: ${Settings.maxWidth - 1}px) {
            ${css}
          }`;
        }

        printStyle(css);

        // this is our nav
        const $nav = $('<nav>').on('click', stopPropagation); // prevent menu close on self click
        const $nav_container = $('<div class="nav-container">').appendTo($nav);
        let $nav_content;

        let Model = {};
        let _open = false;
        let _top = 0;
        let _containerWidth = 0;
        let _transitionDuration;
        let _closeLevelsTimeout = null;
        let _indexes = {}; // object with level indexes
        const _openLevels = []; // array with current open levels

        // init function
        const initNav = () => {
          // remove transition from the nav container so we can update the nav without flickering
          $nav_container.css('transition', 'none');

          const wasOpen = $nav.hasClass(navOpenClass);

          $nav
            .off('click')
            .attr('class', '')
            .addClass(`
              hc-offcanvas-nav
              ${navUniqId}
              ${Settings.navClass || ''}
              nav-levels-${Settings.levelOpen || 'none'}
              side-${Settings.side}
              ${Settings.disableBody ? 'disable-body' : ''}
              ${isIos ? 'is-ios' : ''}
              ${isTouchDevice ? 'touch-device' : ''}
              ${wasOpen ? navOpenClass : ''}
            `);

          // close menu on body click (nav::after)
          if (Settings.disableBody) {
            $nav.on('click', closeNav);
          }

          setTimeout(() => {
            // clear inline transition
            $nav_container.css('transition', '');

            _containerWidth = $nav_container.width();
            _transitionDuration = toMs($nav_container.css('transition-duration'));

            if (typeof Settings.pushContent !== 'boolean') {
              $nav_content = $(Settings.pushContent);

              if ($nav_content.length) {
                printStyle(`${getElementCssTag(Settings.pushContent)} {
                  transition: ${$nav_container.css('transition-property').split(',')[0]} ${$nav_container.css('transition-duration')} ${$nav_container.css('transition-timing-function').split(',')[0]};
                }`);
              }
            }
          }, 1); // timed out so we can get computed data
        };

        // create nav model

        const createModel = () => {
          // get first level menus
          const $first_level = () => {
            const $ul = $this.find('ul').addBack('ul'); // original nav menus
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
                const $content = $li.children(':not(ul):not(div)').add($li.contents().filter(function() {
                  return this.nodeType === 3 && this.nodeValue.trim();
                }));
                const $nested_navs = $li.find('ul');
                const $subnav = $nested_navs.first().add($nested_navs.first().siblings('ul'));

                // save unique identifier for remembering open menus
                if ($subnav.length && !$li.data('hc-uniqid')) {
                  $li.data('hc-uniqid', ID());
                }

                // add elements to this level
                nav.items.push({
                  uniqid: $li.data('hc-uniqid'),
                  classes: $li.attr('class'),
                  $content: $content,
                  subnav: $subnav.length ? getModel($subnav) : []
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

          function createDom(menu, $container, level, title, backIndex) {
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
                let $item_link = $item_content.find('a').addBack('a');
                const $a = $item_link.length ? $item_link.clone() : $(`<a>`).append($item_content.clone()).on('click', stopPropagation);

                // on click trigger original link
                if ($item_link.length) {
                  $a.on('click', (e) => {
                    e.stopPropagation();
                    $item_link[0].click();
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
                  if (Settings.levelOpen === false || Settings.levelOpen === 'none') {
                    // every item should close the nav
                    $a.on('click', closeNav);
                  }
                  else {
                    // only items without submenus,
                    // or with submenus but with valid hrefs
                    $a.filter(function() {
                      const $this = $(this);
                      return !item.subnav.length || ($this.attr('href') && $this.attr('href').charAt(0) !== '#');
                    }).on('click', closeNav);
                  }
                }

                const $item = $(`<li>`).addClass(item.classes).append($a);

                // insert item
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
                    const $next_label = $(`<label for="${navUniqId}-${nextLevel}-${index}">`).on('click', stopPropagation);
                    const $checkbox = $(`<input type="checkbox" id="${navUniqId}-${nextLevel}-${index}">`)
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

                    if (!$a.attr('href') || $a.attr('href').charAt(0) === '#') {
                      $a.prepend($next_label.on('click', function() {
                        // trigger parent click in case it has custom click events
                        $(this).parent().trigger('click');
                      }));
                    }
                    else {
                      $next_span.append($next_label);
                    }
                  }

                  _indexes[nextLevel]++;

                  createDom(item.subnav, $item, nextLevel, nav_title, _indexes[nextLevel]-1);
                }
              });
            });

            // insert back links
            if (level && typeof backIndex !== 'undefined') {
              if (Settings.insertBack !== false && Settings.levelOpen === 'overlap') {
                const $children_menus = $content.children('ul');
                let $back = $(`<li class="nav-back"><a href="#">${Settings.labelBack || ''}<span></span></a></li>`);

                $back.children('a').on('click', preventClick(() => closeLevel(level, backIndex)));

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
              const $close = $(`<li class="nav-close"><a href="#">${Settings.labelClose || ''}<span></span></a></li>`);

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
        $body.append($nav);

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

          $nav.addClass(navOpenClass);
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

          if ($nav_content && $nav_content.length) {
            setTransform($nav_content, _containerWidth, Settings.side);
          }

          // trigger open event
          setTimeout(() => {
            self.trigger('open', $.extend({}, Settings));
          }, _transitionDuration + 1);
        }

        function closeNav() {
          _open = false;

          if ($nav_content && $nav_content.length) {
            setTransform($nav_content, 0, Settings.side);
          }

          $nav.removeClass(navOpenClass);
          $nav_container.removeAttr('style');
          $toggle.removeClass('toggle-open');

          if (Settings.levelOpen !== false && Settings.levelOpen !== 'none') {
            _closeLevelsTimeout = setTimeout(() => {
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

          // trigger close event
          setTimeout(() => {
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
            setTransform($nav_container, l * Settings.levelSpacing, Settings.side);

            if ($nav_content && $nav_content.length) {
              setTransform($nav_content, _containerWidth + l * Settings.levelSpacing, Settings.side);
            }
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
            setTransform($nav_container, (l - 1) * Settings.levelSpacing, Settings.side);

            if ($nav_content && $nav_content.length) {
              setTransform($nav_content, _containerWidth + (l - 1) * Settings.levelSpacing, Settings.side);
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
        }

        // Public methods

        self.options = (option) => {
          return option ? Settings[option] : Object.assign({}, Settings);
        };

        self.isOpen = () => $nav.hasClass(navOpenClass);

        self.open = () => {
          // timeout in case of update
          setTimeout(openNav, 1.5);
        };

        self.close = closeNav;

        self.update = (options, updateDom) => {
          if (typeof options === 'object') {
            Settings = $.extend({}, Settings, options);
            initNav();
            createNavDom(true);
          }

          if (options === true || updateDom) {
            initNav();
            createModel();
            createNavDom(true);
          }
        };
      };

      return this.each(Plugin);
    }
  });
})(jQuery, typeof window !== 'undefined' ? window : this);