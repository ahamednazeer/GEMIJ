import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

class VisitorFlowTester {
  private results: TestResult[] = [];

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
    this.results.push({ test, status, message, data });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
  }

  async testDatabaseData() {
    console.log('\n🔍 Testing Database Data...\n');

    try {
      // Test issues exist
      const issues = await prisma.issue.findMany({
        include: { articles: true }
      });
      
      if (issues.length >= 3) {
        this.addResult('Database Issues', 'PASS', `Found ${issues.length} issues in database`);
      } else {
        this.addResult('Database Issues', 'FAIL', `Expected at least 3 issues, found ${issues.length}`);
      }

      // Test current issue exists
      const currentIssue = await prisma.issue.findFirst({
        where: { isCurrent: true },
        include: { articles: true }
      });

      if (currentIssue) {
        this.addResult('Current Issue', 'PASS', `Current issue found: Vol ${currentIssue.volume}, No ${currentIssue.number} with ${currentIssue.articles.length} articles`);
      } else {
        this.addResult('Current Issue', 'FAIL', 'No current issue found');
      }

      // Test articles exist
      const totalArticles = await prisma.article.count();
      if (totalArticles >= 6) {
        this.addResult('Database Articles', 'PASS', `Found ${totalArticles} articles in database`);
      } else {
        this.addResult('Database Articles', 'FAIL', `Expected at least 6 articles, found ${totalArticles}`);
      }

    } catch (error) {
      this.addResult('Database Connection', 'FAIL', `Database error: ${error}`);
    }
  }

  async testPublicAPIEndpoints() {
    console.log('\n🌐 Testing Public API Endpoints...\n');

    try {
      // Test current issue endpoint
      const currentIssueResponse = await axios.get(`${API_URL}/public/current-issue`);
      if (currentIssueResponse.status === 200 && currentIssueResponse.data.data) {
        const issue = currentIssueResponse.data.data;
        this.addResult('GET /public/current-issue', 'PASS', 
          `Retrieved current issue: Vol ${issue.volume}, No ${issue.number} with ${issue.articles?.length || 0} articles`);
      } else {
        this.addResult('GET /public/current-issue', 'FAIL', 'Invalid response structure');
      }

      // Test archive endpoint
      const archiveResponse = await axios.get(`${API_URL}/public/archive?page=1&limit=10`);
      if (archiveResponse.status === 200 && archiveResponse.data.data) {
        const issues = archiveResponse.data.data;
        this.addResult('GET /public/archive', 'PASS', 
          `Retrieved ${issues.length} issues from archive`);
      } else {
        this.addResult('GET /public/archive', 'FAIL', 'Invalid response structure');
      }

      // Test specific issue endpoint
      const issueResponse = await axios.get(`${API_URL}/public/issues/1/1`);
      if (issueResponse.status === 200 && issueResponse.data.data) {
        const issue = issueResponse.data.data;
        this.addResult('GET /public/issues/:volume/:number', 'PASS', 
          `Retrieved specific issue with ${issue.articles?.length || 0} articles`);
      } else {
        this.addResult('GET /public/issues/:volume/:number', 'FAIL', 'Invalid response structure');
      }

      // Test article endpoint
      const articleResponse = await axios.get(`${API_URL}/public/articles/10.1234/ijatem.2024.001`);
      if (articleResponse.status === 200 && articleResponse.data.data) {
        const article = articleResponse.data.data;
        this.addResult('GET /public/articles/:doi', 'PASS', 
          `Retrieved article: "${article.title.substring(0, 50)}..."`);
      } else {
        this.addResult('GET /public/articles/:doi', 'FAIL', 'Invalid response structure');
      }

      // Test search endpoint
      const searchResponse = await axios.get(`${API_URL}/public/search?q=artificial intelligence`);
      if (searchResponse.status === 200 && searchResponse.data.data) {
        const articles = searchResponse.data.data;
        this.addResult('GET /public/search', 'PASS', 
          `Search returned ${articles.length} articles for "artificial intelligence"`);
      } else {
        this.addResult('GET /public/search', 'FAIL', 'Invalid response structure');
      }

      // Test stats endpoint
      const statsResponse = await axios.get(`${API_URL}/public/stats`);
      if (statsResponse.status === 200 && statsResponse.data.data) {
        const stats = statsResponse.data.data;
        this.addResult('GET /public/stats', 'PASS', 
          `Retrieved stats: ${stats.totalArticles} articles, ${stats.totalIssues} issues`);
      } else {
        this.addResult('GET /public/stats', 'FAIL', 'Invalid response structure');
      }

    } catch (error: any) {
      this.addResult('API Connection', 'FAIL', 
        `API connection failed: ${error.message}. Make sure the server is running on ${API_URL}`);
    }
  }

  async testFileDownloads() {
    console.log('\n📁 Testing File Downloads...\n');

    try {
      // Test article download endpoint
      const downloadResponse = await axios.get(`${API_URL}/public/articles/10.1234/ijatem.2024.001/download`, {
        responseType: 'blob',
        timeout: 5000
      });
      
      if (downloadResponse.status === 200 && downloadResponse.data) {
        this.addResult('Article PDF Download', 'PASS', 
          `Successfully downloaded PDF (${downloadResponse.data.size || 'unknown size'} bytes)`);
      } else {
        this.addResult('Article PDF Download', 'FAIL', 'Download failed or empty response');
      }

    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        this.addResult('Article PDF Download', 'FAIL', 'Server not running - cannot test downloads');
      } else {
        this.addResult('Article PDF Download', 'FAIL', `Download error: ${error.message}`);
      }
    }
  }

  async testVisitorFlowScenarios() {
    console.log('\n👤 Testing Visitor Flow Scenarios...\n');

    try {
      // Scenario 1: Home page → Current Issue → Article View
      console.log('Scenario 1: Home → Current Issue → Article View');
      
      // Get current issue (simulating home page)
      const homeResponse = await axios.get(`${API_URL}/public/current-issue`);
      if (homeResponse.status === 200 && homeResponse.data.data?.articles?.length > 0) {
        const firstArticle = homeResponse.data.data.articles[0];
        
        // Get specific article (simulating article click)
        const articleResponse = await axios.get(`${API_URL}/public/articles/${firstArticle.doi}`);
        if (articleResponse.status === 200) {
          this.addResult('Visitor Flow: Home → Current Issue → Article', 'PASS', 
            `Successfully navigated to article: "${firstArticle.title.substring(0, 40)}..."`);
        } else {
          this.addResult('Visitor Flow: Home → Current Issue → Article', 'FAIL', 
            'Failed to retrieve article from current issue');
        }
      } else {
        this.addResult('Visitor Flow: Home → Current Issue → Article', 'FAIL', 
          'No articles found in current issue');
      }

      // Scenario 2: Archive browsing
      console.log('Scenario 2: Archive browsing');
      
      const archiveResponse = await axios.get(`${API_URL}/public/archive`);
      if (archiveResponse.status === 200 && archiveResponse.data.data?.length > 0) {
        const issues = archiveResponse.data.data;
        this.addResult('Visitor Flow: Archive Browsing', 'PASS', 
          `Successfully browsed archive with ${issues.length} issues`);
      } else {
        this.addResult('Visitor Flow: Archive Browsing', 'FAIL', 
          'Archive browsing failed or no issues found');
      }

      // Scenario 3: Search functionality
      console.log('Scenario 3: Search functionality');
      
      const searchTerms = ['machine learning', 'blockchain', 'sustainability'];
      let searchSuccessCount = 0;
      
      for (const term of searchTerms) {
        try {
          const searchResponse = await axios.get(`${API_URL}/public/search?q=${encodeURIComponent(term)}`);
          if (searchResponse.status === 200) {
            searchSuccessCount++;
          }
        } catch (error) {
          // Continue with other search terms
        }
      }
      
      if (searchSuccessCount === searchTerms.length) {
        this.addResult('Visitor Flow: Search Functionality', 'PASS', 
          `All ${searchTerms.length} search queries executed successfully`);
      } else {
        this.addResult('Visitor Flow: Search Functionality', 'FAIL', 
          `Only ${searchSuccessCount}/${searchTerms.length} search queries succeeded`);
      }

    } catch (error: any) {
      this.addResult('Visitor Flow Scenarios', 'FAIL', 
        `Error testing visitor flows: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🧪 VISITOR/READER FLOW TEST SUITE');
    console.log('=====================================\n');

    await this.testDatabaseData();
    await this.testPublicAPIEndpoints();
    await this.testFileDownloads();
    await this.testVisitorFlowScenarios();

    this.printSummary();
  }

  private printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================\n');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   • ${r.test}: ${r.message}`));
      console.log('');
    }

    console.log('🎯 VISITOR FLOW CHECKLIST:');
    console.log('==========================');
    console.log('✓ Open website → sees Home');
    console.log('✓ Click Current Issue or Archive');
    console.log('✓ Browse list of articles');
    console.log('✓ Click any article → open article page');
    console.log('✓ Read → Download PDF → Cite → Share');
    console.log('✓ Search functionality');
    console.log('✓ Subscribe option available');
    console.log('✓ Submit Paper link available\n');

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Visitor flow is ready for testing.');
    } else {
      console.log('⚠️  Some tests failed. Please fix the issues before testing the visitor flow.');
    }
  }
}

async function main() {
  const tester = new VisitorFlowTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

export { VisitorFlowTester };