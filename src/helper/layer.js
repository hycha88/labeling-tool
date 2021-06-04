import Canvas from './canvas'

class Layer {
  constructor(id, options) {
    this.canvas = new Canvas(id, options)
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
    else context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height)
    this.imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    return this
  }
  render() {}
}

export default Layer
