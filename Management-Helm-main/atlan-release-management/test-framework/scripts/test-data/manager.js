/**
 * Test Data Management System
 *
 * This module provides tools for managing test data in a deterministic way.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TestDataManager {
  constructor(options = {}) {
    this.options = {
      dataDir: path.join(__dirname, 'fixtures'),
      seedPrefix: 'test-seed-',
      ...options
    };
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.options.dataDir)) {
      fs.mkdirSync(this.options.dataDir, { recursive: true });
    }
    
    this.currentSeed = null;
  }
  
  /**
   * Set a deterministic seed for data generation
   */
  setSeed(testName) {
    // Create a deterministic seed based on the test name
    this.currentSeed = crypto
      .createHash('md5')
      .update(this.options.seedPrefix + testName)
      .digest('hex');
    
    console.log(`Set seed ${this.currentSeed} for test "${testName}"`);
    return this.currentSeed;
  }
  
  /**
   * Generate deterministic test data
   */
  generateData(schema, count = 1) {
    if (!this.currentSeed) {
      throw new Error('Must call setSeed before generating data');
    }
    
    // Create a seeded random number generator
    const rng = this.createSeededRNG(this.currentSeed);
    
    // Generate the requested number of items
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(this.generateItem(schema, rng, i));
    }
    
    return count === 1 ? result[0] : result;
  }
  
  /**
   * Create a seeded random number generator
   */
  createSeededRNG(seed) {
    // Simple xorshift128+ algorithm for a seeded RNG
    let x = 123456789;
    let y = 362436069;
    let z = 521288629;
    let w = parseInt(seed.slice(0, 8), 16);
    
    // Mix in the seed
    x ^= parseInt(seed.slice(8, 16), 16);
    y ^= parseInt(seed.slice(16, 24), 16);
    z ^= parseInt(seed.slice(24, 32), 16);
    
    function next() {
      const t = x ^ (x << 11);
      x = y;
      y = z;
      z = w;
      w = w ^ (w >>> 19) ^ (t ^ (t >>> 8));
      return w / 4294967296 + 0.5;
    }
    
    return { next };
  }
  
  /**
   * Generate a single data item based on schema
   */
  generateItem(schema, rng, index) {
    const result = {};
    
    Object.entries(schema).forEach(([key, def]) => {
      if (typeof def === 'function') {
        // Custom generator function
        result[key] = def(rng, index);
      } else if (typeof def === 'object' && def !== null) {
        // Nested object
        result[key] = this.generateItem(def, rng, index);
      } else {
        // Static value
        result[key] = def;
      }
    });
    
    return result;
  }
  
  /**
   * Save generated data to a fixture file
   */
  saveFixture(name, data) {
    const fixturePath = path.join(this.options.dataDir, `${name}.json`);
    fs.writeFileSync(fixturePath, JSON.stringify(data, null, 2));
    console.log(`Saved fixture "${name}" to ${fixturePath}`);
    return fixturePath;
  }
  
  /**
   * Load a fixture file
   */
  loadFixture(name) {
    const fixturePath = path.join(this.options.dataDir, `${name}.json`);
    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Fixture "${name}" does not exist`);
    }
    
    const data = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    console.log(`Loaded fixture "${name}" from ${fixturePath}`);
    return data;
  }
  
  /**
   * Create a snapshot of current system state
   */
  createSnapshot(name) {
    // This would interact with the system to capture its state
    // Simplified for demo purposes
    console.log(`Creating snapshot "${name}" of current system state`);
    return {
      timestamp: new Date().toISOString(),
      name,
      // In a real implementation, this would contain actual system state
      state: {
        databases: {
          users: { count: 42 },
          products: { count: 156 }
        },
        cache: { keys: 189 }
      }
    };
  }
  
  /**
   * Restore system to a previous snapshot
   */
  restoreSnapshot(snapshot) {
    // This would restore the system to the captured state
    // Simplified for demo purposes
    console.log(`Restoring system to snapshot "${snapshot.name}" from ${snapshot.timestamp}`);
    return true;
  }
}

// Example usage
const manager = new TestDataManager();

// Set a deterministic seed
manager.setSeed('user-authentication-test');

// Define a schema for user data
const userSchema = {
  id: (rng, i) => `user-${i + 1000}`,
  name: (rng, i) => `Test User ${i}`,
  email: (rng, i) => `user${i}@example.com`,
  age: (rng) => Math.floor(rng.next() * 50) + 18,
  isActive: (rng) => rng.next() > 0.2,
  createdAt: () => new Date().toISOString()
};

// Generate 5 users with the schema
const users = manager.generateData(userSchema, 5);
console.log(`Generated ${users.length} test users`);

// Save the data as a fixture
manager.saveFixture('test-users', users);

// Later, load the fixture
const loadedUsers = manager.loadFixture('test-users');
console.log(`Loaded ${loadedUsers.length} users from fixture`);

module.exports = TestDataManager;