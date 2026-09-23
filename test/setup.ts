// Global test setup. Database cleanup is NOT done here — integration tests must
// call cleanDatabase() in their own beforeEach. A global clean races with
// seedTestData() when unit and integration files run in parallel (CI).
