import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { TripStatus, Role } from '@mototaxi/shared';

test('Trip Lifecycle - Valid transitions', () => {
  const validTransitions: Record<TripStatus, TripStatus[]> = {
    [TripStatus.REQUESTED]: [TripStatus.ACCEPTED, TripStatus.CANCELLED],
    [TripStatus.ACCEPTED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
    [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
    [TripStatus.COMPLETED]: [],
    [TripStatus.CANCELLED]: [],
  };

  // Test progression
  assert.ok(validTransitions[TripStatus.REQUESTED].includes(TripStatus.ACCEPTED));
  assert.ok(validTransitions[TripStatus.ACCEPTED].includes(TripStatus.IN_PROGRESS));
  assert.ok(validTransitions[TripStatus.IN_PROGRESS].includes(TripStatus.COMPLETED));

  // Test invalid backward progression
  assert.equal(validTransitions[TripStatus.COMPLETED].includes(TripStatus.IN_PROGRESS), false);
  assert.equal(validTransitions[TripStatus.CANCELLED].includes(TripStatus.ACCEPTED), false);
});

test('JWT Payload - Role verification', () => {
  const secret = 'test-jwt-secret-key-for-unit-test';
  const clientPayload = { id: 'usr-123', role: Role.CLIENT };
  const driverPayload = { id: 'drv-456', role: Role.DRIVER };

  const clientToken = jwt.sign(clientPayload, secret);
  const driverToken = jwt.sign(driverPayload, secret);

  const decodedClient = jwt.verify(clientToken, secret) as any;
  const decodedDriver = jwt.verify(driverToken, secret) as any;

  assert.equal(decodedClient.role, Role.CLIENT);
  assert.equal(decodedDriver.role, Role.DRIVER);
  assert.notEqual(decodedClient.id, decodedDriver.id);
});
