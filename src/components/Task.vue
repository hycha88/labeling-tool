<template>
  <div>
    <h1>segmentation</h1>
    <div class="canvas-wrapper">
      <canvas id="canvas1" class="segment-annotator-layer"></canvas>
    </div>
    <div class="canvas-wrapper">
      <canvas id="canvas2" class="segment-annotator-layer"></canvas>
    </div>
    <div class="canvas-wrapper">
      <canvas id="canvas3" class="segment-annotator-layer"></canvas>
    </div>
  </div>
</template>

<script>
import segmentation from '../image/segmentation'
import person from '../assets/2.jpg'
// import { fabric } from 'fabric'
import Canvas from '../helper/canvas'
export default {
  name: 'Task',
  data() {
    return {
      canvas1: '',
      canvas2: '',
      canvas3: ''
    }
  },
  async mounted() {
    // this.canvas1 = new fabric.Canvas('canvas1', {
    //   width: 590,
    //   height: 396,
    //   top: 0,
    //   left: 0
    // })
    this.canvas1 = new Canvas('canvas1', {
      width: 590,
      height: 396,
      top: 0,
      left: 0
    }).canvas
    const ctx = this.canvas1.getContext('2d')
    await this.loadImage(ctx)
    this.resetSuperpixels()
  },
  methods: {
    loadImage(ctx) {
      return new Promise(resolve => {
        const image = new Image()
        image.src = person
        const _this = this
        image.onload = () => {
          ctx.drawImage(image, 0, 0, _this.canvas1.width, _this.canvas1.height)
          resolve(true)
        }
      })
    },
    resetSuperpixels(options) {
      options = options || { method: 'slic', regionSize: 25 }
      const ctx = this.canvas1.getContext('2d')
      const imageData = ctx.getImageData(0, 0, this.canvas1.width, this.canvas1.height)
      const seg = new segmentation()
      const _segmentation = seg.create(imageData, options)
      imageData.data.set(_segmentation.result.data)

      this.canvas2 = new Canvas('canvas2', {
        width: this.canvas1.width,
        height: this.canvas1.height,
        top: 0,
        left: 0
      }).canvas
      const ctx2 = this.canvas2.getContext('2d')
      ctx2.putImageData(imageData, 0, 0)
      console.log('super pixel data', imageData)
      // this.canvas1.setSuperpixels(imageData)

      this.updateBoundary()
      // // visualiztion data
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
      // this.canvas3 = new fabric.Canvas('canvas3', {
      //   width: this.canvas1.width,
      //   height: this.canvas1.height,
      //   top: 0,
      //   left: 0
      // })
      this.canvas3 = new Canvas('canvas3', {
        width: this.canvas1.width,
        height: this.canvas1.height,
        top: 0,
        left: 0
      }).canvas
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
.canvas-wrapper {
  position: absolute !important;
}
</style>
