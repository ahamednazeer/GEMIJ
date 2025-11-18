# 👤 VISITOR/READER FLOW TEST GUIDE

## Overview
This guide provides comprehensive testing for the visitor/reader flow functionality of the journal website.

## Visitor Flow Description
```
Open website → sees Home
Click Current Issue or Archive
Browse list of articles
Click any article → open article page
Read → Download PDF → Cite → Share
If want updates → Click Subscribe
If wants to submit → Click Submit Paper → goes to Author flow
```

## Test Data Created

### 📚 Issues & Articles
- **Issue 1 (Current)**: Vol 1, No 1 - "Technology and Innovation" (3 articles)
- **Issue 2**: Vol 1, No 2 - "Sustainable Engineering Solutions" (2 articles)  
- **Issue 3**: Vol 1, No 3 - "Digital Transformation in Industry 4.0" (1 article)

### 📄 Sample Articles
1. **AI Supply Chain Management** - DOI: 10.1234/ijatem.2024.001
2. **Blockchain IoT Security** - DOI: 10.1234/ijatem.2024.002
3. **ML Predictive Maintenance** - DOI: 10.1234/ijatem.2024.003
4. **Renewable Energy Smart Grid** - DOI: 10.1234/ijatem.2024.004
5. **Sustainable Manufacturing LCA** - DOI: 10.1234/ijatem.2024.005
6. **Digital Twin Industry 4.0** - DOI: 10.1234/ijatem.2024.006

## 🚀 Quick Start

### 1. Seed the Database
```bash
cd server
npm run seed
```

### 2. Start the Application
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

### 3. Run Automated Tests
```bash
cd server
npx ts-node src/scripts/test-visitor-flow.ts
```

## 🧪 Manual Testing Checklist

### Home Page Testing
- [ ] Website loads successfully
- [ ] Journal name and description visible
- [ ] Current issue articles displayed (max 6)
- [ ] Statistics showing (articles, issues, views, downloads)
- [ ] "Submit Your Paper" and "Browse Articles" buttons work
- [ ] Navigation menu accessible

### Current Issue Testing
- [ ] Current issue page loads
- [ ] Issue details displayed (volume, number, title, description)
- [ ] All articles listed with:
  - [ ] Title, authors, abstract
  - [ ] Keywords, DOI, pages
  - [ ] View counts and download counts
  - [ ] "View Article" and "Download PDF" buttons
- [ ] Issue statistics calculated correctly
- [ ] Subscribe options available

### Archive Testing
- [ ] Archive page loads
- [ ] Multiple issues displayed
- [ ] Pagination works (if applicable)
- [ ] Issue filtering/sorting works
- [ ] Can navigate to specific issues

### Article View Testing
- [ ] Individual article pages load
- [ ] Full article details displayed
- [ ] PDF download works
- [ ] Citation information available
- [ ] Share functionality works
- [ ] Related articles suggested (if implemented)

### Search Testing
- [ ] Search page accessible
- [ ] Search by keywords works
- [ ] Search by author works
- [ ] Search by year works
- [ ] Search results display correctly
- [ ] Pagination in search results

### Download Testing
- [ ] PDF downloads initiate correctly
- [ ] Downloaded files are valid PDFs
- [ ] Download counts increment
- [ ] File names are appropriate

### Navigation Testing
- [ ] All menu items work
- [ ] Breadcrumb navigation (if implemented)
- [ ] Back/forward browser buttons work
- [ ] Mobile responsive navigation

## 🔧 Automated Test Coverage

The automated test script (`test-visitor-flow.ts`) covers:

### Database Tests
- ✅ Issues exist in database
- ✅ Current issue is properly marked
- ✅ Articles are associated with issues
- ✅ Sample data is complete

### API Endpoint Tests
- ✅ `GET /public/current-issue`
- ✅ `GET /public/archive`
- ✅ `GET /public/issues/:volume/:number`
- ✅ `GET /public/articles/:doi`
- ✅ `GET /public/search`
- ✅ `GET /public/stats`
- ✅ `GET /public/articles/:doi/download`

### Flow Scenario Tests
- ✅ Home → Current Issue → Article navigation
- ✅ Archive browsing functionality
- ✅ Search with multiple terms
- ✅ File download process

## 📊 Expected Test Results

When all tests pass, you should see:
```
🧪 VISITOR/READER FLOW TEST SUITE
=====================================

✅ Database Issues: Found 3 issues in database
✅ Current Issue: Current issue found: Vol 1, No 1 with 3 articles
✅ Database Articles: Found 6 articles in database
✅ GET /public/current-issue: Retrieved current issue: Vol 1, No 1 with 3 articles
✅ GET /public/archive: Retrieved 3 issues from archive
✅ GET /public/issues/:volume/:number: Retrieved specific issue with 3 articles
✅ GET /public/articles/:doi: Retrieved article: "Artificial Intelligence in Supply Chain Management..."
✅ GET /public/search: Search returned 1 articles for "artificial intelligence"
✅ GET /public/stats: Retrieved stats: 6 articles, 3 issues
✅ Article PDF Download: Successfully downloaded PDF
✅ Visitor Flow: Home → Current Issue → Article: Successfully navigated to article
✅ Visitor Flow: Archive Browsing: Successfully browsed archive with 3 issues
✅ Visitor Flow: Search Functionality: All 3 search queries executed successfully

📊 TEST SUMMARY
================
Total Tests: 13
✅ Passed: 13
❌ Failed: 0
Success Rate: 100.0%

🎉 ALL TESTS PASSED! Visitor flow is ready for testing.
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Run `npm run seed` to populate data

2. **API Connection Failed**
   - Ensure server is running on correct port
   - Check VITE_API_URL in client .env
   - Verify no CORS issues

3. **PDF Downloads Fail**
   - Check file permissions in uploads/articles/
   - Ensure PDF files exist
   - Verify server static file serving

4. **Search Returns No Results**
   - Verify articles have proper keywords
   - Check search indexing (if implemented)
   - Test with exact article titles

## 🎯 Success Criteria

The visitor flow is considered successful when:
- ✅ All automated tests pass
- ✅ Manual testing checklist completed
- ✅ No console errors in browser
- ✅ All downloads work correctly
- ✅ Search functionality returns relevant results
- ✅ Navigation is intuitive and responsive
- ✅ Page load times are acceptable
- ✅ Mobile experience is functional

## 📝 Next Steps

After successful testing:
1. Document any issues found
2. Test with different browsers
3. Test mobile responsiveness
4. Performance testing with larger datasets
5. Accessibility testing
6. SEO optimization verification