const config = {
  entry: {
    game: './game.js',
  },
  devServer: {
    disableHostCheck: true,
  },
  output: {
    path: __dirname,
    filename: '[name].dist.js',
    sourceMapFilename: '[name].map',
  },
}

module.exports = config;
