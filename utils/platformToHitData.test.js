const platformToHitData = require('./platformToHitData');

describe('platformToHitData', () => {
  it('Should convert to obj', () => {
    const platforms = [
      [ 0, 0, 32 ],
      [ 2, 2, 28 ],
      [ 1, 5, 3 ],
    ];

    expect(platformToHitData(platforms)).toEqual({});
  });
});
