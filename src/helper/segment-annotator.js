import Layer from './layer'
import segmentation from '../image/segmentation'

class SegmentAnnotator {
  constructor(options) {
    this.colormap = (options && options.colormap) || [
      [255, 255, 255],
      [255, 0, 0]
    ]
    this.boundaryColor = (options && options.boundaryColor) || [255, 255, 255]
    this.boundaryAlpha = (options && options.boundaryAlpha) || 127
    this.visualizationAlpha = (options && options.visualizationAlpha) || 144
    this.highlightAlpha = (options && options.highlightAlpha) || Math.min(255, this.visualizationAlpha + 128)
    this.createLayers(options)
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

  // Run superpixel segmentation.
  resetSuperpixels = function(options) {
    options = options || {}
    this.layers.superpixel.copy(this.layers.image)
    this.segmentation = segmentation.create(this.layers.image.imageData, options)
    this.updateSuperpixels(options)
    return this
  }

  createPixelIndex = function(numSegments) {
    var pixelIndex = new Array(numSegments),
      data = this.layers.superpixel.imageData.data,
      i
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
    this.initializeEvents()
    this.resetSuperpixels(options.superpixelOptions)
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
}
export default SegmentAnnotator
