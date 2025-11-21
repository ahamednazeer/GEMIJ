#!/usr/bin/env node

const axios = require('axios');

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

// Test credentials from seed.ts
const TEST_USERS = {
    author: { email: 'author@journal.com', password: 'author123', role: 'AUTHOR' },
    reviewer: { email: 'reviewer@journal.com', password: 'reviewer123', role: 'REVIEWER' },
    editor: { email: 'editor@journal.com', password: 'editor123', role: 'EDITOR' },
    admin: { email: 'admin@journal.com', password: 'admin123', role: 'ADMIN' }
};

class APITester {
    constructor() {
        this.results = [];
        this.authToken = null;
        this.currentUser = null;
    }

    async testEndpoint(method, endpoint, data = null, requiresAuth = false, description = '') {
        const startTime = Date.now();
        const fullUrl = `${API_URL}${endpoint}`;

        try {
            const config = {
                method,
                url: fullUrl,
                data,
            };

            if (requiresAuth && this.authToken) {
                config.headers = {
                    Authorization: `Bearer ${this.authToken}`,
                };
            }

            const response = await axios(config);
            const responseTime = Date.now() - startTime;

            return {
                endpoint: description || `${method} ${endpoint}`,
                method,
                status: 'success',
                statusCode: response.status,
                message: 'OK',
                responseTime,
                user: this.currentUser
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                endpoint: description || `${method} ${endpoint}`,
                method,
                status: 'failed',
                statusCode: error.response?.status,
                message: error.response?.data?.message || error.message || 'Unknown error',
                responseTime,
                user: this.currentUser
            };
        }
    }

    async loginAs(userType) {
        const user = TEST_USERS[userType];
        if (!user) {
            console.log(`❌ Unknown user type: ${userType}`);
            return false;
        }

        console.log(`\n🔐 Logging in as ${user.role} (${user.email})...`);

        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: user.email,
                password: user.password,
            });

            this.authToken = response.data.data?.token;
            this.currentUser = userType;
            console.log(`✅ Successfully logged in as ${user.role}`);
            return true;
        } catch (error) {
            console.log(`❌ Failed to login as ${user.role}: ${error.message}`);
            this.authToken = null;
            this.currentUser = null;
            return false;
        }
    }

    async testPublicAPIs() {
        console.log('\n🌐 Testing Public APIs (No Auth Required)...\n');

        this.results.push(await this.testEndpoint('GET', '/public/current-issue', null, false, 'Get Current Issue'));
        this.results.push(await this.testEndpoint('GET', '/public/archive?page=1&limit=10', null, false, 'Get Archive'));
        this.results.push(await this.testEndpoint('GET', '/public/stats', null, false, 'Get Journal Stats'));
        this.results.push(await this.testEndpoint('GET', '/public/search?q=test&page=1&limit=10', null, false, 'Search Articles'));
    }

    async testAuthAPIs() {
        console.log('\n🔐 Testing Authentication APIs...\n');

        // Test registration
        const registerResult = await this.testEndpoint('POST', '/auth/register', {
            email: `test${Date.now()}@example.com`,
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User',
        }, false, 'Register New User');
        this.results.push(registerResult);

        // Test profile endpoints (requires auth)
        if (this.authToken) {
            this.results.push(await this.testEndpoint('GET', '/auth/profile', null, true, `Get Profile (${this.currentUser})`));
            this.results.push(await this.testEndpoint('PUT', '/auth/profile', {
                firstName: 'Updated',
            }, true, `Update Profile (${this.currentUser})`));
        }
    }

    async testSubmissionAPIs() {
        console.log('\n📄 Testing Submission APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping - no auth token');
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/submissions?page=1&limit=10', null, true, `Get Submissions (${this.currentUser})`));

        const createSubmissionData = {
            title: `Test Submission - ${this.currentUser} - ${Date.now()}`,
            abstract: 'Test abstract for API testing purposes',
            keywords: ['test', 'api', 'automation'],
            manuscriptType: 'RESEARCH_ARTICLE',
        };
        this.results.push(await this.testEndpoint('POST', '/submissions', createSubmissionData, true, `Create Submission (${this.currentUser})`));
    }

    async testReviewAPIs() {
        console.log('\n📝 Testing Review APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping - no auth token');
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/reviews/invitations', null, true, `Get Review Invitations (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/reviews/pending', null, true, `Get Pending Reviews (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/reviews/completed', null, true, `Get Completed Reviews (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/reviews/stats', null, true, `Get Review Stats (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/reviews/history', null, true, `Get Review History (${this.currentUser})`));
    }

    async testEditorAPIs() {
        console.log('\n✏️  Testing Editor APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping - no auth token');
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/editor/submissions?page=1&limit=10', null, true, `Get Editor Submissions (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/editor/stats', null, true, `Get Editor Stats (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/editor/reviews/overdue', null, true, `Get Overdue Reviews (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/editor/submissions/revised', null, true, `Get Revised Submissions (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/editor/issues', null, true, `Get Issues (${this.currentUser})`));
    }

    async testPaymentAPIs() {
        console.log('\n💳 Testing Payment APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping - no auth token');
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/payments/history', null, true, `Get Payment History (${this.currentUser})`));
    }

    async testAdminAPIs() {
        console.log('\n👑 Testing Admin APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping - no auth token');
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/admin/stats', null, true, `Get Admin Stats (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/admin/system/health', null, true, `Get System Health (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/admin/users?page=1&limit=10', null, true, `Get All Users (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/admin/settings', null, true, `Get System Settings (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/admin/issues?page=1&limit=10', null, true, `Get Admin Issues (${this.currentUser})`));
        this.results.push(await this.testEndpoint('GET', '/admin/payments?page=1&limit=10', null, true, `Get Admin Payments (${this.currentUser})`));
    }

    async testAsRole(userType) {
        const loginSuccess = await this.loginAs(userType);
        if (!loginSuccess) {
            console.log(`⚠️  Skipping tests for ${userType} - login failed`);
            return;
        }

        await this.testAuthAPIs();
        await this.testSubmissionAPIs();
        await this.testReviewAPIs();
        await this.testEditorAPIs();
        await this.testPaymentAPIs();
        await this.testAdminAPIs();
    }

    generateReport() {
        const totalTests = this.results.length;
        const passed = this.results.filter(r => r.status === 'success').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

        return {
            totalTests,
            passed,
            failed,
            successRate,
            results: this.results,
        };
    }

    printReport() {
        const report = this.generateReport();

        console.log('\n' + '='.repeat(100));
        console.log('📊 COMPREHENSIVE API TEST REPORT - ALL USER ROLES');
        console.log('='.repeat(100));
        console.log(`\nTotal Tests: ${report.totalTests}`);
        console.log(`✅ Passed: ${report.passed}`);
        console.log(`❌ Failed: ${report.failed}`);
        console.log(`📈 Success Rate: ${report.successRate.toFixed(2)}%\n`);

        // Group results by user role
        const byRole = {
            public: [],
            author: [],
            reviewer: [],
            editor: [],
            admin: []
        };

        report.results.forEach(result => {
            const role = result.user || 'public';
            if (byRole[role]) {
                byRole[role].push(result);
            }
        });

        // Print results by role
        Object.keys(byRole).forEach(role => {
            if (byRole[role].length === 0) return;

            const roleResults = byRole[role];
            const rolePassed = roleResults.filter(r => r.status === 'success').length;
            const roleFailed = roleResults.filter(r => r.status === 'failed').length;
            const roleSuccessRate = roleResults.length > 0 ? (rolePassed / roleResults.length) * 100 : 0;

            console.log('='.repeat(100));
            console.log(`${role.toUpperCase()} ROLE - ${roleResults.length} tests | ✅ ${rolePassed} passed | ❌ ${roleFailed} failed | ${roleSuccessRate.toFixed(1)}% success`);
            console.log('='.repeat(100));

            roleResults.forEach((result, index) => {
                const icon = result.status === 'success' ? '✅' : '❌';
                console.log(`\n${index + 1}. ${icon} ${result.endpoint}`);
                console.log(`   Method: ${result.method}`);
                console.log(`   Status: ${result.status.toUpperCase()}`);
                if (result.statusCode) {
                    console.log(`   HTTP Status: ${result.statusCode}`);
                }
                if (result.message && result.status === 'failed') {
                    console.log(`   Message: ${result.message}`);
                }
                if (result.responseTime) {
                    console.log(`   Response Time: ${result.responseTime}ms`);
                }
            });
            console.log('');
        });

        // Summary of failed tests
        const failedTests = report.results.filter(r => r.status === 'failed');
        if (failedTests.length > 0) {
            console.log('='.repeat(100));
            console.log('❌ FAILED TESTS SUMMARY');
            console.log('='.repeat(100));

            const failedByStatus = {};
            failedTests.forEach(test => {
                const status = test.statusCode || 'unknown';
                if (!failedByStatus[status]) {
                    failedByStatus[status] = [];
                }
                failedByStatus[status].push(test);
            });

            Object.keys(failedByStatus).sort().forEach(status => {
                console.log(`\n${status} Errors (${failedByStatus[status].length}):`);
                failedByStatus[status].forEach(test => {
                    console.log(`  • [${test.user || 'public'}] ${test.endpoint}`);
                });
            });
        }

        console.log('\n' + '='.repeat(100));
        console.log('END OF REPORT');
        console.log('='.repeat(100) + '\n');
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive API Tests with All User Roles...\n');
        console.log(`API Base URL: ${API_URL}\n`);
        console.log('Test Users:');
        Object.keys(TEST_USERS).forEach(key => {
            console.log(`  - ${TEST_USERS[key].role}: ${TEST_USERS[key].email}`);
        });

        // Test public APIs first (no auth required)
        await this.testPublicAPIs();

        // Test with each user role
        await this.testAsRole('author');
        await this.testAsRole('reviewer');
        await this.testAsRole('editor');
        await this.testAsRole('admin');

        this.printReport();
        return this.generateReport();
    }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
