export default class DragAndDropManager {
  constructor() {
    this.dropArea = document.getElementById('drop-area')
    this.onDropHandler = () => {}
  }

  initialize({ onDropHandler }) {
    this.onDropHandler = onDropHandler
    
    this.disableDragNDropNativeEvents()
    this.enableHighlightOnDrag()
    this.enableDrop()
  }

  disableDragNDropNativeEvents() {
    const events = [
      'dragenter',
      'dragover',
      'dragleave',
      'drop'
    ]

    const preventDefaultBehavior = evt => {
      evt.preventDefault()
      evt.stopPropagation()
    }

    events.forEach(eventName => {
      this.dropArea.addEventListener(
        eventName,
        preventDefaultBehavior,
        false
      )
      
      document.body.addEventListener(
        eventName,
        preventDefaultBehavior,
        false
      )
    })
  }

  enableHighlightOnDrag() {
    const dragEvents = [
      'dragenter',
      'dragover'
    ]

    const highlight = evt => {
      this.dropArea.classList.add('highlight')
      this.dropArea.classList.add('drop-area')
    }

    dragEvents.forEach(eventName => {
      this.dropArea.addEventListener(eventName, highlight, false)
    })
  }

  enableDrop() {
    const drop = evt => {
      this.dropArea.classList.remove('drop-area')

      const files = evt.dataTransfer.files
      return this.onDropHandler(files)
    }

    this.dropArea.addEventListener('drop', drop, false)
  }
}