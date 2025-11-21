import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface TestResult {
    endpoint: string;
    method: string;
    status: 'success' | 'failed' | 'skipped';
    statusCode?: number;
    message?: string;
    responseTime?: number;
}

interface TestReport {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    successRate: number;
    results: TestResult[];
}

class APITester {
    private results: TestResult[] = [];
    private authToken: string | null = null;

    private async testEndpoint(
        method: string,
        endpoint: string,
        data?: any,
        requiresAuth: boolean = false,
        description: string = ''
    ): Promise<TestResult> {
        const startTime = Date.now();
        const fullUrl = `${API_URL}${endpoint}`;

        try {
            const config: any = {
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
            };
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            const axiosError = error as AxiosError;

            return {
                endpoint: description || `${method} ${endpoint}`,
                method,
                status: 'failed',
                statusCode: axiosError.response?.status,
                message: axiosError.response?.data?.message || axiosError.message || 'Unknown error',
                responseTime,
            };
        }
    }

    private skipEndpoint(method: string, endpoint: string, reason: string): TestResult {
        return {
            endpoint: `${method} ${endpoint}`,
            method,
            status: 'skipped',
            message: reason,
        };
    }

    async testPublicAPIs(): Promise<void> {
        console.log('\n🌐 Testing Public APIs...\n');

        // Public Service Tests
        this.results.push(await this.testEndpoint('GET', '/public/current-issue', null, false, 'Get Current Issue'));
        this.results.push(await this.testEndpoint('GET', '/public/archive?page=1&limit=10', null, false, 'Get Archive'));
        this.results.push(await this.testEndpoint('GET', '/public/stats', null, false, 'Get Journal Stats'));
        this.results.push(await this.testEndpoint('GET', '/public/search?q=test&page=1&limit=10', null, false, 'Search Articles'));
    }

    async testAuthAPIs(): Promise<void> {
        console.log('\n🔐 Testing Authentication APIs...\n');

        // Test registration (might fail if user exists)
        const registerResult = await this.testEndpoint('POST', '/auth/register', {
            email: `test${Date.now()}@example.com`,
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User',
        }, false, 'Register New User');
        this.results.push(registerResult);

        // Test login
        const loginResult = await this.testEndpoint('POST', '/auth/login', {
            email: 'test@example.com',
            password: 'password123',
        }, false, 'Login');
        this.results.push(loginResult);

        // If login successful, save token
        if (loginResult.status === 'success') {
            try {
                const response = await axios.post(`${API_URL}/auth/login`, {
                    email: 'test@example.com',
                    password: 'password123',
                });
                this.authToken = response.data.data?.token;
                console.log('✅ Authentication token obtained');
            } catch (error) {
                console.log('⚠️  Could not obtain auth token');
            }
        }

        // Test profile endpoints (requires auth)
        if (this.authToken) {
            this.results.push(await this.testEndpoint('GET', '/auth/profile', null, true, 'Get Profile'));
            this.results.push(await this.testEndpoint('PUT', '/auth/profile', {
                firstName: 'Updated',
            }, true, 'Update Profile'));
        } else {
            this.results.push(this.skipEndpoint('GET', '/auth/profile', 'No auth token'));
            this.results.push(this.skipEndpoint('PUT', '/auth/profile', 'No auth token'));
        }
    }

    async testSubmissionAPIs(): Promise<void> {
        console.log('\n📄 Testing Submission APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping submission tests - no auth token');
            this.results.push(this.skipEndpoint('GET', '/submissions', 'No auth token'));
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/submissions?page=1&limit=10', null, true, 'Get Submissions'));

        // Create submission test
        const createSubmissionData = {
            title: 'Test Submission',
            abstract: 'Test abstract for API testing',
            keywords: ['test', 'api'],
            manuscriptType: 'RESEARCH_ARTICLE',
        };
        const createResult = await this.testEndpoint('POST', '/submissions', createSubmissionData, true, 'Create Submission');
        this.results.push(createResult);
    }

    async testReviewAPIs(): Promise<void> {
        console.log('\n📝 Testing Review APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping review tests - no auth token');
            this.results.push(this.skipEndpoint('GET', '/reviews/invitations', 'No auth token'));
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/reviews/invitations', null, true, 'Get Review Invitations'));
        this.results.push(await this.testEndpoint('GET', '/reviews/pending', null, true, 'Get Pending Reviews'));
        this.results.push(await this.testEndpoint('GET', '/reviews/completed', null, true, 'Get Completed Reviews'));
        this.results.push(await this.testEndpoint('GET', '/reviews/stats', null, true, 'Get Review Stats'));
        this.results.push(await this.testEndpoint('GET', '/reviews/history', null, true, 'Get Review History'));
    }

    async testEditorAPIs(): Promise<void> {
        console.log('\n✏️  Testing Editor APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping editor tests - no auth token');
            this.results.push(this.skipEndpoint('GET', '/editor/submissions', 'No auth token'));
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/editor/submissions?page=1&limit=10', null, true, 'Get Editor Submissions'));
        this.results.push(await this.testEndpoint('GET', '/editor/stats', null, true, 'Get Editor Stats'));
        this.results.push(await this.testEndpoint('GET', '/editor/reviews/overdue', null, true, 'Get Overdue Reviews'));
        this.results.push(await this.testEndpoint('GET', '/editor/submissions/revised', null, true, 'Get Revised Submissions'));
        this.results.push(await this.testEndpoint('GET', '/editor/issues', null, true, 'Get Issues'));
    }

    async testPaymentAPIs(): Promise<void> {
        console.log('\n💳 Testing Payment APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping payment tests - no auth token');
            this.results.push(this.skipEndpoint('GET', '/payments/history', 'No auth token'));
            return;
        }

        this.results.push(await this.testEndpoint('GET', '/payments/history', null, true, 'Get Payment History'));
    }

    async testAdminAPIs(): Promise<void> {
        console.log('\n👑 Testing Admin APIs...\n');

        if (!this.authToken) {
            console.log('⚠️  Skipping admin tests - no auth token');
            this.results.push(this.skipEndpoint('GET', '/admin/stats', 'No auth token'));
            return;
        }

        // Note: These will likely fail with 403 if user is not admin
        this.results.push(await this.testEndpoint('GET', '/admin/stats', null, true, 'Get Admin Stats'));
        this.results.push(await this.testEndpoint('GET', '/admin/system/health', null, true, 'Get System Health'));
        this.results.push(await this.testEndpoint('GET', '/admin/users?page=1&limit=10', null, true, 'Get All Users'));
        this.results.push(await this.testEndpoint('GET', '/admin/settings', null, true, 'Get System Settings'));
        this.results.push(await this.testEndpoint('GET', '/admin/issues?page=1&limit=10', null, true, 'Get Admin Issues'));
        this.results.push(await this.testEndpoint('GET', '/admin/payments?page=1&limit=10', null, true, 'Get Admin Payments'));
        this.results.push(await this.testEndpoint('GET', '/admin/complaints?page=1&limit=10', null, true, 'Get Complaints'));
        this.results.push(await this.testEndpoint('GET', '/admin/retractions', null, true, 'Get Retractions'));
    }

    generateReport(): TestReport {
        const totalTests = this.results.length;
        const passed = this.results.filter(r => r.status === 'success').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const skipped = this.results.filter(r => r.status === 'skipped').length;
        const successRate = totalTests > 0 ? (passed / (totalTests - skipped)) * 100 : 0;

        return {
            totalTests,
            passed,
            failed,
            skipped,
            successRate,
            results: this.results,
        };
    }

    printReport(): void {
        const report = this.generateReport();

        console.log('\n' + '='.repeat(80));
        console.log('📊 API TEST REPORT');
        console.log('='.repeat(80));
        console.log(`\nTotal Tests: ${report.totalTests}`);
        console.log(`✅ Passed: ${report.passed}`);
        console.log(`❌ Failed: ${report.failed}`);
        console.log(`⏭️  Skipped: ${report.skipped}`);
        console.log(`📈 Success Rate: ${report.successRate.toFixed(2)}%\n`);

        console.log('='.repeat(80));
        console.log('DETAILED RESULTS');
        console.log('='.repeat(80));

        report.results.forEach((result, index) => {
            const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
            console.log(`\n${index + 1}. ${icon} ${result.endpoint}`);
            console.log(`   Method: ${result.method}`);
            console.log(`   Status: ${result.status.toUpperCase()}`);
            if (result.statusCode) {
                console.log(`   HTTP Status: ${result.statusCode}`);
            }
            if (result.message) {
                console.log(`   Message: ${result.message}`);
            }
            if (result.responseTime) {
                console.log(`   Response Time: ${result.responseTime}ms`);
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('END OF REPORT');
        console.log('='.repeat(80) + '\n');
    }

    async runAllTests(): Promise<TestReport> {
        console.log('🚀 Starting API Tests...\n');
        console.log(`API Base URL: ${API_URL}\n`);

        await this.testPublicAPIs();
        await this.testAuthAPIs();
        await this.testSubmissionAPIs();
        await this.testReviewAPIs();
        await this.testEditorAPIs();
        await this.testPaymentAPIs();
        await this.testAdminAPIs();

        this.printReport();
        return this.generateReport();
    }
}

// Export for use in other files
export const apiTester = new APITester();

// For direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    apiTester.runAllTests().catch(console.error);
}
