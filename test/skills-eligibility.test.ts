/**
 * Skill Eligibility Test
 * Tests the requires_env filtering in SkillLoader
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { SkillLoader } from '../src/agent/skills';

const TEST_DIR = path.join(os.tmpdir(), 'skill-eligibility-test-' + Date.now());

// Helper to create test skill files
function createSkill(name: string, frontmatter: string, body: string = 'Test content') {
    const skillPath = path.join(TEST_DIR, `${name}.md`);
    fs.writeFileSync(skillPath, `---\n${frontmatter}\n---\n${body}`);
}

async function runTests() {
    console.log('==================================================');
    console.log('  Skill Eligibility Test');
    console.log('==================================================\n');

    // Setup test directory
    fs.mkdirSync(TEST_DIR, { recursive: true });

    let passed = 0;
    let failed = 0;

    // Test 1: Skill without requires_env should load
    console.log('=== Test 1: No requires_env (should load) ===');
    createSkill('basic', 'name: basic\ndescription: A basic skill');
    {
        const loader = new SkillLoader(TEST_DIR, {});
        const skills = await loader.loadSkills();
        if (skills.some(s => s.name === 'basic')) {
            console.log('✓ Skill loaded without requires_env');
            passed++;
        } else {
            console.log('✗ FAILED: Skill should have loaded');
            failed++;
        }
    }

    // Test 2: Skill with requires_env satisfied should load
    console.log('\n=== Test 2: requires_env satisfied (should load) ===');
    process.env.TEST_API_KEY = 'test-value';
    createSkill('with_env', 'name: with_env\ndescription: Needs env\nrequires_env:\n  - TEST_API_KEY');
    {
        const loader = new SkillLoader(TEST_DIR, {});
        const skills = await loader.loadSkills();
        if (skills.some(s => s.name === 'with_env')) {
            console.log('✓ Skill loaded with satisfied requires_env');
            passed++;
        } else {
            console.log('✗ FAILED: Skill should have loaded (env was set)');
            failed++;
        }
    }

    // Test 3: Skill with missing requires_env should be skipped
    console.log('\n=== Test 3: requires_env missing (should skip) ===');
    delete process.env.MISSING_API_KEY; // Ensure it's not set
    createSkill('missing_env', 'name: missing_env\ndescription: Needs missing env\nrequires_env:\n  - MISSING_API_KEY');
    {
        const loader = new SkillLoader(TEST_DIR, {});
        const skills = await loader.loadSkills();
        if (!skills.some(s => s.name === 'missing_env')) {
            console.log('✓ Skill correctly skipped due to missing env');
            passed++;
        } else {
            console.log('✗ FAILED: Skill should NOT have loaded');
            failed++;
        }
    }

    // Cleanup
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    delete process.env.TEST_API_KEY;

    // Summary
    console.log('\n==================================================');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log('==================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
