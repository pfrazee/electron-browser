const {app, BrowserWindow} = require('electron')

var mainWindow = null

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit()
  }
})

app.on('ready', function () {
  mainWindow = new BrowserWindow({ width: 1030, height: 720, frame: false })
  //mainWindow.webContents.openDevTools();
  mainWindow.loadURL(`file://${__dirname}/browser.html`)
  mainWindow.on('closed', function() {
    mainWindow = null
  })
})
