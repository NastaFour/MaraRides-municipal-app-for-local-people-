import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceKm, calculateFare } from '../lib/fare';

test('Fare Calculation - Haversine distance accuracy', () => {
  // Test coordinates: Plaza Bolívar to Terminal in Mara
  const lat1 = 10.7289;
  const lon1 = -71.7456;
  const lat2 = 10.7420;
  const lon2 = -71.7310;

  const distance = calculateDistanceKm(lat1, lon1, lat2, lon2);
  assert.ok(distance > 1.5 && distance < 4.0, `Expected distance between 1.5 and 4.0 km, got ${distance}`);
});

test('Fare Calculation - Minimum fare threshold enforcement', () => {
  // Identical origin and destination (0 km)
  const lat = 10.7289;
  const lon = -71.7456;

  const estimate = calculateFare(lat, lon, lat, lon);
  // Must respect minimum fare ($2.00 USD)
  assert.equal(estimate.fare, 2.00);
  assert.equal(estimate.currency, 'USD');
  assert.ok(estimate.durationMin >= 3, 'Minimum duration should be at least 3 minutes buffer');
});

test('Fare Calculation - Long distance scaling', () => {
  // Trip of ~10 km
  const lat1 = 10.7000;
  const lon1 = -71.7000;
  const lat2 = 10.8000;
  const lon2 = -71.7000;

  const estimate = calculateFare(lat1, lon1, lat2, lon2);
  assert.ok(estimate.distanceKm >= 10, 'Distance should be at least 10 km');
  assert.ok(estimate.fare > 5.00, 'Fare should scale above base fare for 10km');
  assert.ok(estimate.durationMin >= 20, 'Duration should estimate reasonable travel time');
});
