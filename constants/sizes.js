const sizes = {
  container: [1024, 1024],
  grid: [32, 32],
}
sizes.cell = [
  sizes.container[0] / sizes.grid[0],
  sizes.container[1] / sizes.grid[1],
];
sizes.player = [].concat(sizes.cell);

module.exports = sizes;
