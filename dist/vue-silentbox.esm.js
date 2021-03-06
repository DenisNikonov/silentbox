import { VueMathjax } from 'vue-mathjax';

var VideoUrlDecoderMixin = {
  methods: {
    getYoutubeVideoId(url) {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return match !== undefined && match[7] !== undefined ? match[7] : false;
    },

    getVimeoVideoId(url) {
      return /(vimeo(pro)?\.com)\/(?:[^\d]+)?(\d+)\??(.*)?$/.exec(url)[3];
    }

  }
};

var itemMixin = {
  mixins: [VideoUrlDecoderMixin],
  methods: {
    isEmbedVideo(itemSrc) {
      const supportedVideoServices = ['youtube.com', 'youtu.be', 'vimeo.com'];
      return supportedVideoServices.some(service => {
        return itemSrc.includes(service);
      });
    },

    isLocalVideo(itemSrc) {
      const supportedVideoServices = ['.mp4', '.ogg', '.webm', '.mov', '.flv', '.wmv', '.mkv'];
      return supportedVideoServices.some(service => {
        return itemSrc.includes(service);
      });
    },

    getThumbnail(src) {
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        const videoId = this.getYoutubeVideoId(src);
        return 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
      } else if (src.includes('vimeo.com')) {
        const videoDetails = this.httpGet('https://vimeo.com/api/v2/video/54802209.json');
        return videoDetails[0].thumbnail_medium;
      } else {
        return src;
      }
    },

    httpGet(url) {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open('GET', url, false);
      xmlHttp.send(null);
      return JSON.parse(xmlHttp.responseText);
    }

  }
};

//
var script = {
  name: 'SilentboxOverlay',
  mixins: [itemMixin],
  components: {
    'vue-mathjax': VueMathjax
  },
  props: {
    overlayItem: {
      type: Object,
      default: () => {
        return {
          src: '',
          description: ''
        };
      }
    },
    visible: {
      type: Boolean,
      default: false
    },
    totalItems: {
      type: Number,
      defautl: 1
    }
  },
  methods: {
    bodyScrolling() {
      const body = document.body; // add class only if overlay should be visible

      if (this.isVisible && !body.classList.contains('silentbox-is-opened')) {
        return body.classList.add('silentbox-is-opened');
      } // remove class only if overlay should be hidden


      if (!this.isVisible && body.classList.contains('silentbox-is-opened')) {
        return body.classList.remove('silentbox-is-opened');
      }
    },

    /**
     * Move to next item.
     */
    moveToNextItem() {
      this.$emit('requestNextSilentBoxItem');
    },

    /**
     * Move to previous item.
     */
    moveToPreviousItem() {
      this.$emit('requestPreviousSilentBoxItem');
    },

    /**
     * Hide silentbox overlay.
     */
    closeSilentboxOverlay() {
      this.$emit('closeSilentboxOverlay');
    },

    /**
     * Search for known video services URLs and return their players if recognized.
     * Unrecognized URLs are handled as images.
     *
     * @param  {string} url
     * @return {string}
     */
    handleUrl(url) {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return this.parseYoutubeVideo(url);
      } else if (url.includes('vimeo')) {
        return this.parseVimeoVideo(url);
      }

      return url;
    },

    /**
     * Get embed URL for youtube.com
     *
     * @param  {string} url
     * @return {string}
     */
    parseYoutubeVideo(url) {
      let videoUrl = '';
      const videoId = this.getYoutubeVideoId(url);

      if (videoId) {
        videoUrl = 'http://www.youtube.com/embed/' + videoId + '?rel=0';

        if (this.overlayItem.autoplay === 'autoplay') {
          videoUrl += '&autoplay=1';
        }

        if (!this.overlayItem.controls) {
          videoUrl += '&controls=0';
        }
      }

      return videoUrl;
    },

    /**
     * Get embed URL for vimeo.com
     *
     * @param  {string} url
     * @return {string}
     */
    parseVimeoVideo(url) {
      let videoUrl = '';
      const vimoId = /(vimeo(pro)?\.com)\/(?:[^\d]+)?(\d+)\??(.*)?$/.exec(url)[3];

      if (vimoId !== undefined) {
        videoUrl = 'https://player.vimeo.com/video/' + vimoId + '?rel=0';

        if (this.overlayItem.autoplay === 'autoplay') {
          videoUrl += '&autoplay=1';
        }
      }

      return videoUrl;
    }

  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
/* server only */
, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
  if (typeof shadowMode !== 'boolean') {
    createInjectorSSR = createInjector;
    createInjector = shadowMode;
    shadowMode = false;
  } // Vue.extend constructor export interop.


  const options = typeof script === 'function' ? script.options : script; // render functions

  if (template && template.render) {
    options.render = template.render;
    options.staticRenderFns = template.staticRenderFns;
    options._compiled = true; // functional template

    if (isFunctionalTemplate) {
      options.functional = true;
    }
  } // scopedId


  if (scopeId) {
    options._scopeId = scopeId;
  }

  let hook;

  if (moduleIdentifier) {
    // server build
    hook = function (context) {
      // 2.3 injection
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
      // 2.2 with runInNewContext: true

      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
      } // inject component styles


      if (style) {
        style.call(this, createInjectorSSR(context));
      } // register component module identifier for async chunk inference


      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    }; // used by ssr in case component is cached and beforeCreate
    // never gets called


    options._ssrRegister = hook;
  } else if (style) {
    hook = shadowMode ? function (context) {
      style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
    } : function (context) {
      style.call(this, createInjector(context));
    };
  }

  if (hook) {
    if (options.functional) {
      // register for functional component in vue file
      const originalRender = options.render;

      options.render = function renderWithStyleInjection(h, context) {
        hook.call(context);
        return originalRender(h, context);
      };
    } else {
      // inject component registration as beforeCreate hook
      const existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }

  return script;
}

const isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());

function createInjector(context) {
  return (id, style) => addStyle(id, style);
}

let HEAD;
const styles = {};

function addStyle(id, css) {
  const group = isOldIE ? css.media || 'default' : id;
  const style = styles[group] || (styles[group] = {
    ids: new Set(),
    styles: []
  });

  if (!style.ids.has(id)) {
    style.ids.add(id);
    let code = css.source;

    if (css.map) {
      // https://developer.chrome.com/devtools/docs/javascript-debugging
      // this makes source maps inside style tags work properly in Chrome
      code += '\n/*# sourceURL=' + css.map.sources[0] + ' */'; // http://stackoverflow.com/a/26603875

      code += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) + ' */';
    }

    if (!style.element) {
      style.element = document.createElement('style');
      style.element.type = 'text/css';
      if (css.media) style.element.setAttribute('media', css.media);

      if (HEAD === undefined) {
        HEAD = document.head || document.getElementsByTagName('head')[0];
      }

      HEAD.appendChild(style.element);
    }

    if ('styleSheet' in style.element) {
      style.styles.push(code);
      style.element.styleSheet.cssText = style.styles.filter(Boolean).join('\n');
    } else {
      const index = style.ids.size - 1;
      const textNode = document.createTextNode(code);
      const nodes = style.element.childNodes;
      if (nodes[index]) style.element.removeChild(nodes[index]);
      if (nodes.length) style.element.insertBefore(textNode, nodes[index]);else style.element.appendChild(textNode);
    }
  }
}

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _vm.visible
    ? _c("div", { attrs: { id: "silentbox-overlay" } }, [
        _c("div", { attrs: { id: "silentbox-overlay__background" } }),
        _vm._v(" "),
        _c(
          "div",
          {
            attrs: { id: "silentbox-overlay__content" },
            on: {
              click: function($event) {
                $event.stopPropagation();
                return _vm.closeSilentboxOverlay($event)
              }
            }
          },
          [
            _c(
              "div",
              { attrs: { id: "silentbox-overlay__embed" } },
              [
                _c("div", { attrs: { id: "silentbox-overlay__container" } }, [
                  _vm.isEmbedVideo(_vm.overlayItem.src)
                    ? _c("iframe", {
                        attrs: {
                          allow: [
                            "accelerometer;",
                            _vm.overlayItem.autoplay + ";",
                            "encrypted-media;",
                            "gyroscope;",
                            "picture-in-picture"
                          ],
                          src: _vm.handleUrl(_vm.overlayItem.src),
                          frameborder: "0",
                          width: "100%",
                          height: "100%",
                          allowfullscreen: ""
                        }
                      })
                    : _vm.isLocalVideo(_vm.overlayItem.src)
                    ? _c("div", { staticClass: "silentbox-video__frame" }, [
                        _c("video", {
                          staticClass: "silentbox-video__embed",
                          attrs: {
                            src: _vm.overlayItem.src,
                            autoplay: _vm.overlayItem.autoplay,
                            controls: ""
                          }
                        })
                      ])
                    : _c("img", {
                        attrs: {
                          src: _vm.overlayItem.src,
                          alt: _vm.overlayItem.alt,
                          width: "auto",
                          height: "auto"
                        }
                      })
                ]),
                _vm._v(" "),
                _vm.overlayItem.description
                  ? _c("vue-mathjax", {
                      attrs: {
                        id: "silentbox-overlay__description",
                        formula: _vm.overlayItem.description
                      }
                    })
                  : _vm._e()
              ],
              1
            )
          ]
        ),
        _vm._v(" "),
        _c(
          "div",
          {
            attrs: {
              id: "silentbox-overlay__close-button",
              role: "button",
              tabindex: "3"
            },
            on: {
              click: function($event) {
                $event.stopPropagation();
                return _vm.closeSilentboxOverlay($event)
              },
              keyup: function($event) {
                if (
                  !$event.type.indexOf("key") &&
                  _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")
                ) {
                  return null
                }
                return _vm.closeSilentboxOverlay($event)
              }
            }
          },
          [_c("div", { staticClass: "icon" })]
        ),
        _vm._v(" "),
        _vm.totalItems > 1
          ? _c("div", { attrs: { id: "silentbox-overlay__arrow-buttons" } }, [
              _c("div", {
                staticClass: "arrow arrow-previous",
                attrs: { role: "button", tabindex: "2" },
                on: {
                  click: function($event) {
                    $event.stopPropagation();
                    return _vm.moveToPreviousItem($event)
                  },
                  keyup: function($event) {
                    if (
                      !$event.type.indexOf("key") &&
                      _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")
                    ) {
                      return null
                    }
                    return _vm.moveToPreviousItem($event)
                  }
                }
              }),
              _vm._v(" "),
              _c("div", {
                staticClass: "arrow arrow-next",
                attrs: { role: "button", tabindex: "1" },
                on: {
                  click: function($event) {
                    $event.stopPropagation();
                    return _vm.moveToNextItem($event)
                  },
                  keyup: function($event) {
                    if (
                      !$event.type.indexOf("key") &&
                      _vm._k($event.keyCode, "enter", 13, $event.key, "Enter")
                    ) {
                      return null
                    }
                    return _vm.moveToNextItem($event)
                  }
                }
              })
            ])
          : _vm._e()
      ])
    : _vm._e()
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = function (inject) {
    if (!inject) return
    inject("data-v-062ebcfc_0", { source: ".silentbox-is-opened {\n  overflow: hidden;\n}\n#silentbox-overlay {\n  display: block;\n  height: 100vh;\n  left: 0;\n  position: fixed;\n  top: 0;\n  width: 100vw;\n  z-index: 999;\n}\n#silentbox-overlay__background {\n  background: rgba(0, 0, 0, 0.75);\n  backdrop-filter: blur(20px);\n  cursor: default;\n  display: block;\n  height: 100%;\n  left: 0;\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n#silentbox-overlay__content {\n  cursor: default;\n  display: block;\n  height: 100%;\n  position: relative;\n  width: 100%;\n}\n#silentbox-overlay__embed {\n  bottom: 0;\n  cursor: default;\n  display: block;\n  height: 80%;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: -2.5rem;\n  width: 75%;\n}\n#silentbox-overlay__embed img,\n#silentbox-overlay__embed iframe {\n  background-color: #000;\n  bottom: 0;\n  box-shadow: 0 0 1.5rem rgba(0, 0, 0, 0.45);\n  cursor: default;\n  display: block;\n  left: 0;\n  margin: auto;\n  max-height: 100%;\n  max-width: 100%;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n#silentbox-overlay__container {\n  cursor: default;\n  height: 100%;\n  margin: 0 0 1.5rem 0;\n  position: relative;\n  text-align: center;\n  width: 100%;\n}\n#silentbox-overlay__description {\n  display: block;\n  padding-top: 1rem;\n  text-align: center;\n  color: #fff;\n}\n#silentbox-overlay__close-button {\n  background: rgba(0, 0, 0, 0);\n  border: none;\n  color: #fff;\n  cursor: pointer;\n  height: 2.5rem;\n  position: absolute;\n  right: 0;\n  top: 0;\n  transition: background-color 250ms ease-out;\n  width: 2.5rem;\n}\n#silentbox-overlay__close-button:hover, #silentbox-overlay__close-button:focus {\n  background-color: rgba(0, 0, 0, 0.5);\n  outline: none;\n}\n#silentbox-overlay__close-button .icon {\n  color: #fff;\n  cursor: pointer;\n  height: 1rem;\n  left: 0.7rem;\n  margin: 50% 50% 0 0;\n  position: absolute;\n  right: 0px;\n  top: -0.5rem;\n  transition: 250ms ease;\n  width: 1rem;\n}\n#silentbox-overlay__close-button .icon:before, #silentbox-overlay__close-button .icon:after {\n  background: #fff;\n  content: \"\";\n  height: 2px;\n  left: 5%;\n  position: absolute;\n  top: 50%;\n  transition: 250ms ease;\n  width: 100%;\n}\n#silentbox-overlay__close-button .icon:before {\n  transform: rotate(-45deg);\n}\n#silentbox-overlay__close-button .icon:after {\n  transform: rotate(45deg);\n}\n#silentbox-overlay__close-button .icon:hover:before, #silentbox-overlay__close-button .icon:hover:after, #silentbox-overlay__close-button .icon:focus:before, #silentbox-overlay__close-button .icon:focus:after {\n  background: #58e8d2;\n  left: 25%;\n  width: 50%;\n}\n#silentbox-overlay__arrow-buttons .arrow {\n  border-left: 2px solid #fff;\n  border-top: 2px solid #fff;\n  cursor: pointer;\n  height: 1.5rem;\n  position: absolute;\n  width: 1.5rem;\n}\n#silentbox-overlay__arrow-buttons .arrow:hover, #silentbox-overlay__arrow-buttons .arrow:focus {\n  outline: none;\n  border-color: #58e8d2;\n}\n#silentbox-overlay__arrow-buttons .arrow-previous {\n  left: 2rem;\n  top: 50%;\n  transform: rotate(-45deg);\n}\n#silentbox-overlay__arrow-buttons .arrow-previous:hover, #silentbox-overlay__arrow-buttons .arrow-previous:focus {\n  animation-duration: 1s;\n  animation-iteration-count: infinite;\n  animation-name: pulsingPrevious;\n}\n#silentbox-overlay__arrow-buttons .arrow-next {\n  right: 2rem;\n  top: 50%;\n  transform: rotate(135deg);\n}\n#silentbox-overlay__arrow-buttons .arrow-next:hover, #silentbox-overlay__arrow-buttons .arrow-next:focus {\n  animation-duration: 1s;\n  animation-iteration-count: infinite;\n  animation-name: pulsingNext;\n}\n#silentbox-overlay .silentbox-video__frame {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: 100%;\n  height: 100%;\n}\n#silentbox-overlay .silentbox-video__embed {\n  outline: none;\n}\n#silentbox-overlay .silentbox-video__embed:active, #silentbox-overlay .silentbox-video__embed:focus, #silentbox-overlay .silentbox-video__embed:hover {\n  outline: none;\n}\n@keyframes pulsingNext {\n0% {\n    animation-timing-function: ease-in;\n    right: 2rem;\n}\n25% {\n    animation-timing-function: ease-in;\n    right: 1.75rem;\n}\n75% {\n    animation-timing-function: ease-in;\n    right: 2.25rem;\n}\n100% {\n    animation-timing-function: ease-in;\n    right: 2rem;\n}\n}\n@keyframes pulsingPrevious {\n0% {\n    animation-timing-function: ease-in;\n    left: 2rem;\n}\n25% {\n    animation-timing-function: ease-in;\n    left: 1.75rem;\n}\n75% {\n    animation-timing-function: ease-in;\n    left: 2.25rem;\n}\n100% {\n    animation-timing-function: ease-in;\n    left: 2rem;\n}\n}\n\n/*# sourceMappingURL=overlay.vue.map */", map: {"version":3,"sources":["C:\\OSPanel\\domains\\silentbox\\src\\components\\overlay.vue","overlay.vue"],"names":[],"mappings":"AA4MA;EACA,gBAAA;AC3MA;AD8MA;EACA,cAAA;EACA,aAAA;EACA,OAAA;EACA,eAAA;EACA,MAAA;EACA,YAAA;EACA,YAAA;AC3MA;ADsLA;EAwBA,+BAAA;EACA,2BAAA;EACA,eAAA;EACA,cAAA;EACA,YAAA;EACA,OAAA;EACA,kBAAA;EACA,MAAA;EACA,WAAA;AC3MA;AD2KA;EAoCA,eAAA;EACA,cAAA;EACA,YAAA;EACA,kBAAA;EACA,WAAA;AC5MA;ADoKA;EA4CA,SAAA;EACA,eAAA;EACA,cAAA;EACA,WAAA;EACA,OAAA;EACA,YAAA;EACA,kBAAA;EACA,QAAA;EACA,YAAA;EACA,UAAA;AC7MA;AD+MA;;EAEA,sBAjDA;EAkDA,SAAA;EACA,0CAAA;EACA,eAAA;EACA,cAAA;EACA,OAAA;EACA,YAAA;EACA,gBAAA;EACA,eAAA;EACA,kBAAA;EACA,QAAA;EACA,MAAA;AC7MA;ADyIA;EAyEA,eAAA;EACA,YAAA;EACA,oBAAA;EACA,kBAAA;EACA,kBAAA;EACA,WAAA;AC/MA;ADiIA;EAkFA,cAAA;EACA,iBAAA;EACA,kBAAA;EACA,WA/EA;ACjIA;AD2HA;EAyFA,4BAAA;EACA,YAAA;EACA,WArFA;EAsFA,eAAA;EACA,cAAA;EACA,kBAAA;EACA,QAAA;EACA,MAAA;EACA,2CAAA;EACA,aAAA;ACjNA;ADkNA;EAEA,oCAAA;EACA,aAAA;ACjNA;ADoNA;EACA,WApGA;EAqGA,eAAA;EACA,YAAA;EACA,YAAA;EACA,mBAAA;EACA,kBAAA;EACA,UAAA;EACA,YAAA;EACA,sBAAA;EACA,WAAA;AClNA;ADmNA;EAEA,gBAhHA;EAiHA,WAAA;EACA,WAAA;EACA,QAAA;EACA,kBAAA;EACA,QAAA;EACA,sBAAA;EACA,WAAA;AClNA;ADoNA;EACA,yBAAA;AClNA;ADoNA;EACA,wBAAA;AClNA;ADsNA;EAEA,mBAlIA;EAmIA,SAAA;EACA,UAAA;ACrNA;AD4NA;EACA,2BAAA;EACA,0BAAA;EACA,eAAA;EACA,cAAA;EACA,kBAAA;EACA,aAAA;AC1NA;AD2NA;EAEA,aAAA;EACA,qBArJA;ACrEA;AD6NA;EACA,UAAA;EACA,QAAA;EACA,yBAAA;AC3NA;AD4NA;EAEA,sBAAA;EACA,mCAAA;EACA,+BAAA;AC3NA;AD8NA;EACA,WAAA;EACA,QAAA;EACA,yBAAA;AC5NA;AD6NA;EAEA,sBAAA;EACA,mCAAA;EACA,2BAAA;AC5NA;ADgOA;EACA,aAAA;EACA,uBAAA;EACA,mBAAA;EACA,WAAA;EACA,YAAA;AC9NA;ADgOA;EACA,aAAA;AC9NA;AD+NA;EAGA,aAAA;AC/NA;ADqOA;AACA;IACA,kCAAA;IACA,WAAA;AClOE;ADoOF;IACA,kCAAA;IACA,cAAA;AClOE;ADoOF;IACA,kCAAA;IACA,cAAA;AClOE;ADoOF;IACA,kCAAA;IACA,WAAA;AClOE;AACF;ADoOA;AACA;IACA,kCAAA;IACA,UAAA;AClOE;ADoOF;IACA,kCAAA;IACA,aAAA;AClOE;ADoOF;IACA,kCAAA;IACA,aAAA;AClOE;ADoOF;IACA,kCAAA;IACA,UAAA;AClOE;AACF;;AAEA,sCAAsC","file":"overlay.vue","sourcesContent":["<template>\r\n  <div id=\"silentbox-overlay\" v-if=\"visible\">\r\n    <div id=\"silentbox-overlay__background\" />\r\n\r\n    <div id=\"silentbox-overlay__content\" @click.stop=\"closeSilentboxOverlay\">\r\n      <div id=\"silentbox-overlay__embed\">\r\n        <div id=\"silentbox-overlay__container\">\r\n          <!-- embed video rendering -->\r\n          <iframe\r\n            v-if=\"isEmbedVideo(overlayItem.src)\"\r\n            :allow=\"['accelerometer;', overlayItem.autoplay + ';', 'encrypted-media;', 'gyroscope;', 'picture-in-picture']\"\r\n            :src=\"handleUrl(overlayItem.src)\"\r\n            frameborder=\"0\"\r\n            width=\"100%\"\r\n            height=\"100%\"\r\n            allowfullscreen\r\n          />\r\n          <!-- local video rendering -->\r\n          <div\r\n            v-else-if=\"isLocalVideo(overlayItem.src)\"\r\n            class=\"silentbox-video__frame\"\r\n          >\r\n            <video\r\n              :src=\"overlayItem.src\"\r\n              :autoplay=\"overlayItem.autoplay\"\r\n              controls\r\n              class=\"silentbox-video__embed\"\r\n            />\r\n          </div>\r\n          <!-- local/embed image rendering -->\r\n          <img v-else :src=\"overlayItem.src\" :alt=\"overlayItem.alt\" width=\"auto\" height=\"auto\" >\r\n        </div>\r\n        <vue-mathjax\r\n          id=\"silentbox-overlay__description\"\r\n          v-if=\"overlayItem.description\"\r\n          :formula=\"overlayItem.description\"\r\n        >\r\n            <!-- {{ overlayItem.description }} -->\r\n        </vue-mathjax>\r\n      </div>\r\n    </div>\r\n\r\n    <div\r\n      id=\"silentbox-overlay__close-button\"\r\n      role=\"button\"\r\n      tabindex=\"3\"\r\n      @click.stop=\"closeSilentboxOverlay\"\r\n      @keyup.enter=\"closeSilentboxOverlay\"\r\n    >\r\n      <div class=\"icon\" />\r\n    </div>\r\n\r\n    <div id=\"silentbox-overlay__arrow-buttons\" v-if=\"totalItems > 1\">\r\n      <div\r\n        class=\"arrow arrow-previous\"\r\n        role=\"button\"\r\n        tabindex=\"2\"\r\n        @click.stop=\"moveToPreviousItem\"\r\n        @keyup.enter=\"moveToPreviousItem\"\r\n      />\r\n      <div\r\n        class=\"arrow arrow-next\"\r\n        role=\"button\"\r\n        tabindex=\"1\"\r\n        @click.stop=\"moveToNextItem\"\r\n        @keyup.enter=\"moveToNextItem\"\r\n      />\r\n    </div>\r\n  </div>\r\n</template>\r\n\r\n<script>\r\nimport itemMixim from './../mixins/item'\r\nimport {VueMathjax} from 'vue-mathjax'\r\nexport default {\r\n  name: 'SilentboxOverlay',\r\n  mixins: [itemMixim],\r\n  components: {\r\n    'vue-mathjax': VueMathjax\r\n  },\r\n  props: {\r\n    overlayItem: {\r\n      type: Object,\r\n      default: () => {\r\n        return {\r\n          src: '',\r\n          description: ''\r\n        }\r\n      }\r\n    },\r\n    visible: {\r\n      type: Boolean,\r\n      default: false\r\n    },\r\n    totalItems: {\r\n      type: Number,\r\n      defautl: 1\r\n    }\r\n  },\r\n  methods: {\r\n    bodyScrolling () {\r\n      const body = document.body\r\n\r\n      // add class only if overlay should be visible\r\n      if (this.isVisible && !body.classList.contains('silentbox-is-opened')) {\r\n        return body.classList.add('silentbox-is-opened')\r\n      }\r\n\r\n      // remove class only if overlay should be hidden\r\n      if (!this.isVisible && body.classList.contains('silentbox-is-opened')) {\r\n        return body.classList.remove('silentbox-is-opened')\r\n      }\r\n    },\r\n    /**\r\n     * Move to next item.\r\n     */\r\n    moveToNextItem () {\r\n      this.$emit('requestNextSilentBoxItem')\r\n    },\r\n    /**\r\n     * Move to previous item.\r\n     */\r\n    moveToPreviousItem () {\r\n      this.$emit('requestPreviousSilentBoxItem')\r\n    },\r\n    /**\r\n     * Hide silentbox overlay.\r\n     */\r\n    closeSilentboxOverlay () {\r\n      this.$emit('closeSilentboxOverlay')\r\n    },\r\n    /**\r\n     * Search for known video services URLs and return their players if recognized.\r\n     * Unrecognized URLs are handled as images.\r\n     *\r\n     * @param  {string} url\r\n     * @return {string}\r\n     */\r\n    handleUrl (url) {\r\n      if (url.includes('youtube.com') || url.includes('youtu.be')) {\r\n        return this.parseYoutubeVideo(url)\r\n      } else if (url.includes('vimeo')) {\r\n        return this.parseVimeoVideo(url)\r\n      }\r\n      return url\r\n    },\r\n    /**\r\n     * Get embed URL for youtube.com\r\n     *\r\n     * @param  {string} url\r\n     * @return {string}\r\n     */\r\n    parseYoutubeVideo (url) {\r\n      let videoUrl = ''\r\n      const videoId = this.getYoutubeVideoId(url)\r\n\r\n      if (videoId) {\r\n        videoUrl = 'http://www.youtube.com/embed/' + videoId + '?rel=0'\r\n\r\n        if (this.overlayItem.autoplay === 'autoplay') {\r\n          videoUrl += '&autoplay=1'\r\n        }\r\n        if (!this.overlayItem.controls) {\r\n          videoUrl += '&controls=0'\r\n        }\r\n      }\r\n\r\n      return videoUrl\r\n    },\r\n    /**\r\n     * Get embed URL for vimeo.com\r\n     *\r\n     * @param  {string} url\r\n     * @return {string}\r\n     */\r\n    parseVimeoVideo (url) {\r\n      let videoUrl = ''\r\n      const vimoId = /(vimeo(pro)?\\.com)\\/(?:[^\\d]+)?(\\d+)\\??(.*)?$/.exec(url)[3]\r\n\r\n      if (vimoId !== undefined) {\r\n        videoUrl = 'https://player.vimeo.com/video/' + vimoId + '?rel=0'\r\n        if (this.overlayItem.autoplay === 'autoplay') {\r\n          videoUrl += '&autoplay=1'\r\n        }\r\n      }\r\n\r\n      return videoUrl\r\n    }\r\n  }\r\n}\r\n</script>\r\n\r\n<style lang=\"scss\">\r\n@mixin element($element) {\r\n    &__#{$element} {\r\n        @content;\r\n    }\r\n}\r\n\r\n// Colours used in silentbox\r\n$main:   #fff;\r\n$accent: #58e8d2;\r\n$bg: #000;\r\n\r\n.silentbox-is-opened {\r\n    overflow: hidden;\r\n}\r\n\r\n#silentbox-overlay {\r\n    display: block;\r\n    height: 100vh;\r\n    left: 0;\r\n    position: fixed;\r\n    top: 0;\r\n    width: 100vw;\r\n    z-index: 999;\r\n\r\n    @include element(background) {\r\n        background: rgba($bg, .75);\r\n        backdrop-filter: blur(20px);\r\n        cursor: default;\r\n        display: block;\r\n        height: 100%;\r\n        left: 0;\r\n        position: absolute;\r\n        top: 0;\r\n        width: 100%;\r\n    }\r\n\r\n    @include element(content) {\r\n        cursor: default;\r\n        display: block;\r\n        height: 100%;\r\n        position: relative;\r\n        width: 100%;\r\n    }\r\n\r\n    @include element(embed) {\r\n        bottom: 0;\r\n        cursor: default;\r\n        display: block;\r\n        height: 80%;\r\n        left: 0;\r\n        margin: auto;\r\n        position: absolute;\r\n        right: 0;\r\n        top: -2.5rem;\r\n        width: 75%;\r\n\r\n        img,\r\n        iframe {\r\n            background-color: $bg;\r\n            bottom: 0;\r\n            box-shadow: 0 0 1.5rem rgba($bg, .45);\r\n            cursor: default;\r\n            display: block;\r\n            left: 0;\r\n            margin: auto;\r\n            max-height: 100%;\r\n            max-width: 100%;\r\n            position: absolute;\r\n            right: 0;\r\n            top: 0;\r\n        }\r\n    }\r\n\r\n    @include element(container) {\r\n        cursor: default;\r\n        height: 100%;\r\n        margin: 0 0 1.5rem 0;\r\n        position: relative;\r\n        text-align: center;\r\n        width: 100%;\r\n    }\r\n\r\n    @include element(description) {\r\n        display: block;\r\n        padding-top: 1rem;\r\n        text-align: center;\r\n        color: $main;\r\n    }\r\n\r\n    @include element(close-button) {\r\n        background: rgba($bg, .0);\r\n        border: none;\r\n        color: $main;\r\n        cursor: pointer;\r\n        height: 2.5rem;\r\n        position: absolute;\r\n        right: 0;\r\n        top: 0;\r\n        transition: background-color 250ms ease-out;\r\n        width: 2.5rem;\r\n        &:hover,\r\n        &:focus {\r\n            background-color: rgba($bg, .5);\r\n            outline: none;\r\n        }\r\n\r\n        .icon {\r\n            color: $main;\r\n            cursor: pointer;\r\n            height: 1rem;\r\n            left: .7rem;\r\n            margin: 50% 50% 0 0;\r\n            position: absolute;\r\n            right: 0px;\r\n            top: -.5rem;\r\n            transition: 250ms ease;\r\n            width: 1rem;\r\n            &:before,\r\n            &:after {\r\n                background: $main;\r\n                content: \"\";\r\n                height: 2px;\r\n                left: 5%;\r\n                position: absolute;\r\n                top: 50%;\r\n                transition: 250ms ease;\r\n                width: 100%;\r\n            }\r\n            &:before {\r\n                transform: rotate(-45deg);\r\n            }\r\n            &:after {\r\n                transform: rotate(45deg);\r\n            }\r\n            &:hover,\r\n            &:focus {\r\n                &:before,\r\n                &:after {\r\n                    background: $accent;\r\n                    left: 25%;\r\n                    width: 50%;\r\n                }\r\n            }\r\n        }\r\n    }\r\n\r\n    @include element(arrow-buttons) {\r\n        .arrow {\r\n            border-left: 2px solid $main;\r\n            border-top: 2px solid $main;\r\n            cursor: pointer;\r\n            height: 1.5rem;\r\n            position: absolute;\r\n            width: 1.5rem;\r\n            &:hover,\r\n            &:focus {\r\n                outline: none;\r\n                border-color: $accent;\r\n            }\r\n        }\r\n        .arrow-previous {\r\n            left: 2rem;\r\n            top: 50%;\r\n            transform: rotate(-45deg);\r\n            &:hover,\r\n            &:focus {\r\n                animation-duration: 1s;\r\n                animation-iteration-count: infinite;\r\n                animation-name: pulsingPrevious;\r\n            }\r\n        }\r\n        .arrow-next {\r\n            right: 2rem;\r\n            top: 50%;\r\n            transform: rotate(135deg);\r\n            &:hover,\r\n            &:focus {\r\n                animation-duration: 1s;\r\n                animation-iteration-count: infinite;\r\n                animation-name: pulsingNext;\r\n            }\r\n        }\r\n    }\r\n    .silentbox-video__frame {\r\n      display: flex;\r\n      justify-content: center;\r\n      align-items: center;\r\n      width: 100%;\r\n      height: 100%;\r\n    }\r\n    .silentbox-video__embed {\r\n      outline: none;\r\n      &:active,\r\n      &:focus,\r\n      &:hover {\r\n        outline: none\r\n      }\r\n    }\r\n}\r\n\r\n// Animations\r\n@keyframes pulsingNext {\r\n    0%   {\r\n        animation-timing-function: ease-in;\r\n        right: 2rem;\r\n    }\r\n    25%  {\r\n        animation-timing-function: ease-in;\r\n        right: 1.75rem;\r\n    }\r\n    75%  {\r\n        animation-timing-function: ease-in;\r\n        right: 2.25rem;\r\n    }\r\n    100% {\r\n        animation-timing-function: ease-in;\r\n        right: 2rem;\r\n    }\r\n}\r\n@keyframes pulsingPrevious {\r\n    0%   {\r\n        animation-timing-function: ease-in;\r\n        left: 2rem;\r\n    }\r\n    25%  {\r\n        animation-timing-function: ease-in;\r\n        left: 1.75rem;\r\n    }\r\n    75%  {\r\n        animation-timing-function: ease-in;\r\n        left: 2.25rem;\r\n    }\r\n    100% {\r\n        animation-timing-function: ease-in;\r\n        left: 2rem;\r\n    }\r\n}\r\n</style>\r\n",".silentbox-is-opened {\n  overflow: hidden;\n}\n\n#silentbox-overlay {\n  display: block;\n  height: 100vh;\n  left: 0;\n  position: fixed;\n  top: 0;\n  width: 100vw;\n  z-index: 999;\n}\n#silentbox-overlay__background {\n  background: rgba(0, 0, 0, 0.75);\n  backdrop-filter: blur(20px);\n  cursor: default;\n  display: block;\n  height: 100%;\n  left: 0;\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n#silentbox-overlay__content {\n  cursor: default;\n  display: block;\n  height: 100%;\n  position: relative;\n  width: 100%;\n}\n#silentbox-overlay__embed {\n  bottom: 0;\n  cursor: default;\n  display: block;\n  height: 80%;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: -2.5rem;\n  width: 75%;\n}\n#silentbox-overlay__embed img,\n#silentbox-overlay__embed iframe {\n  background-color: #000;\n  bottom: 0;\n  box-shadow: 0 0 1.5rem rgba(0, 0, 0, 0.45);\n  cursor: default;\n  display: block;\n  left: 0;\n  margin: auto;\n  max-height: 100%;\n  max-width: 100%;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n#silentbox-overlay__container {\n  cursor: default;\n  height: 100%;\n  margin: 0 0 1.5rem 0;\n  position: relative;\n  text-align: center;\n  width: 100%;\n}\n#silentbox-overlay__description {\n  display: block;\n  padding-top: 1rem;\n  text-align: center;\n  color: #fff;\n}\n#silentbox-overlay__close-button {\n  background: rgba(0, 0, 0, 0);\n  border: none;\n  color: #fff;\n  cursor: pointer;\n  height: 2.5rem;\n  position: absolute;\n  right: 0;\n  top: 0;\n  transition: background-color 250ms ease-out;\n  width: 2.5rem;\n}\n#silentbox-overlay__close-button:hover, #silentbox-overlay__close-button:focus {\n  background-color: rgba(0, 0, 0, 0.5);\n  outline: none;\n}\n#silentbox-overlay__close-button .icon {\n  color: #fff;\n  cursor: pointer;\n  height: 1rem;\n  left: 0.7rem;\n  margin: 50% 50% 0 0;\n  position: absolute;\n  right: 0px;\n  top: -0.5rem;\n  transition: 250ms ease;\n  width: 1rem;\n}\n#silentbox-overlay__close-button .icon:before, #silentbox-overlay__close-button .icon:after {\n  background: #fff;\n  content: \"\";\n  height: 2px;\n  left: 5%;\n  position: absolute;\n  top: 50%;\n  transition: 250ms ease;\n  width: 100%;\n}\n#silentbox-overlay__close-button .icon:before {\n  transform: rotate(-45deg);\n}\n#silentbox-overlay__close-button .icon:after {\n  transform: rotate(45deg);\n}\n#silentbox-overlay__close-button .icon:hover:before, #silentbox-overlay__close-button .icon:hover:after, #silentbox-overlay__close-button .icon:focus:before, #silentbox-overlay__close-button .icon:focus:after {\n  background: #58e8d2;\n  left: 25%;\n  width: 50%;\n}\n#silentbox-overlay__arrow-buttons .arrow {\n  border-left: 2px solid #fff;\n  border-top: 2px solid #fff;\n  cursor: pointer;\n  height: 1.5rem;\n  position: absolute;\n  width: 1.5rem;\n}\n#silentbox-overlay__arrow-buttons .arrow:hover, #silentbox-overlay__arrow-buttons .arrow:focus {\n  outline: none;\n  border-color: #58e8d2;\n}\n#silentbox-overlay__arrow-buttons .arrow-previous {\n  left: 2rem;\n  top: 50%;\n  transform: rotate(-45deg);\n}\n#silentbox-overlay__arrow-buttons .arrow-previous:hover, #silentbox-overlay__arrow-buttons .arrow-previous:focus {\n  animation-duration: 1s;\n  animation-iteration-count: infinite;\n  animation-name: pulsingPrevious;\n}\n#silentbox-overlay__arrow-buttons .arrow-next {\n  right: 2rem;\n  top: 50%;\n  transform: rotate(135deg);\n}\n#silentbox-overlay__arrow-buttons .arrow-next:hover, #silentbox-overlay__arrow-buttons .arrow-next:focus {\n  animation-duration: 1s;\n  animation-iteration-count: infinite;\n  animation-name: pulsingNext;\n}\n#silentbox-overlay .silentbox-video__frame {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: 100%;\n  height: 100%;\n}\n#silentbox-overlay .silentbox-video__embed {\n  outline: none;\n}\n#silentbox-overlay .silentbox-video__embed:active, #silentbox-overlay .silentbox-video__embed:focus, #silentbox-overlay .silentbox-video__embed:hover {\n  outline: none;\n}\n\n@keyframes pulsingNext {\n  0% {\n    animation-timing-function: ease-in;\n    right: 2rem;\n  }\n  25% {\n    animation-timing-function: ease-in;\n    right: 1.75rem;\n  }\n  75% {\n    animation-timing-function: ease-in;\n    right: 2.25rem;\n  }\n  100% {\n    animation-timing-function: ease-in;\n    right: 2rem;\n  }\n}\n@keyframes pulsingPrevious {\n  0% {\n    animation-timing-function: ease-in;\n    left: 2rem;\n  }\n  25% {\n    animation-timing-function: ease-in;\n    left: 1.75rem;\n  }\n  75% {\n    animation-timing-function: ease-in;\n    left: 2.25rem;\n  }\n  100% {\n    animation-timing-function: ease-in;\n    left: 2rem;\n  }\n}\n\n/*# sourceMappingURL=overlay.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

//
var script$1 = {
  name: 'silentboxGallery',
  mixins: [itemMixin],
  props: {
    gallery: {
      type: Array,
      default: () => {
        return [];
      }
    },
    inner: {
      type: Boolean,
      default: false
    },
    image: {
      type: Object,
      default: () => {
        return {
          src: '',
          alt: '',
          thumbnailWidth: '200px',
          thumbnailHeight: 'auto',
          thumbnail: '',
          autoplay: false,
          controls: true,
          description: ''
        };
      }
    }
  },
  components: {
    'silentbox-overlay': __vue_component__
  },

  mounted() {
    // Listen to key events.
    window.addEventListener('keyup', event => {
      // Escape: 27
      if (event.which === 27) {
        this.hideOverlay();
      } // Right arrow: 39


      if (event.which === 39) {
        this.showNextItem();
      } // Left arrow: 37


      if (event.which === 37) {
        this.showPreviousItem();
      }
    });
  },

  data() {
    return {
      overlay: {
        item: {
          src: '',
          alt: '',
          thumbnailWidth: '200px',
          thumbnailHeight: 'auto',
          thumbnail: '',
          autoplay: false,
          controls: true,
          description: '',
          component: 'vue-mathjax'
        },
        visible: false,
        currentItem: 0,
        totalItems: this.gallery.length || 1
      }
    };
  },

  computed: {
    galleryItems() {
      if (this.gallery.length > 0) {
        return this.gallery.map(item => {
          return { ...this.overlay.item,
            ...item,
            thumbnail: this.setThumbnail(item),
            autoplay: this.setAutoplay(item)
          };
        });
      } else {
        return [{ ...this.overlay.item,
          ...this.image,
          thumbnail: this.setThumbnail(this.image)
        }];
      }
    }

  },
  methods: {
    openOverlay(image, index) {
      this.overlay.visible = true;
      this.overlay.item = image;
      this.overlay.currentItem = index;
      this.$emit('silentbox-overlay-opened');
    },

    hideOverlay() {
      this.overlay.visible = false;
      this.$emit('silentbox-overlay-hidden');
    },

    showNextItem() {
      let newItemIndex = this.overlay.currentItem + 1;
      newItemIndex = newItemIndex <= this.galleryItems.length - 1 ? newItemIndex : 0;
      this.overlay.item = this.galleryItems[newItemIndex];
      this.overlay.currentItem = newItemIndex;
      this.$emit('silentbox-overlay-next-item-displayed');
    },

    showPreviousItem() {
      let newItemIndex = this.overlay.currentItem - 1;
      newItemIndex = newItemIndex > -1 ? newItemIndex : this.galleryItems.length - 1;
      this.overlay.item = this.galleryItems[newItemIndex];
      this.overlay.currentItem = newItemIndex;
      this.$emit('silentbox-overlay-previous-item-displayed');
    },

    setAutoplay(item) {
      return item.autoplay ? 'autoplay' : '';
    },

    setThumbnail(item) {
      if (this.isEmbedVideo(item.src) && item.thumbnail === undefined) {
        return this.getThumbnail(item.src);
      }

      return item.thumbnail || item.src;
    }

  }
};

/* script */
const __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "section",
    { attrs: { id: "silentbox-gallery" } },
    [
      _vm._t("append"),
      _vm._v(" "),
      _vm._l(_vm.galleryItems, function(image, index) {
        return _c(
          "div",
          {
            key: image.src,
            staticClass: "silentbox-item",
            on: {
              click: function($event) {
                return _vm.openOverlay(image, index)
              }
            }
          },
          [
            _vm.inner
              ? _vm._t("inner-image", null, { index: index })
              : _vm._e(),
            _vm._v(" "),
            _c("img", {
              attrs: {
                src: image.thumbnail,
                alt: image.alt,
                width: image.thumbnailWidth,
                height: image.thumbnailHeight
              }
            })
          ],
          2
        )
      }),
      _vm._v(" "),
      _vm._t("prepand"),
      _vm._v(" "),
      _c("silentbox-overlay", {
        attrs: {
          "overlay-item": _vm.overlay.item,
          visible: _vm.overlay.visible,
          "total-items": _vm.overlay.totalItems
        },
        on: {
          closeSilentboxOverlay: _vm.hideOverlay,
          requestNextSilentBoxItem: _vm.showNextItem,
          requestPreviousSilentBoxItem: _vm.showPreviousItem
        }
      })
    ],
    2
  )
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;

  /* style */
  const __vue_inject_styles__$1 = function (inject) {
    if (!inject) return
    inject("data-v-3a3fbc3e_0", { source: ".silentbox-item {\n  cursor: pointer;\n  display: inline-block;\n  text-decoration: underline;\n}\n\n/*# sourceMappingURL=gallery.vue.map */", map: {"version":3,"sources":["C:\\OSPanel\\domains\\silentbox\\src\\components\\gallery.vue","gallery.vue"],"names":[],"mappings":"AAwKA;EACA,eAAA;EACA,qBAAA;EACA,0BAAA;ACvKA;;AAEA,sCAAsC","file":"gallery.vue","sourcesContent":["<template>\r\n  <section id=\"silentbox-gallery\">\r\n    <slot name='append'/>\r\n    <div\r\n      v-for=\"(image, index) in galleryItems\"\r\n      :key=\"image.src\"\r\n      @click=\"openOverlay(image, index)\"\r\n      class=\"silentbox-item\"\r\n    >\r\n      <slot name='inner-image' v-if='inner' :index='index' />\r\n      <img\r\n        :src=\"image.thumbnail\"\r\n        :alt=\"image.alt\"\r\n        :width=\"image.thumbnailWidth\"\r\n        :height=\"image.thumbnailHeight\"\r\n      >\r\n    </div>\r\n    <slot name='prepand'/>\r\n\r\n    <silentbox-overlay\r\n      :overlay-item=\"overlay.item\"\r\n      :visible=\"overlay.visible\"\r\n      :total-items=\"overlay.totalItems\"\r\n      @closeSilentboxOverlay=\"hideOverlay\"\r\n      @requestNextSilentBoxItem=\"showNextItem\"\r\n      @requestPreviousSilentBoxItem=\"showPreviousItem\"\r\n    />\r\n  </section>\r\n</template>\r\n\r\n<script>\r\nimport overlay from './overlay.vue'\r\nimport itemMixin from './../mixins/item'\r\n\r\nexport default {\r\n  name: 'silentboxGallery',\r\n  mixins: [itemMixin],\r\n  props: {\r\n    gallery: {\r\n      type: Array,\r\n      default: () => {\r\n        return []\r\n      }\r\n    },\r\n    inner: {\r\n      type: Boolean,\r\n      default: false\r\n    },\r\n    image: {\r\n      type: Object,\r\n      default: () => {\r\n        return {\r\n          src: '',\r\n          alt: '',\r\n          thumbnailWidth: '200px',\r\n          thumbnailHeight: 'auto',\r\n          thumbnail: '',\r\n          autoplay: false,\r\n          controls: true,\r\n          description: ''\r\n        }\r\n      }\r\n    }\r\n  },\r\n  components: {\r\n    'silentbox-overlay': overlay\r\n  },\r\n  mounted () {\r\n    // Listen to key events.\r\n    window.addEventListener('keyup', (event) => {\r\n      // Escape: 27\r\n      if (event.which === 27) {\r\n        this.hideOverlay()\r\n      }\r\n      // Right arrow: 39\r\n      if (event.which === 39) {\r\n        this.showNextItem()\r\n      }\r\n      // Left arrow: 37\r\n      if (event.which === 37) {\r\n        this.showPreviousItem()\r\n      }\r\n    })\r\n  },\r\n  data () {\r\n    return {\r\n      overlay: {\r\n        item: {\r\n          src: '',\r\n          alt: '',\r\n          thumbnailWidth: '200px',\r\n          thumbnailHeight: 'auto',\r\n          thumbnail: '',\r\n          autoplay: false,\r\n          controls: true,\r\n          description: '',\r\n          component: 'vue-mathjax'\r\n        },\r\n        visible: false,\r\n        currentItem: 0,\r\n        totalItems: this.gallery.length || 1\r\n      }\r\n    }\r\n  },\r\n  computed: {\r\n    galleryItems () {\r\n      if (this.gallery.length > 0) {\r\n        return this.gallery.map(item => {\r\n          return {\r\n            ...this.overlay.item,\r\n            ...item,\r\n            thumbnail: this.setThumbnail(item),\r\n            autoplay: this.setAutoplay(item)\r\n          }\r\n        })\r\n      } else {\r\n        return [{\r\n          ...this.overlay.item,\r\n          ...this.image,\r\n          thumbnail: this.setThumbnail(this.image)\r\n        }]\r\n      }\r\n    }\r\n  },\r\n  methods: {\r\n    openOverlay (image, index) {\r\n      this.overlay.visible = true\r\n      this.overlay.item = image\r\n      this.overlay.currentItem = index\r\n      this.$emit('silentbox-overlay-opened')\r\n    },\r\n    hideOverlay () {\r\n      this.overlay.visible = false\r\n      this.$emit('silentbox-overlay-hidden')\r\n    },\r\n    showNextItem () {\r\n      let newItemIndex = this.overlay.currentItem + 1\r\n      newItemIndex = newItemIndex <= this.galleryItems.length - 1\r\n        ? newItemIndex : 0\r\n\r\n      this.overlay.item = this.galleryItems[newItemIndex]\r\n      this.overlay.currentItem = newItemIndex\r\n      this.$emit('silentbox-overlay-next-item-displayed')\r\n    },\r\n    showPreviousItem () {\r\n      let newItemIndex = this.overlay.currentItem - 1\r\n      newItemIndex = newItemIndex > -1\r\n        ? newItemIndex : this.galleryItems.length - 1\r\n\r\n      this.overlay.item = this.galleryItems[newItemIndex]\r\n      this.overlay.currentItem = newItemIndex\r\n      this.$emit('silentbox-overlay-previous-item-displayed')\r\n    },\r\n    setAutoplay (item) {\r\n      return item.autoplay ? 'autoplay' : ''\r\n    },\r\n    setThumbnail (item) {\r\n      if (this.isEmbedVideo(item.src) && item.thumbnail === undefined) {\r\n        return this.getThumbnail(item.src)\r\n      }\r\n\r\n      return item.thumbnail || item.src\r\n    }\r\n  }\r\n}\r\n</script>\r\n\r\n<style lang=\"scss\">\r\n  .silentbox-item {\r\n      cursor: pointer;\r\n      display: inline-block;\r\n      text-decoration: underline;\r\n  }\r\n</style>\r\n",".silentbox-item {\n  cursor: pointer;\n  display: inline-block;\n  text-decoration: underline;\n}\n\n/*# sourceMappingURL=gallery.vue.map */"]}, media: undefined });

  };
  /* scoped */
  const __vue_scope_id__$1 = undefined;
  /* module identifier */
  const __vue_module_identifier__$1 = undefined;
  /* functional template */
  const __vue_is_functional_template__$1 = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__$1 = normalizeComponent(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    false,
    createInjector,
    undefined,
    undefined
  );

const VueSilentbox = {};

VueSilentbox.install = function (Vue, options) {
  Vue.mixin({
    components: {
      'silent-box': __vue_component__$1
    }
  });
};

export default VueSilentbox;
