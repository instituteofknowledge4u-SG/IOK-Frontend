# Backend API Documentation - Class Management

This document outlines the backend routes and endpoints required to support the new CreateClass feature with Features section.

## Base URL

```
/api/class
```

## Endpoints Required

### 1. Add New Class with Features

**Endpoint:** `POST /class/add`

**Request Body:**

```json
{
  "name": "String (required) - Class name",
  "startDate": "Date (required) - Class start date",
  "endDate": "Date (required) - Class end date",
  "fees": "Number (required) - Class fees",
  "teacherName": "String (required) - Lead teacher name",
  "features": [
    {
      "name": "String - Feature name",
      "startDate": "Date - Feature start date",
      "endDate": "Date - Feature end date",
      "fees": "Number - Feature fees",
      "teacherName": "String - Teacher assigned to this feature"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Class created successfully",
  "class": {
    "id": "String - Class ID",
    "name": "String",
    "startDate": "Date",
    "endDate": "Date",
    "fees": "Number",
    "teacherName": "String",
    "features": "Array of feature objects",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

**Status Code:** 201 Created

---

### 2. Get All Teachers (for dropdown)

**Endpoint:** `GET /user/teachers`

**Response:**

```json
{
  "success": true,
  "teachers": [
    {
      "id": "String",
      "name": "String",
      "email": "String",
      "role": "Teacher"
    }
  ]
}
```

**Status Code:** 200 OK

---

### 3. Get All Classes

**Endpoint:** `GET /class/all`

**Response:**

```json
{
  "success": true,
  "classes": [
    {
      "id": "String",
      "name": "String",
      "startDate": "Date",
      "endDate": "Date",
      "fees": "Number",
      "teacherName": "String",
      "features": "Array",
      "createdAt": "Date"
    }
  ]
}
```

**Status Code:** 200 OK

---

### 4. Get Single Class with Features

**Endpoint:** `GET /class/:classId`

**Response:**

```json
{
  "success": true,
  "class": {
    "id": "String",
    "name": "String",
    "startDate": "Date",
    "endDate": "Date",
    "fees": "Number",
    "teacherName": "String",
    "features": [
      {
        "id": "String",
        "name": "String",
        "startDate": "Date",
        "endDate": "Date",
        "fees": "Number",
        "teacherName": "String"
      }
    ],
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

**Status Code:** 200 OK

---

### 5. Update Class

**Endpoint:** `PATCH /class/edit/:classId`

**Request Body:** (Same as Add Class endpoint)

**Response:** (Same as Add Class endpoint)

**Status Code:** 200 OK

---

### 6. Delete Class

**Endpoint:** `DELETE /class/delete/:classId`

**Response:**

```json
{
  "success": true,
  "message": "Class deleted successfully"
}
```

**Status Code:** 200 OK

---

### 7. Add Feature to Class

**Endpoint:** `POST /class/:classId/feature/add`

**Request Body:**

```json
{
  "name": "String (required)",
  "startDate": "Date (required)",
  "endDate": "Date (required)",
  "fees": "Number (required)",
  "teacherName": "String (required)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Feature added successfully",
  "feature": {
    "id": "String",
    "name": "String",
    "startDate": "Date",
    "endDate": "Date",
    "fees": "Number",
    "teacherName": "String"
  }
}
```

**Status Code:** 201 Created

---

### 8. Remove Feature from Class

**Endpoint:** `DELETE /class/:classId/feature/:featureId`

**Response:**

```json
{
  "success": true,
  "message": "Feature removed successfully"
}
```

**Status Code:** 200 OK

---

## Authentication

- All endpoints require JWT authentication via Bearer token in the Authorization header
- Token is automatically included by the frontend API interceptor

## Error Handling

All error responses should follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Status Codes:**

- 400: Bad Request (Invalid data)
- 401: Unauthorized (Invalid/missing token)
- 403: Forbidden (Insufficient permissions)
- 404: Not Found (Resource doesn't exist)
- 500: Internal Server Error

## Database Schema Reference

### Class Model

- `id`: String (Primary Key)
- `name`: String (Required)
- `startDate`: Date (Required)
- `endDate`: Date (Required)
- `fees`: Number (Required)
- `teacherName`: String (Required)
- `features`: Array of Feature objects (Optional)
- `createdAt`: Date (Auto)
- `updatedAt`: Date (Auto)
- `createdBy`: String (User ID - Optional)

### Feature Model (Embedded in Class)

- `id`: String (Unique within class)
- `name`: String (Required)
- `startDate`: Date (Required)
- `endDate`: Date (Required)
- `fees`: Number (Required)
- `teacherName`: String (Required)
- `createdAt`: Date (Auto)
- `updatedAt`: Date (Auto)

## Frontend Integration

The frontend uses these stores and components:

- **Store:** `useClassStore` (Located in `src/stores/useClassStore.js`)
- **Component:** `CreateClass` (Located in `src/pages/CreateClass.jsx`)

The store handles all API calls and state management. To use the APIs:

```javascript
import useClassStore from "../stores/useClassStore";

const { addClass, getTeachers, getClasses } = useClassStore();

// Create a new class with features
await addClass({
  name: "Advanced JavaScript",
  startDate: "2024-01-01",
  endDate: "2024-06-30",
  fees: 500,
  teacherName: "John Doe",
  features: [
    {
      name: "React Fundamentals",
      startDate: "2024-01-01",
      endDate: "2024-02-28",
      fees: 150,
      teacherName: "Jane Smith",
    },
  ],
});
```

## Notes

- All date fields should be in ISO 8601 format (YYYY-MM-DD)
- Fees should be positive numbers
- Teacher names must match existing teachers in the system
- Features are optional when creating a class
- When updating a class, pass the complete features array (for replacements)
