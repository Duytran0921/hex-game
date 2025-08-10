import { MainScene } from './main';
import { MenuScene } from './menu';
import { LoadScene } from './load';

new Phaser.Game({
    width: 720,
    height: 1280,
    parent: 'game',
    scene: [
        LoadScene,
        MenuScene,
        MainScene
    ],
    backgroundColor: 0xDED6B6,
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
        // Allow Phaser to set parent container (#game) height to 100%
        expandParent: true,
    },
});