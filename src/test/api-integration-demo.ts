/**
 * API Integration Test Demo
 * Purpose: Test all integrated API services and tools
 * 
 * Run with: npx ts-node src/test/api-integration-demo.ts
 * 
 * NOTE: You need a valid Bearer token from logged-in user to test real APIs
 */

import { getWalletService } from '../services/wallet.service';
import { getMarketService } from '../services/market.service';
import { getTokenService } from '../services/token.service';
import { getTopicService } from '../services/topic.service';
import { getNewsService } from '../services/news.service';
import { getSecurityService } from '../services/security.service';
import { getUserService } from '../services/user.service';
import { getPointService } from '../services/point.service';
import { getSearchService } from '../services/search.service';
import { getCommonService } from '../services/common.service';

// Test configuration
const TEST_CONFIG = {
    // Set your Bearer token here after login
    AUTH_TOKEN: process.env.MYDEX_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE',

    // Test parameters
    WALLET_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678',
    NETWORK: 'ethereum',
    TOKEN_ADDRESS: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on ETH
    TOKEN_SYMBOL: 'ETH',
};

// Helper function to log results
function logResult(testName: string, success: boolean, data?: any, error?: any) {
    console.log('\n' + '='.repeat(60));
    console.log(`TEST: ${testName}`);
    console.log(`STATUS: ${success ? 'PASS' : 'FAIL'}`);
    if (data) {
        console.log('DATA:', JSON.stringify(data, null, 2).substring(0, 500));
    }
    if (error) {
        console.log('ERROR:', error.message || error);
    }
    console.log('='.repeat(60));
}

// Test functions for each service
async function testWalletService() {
    const service = getWalletService();

    try {
        // Test 1: Get token balance
        console.log('\n[1/3] Testing getTokenBalance...');
        const balance = await service.getTokenBalance(
            TEST_CONFIG.WALLET_ADDRESS,
            TEST_CONFIG.NETWORK
        );
        logResult('Wallet - getTokenBalance', true, balance);
    } catch (error: any) {
        logResult('Wallet - getTokenBalance', false, null, error);
    }

    try {
        // Test 2: Get holdings
        console.log('\n[2/3] Testing getHolding...');
        const holdings = await service.getHolding(
            TEST_CONFIG.WALLET_ADDRESS,
            TEST_CONFIG.NETWORK
        );
        logResult('Wallet - getHolding', true, holdings);
    } catch (error: any) {
        logResult('Wallet - getHolding', false, null, error);
    }

    try {
        // Test 3: Get transaction history
        console.log('\n[3/3] Testing getTxHistory...');
        const history = await service.getTxHistory(
            TEST_CONFIG.WALLET_ADDRESS,
            TEST_CONFIG.NETWORK,
            1,
            5
        );
        logResult('Wallet - getTxHistory', true, history);
    } catch (error: any) {
        logResult('Wallet - getTxHistory', false, null, error);
    }
}

async function testMarketService() {
    const service = getMarketService();

    try {
        // Test 1: Get token detail
        console.log('\n[1/3] Testing getTokenDetail...');
        const detail = await service.getTokenDetail(
            TEST_CONFIG.TOKEN_ADDRESS,
            TEST_CONFIG.NETWORK
        );
        logResult('Market - getTokenDetail', true, detail);
    } catch (error: any) {
        logResult('Market - getTokenDetail', false, null, error);
    }

    try {
        // Test 2: Get 24h data
        console.log('\n[2/3] Testing getToken24h...');
        const data24h = await service.getToken24h(
            TEST_CONFIG.TOKEN_ADDRESS,
            TEST_CONFIG.NETWORK
        );
        logResult('Market - getToken24h', true, data24h);
    } catch (error: any) {
        logResult('Market - getToken24h', false, null, error);
    }

    try {
        // Test 3: Get K-line data
        console.log('\n[3/3] Testing getTokenKline...');
        const kline = await service.getTokenKline(
            TEST_CONFIG.TOKEN_ADDRESS,
            TEST_CONFIG.NETWORK,
            '1h',
            10
        );
        logResult('Market - getTokenKline', true, kline);
    } catch (error: any) {
        logResult('Market - getTokenKline', false, null, error);
    }
}

async function testTokenService() {
    const service = getTokenService();

    try {
        // Test 1: Search token
        console.log('\n[1/2] Testing dexSearch...');
        const results = await service.dexSearch(TEST_CONFIG.TOKEN_SYMBOL);
        logResult('Token - dexSearch', true, results);
    } catch (error: any) {
        logResult('Token - dexSearch', false, null, error);
    }

    try {
        // Test 2: Get hot tokens
        console.log('\n[2/2] Testing getHotTokens...');
        const hotTokens = await service.getHotTokens();
        logResult('Token - getHotTokens', true, hotTokens);
    } catch (error: any) {
        logResult('Token - getHotTokens', false, null, error);
    }
}

async function testTopicService() {
    const service = getTopicService();

    try {
        // Test 1: Get topic list
        console.log('\n[1/2] Testing getList...');
        const topics = await service.getList(undefined, 1, 5);
        logResult('Topic - getList', true, topics);
    } catch (error: any) {
        logResult('Topic - getList', false, null, error);
    }

    try {
        // Test 2: Get hot topics
        console.log('\n[2/2] Testing getHotTopics...');
        const hotTopics = await service.getHotTopics();
        logResult('Topic - getHotTopics', true, hotTopics);
    } catch (error: any) {
        logResult('Topic - getHotTopics', false, null, error);
    }
}

async function testNewsService() {
    const service = getNewsService();

    try {
        // Test: AI analysis
        console.log('\n[1/1] Testing aiAnalyst...');
        const analysis = await service.aiAnalyst({
            query: 'Analyze BTC market trends',
            network: TEST_CONFIG.NETWORK
        });
        logResult('News - aiAnalyst', true, analysis);
    } catch (error: any) {
        logResult('News - aiAnalyst', false, null, error);
    }
}

async function testSecurityService() {
    const service = getSecurityService();

    try {
        // Test: Token security check
        console.log('\n[1/1] Testing checkTokenSecurity...');
        const security = await service.checkTokenSecurity(
            TEST_CONFIG.TOKEN_ADDRESS,
            TEST_CONFIG.NETWORK
        );
        logResult('Security - checkTokenSecurity', true, security);
    } catch (error: any) {
        logResult('Security - checkTokenSecurity', false, null, error);
    }
}

async function testUserService() {
    const service = getUserService();

    try {
        // Test: Get user profile
        console.log('\n[1/1] Testing getProfile...');
        const profile = await service.getProfile();
        logResult('User - getProfile', true, profile);
    } catch (error: any) {
        logResult('User - getProfile', false, null, error);
    }
}

async function testPointService() {
    const service = getPointService();

    try {
        // Test: Get task list
        console.log('\n[1/1] Testing getTaskList...');
        const tasks = await service.getTaskList();
        logResult('Point - getTaskList', true, tasks);
    } catch (error: any) {
        logResult('Point - getTaskList', false, null, error);
    }
}

async function testSearchService() {
    const service = getSearchService();

    try {
        // Test: Global search
        console.log('\n[1/1] Testing search...');
        const results = await service.search('BTC', undefined, 5);
        logResult('Search - search', true, results);
    } catch (error: any) {
        logResult('Search - search', false, null, error);
    }
}

async function testCommonService() {
    const service = getCommonService();

    try {
        // Test: Get chain types
        console.log('\n[1/1] Testing getChainTypes...');
        const chainTypes = await service.getChainTypes();
        logResult('Common - getChainTypes', true, chainTypes);
    } catch (error: any) {
        logResult('Common - getChainTypes', false, null, error);
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    console.log('#'.repeat(60));
    console.log('# MyDex Agent - API Integration Test Demo');
    console.log('# Server: http://tbo.mydex.io/app-api');
    console.log('#'.repeat(60));

    console.log('\n[INFO] Make sure to set MYDEX_AUTH_TOKEN environment variable');
    console.log('[INFO] or update TEST_CONFIG.AUTH_TOKEN in this file\n');

    // Run tests for each service
    console.log('\n>>> Testing Wallet Service...');
    await testWalletService();

    console.log('\n>>> Testing Market Service...');
    await testMarketService();

    console.log('\n>>> Testing Token Service...');
    await testTokenService();

    console.log('\n>>> Testing Topic Service...');
    await testTopicService();

    console.log('\n>>> Testing News Service...');
    await testNewsService();

    console.log('\n>>> Testing Security Service...');
    await testSecurityService();

    console.log('\n>>> Testing User Service...');
    await testUserService();

    console.log('\n>>> Testing Point Service...');
    await testPointService();

    console.log('\n>>> Testing Search Service...');
    await testSearchService();

    console.log('\n>>> Testing Common Service...');
    await testCommonService();

    console.log('\n');
    console.log('#'.repeat(60));
    console.log('# Test Complete!');
    console.log('#'.repeat(60));
}

// Run if executed directly
runAllTests().catch(console.error);

export { runAllTests };
