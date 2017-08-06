const PIXI = require('pixi.js');
const _ = require('lodash');
const { Vector2 } = require('three');
const platforms = require('./data/level_1.js');
const KEY_CODES = require('./constants/key_codes.js');

const sizes = {
  container: [1024, 1024],
  grid: [32, 32],
}
sizes.cell = [
  sizes.container[0] / sizes.grid[0],
  sizes.container[1] / sizes.grid[1],
];
sizes.player = [].concat(sizes.cell);

const GRAVITY_A = 0.14;
const WALK_SPEED = 8;
const RUN_SPEED = 12;
const JUMP_A = -26;
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
const _hitData = [];

const platformToRect = ([ x, y, width, height = 1 ]) => [
  x * sizes.cell[0],
  y * sizes.cell[1],
  width * sizes.cell[0],
  height * sizes.cell[1]
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
  if (keyCode === KEY_CODES.SPACE && _playerVector.y === 0) {
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
  if (keyCode === KEY_CODES.SPACE) {
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
  const playerRight = playerLeft + sizes.player[0];
  const hitBoxes = [
    [playerLeft, playerTop], // NW
    [playerRight, playerTop], // NE
    [playerRight, playerBottom], // SE
    [playerLeft, playerBottom], // SW
  ].map(coord =>
    coord.map(val =>
      _.clamp(
        Math.floor(val / sizes.cell[0]), 0, sizes.grid[0] - 1
      )
    )
  );
  const uniqHitBoxes = _.uniqWith(hitBoxes, _.isEqual);

  const hits = uniqHitBoxes.filter((([i, j]) => _hitData[i][j] !== null));

  if (hits.length === 0) {
    if (_jumpT === null) {
      _jumpT = 1;
    }
    return;
  }

  const isVertical = Math.abs(_playerVector.y) >= Math.abs(_playerVector.x); 
  console.log('HAVE HITS')
  hits.forEach(([i, j]) => {
    const data = _hitData[i][j];
    const left = i * sizes.cell[0];
    const top = j * sizes.cell[1];
    const right = left + sizes.cell[0];
    const bottom = top + sizes.cell[1];
    const rangesOverlap = (a, b, x, y) => (_.inRange(a, x, y) || _.inRange(b, x, y));
    if (data === 'p') {
      if (isVertical) {
        // Vertical collision
        //
        if (
          // top is in rect
          _.inRange(p.y, top, bottom)// && rangesOverlap(p.x, playerRight, left, right)
        ) {
          p.y = bottom + 1;
          // send downward for "bounceback" feel
          console.log('TOP')
          _playerVector.setY(4);
          // return;
        } else if (
          _.inRange(playerBottom, top, bottom)// && rangesOverlap(p.x, playerRight, left, right)
        ) {
          // bottom is in rect
          console.log('BOTTOM')
          _playerVector.setY(0);
          _jumpT = null;
          p.y = top - sizes.player[1];
          // return;
        }
      } else {
        console.log(p.x, p.y, {i, j, left, top, right, bottom})
        // Horizontal collision
        //
        if (
          _.inRange(p.x, left, right) && rangesOverlap(p.y, p.y + sizes.player[1] - 1, top, bottom)
        ) {
          // left is colliding
          console.log('LEFT COLLIDE');
          p.x = right;
          _playerVector.setX(0);
        }
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
    return renderRect(
      0xbaddad,
      sizes.cell[1],
      sizes.container[1] - sizes.cell[1] - sizes.player[1],
      sizes.player[0],
      sizes.player[1]
    );
  }

  function initHitData() {
    for (let i = 0; i < sizes.grid[0]; i++) {
      const arr = [];
      for (let j = 0; j < sizes.grid[1]; j++) {
        arr.push(null);
      }
      _hitData.push(arr);
    }
  }

  function initPlatforms(platforms = []) {
    initHitData();

    // add platforms to hit data;
    platforms.forEach(([x, y, width, height = 1]) => {
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          _hitData[x + i][y + j] = 'p';
        }
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
  _stage = initStage([ ..._platforms, _player ]);
}

function doAnimate() {
  let magnitude = _keyState.includes(KEY_CODES.SHIFT) ? RUN_SPEED : WALK_SPEED;
  const stateRightIndex = _keyState.indexOf(KEY_CODES.RIGHT);
  const stateLeftIndex = _keyState.indexOf(KEY_CODES.LEFT);
  if (stateRightIndex > stateLeftIndex) {
    _playerVector.add(new Vector2(magnitude, 0));
  } else if (stateLeftIndex > stateRightIndex) {
    _playerVector.add(new Vector2(-magnitude, 0));
  }

  if (_jumpT !== null) {
    _playerVector.add(new Vector2(0, _jumpT * GRAVITY_A));

    _jumpT++;
  }

  if (_playerVector.x !== 0) {
    // add some floor friction
    _playerVector.add(new Vector2(-1 * (_playerVector.x * 0.5), 0));

    if (Math.abs(_playerVector.x) < 0.5) {
      _playerVector.x = 0;
    }
  }

  // clamp velocity
  const MAX_PLAYER_VELOCITY_Y = sizes.cell[1];
  const MAX_PLAYER_VELOCITY_X = magnitude;

  _playerVector.x = _.clamp(_playerVector.x, -MAX_PLAYER_VELOCITY_X, MAX_PLAYER_VELOCITY_X);
  _playerVector.y = _.clamp(_playerVector.y, -MAX_PLAYER_VELOCITY_Y, MAX_PLAYER_VELOCITY_Y);

  const newPlayerPos = new Vector2(_player.x, _player.y).add(_playerVector);

  // keep in bounds;
  _player.x = _.clamp(newPlayerPos.x, 0, sizes.container[0] - sizes.player[0]);
  _player.y = _.clamp(newPlayerPos.y, 0, MAX_PLAYER_Y);

  if (_player.y === MAX_PLAYER_Y) {
    _playerVector.setY(0);
  }

  if (_playerVector.y === 0) {
    _jumpT = null;
  }

  if (_playerVector.length() > 0) {
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
