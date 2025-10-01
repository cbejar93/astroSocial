import test from 'node:test';
import assert from 'node:assert/strict';
import { mapValueToLevel } from '../WeatherCard';

test('cloud cover is scored with lower percentages receiving better levels', () => {
  assert.equal(mapValueToLevel('cloudcover', 5), 5);
  assert.equal(mapValueToLevel('cloudcover', 45), 3);
  assert.equal(mapValueToLevel('cloudcover', 85), 1);
});

test('seeing scores decrease as the boundary layer height increases', () => {
  assert.equal(mapValueToLevel('seeing', 250), 5);
  assert.equal(mapValueToLevel('seeing', 750), 3);
  assert.equal(mapValueToLevel('seeing', 1500), 1);
});

test('humidity scores reflect percent-based transparency expectations', () => {
  assert.equal(mapValueToLevel('humidity', 32), 5);
  assert.equal(mapValueToLevel('humidity', 58), 3);
  assert.equal(mapValueToLevel('humidity', 88), 1);
});

test('precipitation probability maps lower chances to higher scores', () => {
  assert.equal(mapValueToLevel('precipitation_probability', 0), 5);
  assert.equal(mapValueToLevel('precipitation_probability', 20), 3);
  assert.equal(mapValueToLevel('precipitation_probability', 80), 1);
});

test('visibility rewards higher metre readings from the API feed', () => {
  assert.equal(mapValueToLevel('visibility', 23000), 4);
  assert.equal(mapValueToLevel('visibility', 12000), 2);
  assert.equal(mapValueToLevel('visibility', 6000), 1);
});

test('non-numeric values fall back to the worst score for safety', () => {
  assert.equal(mapValueToLevel('cloudcover', undefined as unknown as number), 1);
  assert.equal(mapValueToLevel('unknown', Number.NaN), 1);
});
