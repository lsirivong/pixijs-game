const rectsCollide = require('./rectsCollide');

describe('rectsCollide', () => {
  it('should collide if end is equal', () => {
    const a = [0, 0, 1, 1];
    const b = [1, 0, 1, 1];
    const info = {};

    expect(rectsCollide(a, b, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: true,
      yCollide: false
    });
    expect(rectsCollide(b, a, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: true,
      yCollide: false
    });

    const c = [0, 1, 1, 1];
    expect(rectsCollide(a, c, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: false,
      yCollide: true
    });
    expect(rectsCollide(c, a, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: false,
      yCollide: true
    });

    const d = [0, 0, 2, 2];
    const e = [1, 1, 1, 1];
    expect(rectsCollide(d, e, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: true,
      yCollide: true
    });
    expect(rectsCollide(e, d, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: true,
      yCollide: true
    });

    const f = [0, 0, 3, 1];
    expect(rectsCollide(f, e, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: false,
      yCollide: true
    });
    expect(rectsCollide(e, f, info)).toEqual(true);
    expect(info).toEqual({
      xCollide: false,
      yCollide: true
    });
  });

  it('should not collide if only corners are equal', () => {
    const a = [1, 1, 1, 1];

    const b = [].concat(a);
    b[0] = b[0] - 1;
    b[1] = b[1] - 1;
    expect(rectsCollide(b, a)).toEqual(false);

    const c = [].concat(a);
    c[0] = c[0] + 1;
    c[1] = c[1] + 1;
    expect(rectsCollide(c, a)).toEqual(false);

    const d = [].concat(a);
    d[0] = d[0] + 1;
    d[1] = d[1] - 1;
    expect(rectsCollide(d, a)).toEqual(false);

    const e = [].concat(a);
    e[0] = e[0] - 1;
    e[1] = e[1] + 1;
    expect(rectsCollide(e, a)).toEqual(false);
  });
});
