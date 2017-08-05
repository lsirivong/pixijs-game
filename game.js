const PIXI = require('pixi.js');

const options = {
  width: 256,
  height: 256,
}

let renderer = null;
let stage = null;
let player = null;
let playerXVector = null;

function initRenderer() {
  const renderer = PIXI.autoDetectRenderer(options.width, options.height, {
  });
  renderer.view.classList.add('game-container');
  document.body.appendChild(renderer.view);
  return renderer;
}

function initPlayer() {
  const rectangle = new PIXI.Graphics();
  rectangle.beginFill(0xbaddad);
  rectangle.drawRect(0, 0, 10, 10);
  rectangle.endFill();

  return rectangle;
}

function initStage() {
  const stage = new PIXI.Container();

  stage.addChild(player);

  return stage;
}

function init() {
  renderer = initRenderer();
  player = initPlayer();
  stage = initStage();

  playerXVector = 1;
}

function doAnimate() {
  if (playerXVector) {
    // Rudimentary wall hit detection
    if (player.x + player.width >= options.width || player.x < 0) {
      playerXVector *= -1;
    }
    player.x += playerXVector;
  }
}

function gameLoop() {
  if (!renderer) {
    debugger;
  }
  renderer.render(stage);

  doAnimate();

  requestAnimationFrame(gameLoop);
}

function run() {
  init();
  gameLoop();
}

run();
