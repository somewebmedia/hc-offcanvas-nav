( ( window ) => {
  'use strict';

  const hcOffcanvasNav = window.hcOffcanvasNav;
  const document = window.document;

  let supportsPassive = false;
  try {
    const opts = Object.defineProperty( {}, 'passive', {
      get: function() {
        supportsPassive = {passive: false};
      }
    } );
    window.addEventListener( 'testPassive', null, opts );
    window.removeEventListener( 'testPassive', null, opts );
  }
  catch ( e ) {}

  const isIos = ( () => ( ( /iPad|iPhone|iPod/.test( navigator.userAgent ) ) || ( !! navigator.platform && /iPad|iPhone|iPod/.test( navigator.platform ) ) ) && !window.MSStream )();

  const isTouchDevice = ( () => 'ontouchstart' in window || navigator.maxTouchPoints || ( window.DocumentTouch && document instanceof DocumentTouch ) )();

  const isNumeric = ( n ) => ! isNaN( parseFloat( n ) ) && isFinite( n );

  const formatSizeVal = ( n ) => ( n === 'auto' ) ? '100%' : isNumeric( n ) && n !== 0 ? `${n}px` : n;

  const toMs = ( s ) => parseFloat( s ) * ( /\ds$/.test( s ) ? 1000 : 1 );

  const stopPropagation = ( e ) => e.stopPropagation();
  const preventDefault = ( e ) => e.preventDefault();

  const preventClick = ( cb ) => {
    return ( e ) => {
      e.preventDefault();
      e.stopPropagation();
      if ( typeof cb === 'function' ) cb();
    };
  };

  const browserPrefix = ( prop ) => {
    const prefixes = ['Webkit', 'Moz', 'Ms', 'O'];
    const thisBody = document.body || document.documentElement;
    const thisStyle = thisBody.style;
    const Prop = prop.charAt( 0 ).toUpperCase() + prop.slice( 1 );

    if ( typeof thisStyle[prop] !== 'undefined' ) {
      return prop;
    }

    for ( let i = 0; i < prefixes.length; i++ ) {
      if ( typeof thisStyle[prefixes[i] + Prop] !== 'undefined' ) {
        return prefixes[i] + Prop;
      }
    }

    return false;
  };

  const children = ( el, selector ) => {
    if ( el instanceof Element ) {
      return selector ? Array.from( el.children ).filter( ( child ) => child.matches( selector ) ) : el.children;
    }
    else {
      let result = [];

      Array.from( el ).forEach( ( n ) => {
        result = selector
          ? result.concat( Array.from( n.children ).filter( ( child ) => child.matches( selector ) ) )
          : result.concat( Array.from( n.children ) );
      } );

      return result;
    }
  };

  const wrap = ( el, wrapper ) => {
    el.parentNode.insertBefore( wrapper, el );
    wrapper.appendChild( el );
  };

  const data = ( el, prop, val ) => {
    el.hcOffcanvasNav = el.hcOffcanvasNav || {};

    if ( typeof val !== 'undefined' ) {
      el.hcOffcanvasNav[prop] = val;
    }
    else {
      return el.hcOffcanvasNav[prop];
    }
  };

  const clone = ( el, withEvents, deepWithEvents ) => {
    const cloned = el.cloneNode( deepWithEvents || false );
    const srcElements = el instanceof Element ? [el].concat( Array.from( el.getElementsByTagName( '*' ) ) ) : [];
    const destElements = cloned instanceof Element ? [cloned].concat( Array.from( cloned.getElementsByTagName( '*' ) ) ) : [];

    const cloneCopyEvent = ( src, dest ) => {
      for ( let s = 0; s < src.length; s++ ) {
        if ( src[s]._eventListeners ) {
          for ( const type in src[s]._eventListeners ) {
            for ( let i = 0; i < src[s]._eventListeners[type].length; i++ ) {
              dest[i].addEventListener( type, src[s]._eventListeners[type][i].fn, src[s]._eventListeners[type][i].options );
            }
          }
        }
      }
    };

    if ( ! withEvents ) {
      srcElements.shift();
      destElements.shift();
    }

    if ( deepWithEvents ) {
      cloneCopyEvent( srcElements, destElements );
    }

    return cloned;
  };

  const customEventObject = ( type, target, currentTarget, args ) => {
    function Event( type ) {
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

      for ( const prop in args ) {
        this.data[prop] = args[prop];
      }
    }

    return new Event( type );
  };

  const hasListener = ( el, type ) => {
    return ( type ? ( el._eventListeners || {} )[type] : el._eventListeners ) || false;
  };

  const normalizeOptions = ( opts ) => {
    if ( typeof opts === 'boolean' ) {
      return { capture: opts };
    }
    return opts ?? { capture: false };
  };

  const registry = new WeakMap();

  const getRegistry = ( el ) => {
    if ( ! registry.has( el ) ) {
      const store = {};
      registry.set( el, store );
      Object.defineProperty( el, '_eventListeners', {
        get() {
          return registry.get( this );
        },
        configurable: true,
        enumerable: false
      } );
    }
    return registry.get( el );
  };

  const addRemoveListener = ( op ) => {
    const f = EventTarget.prototype[op + 'EventListener'];

    return function ( name, cb, opts ) {
      const eventName = name.split( '.' )[0];
      const store = getRegistry( this );

      if ( op === 'add' ) {
        store[name] = store[name] || [];

        const normalized = normalizeOptions( opts );
        const isDuplicate = store[name].some(
          ( e ) => e.fn === cb && normalizeOptions( e.options ).capture === normalized.capture
        );

        if ( ! isDuplicate ) {
          const lstn = { fn: cb };

          if ( opts ) {
            lstn.options = opts;
          }

          store[name].push( lstn );
          f.call( this, eventName, cb, opts );
        }
      }
      else {
        if ( typeof cb === 'function' ) {
          f.call( this, eventName, cb, opts );

          for ( const e in store ) {
            store[e] = store[e].filter( ( l ) => ! ( l.fn === cb && e.split( '.' )[0] === eventName ) );

            if ( ! store[e].length ) {
              delete store[e];
            }
          }
        }
        else {
          if ( store[name] ) {
            for ( let i = store[name].length; i--; ) {
              f.call( this, eventName, store[name][i].fn, store[name][i].options );
              store[name].splice( i, 1 );
            }
            delete store[name];
          }
        }
      }
    };
  };

  EventTarget.prototype.addEventListener = addRemoveListener( 'add' );
  EventTarget.prototype.removeEventListener = addRemoveListener( 'remove' );

  const debounce = ( func, wait, immediate ) => {
    let timeout;

    return function() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;

        if ( ! immediate ) {
          func.apply( context, args );
        }
      };
      const callNow = immediate && ! timeout;

      clearTimeout( timeout );
      timeout = setTimeout( later, wait );

      if ( callNow ) {
        func.apply( context, args );
      }
    };
  };

  const createElement = ( tag, props = {}, content ) => {
    const el = document.createElement( tag );

    for ( const p in props ) {
      if ( p !== 'class' ) {
        if ( ! ( ! props[p] && props[p] !== 0 ) ) {
          el.setAttribute( p, props[p] );
        }
      }
      else {
        el.className = props[p];
      }
    }

    if ( content ) {
      if ( ! Array.isArray( content ) ) {
        content = [content];
      }

      for ( let i = 0; i < content.length; i++ ) {
        if ( typeof content[i] === 'object' && content[i].length && !content[i].nodeType ) {
          for ( let l = 0; l < content[i].length; l++ ) {
            el.appendChild( content[i][l] );
          }
        }
        else {
          el.appendChild( typeof content[i] === 'string' ? document.createTextNode( content[i] ) : content[i] );
        }
      }
    }

    return el;
  };

  const getElements = ( el ) => {
    let node = null;

    if ( typeof el === 'string' ) {
      node = document.querySelectorAll( el );
    }
    else if ( window.jQuery && el instanceof window.jQuery && el.length ) {
      node = el.toArray();
    }
    else if ( el instanceof Element ) {
      node = [el];
    }

    return node;
  };

  const getElementCssTag = ( el ) => {
    return typeof el === 'string'
      ? el
      : el.getAttribute( 'id' )
        ? `#${el.getAttribute( 'id' )}`
        : el.getAttribute( 'class' )
          ? el.tagName.toLowerCase() + '.' + el.getAttribute( 'class' ).replace( /\s+/g, '.' )
          : getElementCssTag( el.parentNode ) + ' > ' + el.tagName.toLowerCase();
  };

  const printStyle = ( id ) => {
    const $style = createElement( 'style', {id: id} );
    let rules = {};
    let media = {};

    document.head.appendChild( $style );

    const parseRules = ( text ) => {
      if ( text.substr( -1 ) !== ';' ) {
        text += text.substr( -1 ) !== ';' ? ';' : '';
      }
      return text;
    };

    return {
      reset: () => {
        rules = {};
        media = {};
      },
      add: ( selector, declarations, query ) => {
        selector = selector.trim();
        declarations = declarations.trim();

        if ( query ) {
          query = query.trim();
          media[query] = media[query] || {};
          media[query][selector] = parseRules( declarations );
        }
        else {
          rules[selector] = parseRules( declarations );
        }
      },
      remove: ( selector, query ) => {
        selector = selector.trim();

        if ( query ) {
          query = query.trim();
          if ( typeof media[query][selector] !== 'undefined' ) {
            delete media[query][selector];
          }
        }
        else {
          if ( typeof rules[selector] !== 'undefined' ) {
            delete rules[selector];
          }
        }
      },
      insert: () => {
        let cssText = '';

        for ( let breakpoint in media ) {
          cssText += `@media screen and (${breakpoint}) {\n`;

          for ( let key in media[breakpoint] ) {
            cssText += `  ${key} { ${media[breakpoint][key]} }\n`;
          }

          cssText += '}\n';
        }

        for ( let key in rules ) {
          cssText += `${key} { ${rules[key]} }\n`;
        }

        $style.innerHTML = cssText;
      }
    };
  };

  const insertAt = ( $insert, n, $parent ) => {
    const $children = children( $parent );
    const count = $children.length;

    n = n === 'first' ? 0 : n;
    n = n === 'last' ? count : n;

    const i = n > -1
      ? Math.max( 0, Math.min( n, count ) )
      : Math.max( 0, Math.min( count + n, count ) );

    if ( i === 0 ) {
      $parent[0].insertBefore( $insert, $parent[0].firstChild );
    }
    else {
      $children[i - 1].insertAdjacentElement( 'afterend', $insert );
    }
  };

  const getAxis = ( position ) => ['left', 'right'].indexOf( position ) !== -1 ? 'x' : 'y';

  const setTransform = ( () => {
    const transform = browserPrefix( 'transform' );

    return ( $el, val, pos ) => {
      if ( val === false || val === '' ) {
        $el.style.transform = '';
      }
      else {
        if ( getAxis( pos ) === 'x' ) {
          const x = pos === 'left' ? val : -val;
          $el.style.transform = `translate3d(${formatSizeVal(x)},0,0)`;
        }
        else {
          const y = pos === 'top' ? val : -val;
          $el.style.transform = `translate3d(0,${formatSizeVal(y)},0)`;
        }
      }
    };
  } )();

  const deprecated = ( () => {
    const pluginName = 'HC Off-canvas Nav';

    return ( what, instead, type ) => {
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
        'color: default'
      );
    };
  } )();

  hcOffcanvasNav.Helpers = {
    supportsPassive,
    isIos,
    isTouchDevice,
    isNumeric,
    formatSizeVal,
    toMs,
    stopPropagation,
    preventDefault,
    preventClick,
    browserPrefix,
    children,
    wrap,
    data,
    clone,
    customEventObject,
    hasListener,
    debounce,
    createElement,
    getElements,
    getElementCssTag,
    printStyle,
    insertAt,
    getAxis,
    setTransform,
    deprecated
  };

} )( window );
