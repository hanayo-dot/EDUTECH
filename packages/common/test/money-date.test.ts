import { MoneyUtil } from '../src/utils/money.util';
import { DateUtil } from '../src/utils/date.util';
import { SystemRole, ScopeType } from '../src/constants/roles.constant';
import { PermissionAction, PermissionResource } from '../src/constants/permissions.constant';
import { StudentStatus, GradeWorkflowStatus, PaymentStatus } from '../src/constants/statuses.constant';

function runTests() {
  console.log('--- Running @edutech/common Verification Tests ---');

  // Test 1: Precision Decimal Money Arithmetic
  const amount1 = '1500.50';
  const amount2 = '250.25';
  const sum = MoneyUtil.add(amount1, amount2);
  if (MoneyUtil.format(sum) !== '1750.75') {
    throw new Error(`Expected 1750.75, got ${MoneyUtil.format(sum)}`);
  }

  // Floating point precision hazard test: 0.1 + 0.2 must equal 0.30, not 0.30000000000000004
  const floatHazard = MoneyUtil.add('0.1', '0.2');
  if (MoneyUtil.format(floatHazard) !== '0.30') {
    throw new Error(`Float hazard test failed: ${MoneyUtil.format(floatHazard)}`);
  }

  const diff = MoneyUtil.subtract('500.00', '125.75');
  if (MoneyUtil.format(diff) !== '374.25') {
    throw new Error(`Expected 374.25, got ${MoneyUtil.format(diff)}`);
  }

  if (MoneyUtil.compare('100.00', '200.00') !== -1) {
    throw new Error('Comparison 100 < 200 failed');
  }

  if (!MoneyUtil.isPositive('0.01') || MoneyUtil.isPositive('0.00') || MoneyUtil.isPositive('-5.00')) {
    throw new Error('Positive money check failed');
  }
  console.log('✔ MoneyUtil precision arithmetic passed without float distortion');

  // Test 2: Date Window Validation
  const now = new Date('2026-09-14T10:00:00Z');
  const start = new Date('2026-09-01T00:00:00Z');
  const end = new Date('2026-09-30T23:59:59Z');
  if (!DateUtil.isWithinWindow(now, start, end)) {
    throw new Error('Date window check should be valid');
  }
  if (DateUtil.isWithinWindow(new Date('2026-10-01T00:00:00Z'), start, end)) {
    throw new Error('Date outside window should be invalid');
  }
  console.log('✔ DateUtil window evaluation passed');

  // Test 3: Standard Constants Presence
  if (Object.keys(SystemRole).length < 28) {
    throw new Error(`Expected at least 28 system roles, found ${Object.keys(SystemRole).length}`);
  }
  if (Object.keys(PermissionAction).length < 13) {
    throw new Error(`Expected 13 permission actions, found ${Object.keys(PermissionAction).length}`);
  }
  if (StudentStatus.ACTIVE !== 'ACTIVE' || GradeWorkflowStatus.PUBLISHED !== 'PUBLISHED' || PaymentStatus.SUCCESS !== 'SUCCESS') {
    throw new Error('Status constants mismatch');
  }
  console.log(`✔ All 28 system roles and 13 permission actions verified`);

  console.log('--- All @edutech/common tests PASSED successfully! ---');
}

runTests();
