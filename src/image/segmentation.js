import slic from './segmentation/slic'
class Segmentation {
  constructor() {
    this.id = 0
    this.methods = {
      slic: slic
    }
  }
  create(imageData, options) {
    return new slic(imageData, options)
  }
}
export default Segmentation
