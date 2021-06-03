class compact {
  constructor() {}

  createImageData(width, height) {
    var context = document.createElement('canvas').getContext('2d')
    return context.createImageData(width, height)
  }
}
export default compact
