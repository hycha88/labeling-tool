import { fabric } from 'fabric'
class Canvas {
  constructor(id, options) {
    this.canvas = new fabric.Canvas(id, options)
    // if (id === 'image') {
    //   this.initEvent(this.canvas)
    // }
    this.superpixelData = null
    this.mousestate = { down: false, button: 0 }
    // constants
    this.CONSTANT = {
      RECT_STROKE: '#3dea3d',
      POLYGON_STROKE: '#1aebff',
      POINT_STROKE: '#333',

      POINT_STROKE_WIDTH: 0.5,

      RECT_FILL: '#0000',
      POLYGON_FILL: '#fff2',
      POINT_FILL: '#f2f2f2'
    }
  }
  initEvent(canvas) {
    if (canvas) {
      canvas.on('mouse:down', this.onMouseDown.bind(this))
      canvas.on('mouse:up', this.onMouseUp.bind(this))
      canvas.on('mouse:move', this.onMouseMove.bind(this))
      canvas.on('mouse:out', this.onMouseOut.bind(this))
      canvas.on('mouse:wheel', this.wheelHandler.bind(this))
    }
    this.canvas.hoverCursor = 'default'
  }

  onMouseDown() {
    this.mousestate.down = true
  }
  onMouseUp(event) {
    this.updateIfActive(event)
  }
  onMouseMove(event) {
    this.updateIfActive(event)
  }
  onMouseOut(event) {
    console.log('on mouse out', event)
  }

  updateIfActive(event) {
    console.log('update if active', event)
  }
  wheelHandler(opt) {
    const e = opt.e
    // zoom
    const zoom_max = this.CONSTANT.ZOOM_MAX
    const zoom_min = this.CONSTANT.ZOOM_MIN
    const delta = e.deltaY
    let zoom = this.canvas.getZoom()

    zoom *= 0.999 ** delta
    if (zoom > zoom_max) zoom = zoom_max
    if (zoom < zoom_min) zoom = zoom_min

    this.canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom)

    e.preventDefault()
    e.stopPropagation()
  }

  updateHighlight(pixels) {
    const visualizationData = this.layers.visualization.imageData.data
    const boundaryData = this.layers.boundary.imageData.data
    const annotationData = this.layers.annotation.imageData.data
    let i = 0
    let color = ''
    let offset = 0
    if (this.currentPixels !== null) {
      for (i = 0; i < this.currentPixels.length; ++i) {
        offset = this.currentPixels[i]
        color = this.colormap[this.getEncodedLabel(annotationData, offset)]
        visualizationData[offset + 0] = color[0]
        visualizationData[offset + 1] = color[1]
        visualizationData[offset + 2] = color[2]
        visualizationData[offset + 3] = this.visualizationAlpha
      }
    }
    this.currentPixels = pixels
    if (this.currentPixels !== null) {
      for (i = 0; i < pixels.length; ++i) {
        offset = pixels[i]
        if (boundaryData[offset + 3]) {
          visualizationData[offset + 0] = this.boundaryColor[0]
          visualizationData[offset + 1] = this.boundaryColor[1]
          visualizationData[offset + 2] = this.boundaryColor[2]
          visualizationData[offset + 3] = this.highlightAlpha
        } else {
          visualizationData[offset + 3] = this.highlightAlpha
        }
      }
    }
    this.layers.visualization.render()
    this.layers.boundary.render()
    if (typeof this.onhighlight === 'function') this.onhighlight.call(this)
  }

  getClickOffset = function(event) {
    var pos = this.getClickPos(event),
      x = pos[0],
      y = pos[1]
    return 4 * (y * this.canvas.width + x)
  }

  getClickPos = function(event) {
    const container = document.getElementsByClassName('canvas-wrapper')[0]
    const containerRect = container.getBoundingClientRect()
    const offsetLeft =
      containerRect.left +
      (window.pageXOffset || document.documentElement.scrollLeft) -
      (document.documentElement.clientLeft || 0)
    const offsetTop =
      containerRect.top +
      (window.pageYOffset || document.documentElement.scrollTop) -
      (document.documentElement.clientTop || 0)
    let x = Math.round(
      (event.pageX - offsetLeft + container.scrollLeft) * (container.offsetWidth / container.scrollWidth)
    )
    let y = Math.round(
      (event.pageY - offsetTop + container.scrollTop) * (container.offsetHeight / container.scrollHeight)
    )
    x = Math.max(Math.min(x, this.canvas.width - 1), 0)
    y = Math.max(Math.min(y, this.canvas.height - 1), 0)
    return [x, y]
  }
  getEncodedLabel(array, offset) {
    return array[offset] | (array[offset + 1] << 8) | (array[offset + 2] << 16)
  }
}

export default Canvas
