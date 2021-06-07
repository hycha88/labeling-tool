<template>
  <div>
    <h1>segmentation</h1>
    <div class="segment-annotator-outer-container">
      <div class="segment-annotator-inner-container">
        <canvas id="image" class="segment-annotator-layer"></canvas>
        <canvas id="superpixel" class="segment-annotator-layer"></canvas>
        <canvas id="visualization" class="segment-annotator-layer"></canvas>
        <canvas id="boundary" class="segment-annotator-layer"></canvas>
        <canvas id="annotation" class="segment-annotator-layer"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import segmentation from '../image/segmentation'
import person from '../assets/2.png'
import SegmentAnnotator from '../helper/segment-annotator'
export default {
  name: 'Task',
  data() {
    return {
      canvas1: '',
      canvas2: '',
      canvas3: '',
      layers: '',
      annotator: '',
      canvas: '',
      segmentation: null
    }
  },
  async mounted() {
    this.annotator = new SegmentAnnotator()

    this.layers = this.annotator.layers
    this.canvas1 = this.layers.image.canvas
    await this.loadImage()
    this.resetSuperpixels()
  },
  methods: {
    loadImage() {
      return new Promise(resolve => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.src = person + '?crossOrigin'
        // const _this = this

        image.onload = () => {
          this.annotator.layers.image.onImageLoad(image)
          // initail layer
          this.annotator.initialLayer()
          // initial visualization
          this.annotator.initializeAnnotationLayer()
          this.annotator.initializeVisualizationLayer()

          resolve(true)
        }
      })
    },
    // loadBackgroundImages() {
    //   return new Promise(resolve => {
    //     const image = new Image()
    //     image.src = person
    //     const _this = this
    //     image.onload = () => {
    //       _this.canvas1.setBackgroundImage(
    //         image.src,
    //         () => {
    //           _this.canvas1.requestRenderAll()
    //         },
    //         {
    //           originX: 'left',
    //           originY: 'top',
    //           width: _this.canvas1.width,
    //           height: _this.canvas1.height
    //         }
    //       )
    //       resolve(true)
    //     }
    //   })
    // },
    resetSuperpixels(options) {
      options = options || { method: 'slic', regionSize: 25 }
      this.layers.superpixel.copy(this.layers.image)
      const seg = new segmentation()
      this.segmentation = seg.create(this.layers.image.imageData, options)
      this.updateSuperpixels()
    },

    updateSuperpixels() {
      let imageData = this.layers.superpixel.imageData
      imageData.data.set(this.segmentation.result.data)
      this.canvas2 = this.layers.superpixel.canvas
      const ctx2 = this.canvas2.getContext('2d')
      ctx2.putImageData(imageData, 0, 0)
      this.annotator.createPixelIndex(this.segmentation.result.numSegments)
      this.updateBoundary()
      const data = this.setAlpha(0, imageData)
      ctx2.putImageData(data, 0, 0)
    },
    setAlpha(alpha, imageData) {
      var data = imageData.data
      for (var i = 3; i < data.length; i += 4) {
        data[i] = alpha
      }
      return new ImageData(data, imageData.width, imageData.height)
    },
    updateBoundary() {
      this.canvas3 = this.layers.boundary.canvas
      this.canvas3.width = this.canvas1.width
      this.canvas3.height = this.canvas1.height
      const ctx = this.canvas3.getContext('2d')
      const imageData = this.canvas2.getContext('2d').getImageData(0, 0, this.canvas2.width, this.canvas2.height)
      ctx.putImageData(imageData, 0, 0)

      // computeEdgemap
      const canvas3Image = ctx.getImageData(0, 0, this.canvas3.width, this.canvas3.height)
      const boundaryColor = [255, 255, 255]
      const boundaryAlpha = 127
      this.computeEdgemap(
        {
          foreground: boundaryColor.concat(boundaryAlpha),
          background: boundaryColor.concat(0)
        },
        canvas3Image
      )
      // // render
      const ctx3 = this.canvas3.getContext('2d')
      ctx3.putImageData(canvas3Image, 0, 0)
      this.layers.boundary.setImageData(canvas3Image)
    },
    computeEdgemap(options, imageData) {
      if (typeof options === 'undefined') options = {}
      var data = imageData.data,
        width = imageData.width,
        height = imageData.height,
        edgeMap = new Uint8Array(imageData.data),
        foreground = options.foreground || [255, 255, 255],
        background = options.background || [0, 0, 0],
        i,
        j,
        k
      for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {
          var offset = 4 * (i * width + j),
            index = data[4 * (i * width + j)],
            isBoundary =
              i === 0 ||
              j === 0 ||
              i === height - 1 ||
              j === width - 1 ||
              index !== data[4 * (i * width + j - 1)] ||
              index !== data[4 * (i * width + j + 1)] ||
              index !== data[4 * ((i - 1) * width + j)] ||
              index !== data[4 * ((i + 1) * width + j)]
          if (isBoundary) {
            for (k = 0; k < foreground.length; ++k) edgeMap[offset + k] = foreground[k]
          } else {
            for (k = 0; k < background.length; ++k) edgeMap[offset + k] = background[k]
          }
        }
      }
      data.set(edgeMap)
    }
  }
}
</script>
<style scoped>
.segment-annotator-layer {
  left: 0;
  position: absolute;
  top: 0;
  cursor: pointer;
}
</style>
