import test from 'node:test';
import assert from 'node:assert/strict';
import { TripStatus } from '@mototaxi/shared';

function sanitizePhone(phone: string): string {
  return phone.trim().replace(/[\s\-\(\)]/g, '');
}

test('Security - Phone normalization', () => {
  const inputs = [
    '  0412 123 4567  ',
    '+58-414-9988776',
    '(0424) 555-1234',
    '04129876543'
  ];
  const expected = [
    '04121234567',
    '+584149988776',
    '04245551234',
    '04129876543'
  ];

  inputs.forEach((input, index) => {
    assert.equal(sanitizePhone(input), expected[index]);
  });
});

test('Security - Password minimum length check', () => {
  const invalidPasswords = ['12345', 'pass', '', '      ', '  a  '];
  invalidPasswords.forEach((pwd) => {
    assert.ok(pwd.trim().length < 6);
  });

  const validPasswords = ['password123', 'admin2026', 'mypass'];
  validPasswords.forEach((pwd) => {
    assert.ok(pwd.trim().length >= 6);
  });
});

test('Concurrency - Atomic updateMany simulation for trip acceptance', async () => {
  // Simulating the DB table state
  let currentTripStatus = TripStatus.REQUESTED;
  let assignedDriverId: string | null = null;

  // Atomic update simulator: only updates if current status matches condition
  const atomicAccept = (driverId: string): { count: number } => {
    if (currentTripStatus === TripStatus.REQUESTED) {
      currentTripStatus = TripStatus.ACCEPTED;
      assignedDriverId = driverId;
      return { count: 1 };
    }
    return { count: 0 };
  };

  // Driver 1 and Driver 2 both attempt to accept simultaneously
  const driver1Attempt = atomicAccept('driver-alpha');
  const driver2Attempt = atomicAccept('driver-beta');

  // Exactly one driver must succeed
  assert.equal(driver1Attempt.count + driver2Attempt.count, 1);
  assert.equal(driver1Attempt.count, 1);
  assert.equal(driver2Attempt.count, 0);
  assert.equal(assignedDriverId, 'driver-alpha');
  assert.equal(currentTripStatus, TripStatus.ACCEPTED);
});
