// divide stage into 32 x 32 grid
//
const platforms = [
  [ 0, 0, 32 ],
  [ 2, 2, 28 ],
  [ 1, 5, 3 ],
  [ 28, 5, 3 ],
  [ 4, 12, 4 ],
  [ 24, 12, 4 ],
  [ 12, 26, 4, 5 ],
  [ 4, 28, 4, 3 ],
  [ 23, 26, 8, 5 ],
  [ 0, 31, 32 ],
  [ 0, 1, 1, 30 ],
  [ 31, 1, 1, 30 ],
];

module.exports = platforms;
