const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: './src/game.ts',
    output: {
        path: require('path').resolve(__dirname, 'dist'),
        filename: "game.js",
        publicPath: process.env.NODE_ENV === 'production' ? './' : '/dist/',
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
    plugins: [
        ...(process.env.NODE_ENV === 'production' ? [
            new CopyWebpackPlugin([
                { from: 'img', to: 'img' },
                { from: 'font', to: 'font' },
                { from: 'sfx', to: 'sfx' },
                { from: 'lib', to: 'lib' },
                { 
                    from: 'index.html', 
                    to: 'index.html',
                    transform(content) {
                        return content.toString()
                            .replace('src="dist/game.js"', 'src="game.js"')
                            .replace('src="lib/phaser.min.js"', 'src="lib/phaser.min.js"');
                    }
                }
            ])
        ] : [])
    ],
    resolve: {
        extensions: ['.ts', '.js']
    }
}