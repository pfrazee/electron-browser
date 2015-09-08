var ipc = require('ipc')

function triggerMenu (data) {
  ipc.sendToHost('contextmenu-data', data)
}

ipc.on('get-contextmenu-data', function (pos) {
  var data = {
    x: pos.x,
    y: pos.y,
    hasSelection: !!window.getSelection.toString(),
    href: false,
    img: false,
    video: false
  }

  var el = document.elementFromPoint(pos.x, pos.y)
  while (el && el.tagName) {
    if (!data.img && el.tagName == 'IMG')
      data.img = el.src
    if (!data.href && el.href)
      data.href = el.href
    el = el.parentNode
  }

  triggerMenu(data)
})