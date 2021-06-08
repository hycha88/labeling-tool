import Layer from './layer'

class SegmentAnnotator {
  constructor(options) {
    this.colormap = (options && options.colormap) || [
      [255, 255, 255],
      [255, 0, 0],
      [128, 0, 255],
      [64, 32, 32]
    ]
    this.boundaryColor = (options && options.boundaryColor) || [255, 255, 255]
    this.boundaryAlpha = (options && options.boundaryAlpha) || 127
    this.visualizationAlpha = (options && options.visualizationAlpha) || 144
    this.highlightAlpha = (options && options.highlightAlpha) || Math.min(255, this.visualizationAlpha + 128)

    this.mousestate = { down: false, button: 0 }
    this.defaultLabel = (options && options.defaultLabel) || 0
    this.createLayers(options)
    this.initialize(options)
  }

  createLayers = function(options) {
    this.layers = {
      image: new Layer('image', options),
      superpixel: new Layer('superpixel', options),
      visualization: new Layer('visualization', options),
      boundary: new Layer('boundary', options),
      annotation: new Layer('annotation', options)
    }
  }

  createPixelIndex = function(numSegments) {
    const pixelIndex = new Array(numSegments)
    const data = this.layers.superpixel.imageData.data
    let i
    for (i = 0; i < numSegments; ++i) pixelIndex[i] = []
    for (i = 0; i < data.length; i += 4) {
      var index = data[i] | (data[i + 1] << 8) | (data[i + 2] << 16)
      pixelIndex[index].push(i)
    }
    this.currentPixels = null
    this.pixelIndex = pixelIndex
  }
  initialize = function(options) {
    options = options || {}
    this.initializeEvents(options)
  }

  initializeEvents(options) {
    console.log(options)
    // const canvas = this.layers.annotation.canvas
    // canvas.addEventListener('mousedown', () => {
    //   this.mousestate.down = true
    // })

    // canvas.addEventListener('mousemove', event => {
    //   this.updateIfActive(event)
    // })

    // canvas.addEventListener('mouseup', event => {
    //   this.updateIfActive(event)
    // })
    // canvas.addEventListener('mouseleave', () => {
    //   this.updateHighlight(null)
    // })
    // const _this = this
    // window.addEventListener('mouseup', function() {
    //   _this.mousestate.down = false
    // })
  }

  initialLayer() {
    this.width = this.layers.image.canvas.width
    this.height = this.layers.image.canvas.height
    for (let key in this.layers) {
      if (key !== 'image') {
        const canvas = this.layers[key].canvas
        canvas.width = this.width
        canvas.height = this.height
      }
    }
    this.container = document.querySelector('.segment-annotator-outer-container')
    this.innerContainer = document.querySelector('.segment-annotator-inner-container')

    this.innerContainer.style.position = 'absolute'
    this.container.style.position = 'absolute'
    this.innerContainer.style.left = 0
    this.innerContainer.style.top = 0
    this.container.style.left = 0
    this.container.style.top = 0
    this.innerContainer.style.width = this.width + 'px'
    this.innerContainer.style.height = this.height + 'px'
    this.container.style.width = this.width + 'px'
    this.container.style.height = this.height + 'px'
  }

  initializeAnnotationLayer() {
    const layer = this.layers.annotation
    layer.resize(this.width, this.height)
    this.currentLabel = this.defaultLabel

    layer.fill([this.defaultLabel, 0, 0, 0], layer.imageData)
    layer.render()
  }

  initializeVisualizationLayer() {
    const layer = this.layers.visualization
    layer.resize(this.width, this.height)
    const initialColor = this.colormap[this.defaultLabel].concat([this.visualizationAlpha])
    layer.fill(initialColor, layer.imageData)
    layer.render()
  }

  updateSuperpixels = function() {
    var annotator = this
    this.layers.superpixel.process(function(imageData) {
      imageData.data.set(annotator.segmentation.result.data)
      annotator._createPixelIndex(annotator.segmentation.result.numSegments)
      annotator._updateBoundaryLayer()
      this.setAlpha(0).render()
    })
  }

  updateIfActive(event) {
    const offset = this.getClickOffset(event)
    const superpixelData = this.layers.superpixel.imageData.data
    const superpixelIndex = this.getEncodedLabel(superpixelData, offset)
    const pixels = this.pixelIndex[superpixelIndex]

    this.updateHighlight(pixels)
    if (this.mousestate.down) {
      this.updateAnnotation(pixels, this.currentLabel)
    }
  }

  // Update label.
  updateAnnotation(pixels, labels) {
    var updates
    labels = 2
    labels = typeof labels === 'object' ? labels : this.fillArray(new Int32Array(pixels.length), labels)
    updates = this.getDifferentialUpdates(pixels, labels)
    if (updates.pixels.length === 0) return this
    // this._updateHistory(updates)
    this.fillPixels(updates.pixels, updates.next)
    this.layers.visualization.render()
    if (typeof this.onchange === 'function') this.onchange.call(this)
    return this
  }

  fillPixels = function(pixels, labels) {
    if (pixels.length !== labels.length) throw 'Invalid fill: ' + pixels.length + ' !== ' + labels.length
    const annotationData = this.layers.annotation.imageData.data
    const visualizationData = this.layers.visualization.imageData.data

    for (var i = 0; i < pixels.length; ++i) {
      const offset = pixels[i]
      const label = labels[i]
      const color = this.colormap[label]
      this.setEncodedLabel(annotationData, offset, label)
      visualizationData[offset + 0] = color[0]
      visualizationData[offset + 1] = color[1]
      visualizationData[offset + 2] = color[2]
    }
  }

  // Get the differential update of labels.
  getDifferentialUpdates = function(pixels, labels) {
    if (pixels.length !== labels.length) throw 'Invalid labels'
    var annotationData = this.layers.annotation.imageData.data,
      updates = { pixels: [], prev: [], next: [] }
    for (var i = 0; i < pixels.length; ++i) {
      var label = this.getEncodedLabel(annotationData, pixels[i])
      if (label !== labels[i]) {
        updates.pixels.push(pixels[i])
        updates.prev.push(label)
        updates.next.push(labels[i])
      }
    }
    return updates
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
    // if (typeof this.onhighlight === 'function') this.onhighlight.call(this)
  }
  getClickOffset = function(event) {
    const pos = this.getClickPos(event)
    const x = pos[0]
    const y = pos[1]

    return 4 * (y * this.layers.visualization.canvas.width + x)
  }

  getClickPos = function(event) {
    const container = document.querySelector('.segment-annotator-outer-container')
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
    x = Math.max(Math.min(x, this.layers.visualization.canvas.width - 1), 0)
    y = Math.max(Math.min(y, this.layers.visualization.canvas.height - 1), 0)
    return [x, y]
  }

  fillArray(array, value) {
    for (var i = 0; i < array.length; ++i) array[i] = value
    return array
  }
  getEncodedLabel(array, offset) {
    return array[offset] | (array[offset + 1] << 8) | (array[offset + 2] << 16)
  }
  setEncodedLabel(array, offset, label) {
    array[offset + 0] = label & 255
    array[offset + 1] = (label >>> 8) & 255
    array[offset + 2] = (label >>> 16) & 255
    array[offset + 3] = 255
  }
}
export default SegmentAnnotator
