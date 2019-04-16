module.exports = {
  lintOnSave: true,
  configureWebpack: {
    node: {
      process: 'mock'
    }
  }
}
