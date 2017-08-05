const PIXI = require('pixi.js');

const options = {
  width: 256,
  height: 256,
}

const game = {
  renderer: null,
  stage: null,
  player: null,
  playerXVector: null,

  initRenderer: function initRenderer() {
    const renderer = PIXI.autoDetectRenderer(options.width, options.height, {
    });
    renderer.view.classList.add('game-container');
    document.body.appendChild(renderer.view);
    return renderer;
  },

  initPlayer: function initPlayer() {
    const rectangle = new PIXI.Graphics();
    rectangle.beginFill(0x66ccff);
    rectangle.drawRect(0, 0, 10, 10);
    rectangle.endFill();

    return rectangle;
  },

  initStage: function initStage() {
    const stage = new PIXI.Container();

    stage.addChild(this.player);

    return stage;
  },

  init: function init() {
    this.renderer = this.initRenderer();
    this.player = this.initPlayer();
    this.stage = this.initStage();

    this.playerXVector = 1;
  },

  doAnimate: function doAnimate() {
    if (this.playerXVector) {
      // Rudimentary wall hit detection
      if (this.player.x + this.player.width >= options.width || this.player.x < 0) {
        this.playerXVector *= -1;
      }
      this.player.x += this.playerXVector;
    }
  },

  gameLoop: function gameLoop() {
    if (!this.renderer) {
      debugger;
    }
    this.renderer.render(this.stage);

    this.doAnimate();

    requestAnimationFrame(gameLoop.bind(this));
  },

  run: function run() {
    this.init();
    this.gameLoop();
  }
}

game.run();
