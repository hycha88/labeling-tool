class Layer {
  constructor(source, options) {
    options = options || {}
    this.canvas = document.createElement('canvas')
    this.canvas.width = options.width || this.canvas.width
    this.canvas.height = options.height || this.canvas.height
    if (source) {
      if (typeof source === 'string' || (typeof source === 'object' && source.nodeName === 'IMG'))
        this.load(source, options)
      else if (typeof source === 'object' && (source.nodeName === 'CANVAS' || source instanceof ImageData))
        this.fromCanvas(source, options)
    }
  }

  load(options) {
    options = options || {}
    if (typeof options === 'function') options = { onload: options }
    var image,
      layer = this
    this.canvas.width = options.width || this.canvas.width
    this.canvas.height = options.height || this.canvas.height
    if (typeof source === 'string') {
      image = new Image()
      image.src = source
    } else image = source
    image.onload = function() {
      layer._onImageLoad(image, options)
    }
    if (typeof options.onerror === 'function') image.onerror = options.onerror.call(this)
    return this
  }

  fromCanvas(source, options) {
    options = options || {}
    if (typeof options === 'function') options = { onload: options }
    this.canvas.width = source.width
    this.canvas.height = source.height
    var context = this.canvas.getContext('2d')
    this._setImageSmoothing(context, options)
    if (source instanceof ImageData) context.putImageData(source, 0, 0)
    else context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height)
    this.imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height)
    if (typeof options.onload === 'function') options.onload.call(this)
    return this
  }
}
export default Layer
