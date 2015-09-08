var BrowserTab = React.createClass({
  render: function () {
    var title = this.props.page.title || 'loading'
    return <div className={this.props.isActive ? 'active' : ''} title={title} onClick={this.props.onClick} onContextMenu={this.props.onContextMenu}>
      <span>
        {title}
        {this.props.page.isLoading ? <i className="fa fa-spinner fa-pulse" /> : undefined}
      </span>
      <a onClick={this.props.onClose}><i className="fa fa-close" /></a>
    </div>
  }
})

var BrowserTabs = React.createClass({
  render: function () {
    var self = this
    return <div id="browser-tabs">
      <a className="close" onClick={this.props.onClose}><i className="fa fa-circle" /></a>
      <a className="minimize" onClick={this.props.onMinimize}><i className="fa fa-circle" /></a>
      <a className="maximize" onClick={this.props.onMaximize}><i className="fa fa-circle" /></a>
      {this.props.pages.map(function (page, i) {
        if (!page)
          return
        
        function onClick (e) { self.props.onTabClick(e, page, i) }
        function onContextMenu (e) { self.props.onTabContextMenu(e, page, i) }
        function onClose (e) { e.preventDefault(); e.stopPropagation(); self.props.onTabClose(e, page, i) }
        return <BrowserTab key={'browser-tab-'+i} isActive={self.props.currentPageIndex == i} page={page} onClick={onClick} onContextMenu={onContextMenu} onClose={onClose} />
      })}
      <a className="newtab" onClick={this.props.onNewTab}><i className="fa fa-plus" /></a>
    </div>
  }  
})