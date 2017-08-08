const platformToHitData = require('./platformToHitData');

describe('platformToHitData', () => {
  it('Should generate a mapping array', () => {
    const platforms = [
      [ 0, 0, 32 ],
    ];

    expect(platformToHitData(platforms)).toEqual({
      ceilings: [
        [ 0, 16, 1024, 16 ]
      ],
      floors: [
        [ 0, 0, 1024, 16 ]
      ],
      westwardWalls: [
        [ 0, 0, 16, 32 ]
      ],
      eastwardWalls: [
        [ 1008, 0, 16, 32 ]
      ],
    });
  });

  it('Should generate a mapping array', () => {
    const platforms = [
      [ 3, 6, 6 ],
      [ 20, 16, 1, 8 ],
    ];

    expect(platformToHitData(platforms)).toEqual({
      ceilings: [
        [ 96, 208, 192, 16 ],
        [ 640, 752, 32, 16 ]
      ],
      floors: [
        [ 96, 192, 192, 16 ],
        [ 640, 512, 32, 16 ]
      ],
      westwardWalls: [
        [ 96, 192, 16, 32 ],
        [ 640, 512, 16, 256 ]
      ],
      eastwardWalls: [
        [ 272, 192, 16, 32 ],
        [ 656, 512, 16, 256 ]
      ],
    });
  });
});
