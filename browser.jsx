'use strict'
var remote = require('remote')
var Menu = remote.require('menu')
var MenuItem = remote.require('menu-item')
var clipboard = require('clipboard')
var urllib = require('url')

function createPageObject (location) {
  return {
    location: location||'https://github.com/pfraze/electron-browser',
    statusText: false,
    title: 'new tab',
    isLoading: false,
    isSearching: false,
    canGoBack: false,
    canGoForward: false,
    canRefresh: false
  }
}

var BrowserChrome = React.createClass({
  getInitialState: function () {
    return {
      pages: [createPageObject()],
      currentPageIndex: 0
    }
  },
  componentWillMount: function () {
    // bind handlers to this object
    for (var k in this.tabHandlers)  this.tabHandlers[k]  = this.tabHandlers[k].bind(this)
    for (var k in this.navHandlers)  this.navHandlers[k]  = this.navHandlers[k].bind(this)
    for (var k in this.pageHandlers) this.pageHandlers[k] = this.pageHandlers[k].bind(this)
  },
  componentDidMount: function () {
    // attach webview events
    for (var k in this.webviewHandlers)
      this.getWebView().addEventListener(k, this.webviewHandlers[k].bind(this))

    // attach keyboard shortcuts
    // :TODO: replace this with menu hotkeys
    var self = this
    document.body.addEventListener('keydown', function (e) {
      if (e.metaKey && e.keyCode == 70) { // cmd+f
        // start search
        self.getPageObject().isSearching = true
        self.setState(self.state)

        // make sure the search input has focus
        self.getPage().getDOMNode().querySelector('#browser-page-search input').focus()
      } else if (e.keyCode == 27) { // esc
        // stop search
        self.getPageObject().isSearching = false
        self.setState(self.state)
      }
    })
  },

  getWebView: function (i) {
    i = (typeof i == 'undefined') ? this.state.currentPageIndex : i
    return this.refs['page-'+i].refs.webview.getDOMNode()
  },
  getPage: function (i) {
    i = (typeof i == 'undefined') ? this.state.currentPageIndex : i
    return this.refs['page-'+i]
  },
  getPageObject: function (i) {
    i = (typeof i == 'undefined') ? this.state.currentPageIndex : i
    return this.state.pages[i]
  },

  createTab: function (location) {
    this.state.pages.push(createPageObject(location))
    this.setState({ pages: this.state.pages, currentPageIndex: this.state.pages.length - 1 })
  },
  closeTab: function (pageIndex) {
    // last tab, full reset
    if (this.state.pages.filter(Boolean).length == 1)
      return this.setState({ pages: [createPageObject()], currentPageIndex: 0 })

    this.state.pages[pageIndex] = null
    this.setState({ pages: this.state.pages })

    // find the nearest adjacent page to make active
    if (this.state.currentPageIndex == pageIndex) {
      for (var i = pageIndex; i >= 0; i--) {
        if (this.state.pages[i])
          return this.setState({ currentPageIndex: i })
      }
      for (var i = pageIndex; i < this.state.pages.length; i++) {
        if (this.state.pages[i])
          return this.setState({ currentPageIndex: i })
      }
    }
  },

  tabContextMenu: function (pageIndex) {
    var self = this
    var menu = new Menu()
    menu.append(new MenuItem({ label: 'New Tab', click: function () { self.createTab() } }))
    menu.append(new MenuItem({ label: 'Duplicate', click: function () { self.createTab(self.getPageObject(pageIndex).location) } }))
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(new MenuItem({ label: 'Close Tab', click: function() { self.closeTab(pageIndex) } }))
    menu.popup(remote.getCurrentWindow())
  },
  locationContextMenu: function (el) {
    var self = this
    var menu = new Menu()
    menu.append(new MenuItem({ label: 'Copy', click: function () {
      clipboard.writeText(el.value)
    }}))
    menu.append(new MenuItem({ label: 'Cut', click: function () {
      clipboard.writeText(el.value.slice(el.selectionStart, el.selectionEnd))
      self.getPageObject().location = el.value.slice(0, el.selectionStart) + el.value.slice(el.selectionEnd)
    }}))
    menu.append(new MenuItem({ label: 'Paste', click: function() {
      var l = el.value.slice(0, el.selectionStart) + clipboard.readText() + el.value.slice(el.selectionEnd)
      self.getPageObject().location = l
    }}))
    menu.append(new MenuItem({ label: 'Paste and Go', click: function() {
      var l = el.value.slice(0, el.selectionStart) + clipboard.readText() + el.value.slice(el.selectionEnd)
      self.getPageObject().location = l
      self.getPage().navigateTo(l)
    }}))
    menu.popup(remote.getCurrentWindow())    
  },
  webviewContextMenu: function (e) {
    var self = this
    var menu = new Menu()
    if (e.href) {
      menu.append(new MenuItem({ label: 'Open Link in New Tab', click: function () { self.createTab(e.href) } }))
      menu.append(new MenuItem({ label: 'Copy Link Address', click: function () { clipboard.writeText(e.href) } }))
    }
    if (e.img) {
      menu.append(new MenuItem({ label: 'Save Image As...', click: function () { alert('todo') } }))
      menu.append(new MenuItem({ label: 'Copy Image URL', click: function () { clipboard.writeText(e.img) } }))
      menu.append(new MenuItem({ label: 'Open Image in New Tab', click: function () { self.createTab(e.img) } }))
    }
    if (e.hasSelection)
      menu.append(new MenuItem({ label: 'Copy', click: function () { self.getWebView().copy() } }))
    menu.append(new MenuItem({ label: 'Select All', click: function () { self.getWebView().selectAll() } }))
    menu.append(new MenuItem({ type: 'separator' }))
    menu.append(new MenuItem({ label: 'Inspect Element', click: function() { self.getWebView().inspectElement(e.x, e.y) } }))
    menu.popup(remote.getCurrentWindow())
  },

  tabHandlers: {
    onNewTab: function () {
      this.createTab()
    },
    onTabClick: function (e, page, pageIndex) {
      this.setState({ currentPageIndex: pageIndex })
    },
    onTabContextMenu: function (e, page, pageIndex) {
      this.tabContextMenu(pageIndex)
    },
    onTabClose: function (e, page, pageIndex) {
      this.closeTab(pageIndex)
    },
    onMaximize: function () {
      if (remote.getCurrentWindow())
        remote.getCurrentWindow().maximize()
      else
        remote.unmaximize()
    },
    onMinimize: function () {
      remote.getCurrentWindow().minimize()
    },
    onClose: function () {
      remote.getCurrentWindow().close()
    }
  },

  navHandlers: {
    onClickHome: function () {
      this.getWebView().goToIndex(0)
    },
    onClickBack: function () {
      this.getWebView().goBack()
    },
    onClickForward: function () {
      this.getWebView().goForward()
    },
    onClickRefresh: function () {
      this.getWebView().reload()
    },
    onClickBundles: function () {
      var location = urllib.parse(this.getWebView().getUrl()).path
      this.getPage().navigateTo('/bundles/view.html#'+location)
    },
    onClickVersions: function () {
      var location = urllib.parse(this.getWebView().getUrl()).path
      this.getPage().navigateTo('/bundles/versions.html#'+location)
    },
    onClickSync: console.log.bind(console, 'sync'),
    onEnterLocation: function (location) {
      this.getPage().navigateTo(location)
    },
    onChangeLocation: function (location) {
      var page = this.getPageObject()
      page.location = location
      this.setState(this.state)      
    },
    onLocationContextMenu: function (e) {
      this.locationContextMenu(e.target)
    }
  },
  pageHandlers: {
    onDidStartLoading: function (e, page) {
      page.isLoading = true
      page.title = false
      this.setState(this.state)
    },
    onDomReady: function (e, page, pageIndex) {
      var webview = this.getWebView(pageIndex)
      page.canGoBack = webview.canGoBack()
      page.canGoForward = webview.canGoForward()
      page.canRefresh = true
      this.setState(this.state)
    },
    onDidStopLoading: function (e, page, pageIndex) {
      // update state
      var webview = this.getWebView(pageIndex)
      page.statusText = false
      page.location = webview.getUrl()
      page.canGoBack = webview.canGoBack()
      page.canGoForward = webview.canGoForward()
      if (!page.title)
        page.title = page.location
      page.isLoading = false
      this.setState(this.state)
    },
    onPageTitleSet: function (e) {
      var page = this.getPageObject()
      page.title = e.title
      page.location = this.getWebView().getUrl()
      this.setState(this.state)
    },
    onContextMenu: function (e, page, pageIndex) {
      this.getWebView(pageIndex).send('get-contextmenu-data', { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })
    },
    onIpcMessage: function (e, page) {
      if (e.channel == 'status') {
        page.statusText = e.args[0]
        this.setState(this.state)
      }
      else if (e.channel == 'contextmenu-data') {
        this.webviewContextMenu(e.args[0])
      }
    }
  },

  render: function() {
    var self = this
    return <div>
      <BrowserTabs ref="tabs" pages={this.state.pages} currentPageIndex={this.state.currentPageIndex} {...this.tabHandlers} />
      <BrowserNavbar ref="navbar" {...this.navHandlers} page={this.state.pages[this.state.currentPageIndex]} />
      {this.state.pages.map(function (page, i) {
        if (!page)
          return
        return <BrowserPage ref={'page-'+i} key={'page-'+i} {...self.pageHandlers} page={page} pageIndex={i} isActive={i == self.state.currentPageIndex} />
      })}
    </div>
  }
})

// render
React.render(
  <BrowserChrome />,
  document.getElementById('browser-chrome')
)