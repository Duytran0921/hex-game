import { HexGrid, Trihex, shapes, Hex, HEX_HEIGHT, HEX_WIDTH } from './hexGrid';
import { Button, pick, shuffle } from './util';

export class MainScene extends Phaser.Scene {

    grid: HexGrid;

    foreground: Phaser.GameObjects.Image;
    nextType: number;
    nextTrihex: Trihex;
    nextNextTrihex: Trihex;
    trihexDeck: Trihex[];
    bigPreviewTrihex: Hex[];
    bigPreviewContainer: Phaser.GameObjects.Container;
    deckCounterImage: Phaser.GameObjects.Image;
    deckCounterText: Phaser.GameObjects.BitmapText;
    rotateLeftButton: Button;
    rotateRightButton: Button;
    openHelpButton: Button;
    closeHelpButton: Button;
    helpPage: Phaser.GameObjects.Image;
    score: number;
    scoreBreakdown: number[];
    scoreText: Phaser.GameObjects.BitmapText;
    waves: Phaser.GameObjects.Image;
    waves2: Phaser.GameObjects.Image;

    pointerDown: boolean;
    previewX: number;
    previewY: number;

    // Mobile preview rotate icons
    previewRotateLeftIcon: Button;
    previewRotateRightIcon: Button;
    previewActive: boolean;
    previewCenterX: number;
    previewCenterY: number;
    suppressTapOnce: boolean;
    
    // Double-tap detection
    lastTapTime: number;
    lastTapX: number;
    lastTapY: number;
    
    // Movement threshold
    pointerDownX: number;
    pointerDownY: number;

    gameOverText: Phaser.GameObjects.BitmapText;
    rankText: Phaser.GameObjects.BitmapText;
    nextRankText: Phaser.GameObjects.BitmapText;
    playAgainButton: Button;

    breakdownContainer: Phaser.GameObjects.Container;
    breakdownHexes: Hex[];
    breakdownTexts: Phaser.GameObjects.BitmapText[];

    constructor() {
        super('main');
    }

    create() {
        // Portrait layout: 720x1280
        this.add.rectangle(360, 640, 720, 1280, 0x90C7E5);

        this.score = 0;
        this.scoreBreakdown = [0, 0, 0, 0, 0, 0];

        this.pointerDown = false;
        this.previewActive = false;
        this.suppressTapOnce = false;
        this.lastTapTime = 0;
        this.lastTapX = 0;
        this.lastTapY = 0;
        this.pointerDownX = 0;
        this.pointerDownY = 0;

        this.waves = this.add.image(360, 640, 'waves');
        this.waves2 = this.add.image(360, 640, 'waves2');
        
        // Grid positioned in center-top area
        this.grid = new HexGrid(this, 5, 8, 0, 100, this.onNewPoints.bind(this));
        this.trihexDeck = this.createTrihexDeck(25, true);

        // Score text at top
        this.scoreText = this.add.bitmapText(360, 30, 'font', '0 points', 50);
        this.scoreText.setOrigin(0.5, 0);
        this.scoreText.setDepth(4);
        
        // Rotate buttons at bottom left and right
        this.rotateLeftButton = new Button(this, 120, 1150, 'rotate', this.rotateLeft.bind(this));
        this.rotateLeftButton.setDepth(3.5);
        this.rotateLeftButton.setFlipX(true);
        this.rotateRightButton = new Button(this, 600, 1150, 'rotate', this.rotateRight.bind(this));
        this.rotateRightButton.setDepth(3.5);

        // Mobile preview rotate icons (initially hidden)
        this.previewRotateLeftIcon = new Button(this, -100, -100, 'rotate', this.rotateLeft.bind(this));
        this.previewRotateLeftIcon.setDepth(6);
        this.previewRotateLeftIcon.setFlipX(true);
        this.previewRotateLeftIcon.setScale(0.4);
        this.previewRotateLeftIcon.setVisible(false);
        
        this.previewRotateRightIcon = new Button(this, -100, -100, 'rotate-bw', this.rotateRight.bind(this));
        this.previewRotateRightIcon.setDepth(6);
        this.previewRotateRightIcon.setScale(0.4);
        this.previewRotateRightIcon.setVisible(false);

        // Help button at bottom center
        this.openHelpButton = new Button(this, 360, 1200, 'question', this.openHelp.bind(this));
        this.openHelpButton.setDepth(3.5);

        // Close help button (portrait center)
        this.closeHelpButton = new Button(this, 360, 1200, 'x', this.closeHelp.bind(this));
        this.closeHelpButton.setDepth(5.1);
        this.closeHelpButton.setVisible(false);
        
        // Deck counter at bottom center-left
        this.deckCounterText = this.add.bitmapText(300, 1150, 'font', String(this.trihexDeck.length), 50)
        this.deckCounterText.setOrigin(0.5, 0.45);
        this.deckCounterText.setDepth(3.6);

        this.deckCounterImage = this.add.image(300, 1150, 'a-shape');
        this.deckCounterImage.setDepth(3.5);
        this.deckCounterImage.setAlpha(0.5);
        
        // Big preview container positioned at bottom right area
        this.bigPreviewContainer = this.add.container(550, 950);
        this.bigPreviewContainer.setDepth(4);

        this.bigPreviewTrihex = [];
        for (let i = 0; i < 3; i++) {
            let h = new Hex(this, 0, 0, -1, -1);
            h.embiggen();
            h.setDepth(4);
            this.bigPreviewTrihex.push(h);
            this.bigPreviewContainer.add(h);
            this.bigPreviewContainer.add(h.edges.getChildren());
            this.bigPreviewContainer.add(h.propeller);
        }

        // Help page centered
        this.helpPage = this.add.image(360, 640, 'help-page');
        this.helpPage.setDepth(5);
        this.helpPage.setVisible(false);

        this.pickNextTrihex();

        // Foreground transition (adjust for portrait)
        this.foreground = this.add.image(1080, 640, 'page');
        this.foreground.setDepth(3);

        this.tweens.add({
            targets: this.foreground,
            props: { x: 1800 },
            duration: 400
        });

        this.tweens.add({
            targets: this.rotateLeftButton,
            props: { x: this.rotateLeftButton.x + 720 },
            duration: 400
        });

        this.tweens.add({
            targets: this.openHelpButton,
            props: { x: this.openHelpButton.x + 720 },
            duration: 400
        });

        this.tweens.add({
            targets: this.rotateRightButton,
            props: { x: this.rotateRightButton.x + 720 },
            duration: 400
        });

        this.tweens.add({
            targets: this.scoreText,
            props: { x: this.scoreText.x + 720 },
            duration: 400
        });

        this.tweens.add({
            targets: [this.deckCounterText, this.deckCounterImage],
            props: { x: this.deckCounterText.x + 720 },
            duration: 400
        });

        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
        this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
        this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
        this.input.keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);

        this.input.on('wheel', this.onMouseWheel, this);
    }

    onNewPoints(points: number, hexType: number) {
        this.score += points;
        this.scoreBreakdown[hexType] += points;
        this.scoreText.setText(String(this.score) + " points");
    }

    openHelp() {
        this.helpPage.setVisible(true);
        this.closeHelpButton.setVisible(true);
        this.openHelpButton.setVisible(false);
        this.grid.deactivate();
        this.hidePreviewRotateIcons();
    }

    closeHelp() {
        this.helpPage.setVisible(false);
        this.closeHelpButton.setVisible(false);
        this.openHelpButton.setVisible(true);
        this.grid.activate();
    }

    onMouseWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        if (deltaY > 0) {
            this.rotateRight();
        }
        if (deltaY < 0) {
            this.rotateLeft();
        }
    }

    rotateRight() {
        this.suppressTapOnce = true;
        this.nextTrihex.rotateRight();
        this.grid.updateTriPreview(this.previewX, this.previewY, this.nextTrihex);
        if (this.previewActive) {
            this.calculatePreviewCenter(this.previewX, this.previewY);
            this.showPreviewRotateIcons();
        }
        this.updateBigTrihex();
    }

    rotateLeft() {
        this.suppressTapOnce = true;
        this.nextTrihex.rotateLeft();
        this.grid.updateTriPreview(this.previewX, this.previewY, this.nextTrihex);
        if (this.previewActive) {
            this.calculatePreviewCenter(this.previewX, this.previewY);
            this.showPreviewRotateIcons();
        }
        this.updateBigTrihex();
    }

    updateBigTrihex() {
        for (let i = 0; i < 3; i++) {
            let row = shapes[this.nextTrihex.shape][i].ro;
            let col = shapes[this.nextTrihex.shape][i].co;

            if (this.nextTrihex.shape === 'a') {
                this.bigPreviewTrihex[i].setX(HEX_WIDTH*1.5*(col + 0.5*row))
                this.bigPreviewTrihex[i].setY(HEX_HEIGHT*1.125*(row));
            } else if (this.nextTrihex.shape === 'v') {
                this.bigPreviewTrihex[i].setX(HEX_WIDTH*1.5*(col - 0.5 + 0.5*row))
                this.bigPreviewTrihex[i].setY(HEX_HEIGHT*1.125*(row));
            } else {
                this.bigPreviewTrihex[i].setX(HEX_WIDTH*1.5*(col + 0.5*row))
                this.bigPreviewTrihex[i].setY(HEX_HEIGHT*1.125*row)
            }

            
            this.bigPreviewTrihex[i].setType(this.nextTrihex.hexes[i]);
            if (this.nextTrihex.hexes[i] === 0) this.bigPreviewTrihex[i].setVisible(false);
        }
    }

    createTrihexDeck(size: number, allShapes?: boolean): Trihex[] {
        let deck: Trihex[] = [];
        for (let i = 0; i < size; i++) {
            if (allShapes) {
                if (i < size/3) {
                    deck.push(new Trihex(0, 0, 0, pick(['a', 'v'])));
                } else if (i < size/1.5) {
                    deck.push(new Trihex(0, 0, 0, pick(['/', '-', '\\'])));
                } else {
                    deck.push(new Trihex(0, 0, 0, pick(['c', 'r', 'n', 'd', 'j', 'l'])));
                }
            } else {
                deck.push(new Trihex(0, 0, 0, 'a'));
            }
        }
        deck = shuffle(deck);
        for (let i = 0; i < size; i++) {
            if (i < size/2) {
                deck[i].hexes[0] = 3;
            } else {
                deck[i].hexes[0] = 1;
            }
        }
        deck = shuffle(deck);
        for (let i = 0; i < size; i++) {
            if (i < size/2) {
                deck[i].hexes[1] = 3;
            } else {
                deck[i].hexes[1] = 2;
            }
        }
        deck = shuffle(deck);
        for (let i = 0; i < size; i++) {
            if (i < size/2) {
                deck[i].hexes[2] = 3;
            } else {
                deck[i].hexes[2] = 2;
            }
            deck[i].hexes = shuffle(deck[i].hexes);
        }
        deck = shuffle(deck);
        return deck;
    }

    pickNextTrihex() {
        if (this.trihexDeck.length > 0) {
            this.nextTrihex = this.trihexDeck.pop();

            this.deckCounterText.setText(String(this.trihexDeck.length));

            if (this.trihexDeck.length > 0) {
                this.deckCounterImage.setTexture({
                    'a': 'a-shape',
                    'v': 'a-shape',
                    '/': 'slash-shape',
                    '-': 'slash-shape',
                    '\\': 'slash-shape',
                    'c': 'c-shape',
                    'r': 'c-shape',
                    'n': 'c-shape',
                    'd': 'c-shape',
                    'j': 'c-shape',
                    'l': 'c-shape'
                }[this.trihexDeck[this.trihexDeck.length-1].shape])
            } else {
                this.deckCounterImage.setVisible(false);
                this.deckCounterText.setText('');
            }
            this.updateBigTrihex();

            this.bigPreviewContainer.setPosition(this.deckCounterImage.x, this.deckCounterImage.y);
            this.bigPreviewContainer.setScale(0.2);

            this.tweens.add({
                targets: this.bigPreviewContainer,
                props: {
                    x: 550,
                    y: 950,
                    scale: 1
                },
                duration: 400
            })

        } else {
            this.bigPreviewContainer.setVisible(false);
            this.nextTrihex = new Trihex(0, 0, 0, 'a');
        }
    }

    waitForFinalScore() {
        this.grid.onQueueEmpty = this.endGame.bind(this);
    }

    endGame() {
        this.grid.sinkBlanks();

        this.tweens.add({
            targets: [
                this.bigPreviewContainer,
                this.rotateLeftButton,
                this.rotateRightButton,
                this.deckCounterImage,
                this.deckCounterText,
                this.openHelpButton
            ],
            props: {
                alpha: 0
            },
            duration: 300
        });

        this.tweens.add({
            targets: this.scoreText,
            props: {
                y: 150
            },
            duration: 700,
            ease: Phaser.Math.Easing.Quadratic.Out
        });

        
        let rank, message1, message2;
        if (this.score === 0) {
            // Z rank
            rank = "Rank: Z";
            message1 = "What!?"
            message2 = "(That's honestly impressive!)"
        } else if (this.score < 70) {
            // E rank
            rank = "Rank: E";
            message1 = "Finished!";
            message2 = "(Next rank at 70 points)";
        } else if (this.score < 80) {
            // D rank
            rank = "Rank: D";
            message1 = "Not bad!";
            message2 = "(Next rank at 80 points)";
        } else if (this.score < 90) {
            // C rank
            rank = "Rank: C";
            message1 = "Good job!";
            message2 = "(Next rank at 90 points)";
        } else if (this.score < 100) {
            // B rank
            rank = "Rank: B";
            message1 = "Well done!";
            message2 = "(Next rank at 100 points)";
        } else if (this.score < 110) {
            // A rank
            rank = "Rank: A";
            message1 = "Excellent!";
            message2 = "(Next rank at 110 points)";
        } else if (this.score < 120) {
            // A+ rank
            rank = "Rank: A+";
            message1 = "Amazing!";
            message2 = "(Next rank at 120 points)";
        } else if (this.score < 125) {
            // S rank
            rank = "Rank: S";
            message1 = "Incredible!!";
            message2 = "(This is the highest rank!)";
        } else {
            // S rank (perfect)
            rank = "Rank: S";
            message1 = "A perfect score!!";
            message2 = "(This is the highest rank!)"
        }
        
        this.gameOverText = this.add.bitmapText(1080, 200, 'font', message1, 50);
        this.gameOverText.setOrigin(0.5);
        this.gameOverText.setDepth(4);

        this.rankText = this.add.bitmapText(1080, 700, 'font', rank, 50);
        this.rankText.setOrigin(0.5);
        this.rankText.setDepth(4);

        this.nextRankText = this.add.bitmapText(1080, 750, 'font', message2, 35);
        this.nextRankText.setOrigin(0.5);
        this.nextRankText.setDepth(4);

        this.playAgainButton = new Button(this, 1080, 900, 'play-again-button', this.playAgain.bind(this));
        this.playAgainButton.setDepth(4);

        this.breakdownContainer = this.add.container(1080, 500);
        this.breakdownContainer.setDepth(4);

        this.breakdownHexes = [];
        this.breakdownTexts = [];

        for (let i = 0; i < 3; i++) {
            let h = new Hex(this, 0, 0, -1, -1);
            h.embiggen();
            h.setDepth(4);
            this.breakdownContainer.add(h);
            this.breakdownHexes.push(h);
            this.breakdownContainer.add(h.edges.getChildren());
            this.breakdownContainer.add(h.propeller);

            let t = this.add.bitmapText(0, 80, 'font', '0', 40);
            t.setOrigin(0.5);
            this.breakdownTexts.push(t);
            this.breakdownContainer.add(t);
        }

        this.breakdownHexes[0].setType(3);
        this.breakdownHexes[0].upgrade();
        this.breakdownHexes[0].setX(-125);
        this.breakdownTexts[0].setX(-125);
        this.breakdownTexts[0].setText(String(this.scoreBreakdown[3] + this.scoreBreakdown[5]));
        
        this.breakdownHexes[1].setType(2);
        this.breakdownHexes[1].upgrade();
        this.breakdownTexts[1].setText(String(this.scoreBreakdown[2]));
        
        this.breakdownHexes[2].setType(1);
        this.breakdownHexes[2].setX(125);
        this.breakdownTexts[2].setX(125);
        this.breakdownTexts[2].setText(String(this.scoreBreakdown[1]));

        this.tweens.add({
            targets: this.gameOverText,
            props: { x: 360 },
            delay: 300,
            duration: 300,
            ease: Phaser.Math.Easing.Quadratic.Out
        });

        this.tweens.add({
            targets: this.breakdownContainer,
            props: { x: 360 },
            delay: 600,
            duration: 300,
            ease: Phaser.Math.Easing.Quadratic.Out
        });

        this.tweens.add({
            targets: [this.rankText, this.nextRankText],
            props: { x: 360 },
            delay: 900,
            duration: 300,
            ease: Phaser.Math.Easing.Quadratic.Out
        });

        this.tweens.add({
            targets: this.playAgainButton,
            props: { x: 360 },
            delay: 1200,
            duration: 300,
            ease: Phaser.Math.Easing.Quadratic.Out
        });
    }

    playAgain() {
        this.breakdownContainer.setVisible(false);
        this.gameOverText.setVisible(false);
        this.nextRankText.setVisible(false);
        this.rankText.setVisible(false);
        this.playAgainButton.setVisible(false);
        this.scoreText.setVisible(false);

        this.tweens.add({
            targets: this.foreground,
            props: { x: 1080 },
            duration: 400
        });

        this.time.addEvent({
            callback: this.scene.restart,
            callbackScope: this.scene,
            delay: 500
        });
    }

    onPointerUp(event) {
        if (!this.pointerDown) {
            return;
        }
        // Determine if this was a tap (not a drag)
        const dx = event.worldX - this.pointerDownX;
        const dy = event.worldY - this.pointerDownY;
        const distance = Math.hypot(dx, dy);
        const TAP_MOVE_THRESHOLD = 12; // pixels

        this.pointerDown = false;

        if (distance > TAP_MOVE_THRESHOLD) {
            // Considered a drag: update preview at release position but do not place
            this.showPreviewAtLocation(event.worldX, event.worldY);
            return;
        }

        if (this.suppressTapOnce) {
            this.suppressTapOnce = false;
            return;
        }

        this.handleTap(event.worldX, event.worldY);
    }

    handleTap(x: number, y: number) {
        if (!this.grid.enabled) return;
        
        const now = this.time.now;
        const DOUBLE_TAP_MS = 300;
        const isDoubleTap = (now - this.lastTapTime < DOUBLE_TAP_MS) && (Phaser.Math.Distance.Between(x, y, this.lastTapX, this.lastTapY) < 20);
        this.lastTapTime = now;
        this.lastTapX = x;
        this.lastTapY = y;

        if (this.previewActive) {
            if (this.isNearPreviewCenter(x, y)) {
                if (isDoubleTap) {
                    this.placeTrihex();
                    this.hidePreviewRotateIcons();
                } else {
                    // Single tap within preview center: do nothing to avoid accidental place; encourage double-tap
                    // Provide a subtle feedback? (optional beep) -- skipped per scope
                }
                return;
            } else {
                // Move preview to new location
                this.showPreviewAtLocation(x, y);
                return;
            }
        } else {
            // First tap: show preview
            this.showPreviewAtLocation(x, y);
            return;
        }
    }

    isNearPreviewCenter(x: number, y: number): boolean {
        if (!this.previewActive) return false;
        const distance = Math.sqrt(
            Math.pow(x - this.previewCenterX, 2) + 
            Math.pow(y - this.previewCenterY, 2)
        );
        return distance < 40; // reduced radius to minimize accidental place
    }

    showPreviewAtLocation(x: number, y: number) {
        this.previewX = x;
        this.previewY = y;
        this.grid.updateTriPreview(x, y, this.nextTrihex);
        
        // Calculate preview center for icon placement
        this.calculatePreviewCenter(x, y);
        
        // Show rotate icons
        this.showPreviewRotateIcons();
        this.previewActive = true;
    }

    calculatePreviewCenter(x: number, y: number) {
        // Use the same coordinate snapping logic as updateTriPreview
        let adjustedY = y;
        let adjustedX = x;
        
        if (this.nextTrihex.shape === 'a') {
            adjustedY -= HEX_HEIGHT/2;
        }
        if (this.nextTrihex.shape === 'v') {
            adjustedY -= HEX_HEIGHT/2;
            adjustedX -= HEX_WIDTH/2;
        }
        
        // Calculate center of the trihex preview
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (let i = 0; i < 3; i++) {
            const triPreview = this.grid.triPreviews[i];
            minX = Math.min(minX, triPreview.x);
            maxX = Math.max(maxX, triPreview.x);
            minY = Math.min(minY, triPreview.y);
            maxY = Math.max(maxY, triPreview.y);
        }
        
        this.previewCenterX = (minX + maxX) / 2;
        this.previewCenterY = (minY + maxY) / 2;
    }

    showPreviewRotateIcons() {
        // Position single rotate icon centered above preview center
        const yOffset = 40;
        
        // Always keep left icon hidden (unused)
        this.previewRotateLeftIcon.setVisible(false);
        
        this.previewRotateRightIcon.setPosition(
            this.previewCenterX,
            this.previewCenterY - yOffset
        );
        
        this.previewRotateRightIcon.setVisible(true);
    }

    hidePreviewRotateIcons() {
        this.previewRotateLeftIcon.setVisible(false);
        this.previewRotateRightIcon.setVisible(false);
        this.previewActive = false;
    }

    placeTrihex() {
        if (!this.grid.enabled) return;
        if (this.grid.placeTrihex(this.previewX, this.previewY, this.nextTrihex)) {
            this.hidePreviewRotateIcons();
            this.pickNextTrihex();
            
            if (this.nextTrihex.hexes[0] === 0 || !this.grid.canPlaceShape(this.nextTrihex.shape)) {
                this.time.addEvent({
                    callback: this.waitForFinalScore,
                    callbackScope: this,
                    delay: 1000
                });
                this.grid.deactivate();
            }
            this.grid.updateTriPreview(-100, -100, this.nextTrihex);
        }
    }

    onPointerDown(event) {
        this.pointerDown = true;
        this.pointerDownX = event.worldX;
        this.pointerDownY = event.worldY;
    }

    onPointerMove(event) {
        // Always update hover preview (desktop), but only show icons when dragging
        this.previewX = event.worldX;
        this.previewY = event.worldY;
        this.grid.updateTriPreview(event.worldX, event.worldY, this.nextTrihex);
        if ((event as any).isDown) {
            this.calculatePreviewCenter(event.worldX, event.worldY);
            this.showPreviewRotateIcons();
            this.previewActive = true;
        }
    }

    onKeyDown(event) {
        if (event.keyCode === 39 || event.keyCode === 68) {
            this.rotateRight();
        }
        if (event.keyCode === 37 || event.keyCode === 65) {
            this.rotateLeft();
        }
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        for (let hex of this.grid.hexes) {
            hex.update(time, delta);
        }

        this.waves.setX(640 + Math.sin(time*0.001)*10);
        this.waves2.setX(640 - Math.sin(time*0.001)*10);
    }
}

