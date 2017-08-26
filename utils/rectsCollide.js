const _ = require('lodash');

const rangesTouch = (a, b, x, y) => {
  return ((x <= a && a <= y) || (x <= b && b <= y))
    || ((a <= x && x <= b) || (a <= y && y <= b));
};

const rangesOverlap = (a, b, x, y) => {
  return ((x < a && a < y) || (x < b && b < y))
    || ((a < x && x < b) || (a < y && y < b))
    // edge case where they are exactly the same
    || ((x <= a && a <= y) && (x <= b && b <= y));
};

/**
 * 
 */
function rectsCollide(a, b, info = {}) {
  const [ax, ay, aw, ah] = a;
  const [bx, by, bw, bh] = b;

  const aRight = ax + aw;
  const aBottom = ay + ah;

  const bRight = bx + bw;
  const bBottom = by + bh;

  const xOverlap = rangesOverlap(ax, aRight, bx, bRight);
  const yOverlap = rangesOverlap(ay, aBottom, by, bBottom);
  const xTouch = rangesTouch(ax, aRight, bx, bRight);
  const yTouch = rangesTouch(ay, aBottom, by, bBottom);

  info.xCollide = yOverlap && xTouch;
  info.yCollide = xOverlap && yTouch;

  const result = info.xCollide
    || info.yCollide;

  return result;
}

module.exports = rectsCollide;
