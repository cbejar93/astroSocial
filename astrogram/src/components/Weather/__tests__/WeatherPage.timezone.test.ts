import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getZonedDateInfo,
  isWithinDaylight,
  parseTimeParts,
} from '../../../pages/WeatherPage';

test('getZonedDateInfo resolves non-local timezone offsets', () => {
  const info = getZonedDateInfo('Pacific/Honolulu', new Date('2024-01-15T15:30:00Z'));
  assert.equal(info.isoDate, '2024-01-15');
  assert.equal(info.hour, 5);
  assert.equal(info.minute, 30);

  const tokyo = getZonedDateInfo('Asia/Tokyo', new Date('2024-01-15T15:30:00Z'));
  assert.equal(tokyo.isoDate, '2024-01-16');
  assert.equal(tokyo.hour, 0);
  assert.equal(tokyo.minute, 30);
});

test('parseTimeParts handles ISO and clock-only strings', () => {
  assert.deepEqual(parseTimeParts('06:45:00'), { hour: 6, minute: 45 });
  assert.deepEqual(parseTimeParts('2024-01-01T18:15:00'), { hour: 18, minute: 15 });
  assert.equal(parseTimeParts('invalid'), null);
});

test('isWithinDaylight respects overnight sun events', () => {
  assert.equal(isWithinDaylight('06:00:00', '18:00:00', 12, 0), true);
  assert.equal(isWithinDaylight('06:00:00', '18:00:00', 20, 0), false);

  // Polar day scenario where sunset occurs after midnight local time
  assert.equal(isWithinDaylight('20:00:00', '02:00:00', 22, 0), true);
  assert.equal(isWithinDaylight('20:00:00', '02:00:00', 3, 0), false);
});
