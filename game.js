const PIXI = require('pixi.js');
const _ = require('lodash');
const { Vector2 } = require('three');
const platforms = require('./data/level_2.js');
const KEY_CODES = require('./constants/key_codes.js');
const platformToHitData = require('./utils/platformToHitData');
const rectsCollide = require('./utils/rectsCollide');
const sizes = require('./constants/sizes.js');

const GRAVITY_A = 0.08;
const WALK_SPEED = 8;
const RUN_SPEED = 12;
const JUMP_A = -26;
const JUMP_V = new Vector2(0, -4);

const MAX_PLAYER_Y = sizes.container[1] - sizes.player[1];

const HORIZONTAL_NULL = 0;
const HORIZONTAL_LEFT = -1;
const HORIZONTAL_RIGHT = 1;

const VERTICAL_NULL = 0;
const VERTICAL_JUMP = 1;

// Global classes
let _renderer = null;
let _stage = null;

// Global state
let state = {
  player: null,
  jumpT: null,
  hitData: null,
  playerVector: new Vector2(0, 0),
  keys: [],
  horizontal: HORIZONTAL_NULL,
  vertical: VERTICAL_NULL,
};

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

function getHorizontalDirection() {
  const stateRightIndex = state.keys.indexOf(KEY_CODES.RIGHT);
  const stateLeftIndex = state.keys.indexOf(KEY_CODES.LEFT);
  if (stateRightIndex < 0 && stateLeftIndex < 0) {
    return HORIZONTAL_NULL;
  }

  return stateRightIndex > stateLeftIndex ? HORIZONTAL_RIGHT : HORIZONTAL_LEFT;
}

// this could be a reducer
function handleHorizontalMovement() {
  state.horizontal = getHorizontalDirection();
}

function getHorizontalVector() {
  // const magnitude = state.keys.includes(KEY_CODES.SHIFT) ? RUN_SPEED : WALK_SPEED;
  const magnitude = WALK_SPEED;
  const x = state.horizontal * magnitude;
  return new Vector2(x, 0);
}

function startJump() {
  if (state.jumpT === null) {
    state.vertical = VERTICAL_JUMP;
    state.jumpT = +new Date();
  }
}

function stopJump() {
  state.vertical = VERTICAL_NULL;
  // state.jumpT = null;
}

function handleKeyDownAction(keyCode) {
  // TODO: dispatch action
  switch(keyCode) {
    case KEY_CODES.SPACE:
      startJump();
      return;

    case KEY_CODES.RIGHT:
    case KEY_CODES.LEFT:
      handleHorizontalMovement();
      return;

    default:
      return;
  }
}

function handleKeyDown({ keyCode }) {
  if (!state.keys.includes(keyCode)) {
    state.keys.push(keyCode);

    handleKeyDownAction(keyCode);
  }
}

function handleKeyUpAction(keyCode) {
  switch(keyCode) {
    case KEY_CODES.SPACE:
      stopJump();
      return;

    case KEY_CODES.RIGHT:
    case KEY_CODES.LEFT:
      handleHorizontalMovement();
      return;

    default:
      console.warn(`KEY UP ${keyCode} not handled`);
  }
}

function handleKeyUp({ keyCode }) {
  if (keyCode === KEY_CODES.SPACE) {
    // TODO: dispatch action
    state.playerVector.set(0, 0);
  }

  const pos = state.keys.indexOf(keyCode);
  if (pos >= 0) {
    // remove it
    state.keys.splice(pos, 1);

    handleKeyUpAction(keyCode);
  }
}

function old_collideWithHitData(p) {
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

  const hits = uniqHitBoxes.filter((([i, j]) => state.hitData[i][j] !== null));

  if (hits.length === 0) {
    if (state.jumpT === null) {
      state.jumpT = 1;
    }
    return;
  }

  const isVertical = Math.abs(state.playerVector.y) >= Math.abs(state.playerVector.x); 
  console.log('HAVE HITS')
  hits.forEach(([i, j]) => {
    const data = state.hitData[i][j];
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
          // TODO: dispatch action
          state.playerVector.setY(4);
          // return;
        } else if (
          _.inRange(playerBottom, top, bottom)// && rangesOverlap(p.x, playerRight, left, right)
        ) {
          // bottom is in rect
          console.log('BOTTOM')
          // TODO: dispatch action
          state.playerVector.setY(0);
          // TODO: trigger action
          state.jumpT = null;
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
          // TODO: dispatch action
          state.playerVector.setX(0);
        }
      }
    }
  })
}

function collideWithHitData(player) {
  const playerRect = [
    player.x,
    player.y,
    sizes.player[1],
    sizes.player[0],
  ];

  let hitCeil = false;
  let hitFloor = false;
  let hitWestwardWall = false;
  let hitEastwardWall = false;

  /*
   * Things I can know:
   * Am walking (jumpT === null)
   * Am Falling (playerVector.y < 0)
   * Am Rising (playerVector.y > 0)
   *
   * When rising:
   * Check ceilings
   * Check floors (?) - like if jumping up onto a higher platform. Could probably just
   * check on the fall
   * Check Walls if bump into
   *
   * When falling:
   * Check floors, walls
   *
   * When walking:
   * Check floors - for walk off platform
   * Check walls
   *
   */
  const info = {};

  // console.log("B4 FLOORS", playerRect, state.hitData.floors)
  state.hitData.floors.forEach(floor => {
    // console.log("FLOOR", floor)
    if (rectsCollide(playerRect, floor, info)) {
      // This is wrong because will catch initiated jumps
      hitFloor = true;
      // TODO: dispatch action
      // state.playerVector.setY(0);
      if (state.jumpT) {
        console.log('FALLING FLOOR COLLIDE', playerRect, floor);
        // TODO dispatch action
        // console.log('RESET JUMP', state.jumpT)
        state.jumpT = null;
      }
      playerRect[1] = floor[1] - playerRect[3];
      // console.log({ in: 'floordetect', hitFloor, jmupT: state.jumpT})
    }
  });
  // console.log("AFTER FLOORS")

  state.hitData.westwardWalls.forEach(westwardWall => {
    if (rectsCollide(playerRect, westwardWall, info) && info.xCollide) {
      hitWestwardWall = true;
      console.log('WESTARD WALL COLLIDE', playerRect, westwardWall);
      // TODO: dispatch action
      state.playerVector.setX(0);
      playerRect[0] = westwardWall[0] - playerRect[2];
    }
  });

  state.hitData.eastwardWalls.forEach(eastwardWall => {
    if (rectsCollide(playerRect, eastwardWall, info) && info.xCollide) {
      hitEastwardWall = true;
      console.log('EASTWARD WALL COLLIDE', playerRect, eastwardWall);
      // TODO: dispatch action
      state.playerVector.setX(0);
      playerRect[0] = eastwardWall[0] + eastwardWall[2];
    }
  });

  state.hitData.ceilings.forEach(ceiling => {
    if (rectsCollide(playerRect, ceiling, info) && info.yCollide) {
      hitCeil = true;
      console.log('CEILING COLLIDE');
      // TODO: dispatch action
      // state.playerVector.setY(0);
      playerRect[1] = ceiling[1] + ceiling[3];
      state.vertical = VERTICAL_NULL;
    }
  });


  player.x = playerRect[0];
  player.y = playerRect[1];

  if (!hitFloor && !state.jumpT) {
    // TODO dispatch action
    console.log('START FALL', { hitFloor, jumpT: state.jumpT });
    state.jumpT = 1;
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
    return renderRect(
      0xbaddad,
      sizes.cell[1],
      sizes.container[1] - sizes.cell[1] - sizes.player[1],
      sizes.player[0],
      sizes.player[1]
    );
  }

  function initHitData() {
    // TODO dispatch action
    state.hitData = platformToHitData(platforms);
  }

  function initPlatforms(platforms = []) {
    initHitData();

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
  state.player = initPlayer();
  _platforms = initPlatforms(platforms);
  _stage = initStage([ ..._platforms, state.player ]);
}

function doAnimate() {
  const playerVector = state.playerVector.clone();

  // Do Horizontal
  //
  playerVector.add(getHorizontalVector());

  // Do start jump
  if (state.jumpT !== null) {
    const t = +new Date() - state.jumpT;

    playerVector.add(new Vector2(0, state.vertical * JUMP_A + t * GRAVITY_A));
  }

  //   // Do Floor Friction
  //   if (playerVector.x !== 0) {
  //     // add some floor friction
  //     playerVector.add(new Vector2(-1 * (playerVector.x * 0.5), 0));
  // 
  //     if (Math.abs(playerVector.x) < 0.5) {
  //       playerVector.x = 0;
  //     }
  //   }

  // clamp velocity
  const MAX_PLAYER_VELOCITY_Y = sizes.cell[1] / 2;
  // const MAX_PLAYER_VELOCITY_X = magnitude;

  // state.playerVector.x = _.clamp(state.playerVector.x, -MAX_PLAYER_VELOCITY_X, MAX_PLAYER_VELOCITY_X);
  playerVector.y = _.clamp(playerVector.y, -MAX_PLAYER_VELOCITY_Y, MAX_PLAYER_VELOCITY_Y);

  // Apply motion vector
  const newPlayerPos = new Vector2(state.player.x, state.player.y).add(playerVector);

  // keep in play area
  // redundant when proper surface hit handling is implemented
  state.player.x = _.clamp(newPlayerPos.x, 0, sizes.container[0] - sizes.player[0]);
  state.player.y = _.clamp(newPlayerPos.y, 0, MAX_PLAYER_Y);

  // Stop from falling through bottom of screen
  // redundant when proper surface hit handling is implemented
  if (state.player.y === MAX_PLAYER_Y) {
    playerVector.setY(0);
  }

  // // Stop jump timer
  // if (playerVector.y === 0) {
  // // TODO dispatch action
  // state.jumpT = null;
  // }

  // Detect platform collisions
  if (playerVector.length() > 0) {
    // collide with platforms
    collideWithHitData(state.player);
  }
}

function render() {
  _renderer.render(_stage);

  doAnimate();

  requestAnimationFrame(render);
}

function run() {
  init();
  render();
}

run();
