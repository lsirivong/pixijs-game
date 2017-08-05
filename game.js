const PIXI = require('pixi.js');
const _ = require('lodash');
const { Vector2 } = require('three');

const options = {
  width: 256,
  height: 256,
}

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SHIFT = 16;
const KEY_SPACE = 32;
const GRAVITY_A = 1.2;
const JUMP_A = -15;
const JUMP_V = new Vector2(0, -4);

// Global state
let _renderer = null;
let _stage = null;
let _player = null;
let _jumpAccel = 0;
let _jumpT = null;
const _playerVector = new Vector2(0, 0);
const _keyState = [];

function handleKeyDownAction(keyCode) {
  if (keyCode === KEY_SPACE && _jumpT === null) {
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
  const pos = _keyState.indexOf(keyCode);
  if (pos >= 0) {
    // remove it
    _keyState.splice(pos, 1);
  }
}

function init() {
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
    rectangle.y = options.height - 10;
    rectangle.endFill();

    return rectangle;
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
  _stage = initStage([ _player ]);
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
    _player.x = _.clamp(newX, 0, options.width - _player.width);
  }

  if (_jumpT !== null) {
    const newVelocity = new Vector2(0, JUMP_A).add(new Vector2(0, _jumpT * GRAVITY_A));
    const newPlayerPos = new Vector2(_player.x, _player.y).add(newVelocity);

    const MAX_Y = options.height - _player.height;
    // keep in bounds;
    _player.x = _.clamp(newPlayerPos.x, 0, options.width - _player.width);
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
