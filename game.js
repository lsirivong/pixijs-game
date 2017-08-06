const PIXI = require('pixi.js');
const _ = require('lodash');
const { Vector2 } = require('three');

const sizes = {
  container: [256, 256],
  player: [8, 8]
}

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SHIFT = 16;
const KEY_SPACE = 32;
const GRAVITY_A = 0.08;
const WALK_SPEED = 3;
const RUN_SPEED = 6;
const JUMP_A = -10;
const JUMP_V = new Vector2(0, -4);

const MAX_PLAYER_Y = sizes.container[1] - sizes.player[1];

// Global state
let _renderer = null;
let _stage = null;
let _player = null;
let _jumpAccel = 0;
let _jumpT = null;
const _playerVector = new Vector2(0, 0);
const _keyState = [];

// divide stage into 32 x 32 grid
//
const platforms = [
  [ 2, 28, 8 ],
  [ 14, 20, 4 ]
];

window.hitData = [];

for (let i = 0; i < 32; i++) {
  const arr = [];
  for (let j = 0; j < 32; j++) {
    arr.push(null);
  }
  hitData.push(arr);
}

const platformToRect = ([ x, y, width ]) => [ x * 8, y * 8, width * 8, 8 ];

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
  if (keyCode === KEY_SPACE && _playerVector.y === 0) {
     _playerVector.add(new Vector2(0, JUMP_A));
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
    _playerVector.set(0, 0);
  }
  const pos = _keyState.indexOf(keyCode);
  if (pos >= 0) {
    // remove it
    _keyState.splice(pos, 1);
  }
}

function collideWithHitData(p) {
  const playerTop = p.y;
  const playerBottom = playerTop + sizes.player[1];
  const playerLeft = p.x;
  const playerRight = playerLeft + sizes.player[1];
  const hitBoxes = [
    [playerLeft, playerTop], // NW
    [playerRight, playerTop], // NE
    [playerRight, playerBottom], // SE
    [playerLeft, playerBottom], // SW
  ].map(coord =>
    coord.map(val =>
      _.clamp(
        Math.floor(val / 8), 0, 31
      )
    )
  );
  const uniqHitBoxes = _.uniqWith(hitBoxes, _.isEqual);

  const hits = uniqHitBoxes.filter((([i, j]) => hitData[i][j] !== null));

  if (hits.length === 0) {
    if (_jumpT === null) {
      _jumpT = 1;
    }
    return;
  }

  hits.forEach(([i, j]) => {
    const data = hitData[i][j];
    const left = i * 8;
    const top = j * 8;
    const right = left + 8;
    const bottom = top + 8;
    const rangesOverlap = (a, b, x, y) => (_.inRange(a, x, y) || _.inRange(b, x, y));
    const playerLeft = p.x;
    const playerRight = p.x + sizes.player[0];
    if (data === 'p') {
      if (
        _.inRange(p.y, top, bottom) && rangesOverlap(p.x, playerRight, left, right)
      ) {
        p.y = bottom;
        return;
      } else if (_.inRange(playerBottom, top, bottom) && rangesOverlap(p.x, playerRight, left, right)) {
        _playerVector.setY(0);
        _jumpT = null;
        p.y = top - sizes.player[1];
        return;
      }
    }
  })
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
    // add platforms to hit data;
    platforms.forEach(([x, y, width]) => {
      for (let i = 0; i < width; i++) {
        hitData[x + i][y] = 'p';
      }
    });

    // create render graphics
    return platforms.map(p => (
      renderRect.apply(null, [0xd7c12d, ...platformToRect(p)])
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
  let magnitude = _keyState.includes(KEY_SHIFT) ? RUN_SPEED : WALK_SPEED;
  let moved = false;
  if (_keyState.includes(KEY_RIGHT)) {
    playerXVector += magnitude;
  }

  if (_keyState.includes(KEY_LEFT)) {
    playerXVector -= magnitude;
  }

  if (playerXVector !== 0) {
    const newX = _player.x + playerXVector;
    _player.x = _.clamp(newX, 0, sizes.container[0] - sizes.player[0]);
    moved = true;
  }

  if (_jumpT !== null) {
    _playerVector.add(new Vector2(0, _jumpT * GRAVITY_A));

    // clamp velocity
    const MAX_PLAYER_VELOCITY_Y = 8;
    _playerVector.y = _.clamp(_playerVector.y, -MAX_PLAYER_VELOCITY_Y, MAX_PLAYER_VELOCITY_Y);

    const newPlayerPos = new Vector2(_player.x, _player.y).add(_playerVector);

    // keep in bounds;
    _player.x = _.clamp(newPlayerPos.x, 0, sizes.container[0] - sizes.player[0]);
    _player.y = _.clamp(newPlayerPos.y, 0, MAX_PLAYER_Y);

    _jumpT++;
    moved = true;
  }

  if (_player.y === MAX_PLAYER_Y) {
    _playerVector.set(0, 0);
  }

  if (_playerVector.y === 0) {
    _jumpT = null;
  }

  if (moved) {
    // collide with platforms
    collideWithHitData(_player);

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
