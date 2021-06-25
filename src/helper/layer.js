import Canvas from './canvas'
class Layer {
  constructor(id, options) {
    this.canvas = new Canvas(id, options).canvas
    this.imageData = null
  }

  setImageData(data) {
    this.imageData = data
  }

  onImageLoad(image) {
    return new Promise(resolve => {
      // this.canvas.width = image.width
      // this.canvas.height = image.height
      const context = this.canvas.getContext('2d')

      context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height)
      this.imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
      resolve(true)
    })
  }
  copy(source) {
    source.render()
    this.fromCanvas(source.canvas)
    return this
  }

  fromCanvas(source, options) {
    options = options || {}
    if (typeof options === 'function') options = { onload: options }
    this.canvas.width = source.width
    this.canvas.height = source.height
    var context = this.canvas.getContext('2d')

    if (source instanceof ImageData) context.putImageData(source, 0, 0)
    else context.drawImage(source.getElement(), 0, 0, this.canvas.width, this.canvas.height)
    this.imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    return this
  }

  resize(width, height) {
    let temporaryCanvas = document.createElement('canvas')
    const tempoaryContext = temporaryCanvas.getContext('2d')
    temporaryCanvas.width = width
    temporaryCanvas.height = height

    tempoaryContext.drawImage(this.canvas.getElement(), 0, 0, width, height)
    this.canvas.width = width
    this.canvas.height = height

    const context = this.canvas.getContext('2d')
    context.drawImage(temporaryCanvas, 0, 0)
    this.imageData = context.getImageData(0, 0, width, height)
    return this
  }
  render() {
    if (this.imageData) this.canvas.getContext('2d').putImageData(this.imageData, 0, 0)
    return this
  }
  fill = function(rgba, imageData) {
    var data = imageData.data
    for (var i = 0; i < data.length; i += 4) for (var j = 0; j < rgba.length; ++j) data[i + j] = rgba[j]
    return this
  }
}

export default Layer
