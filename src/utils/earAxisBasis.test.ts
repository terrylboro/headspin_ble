import { applyEarAxisBasis, getEarAxisBasisMatrix } from './earAxisBasis';

describe('left-side IMU mounting basis', () => {
  it('rotates vectors 180 degrees about X', () => {
    expect(applyEarAxisBasis(1, 2, 3, 'left')).toEqual([1, -2, -3]);
    expect(getEarAxisBasisMatrix('left')).toEqual([
      1, 0, 0,
      0, -1, 0,
      0, 0, -1,
    ]);
  });

  it('leaves the right/reference mounting basis unchanged', () => {
    expect(applyEarAxisBasis(1, 2, 3, 'right')).toEqual([1, 2, 3]);
  });
});
