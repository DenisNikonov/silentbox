<template>
  <section id="silentbox-gallery">
    <slot name='append'/>
    <div
      v-for="(image, index) in galleryItems"
      :key="image.src"
      @click="openOverlay(image, index)"
      class="silentbox-item"
    >
      <slot name='inner-image' v-if='inner' :index='index' />
      <img
        :src="image.thumbnail"
        :alt="image.alt"
        :width="image.thumbnailWidth"
        :height="image.thumbnailHeight"
      >
    </div>
    <slot name='prepand'/>

    <silentbox-overlay
      :overlay-item="overlay.item"
      :visible="overlay.visible"
      :total-items="overlay.totalItems"
      @closeSilentboxOverlay="hideOverlay"
      @requestNextSilentBoxItem="showNextItem"
      @requestPreviousSilentBoxItem="showPreviousItem"
    />
  </section>
</template>

<script>
import overlay from './overlay.vue'
import itemMixin from './../mixins/item'

export default {
  name: 'silentboxGallery',
  mixins: [itemMixin],
  props: {
    gallery: {
      type: Array,
      default: () => {
        return []
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
        }
      }
    }
  },
  components: {
    'silentbox-overlay': overlay
  },
  mounted () {
    // Listen to key events.
    window.addEventListener('keyup', (event) => {
      // Escape: 27
      if (event.which === 27) {
        this.hideOverlay()
      }
      // Right arrow: 39
      if (event.which === 39) {
        this.showNextItem()
      }
      // Left arrow: 37
      if (event.which === 37) {
        this.showPreviousItem()
      }
    })
  },
  data () {
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
    }
  },
  computed: {
    galleryItems () {
      if (this.gallery.length > 0) {
        return this.gallery.map(item => {
          return {
            ...this.overlay.item,
            ...item,
            thumbnail: this.setThumbnail(item),
            autoplay: this.setAutoplay(item)
          }
        })
      } else {
        return [{
          ...this.overlay.item,
          ...this.image,
          thumbnail: this.setThumbnail(this.image)
        }]
      }
    }
  },
  methods: {
    openOverlay (image, index) {
      this.overlay.visible = true
      this.overlay.item = image
      this.overlay.currentItem = index
      this.$emit('silentbox-overlay-opened')
    },
    hideOverlay () {
      this.overlay.visible = false
      this.$emit('silentbox-overlay-hidden')
    },
    showNextItem () {
      let newItemIndex = this.overlay.currentItem + 1
      newItemIndex = newItemIndex <= this.galleryItems.length - 1
        ? newItemIndex : 0

      this.overlay.item = this.galleryItems[newItemIndex]
      this.overlay.currentItem = newItemIndex
      this.$emit('silentbox-overlay-next-item-displayed')
    },
    showPreviousItem () {
      let newItemIndex = this.overlay.currentItem - 1
      newItemIndex = newItemIndex > -1
        ? newItemIndex : this.galleryItems.length - 1

      this.overlay.item = this.galleryItems[newItemIndex]
      this.overlay.currentItem = newItemIndex
      this.$emit('silentbox-overlay-previous-item-displayed')
    },
    setAutoplay (item) {
      return item.autoplay ? 'autoplay' : ''
    },
    setThumbnail (item) {
      if (this.isEmbedVideo(item.src) && item.thumbnail === undefined) {
        return this.getThumbnail(item.src)
      }

      return item.thumbnail || item.src
    }
  }
}
</script>

<style lang="scss">
  .silentbox-item {
      cursor: pointer;
      display: inline-block;
      text-decoration: underline;
  }
</style>
