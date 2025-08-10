require('path');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/game.ts',
    output: {
        path: require('path').resolve(__dirname, 'dist'),
        filename: "game.js",
    },
    module: {
        rules: [
            {
                test: /\.ts|\.js$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    devServer: {
        contentBase: __dirname,
        watchContentBase: true,
        publicPath: '/dist/',
        port: 8001
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
}