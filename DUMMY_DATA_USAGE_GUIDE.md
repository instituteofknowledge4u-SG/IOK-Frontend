# Dummy Data Usage Guide

This guide explains how to use the `DUMMY_DATA.json` file for testing and development of the CreateClass feature.

## File Structure Overview

The `DUMMY_DATA.json` file contains 5 main sections:

### 1. **Teachers Array**
Sample teacher data for the teacher dropdown selector.

**Usage:**
```javascript
// In your mock API or backend seed script
const teachers = dummyData.teachers;
// Returns array of 5 teachers that can be selected in the form
```

### 2. **Classes Array**
5 complete class examples with various feature counts:
- Advanced JavaScript (3 features)
- React Mastery Course (4 features)
- Full Stack Web Development (5 features)
- Python for Data Science (3 features)
- TypeScript Essentials (3 features)

**Usage:**
```javascript
// Mock GET /api/class/all response
const allClasses = dummyData.classes;

// Use individual classes for testing
const reactClass = dummyData.classes[1]; // React Mastery Course
```

### 3. **Sample Form Data**
Three ready-to-use form submissions:
- `basicClass` - Web Design with 2 features
- `minimalClass` - Git & Version Control with 0 features
- `extendedClass` - React Native with 5 features

**Usage:**
```javascript
// Test the form with different complexity levels
const testData = dummyData.sampleFormData.basicClass;

// Use in frontend form
setFormData(testData);

// Submit to backend
await addClass(testData);
```

### 4. **Test Scenarios**
5 different testing scenarios:
1. Class without features
2. Class with 2 features
3. Class with 4 features
4. Invalid date range (for error testing)
5. Missing required field (for validation testing)

**Usage:**
```javascript
// Run through each scenario
dummyData.testScenarios.forEach(scenario => {
  console.log(scenario.description);
  console.log(scenario.expectedResult);
});
```

### 5. **API Test Calls**
Complete cURL/Postman ready examples with expected responses.

---

## How to Use for Testing

### Frontend Testing

#### 1. **Test Form with Sample Data**
```javascript
import dummyData from './DUMMY_DATA.json';
import useClassStore from '../stores/useClassStore';

function TestCreateClass() {
  const { addClass } = useClassStore();

  const handleTest = async () => {
    try {
      // Test with basic class
      await addClass(dummyData.sampleFormData.basicClass);
      
      // Test with extended class
      await addClass(dummyData.sampleFormData.extendedClass);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  return <button onClick={handleTest}>Run Tests</button>;
}
```

#### 2. **Populate Teachers Dropdown**
```javascript
// Mock the getTeachers response
jest.mock('../api/api', () => ({
  api: {
    get: jest.fn((url) => {
      if (url === '/user/teachers') {
        return Promise.resolve({
          data: { teachers: dummyData.teachers }
        });
      }
    })
  }
}));
```

#### 3. **Test Form Validation**
```javascript
// Test invalid date range
const invalidScenario = dummyData.testScenarios.scenario4;
try {
  await addClass(invalidScenario.data);
} catch (error) {
  // Should show: "Start date must be before end date"
  expect(error).toBe(invalidScenario.expectedResult);
}

// Test missing required field
const missingFieldScenario = dummyData.testScenarios.scenario5;
try {
  await addClass(missingFieldScenario.data);
} catch (error) {
  // Should show: "Please fill all required fields"
  expect(error).toBe(missingFieldScenario.expectedResult);
}
```

### Backend Testing

#### 1. **Seed Database**
```javascript
// In your backend seed script
const mongoose = require('mongoose');
const Class = require('./models/Class');
const dummyData = require('./DUMMY_DATA.json');

async function seedDatabase() {
  await Class.insertMany(dummyData.classes);
  console.log('Database seeded with dummy classes');
}
```

#### 2. **Test API Endpoints**

**Create Class:**
```bash
curl -X POST http://localhost:5000/api/class/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced JavaScript",
    "startDate": "2024-01-15",
    "endDate": "2024-12-31",
    "fees": 1500,
    "teacherName": "John Doe",
    "features": [
      {
        "name": "ES6+ Fundamentals",
        "startDate": "2024-01-15",
        "endDate": "2024-02-28",
        "fees": 300,
        "teacherName": "Jane Smith"
      }
    ]
  }'
```

**Get All Classes:**
```bash
curl -X GET http://localhost:5000/api/class/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Teachers:**
```bash
curl -X GET http://localhost:5000/api/user/teachers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. **Create Mock API Responses**
```javascript
// In your mock API setup (for testing)
app.get('/api/user/teachers', (req, res) => {
  res.json({ teachers: dummyData.teachers });
});

app.get('/api/class/all', (req, res) => {
  res.json({ classes: dummyData.classes });
});

app.post('/api/class/add', (req, res) => {
  const newClass = {
    id: `class_${Date.now()}`,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    class: newClass
  });
});
```

### Manual Testing Checklist

- [ ] **Teachers Dropdown**
  - [ ] Verify all 5 teachers appear
  - [ ] Can select each teacher
  - [ ] Dropdown works on mobile/tablet/desktop

- [ ] **Form Input Validation**
  - [ ] Fill basic class (test scenario 1)
  - [ ] Fill class with 2 features (test scenario 2)
  - [ ] Fill extended class with 4 features (test scenario 3)
  - [ ] Test invalid dates (test scenario 4)
  - [ ] Test missing fields (test scenario 5)

- [ ] **Feature Management**
  - [ ] Add feature button works
  - [ ] Feature form displays correctly
  - [ ] Can add multiple features
  - [ ] Feature remove button works
  - [ ] Feature counter shows correct count

- [ ] **Responsive Design**
  - [ ] Mobile view (375px): Single column layout ✓
  - [ ] Tablet view (768px): Two column layout ✓
  - [ ] Desktop view (1024px+): Full layout ✓
  - [ ] Touch targets are clickable
  - [ ] No horizontal scrolling

- [ ] **Dark Mode**
  - [ ] Colors display correctly in dark mode
  - [ ] Text is readable
  - [ ] Inputs have proper contrast
  - [ ] Buttons are visible

- [ ] **Notifications**
  - [ ] Success toast after submission
  - [ ] Error toast on validation failure
  - [ ] Toast auto-dismisses

- [ ] **Data Submission**
  - [ ] Form data matches API format
  - [ ] Features array is properly formatted
  - [ ] Dates are in ISO format
  - [ ] All required fields are included

---

## Quick Test Commands

### 1. Copy Sample Data to Form
```javascript
// Open browser console in CreateClass page
const data = {
  name: "Advanced JavaScript",
  startDate: "2024-01-15",
  endDate: "2024-12-31",
  fees: 1500,
  teacherName: "John Doe"
};
// Manually fill in the form with this data
```

### 2. Test Class Without Features
```javascript
// Use this data
{
  "name": "Introduction to Git",
  "startDate": "2024-06-15",
  "endDate": "2024-07-15",
  "fees": 350,
  "teacherName": "John Doe"
}
// Expected: Class created with 0 features
```

### 3. Test Class With Multiple Features
```javascript
// Use sampleFormData.basicClass for 2 features
// Use sampleFormData.extendedClass for 5 features
```

### 4. Test Validation Errors
```javascript
// For date validation
startDate: "2024-12-31"
endDate: "2024-01-01"
// Expected error: "Start date must be before end date"

// For missing fields
name: ""
// Expected error: "Please fill all required fields"
```

---

## Integration with Jest Tests

```javascript
import dummyData from '../DUMMY_DATA.json';

describe('CreateClass Component', () => {
  it('should load teachers dropdown with dummy data', () => {
    // Test code
  });

  it('should submit class with 2 features', async () => {
    const testData = dummyData.sampleFormData.basicClass;
    // Test code
  });

  it('should validate invalid date range', async () => {
    const invalidData = dummyData.testScenarios.scenario4.data;
    // Test code
  });

  it('should display all 5 classes from dummy data', () => {
    const classes = dummyData.classes;
    expect(classes.length).toBe(5);
    // Test code
  });
});
```

---

## Data Statistics

| Item | Count |
|------|-------|
| Teachers | 5 |
| Classes | 5 |
| Total Features | 18 |
| Test Scenarios | 5 |
| API Examples | 3 |
| Sample Form Data Sets | 3 |

---

## File Sizes

- Minimal class (0 features): ~150 bytes
- Basic class (2 features): ~400 bytes
- Extended class (5 features): ~900 bytes

---

## Tips & Tricks

### 1. **Copy Teacher Names for Testing**
```javascript
dummyData.teachers.map(t => t.name);
// ["John Doe", "Jane Smith", "Michael Johnson", "Emily Brown", "David Wilson"]
```

### 2. **Quick Feature Count**
```javascript
dummyData.classes.map(c => ({ name: c.name, features: c.features.length }));
```

### 3. **Test All Scenarios Programmatically**
```javascript
for (const [key, scenario] of Object.entries(dummyData.testScenarios)) {
  console.log(`Testing: ${scenario.description}`);
  console.log(`Expected: ${scenario.expectedResult}`);
}
```

### 4. **Generate Random Test Data**
```javascript
const randomClass = dummyData.classes[Math.floor(Math.random() * 5)];
const randomTeacher = dummyData.teachers[Math.floor(Math.random() * 5)];
```

---

## Troubleshooting

### Teachers Dropdown Shows Empty
1. Check if `getTeachers()` API call is working
2. Verify mock response matches `dummyData.teachers` structure
3. Check console for API errors

### Form Not Submitting With Dummy Data
1. Verify all required fields are present
2. Check date format is ISO-8601 (YYYY-MM-DD)
3. Verify teacher names match exactly
4. Check console for validation errors

### Features Not Displaying
1. Ensure features array is properly nested
2. Verify feature IDs are unique
3. Check that each feature has all required fields

---

## Next Steps

1. **Update Mock API** - Use dummy data for mock API responses
2. **Create Test Suite** - Build Jest tests using this dummy data
3. **Manual Testing** - Follow the checklist above
4. **Backend Integration** - Seed database with this data
5. **Performance Testing** - Test with large datasets

---

**Last Updated:** April 20, 2026
**File Size:** ~25KB
**Formats:** JSON (compatible with all systems)
