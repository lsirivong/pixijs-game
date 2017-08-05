const PIXI = require('pixi.js');
const _ = require('lodash');
const { Vector2 } = require('three');

const sizes = {
  container: [256, 256],
  player: [16, 16]
}

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SHIFT = 16;
const KEY_SPACE = 32;
const GRAVITY_A = 0.6;
const GRAVITY_HEAVY_A = GRAVITY_A * 2;
const JUMP_A = -10;
const JUMP_V = new Vector2(0, -4);

const LARGE_JUMP_THRESHOLD = 120;

// Global state
let _renderer = null;
let _stage = null;
let _player = null;
let _jumpAccel = 0;
let _jumpT = null;
let _jumpTimeout = null;
const _playerVector = new Vector2(0, 0);
const _keyState = [];

const platforms = [
  [ 20, 200, 80, 10 ]
];

/**
 * returns a PIXI.Graphics object
 */
function renderRect(fill, x, y, width, height) {
  const rectangle = new PIXI.Graphics();
  rectangle.beginFill(fill);
  rectangle.drawRect(0, 0, width, height);
  rectangle.x = x;
  rectangle.y = y;
  rectangle.endFill();
  return rectangle;
}
function handleKeyDownAction(keyCode) {
  if (keyCode === KEY_SPACE && _player.y === sizes.container[1] - sizes.player[1]) {
    _isLargeJump = null
    _jumpTimeout = setTimeout(() => {
      _jumpTimeout = null;
      _isLargeJump = true;
    }, LARGE_JUMP_THRESHOLD)
    _jumpT = 1;
  }
}

function handleKeyDown({ keyCode }) {
  if (!_keyState.includes(keyCode)) {
    _keyState.push(keyCode);

    handleKeyDownAction(keyCode);
  }
}

function handleKeyUp({ keyCode }) {
  if (keyCode === KEY_SPACE) {
    if (_jumpTimeout) {
      _isLargeJump = false;
      clearTimeout(_jumpTimeout);
    }
  }
  const pos = _keyState.indexOf(keyCode);
  if (pos >= 0) {
    // remove it
    _keyState.splice(pos, 1);
  }
}

function init() {
  function initRenderer() {
    const renderer = PIXI.autoDetectRenderer(sizes.container[0], sizes.container[0], {
    });
    renderer.view.classList.add('game-container');
    document.body.appendChild(renderer.view);
    return renderer;
  }

  function initPlayer() {
    return renderRect(0xbaddad, 0, sizes.container[1] - sizes.player[1], sizes.player[0], sizes.player[1]);
  }

  function initPlatforms(platforms = []) {
    return platforms.map(p => (
      renderRect.apply(null, [0xd7c12d, ...p])
    ));
  }

  function initStage(children) {
    const stage = new PIXI.Container();

    children.forEach(child => {
      stage.addChild(child);
    })

    return stage;
  }

  function bindKeys() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  bindKeys();
  _renderer = initRenderer();
  _player = initPlayer();
  _platforms = initPlatforms(platforms);
  _stage = initStage([ _player, ..._platforms ]);
}

function doAnimate() {
  let playerXVector = 0;
  let magnitude = _keyState.includes(KEY_SHIFT) ? 5 : 2;
  if (_keyState.includes(KEY_RIGHT)) {
    playerXVector += magnitude;
  }

  if (_keyState.includes(KEY_LEFT)) {
    playerXVector -= magnitude;
  }

  if (playerXVector !== 0) {
    const newX = _player.x + playerXVector;
    _player.x = _.clamp(newX, 0, sizes.container[0] - sizes.player[0]);
  }

  if (_jumpT !== null) {
    const newVelocity = new Vector2(0, JUMP_A).add(new Vector2(0, _jumpT * (_isLargeJump === false ? GRAVITY_HEAVY_A : GRAVITY_A )));
    const newPlayerPos = new Vector2(_player.x, _player.y).add(newVelocity);

    const MAX_Y = sizes.container[1] - sizes.player[1];
    // keep in bounds;
    _player.x = _.clamp(newPlayerPos.x, 0, sizes.container[0] - sizes.player[0]);
    _player.y = _.clamp(newPlayerPos.y, 0, MAX_Y);

    _jumpT++;

    if (_player.y === MAX_Y) {
      _jumpT = null;
    }
  }
}

function gameLoop() {
  _renderer.render(_stage);

  doAnimate();

  requestAnimationFrame(gameLoop);
}

function run() {
  init();
  gameLoop();
}

run();
