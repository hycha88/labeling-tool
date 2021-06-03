<template>
  <div>
    <h1>segmentation</h1>
    <canvas id="canvas" class="segment-annotator-layer"></canvas>
    <canvas id="canvas2" class="segment-annotator-layer"></canvas>
    <canvas id="canvas3" class="segment-annotator-layer"></canvas>
  </div>
</template>

<script>
import segmentation from '../image/segmentation'
import sky from '../assets/sky.jpg'
// import person from '../assets/2.jpg'
export default {
  name: 'Task',

  mounted() {
    const canvas = document.getElementById('canvas')
    canvas.width = 590
    canvas.height = 396
    const ctx = canvas.getContext('2d')
    this.drawCanvas(ctx)
  },
  methods: {
    drawCanvas(ctx) {
      const img = new Image()
      img.src = sky
      const _this = this
      img.onload = function() {
        ctx.drawImage(img, 0, 0, 590, 396)
        _this.resetSuperpixels()
      }
    },
    resetSuperpixels(options) {
      options = options || { method: 'slic', regionSize: 25 }
      const canvas = document.getElementById('canvas')
      const ctx = canvas.getContext('2d')
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      // console.log(ctx)
      const seg = new segmentation()
      const _segmentation = seg.create(imageData, options)
      console.log(_segmentation.result.data)
      imageData.data.set(_segmentation.result.data)
      const canvas2 = document.getElementById('canvas2')
      canvas2.width = 590
      canvas2.height = 396
      const ctx2 = canvas2.getContext('2d')
      ctx2.putImageData(imageData, 0, 0)
      this.updateBoundary()
      // visualiztion data
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
      const canvas3 = document.getElementById('canvas3')
      canvas3.width = 590
      canvas3.height = 396
      const ctx = canvas3.getContext('2d')

      const canvas2 = document.getElementById('canvas2')
      const imageData = canvas2.getContext('2d').getImageData(0, 0, canvas2.width, canvas2.height)
      ctx.putImageData(imageData, 0, 0)

      // computeEdgemap

      const canvas3Image = ctx.getImageData(0, 0, canvas3.width, canvas3.height)

      const boundaryColor = [255, 255, 255]
      const boundaryAlpha = 127
      this.computeEdgemap(
        {
          foreground: boundaryColor.concat(boundaryAlpha),
          background: boundaryColor.concat(0)
        },
        canvas3Image
      )
      // render

      const ctx3 = canvas3.getContext('2d')
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.segment-annotator-layer {
  left: 0;
  position: absolute;
  top: 0;
  cursor: pointer;
}
</style>
