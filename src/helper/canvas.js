import { fabric } from 'fabric'

class Canvas {
  constructor(id) {
    this.canvas = new fabric.Canvas(id)
    this.initEvent()
    this.superpixelData = null
  }
  initEvent() {
    this.canvas.on('mouse:down', this.onMouseDown.bind(this))
    this.canvas.on('mouse:up', this.onMouseUp.bind(this))
    this.canvas.on('mouse:move', this.onMouseMove.bind(this))
  }

  setSuperpixels(pixels) {
    this.superpixelData = pixels
  }

  onMouseDown(event) {
    console.log('on mouse down', event)
  }
  onMouseUp(event) {
    console.log('on mouse up', event)
    // this.updateIfActive(event)
  }
  onMouseMove(event) {
    console.log('on mouse move', event)
    // this.updateIfActive(event)
  }

  updateIfActive(event) {
    console.log('update if active', event)
    // const result = this.getClickOffset(event.e)
    // const data = document.getElementById('canvas2')
    // const superpixelData = data.getContext('2d').getImageData(0, 0, data.width, data.height)
    console.log('get super pixel data', this.superpixelData)
    // // const annotationData = annotator.layers.annotation.imageData.data
    // const superpixelIndex = this.getEncodedLabel(superpixelData, offset)
    // console.log('get result', result)
    // console.log('print super', superpixelIndex)
  }

  getClickOffset = function(event) {
    var pos = this.getClickPos(event),
      x = pos[0],
      y = pos[1]
    return 4 * (y * this.canvas.width + x)
  }

  getClickPos = function(event) {
    const container = document.getElementsByClassName('canvas-wrapper')[0]
    console.log('get containter', container)
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
