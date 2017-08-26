const sizes = require('../constants/sizes.js');

/**
 * Generates rects for the ceilings, floors, and walls
 * of an array of rect data
 */
const platformToHitData = (platforms = []) => {
  return platforms.reduce((acc, platform) => {
    const [ left, top, width, height = 1 ] = platform;
    const [ cellWidth, cellHeight ] = sizes.cell;

    const widthPx = width * cellWidth;
    const heightPx = height * cellHeight;
    const halfCellPx = cellHeight / 2;
    const leftPx = left * cellWidth;
    const topPx = top * cellHeight;

    acc.ceilings.push([
      leftPx, topPx + heightPx - halfCellPx, widthPx, halfCellPx
    ]);
    acc.floors.push([
      leftPx, topPx, widthPx, halfCellPx
    ]);
    acc.westwardWalls.push([
      leftPx, topPx, halfCellPx, heightPx
    ]);
    acc.eastwardWalls.push([
      leftPx + widthPx - halfCellPx, topPx, halfCellPx, heightPx
    ]);

    return acc;
  },
  {
    ceilings: [],
    floors: [],
    westwardWalls: [],
    eastwardWalls: []
  })
}

module.exports = platformToHitData;
