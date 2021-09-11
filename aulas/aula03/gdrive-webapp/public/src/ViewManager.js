export default class ViewManager {
  constructor() {
    this.tbody = document.getElementById('tbody')
    this.newFileBtn = document.getElementById('new-file-btn')
    this.fileElem = document.getElementById('file-elem')
    this.progressModal = document.getElementById('progress-modal')
    this.progressBar = document.getElementById('progress-bar')
    this.statusOutput = document.getElementById('output')
    this.modalInstance = {}

    this.dateFormatter = new Intl.DateTimeFormat('pt', {
      locale: 'pt-br',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  configureModal() {
    this.modalInstance = M.Modal.init(this.progressModal, {
      opacity: 0,
      dismissable: false,
      // this frees screens for you to click while modal is open
      onOpenEnd() {
        this.$overlay[0].remove()
      }
    })
  }

  openModal() {
    this.modalInstance.open()
  }
  
  closeModal() {
    this.modalInstance.close()
  }

  updateUploadStatus(size) {
    this.statusOutput.innerHTML = `Uploading in <b>${Math.floor(size)}%</b>...`
    this.progressBar.value = size
  }

  configureOnFileChange(fn) {
    this.fileElem.onchange = evt => fn(evt.target.files)
  }

  configureFileUploadBtnClick() {
    this.newFileBtn.onclick = () => this.fileElem.click()
  }

  getIcon(file) {
    return file.match(/\.mp4/i)
      ? 'movie'
      : (
        file.match(/\.jp(e?)g|png/i)
          ? 'image'
          : 'content_copy'
      )
  }

  makeIcon(file) {
    const icon = this.getIcon(file)
    const colors = {
      image: 'yellow600',
      movie: 'red600',
      content_copy: ''
    }

    return `
      <i class="material-icons ${colors[icon]} left">${icon}</i>
    `
  }

  updateCurrentFiles(files) {
    const template = item => `
      <tr>
        <td>${this.makeIcon(item.file)} ${item.file}</td>
        <td>${item.owner}</td>
        <td>${this.dateFormatter.format(new Date(item.lastModified))}</td>
        <td>${item.size}</td>
      </tr>
    `

    this.tbody.innerHTML = files.map(template).join('')
  }
}