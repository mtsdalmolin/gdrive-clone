import AppController from "./src/AppController.js";
import ConnectionManager from "./src/ConnectionManager.js";
import DragAndDropManager from "./src/DragAndDropManager.js";
import ViewManager from "./src/ViewManager.js";

const API_URL = 'https://localhost:3000'

const connectionManager = new ConnectionManager({
  apiURL: API_URL
})

const viewManager = new ViewManager()

const dragAndDropManager = new DragAndDropManager()

const appController = new AppController({
  connectionManager,
  dragAndDropManager,
  viewManager
})

try {
  await appController.initialize()
} catch(err) {
  console.error('error on initializing app', err)
}