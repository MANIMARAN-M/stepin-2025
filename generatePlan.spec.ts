import { test, expect } from '@playwright/test';
import { computePlan } from './generatePlan';

// Mock data for testing
const mockFailures = [
  {
    test_id: 'test1',
    module: 'Order Management',
    environment: 'QA',
    failure_type: 'Backend Service Bug',
    impacted_layers: ['Client App', 'OrderService'],
  },
  {
    test_id: 'test2',
    module: 'Payment Gateway',
    environment: 'PreProd',
    failure_type: 'Concurrency Bug',
    impacted_layers: ['PaymentService', 'DB (MySQL)'],
  },
];

const mockPolicy = {
  caps: {
    per_incident_minutes_max: 60,
  },
  multipliers: {
    by_environment: {
      QA: 0.9,
      PreProd: 1.2,
    },
    by_failure_type: {
      'Backend Service Bug': 1.1,
      'Concurrency Bug': 1.3,
    },
  },
  module_priority_score: {
    'Order Management': 5,
    'Payment Gateway': 5,
  },
  minutes_per_impacted_layer: {
    'Client App': 8,
    OrderService: 12,
    PaymentService: 12,
    'DB (MySQL)': 10,
  },
};

test.describe('computePlan', () => {
  test('should compute Base_minutes, Final_minutes, and priority_score correctly', () => {
    const result = computePlan(mockFailures, mockPolicy);

    expect(result).toEqual([
      {
        test_id: 'test1',
        module: 'Order Management',
        environment: 'QA',
        failure_type: 'Backend Service Bug',
        impacted_layers: ['Client App', 'OrderService'],
        Base_minutes: 20, // 8 + 12
        Final_minutes: 19.8, // 20 * 0.9 * 1.1
        priority_score: 4.95, // 5 * 0.9 * 1.1
      },
      {
        test_id: 'test2',
        module: 'Payment Gateway',
        environment: 'PreProd',
        failure_type: 'Concurrency Bug',
        impacted_layers: ['PaymentService', 'DB (MySQL)'],
        Base_minutes: 22, // 12 + 10
        Final_minutes: 34.32, // 22 * 1.2 * 1.3
        priority_score: 7.8, // 5 * 1.2 * 1.3
      },
    ]);
  });

  test('should handle unknown environment and failure_type gracefully', () => {
    const unknownFailures = [
      {
        test_id: 'test3',
        module: 'Unknown Module',
        environment: 'UnknownEnv',
        failure_type: 'UnknownType',
        impacted_layers: ['Client App'],
      },
    ];

    const result = computePlan(unknownFailures, mockPolicy);

    expect(result).toEqual([
      {
        test_id: 'test3',
        module: 'Unknown Module',
        environment: 'UnknownEnv',
        failure_type: 'UnknownType',
        impacted_layers: ['Client App'],
        Base_minutes: 8, // Only Client App
        Final_minutes: 8, // 8 * 1.0 * 1.0
        priority_score: 1, // 1 * 1.0 * 1.0
      },
    ]);
  });

  test('should handle empty impacted_layers gracefully', () => {
    const emptyLayersFailures = [
      {
        test_id: 'test4',
        module: 'Order Management',
        environment: 'QA',
        failure_type: 'Backend Service Bug',
        impacted_layers: [],
      },
    ];

    const result = computePlan(emptyLayersFailures, mockPolicy);

    expect(result).toEqual([
      {
        test_id: 'test4',
        module: 'Order Management',
        environment: 'QA',
        failure_type: 'Backend Service Bug',
        impacted_layers: [],
        Base_minutes: 0, // No layers
        Final_minutes: 0, // 0 * 0.9 * 1.1
        priority_score: 0, // 5 * 0.9 * 1.1, but since Base_minutes = 0, it's 0
      },
    ]);
  });
});
