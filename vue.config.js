const { defineConfig } = require('@vue/cli-service')
const { resolve, relative } = require('path')
const { name } = require('./package.json')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const { buildDepConfig, devDepConfig } = require('./src/config')

module.exports = defineConfig({
  publicPath: buildDepConfig.publicPath,
  assetsDir: 'static',
  runtimeCompiler: true,
  productionSourceMap: false,
  devServer: {
    port: devDepConfig.port,
    proxy: devDepConfig.api,
    open: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    client: {
      logging: 'none',
      overlay: {
        errors: true,
        warnings: false
      }
    }
  },
  configureWebpack: {
    plugins: [
      // @apidevtools/json-schema-ref-parser need ,webpack 5 not import Polyfills
      new NodePolyfillPlugin({
        excludeAliases: ['console']
      })
    ],
    resolve: {
      alias: {
        '@': resolve('src'),
        '*': resolve(''),
        Assets: resolve('src/assets')
      }
    },
    output: {
      // 保证子应用的资源路径变为绝对路径，避免子应用的相对资源在变为主应用上的相对资源
      // 因为子应用和主应用在同一个文档流，相对路径是相对于主应用而言的
      library: `micro-app-${name}`,
      libraryTarget: 'umd',
      chunkLoadingGlobal: `webpackJsonp_${name}`
    }
  },
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      /**
       * HtmlWebpackPlugin
       * git doc:https://github.com/jantimon/html-webpack-plugin#options
       */
      args[0].title = buildDepConfig.title
      return args
    })
  },

  css: {
    loaderOptions: {
      scss: {
        additionalData: (content, loaderContext) => {
          // https://webpack.js.org/loaders/sass-loader/#sync
          // !!! @use 'sass:math';
          const { resourcePath, rootContext } = loaderContext
          const relativePath = relative(rootContext, resourcePath)
          if (
            relativePath.includes('@formily') &&
            relativePath.includes('form-item')
          ) {
            return content
          }

          return (
            `@import "~@/assets/scss/mixin/socar-base-mixin.scss";` + content
          )
        }
      }
    }
  }
})
