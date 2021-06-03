import compact from './compact'

class Base {
  constructor(imageData) {
    if (!(imageData instanceof ImageData)) throw 'Invalid ImageData'
    this.imageData = compact.createImageData(imageData.width, imageData.height)
    this.imageData.data.set(imageData.data)
  }
}
export default Base
