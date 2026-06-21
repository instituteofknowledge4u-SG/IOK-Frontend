# Quick Backend API Reference - Class Management

Copy and adapt these route templates for your backend implementation.

## Express.js Route Examples

```javascript
// routes/class_routes.js or similar

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth_middleware");
const classController = require("../controllers/class_controller");

// All routes require authentication
router.use(authMiddleware);

// Class Management Routes
router.post("/add", classController.addClass);
router.get("/all", classController.getClasses);
router.get("/:classId", classController.getClass);
router.patch("/edit/:classId", classController.updateClass);
router.delete("/delete/:classId", classController.deleteClass);

// Feature Management Routes
router.post("/:classId/feature/add", classController.addFeature);
router.delete("/:classId/feature/:featureId", classController.removeFeature);

// User Routes (for teachers dropdown)
router.get("/teachers", userController.getTeachers); // This might exist already

module.exports = router;
```

## Sample Controller Methods

```javascript
// controllers/class_controller.ts or .js

// Add Class with Features
exports.addClass = async (req, res) => {
  try {
    const { name, startDate, endDate, fees, teacherName, features } = req.body;

    // Validation
    if (!name || !startDate || !endDate || !fees || !teacherName) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // Create class document
    const newClass = new Class({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      fees,
      teacherName,
      features: features || [],
      createdBy: req.user.id, // Assuming auth middleware sets req.user
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("features")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Class
exports.getClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const classData = await Class.findById(classId).populate("features");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Class
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, startDate, endDate, fees, teacherName, features } = req.body;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        fees,
        teacherName,
        features: features || [],
      },
      { new: true },
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Class
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const deletedClass = await Class.findByIdAndDelete(classId);

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Feature to Class
exports.addFeature = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, startDate, endDate, fees, teacherName } = req.body;

    if (!name || !startDate || !endDate || !fees || !teacherName) {
      return res.status(400).json({
        success: false,
        message: "Required feature fields missing",
      });
    }

    const feature = {
      id: new Date().getTime().toString(),
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      fees,
      teacherName,
      createdAt: new Date(),
    };

    const classData = await Class.findByIdAndUpdate(
      classId,
      { $push: { features: feature } },
      { new: true },
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(201).json({
      success: true,
      message: "Feature added successfully",
      feature,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove Feature from Class
exports.removeFeature = async (req, res) => {
  try {
    const { classId, featureId } = req.params;

    const classData = await Class.findByIdAndUpdate(
      classId,
      { $pull: { features: { id: featureId } } },
      { new: true },
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Feature removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Teachers (for dropdown)
// This endpoint might already exist in your user controller
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "Teacher" })
      .select("id name email role")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

## Sample Mongoose Model

```javascript
// models/Class.ts or .js

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  fees: {
    type: Number,
    required: true,
    min: 0,
  },
  teacherName: {
    type: String,
    required: true,
  },
  features: [
    {
      id: String,
      name: String,
      startDate: Date,
      endDate: Date,
      fees: Number,
      teacherName: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Class", classSchema);
```

## Register Routes in Main App

```javascript
// In your main backend file (index.js, app.js, etc.)

const classRoutes = require("./routes/class_routes");

// Mount the routes
app.use("/api/class", classRoutes);
```

## Testing the Endpoints

```bash
# Create a class
curl -X POST http://localhost:YOUR_PORT/api/class/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced JavaScript",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "fees": 1000,
    "teacherName": "John Doe",
    "features": [
      {
        "name": "React Basics",
        "startDate": "2024-01-01",
        "endDate": "2024-03-31",
        "fees": 300,
        "teacherName": "Jane Smith"
      }
    ]
  }'

# Get all classes
curl -X GET http://localhost:YOUR_PORT/api/class/all \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get single class
curl -X GET http://localhost:YOUR_PORT/api/class/CLASSID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get teachers
curl -X GET http://localhost:YOUR_PORT/api/user/teachers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Important Notes

1. **Authentication**: All endpoints require JWT token authentication
2. **Validation**: Implement server-side validation for all inputs
3. **Date Format**: Use ISO 8601 format (YYYY-MM-DD)
4. **Error Handling**: Follow the response format shown above
5. **Security**: Validate teacher names exist in the database
6. **Indexes**: Create database indexes on frequently queried fields
7. **Timestamps**: Automatically track createdAt and updatedAt
8. **User Context**: Capture createdBy from authenticated user

## Field Constraints

| Field       | Type     | Required | Constraints                     |
| ----------- | -------- | -------- | ------------------------------- |
| name        | String   | Yes      | Non-empty, max 100 chars        |
| startDate   | Date     | Yes      | Valid ISO date, before endDate  |
| endDate     | Date     | Yes      | Valid ISO date, after startDate |
| fees        | Number   | Yes      | Non-negative number             |
| teacherName | String   | Yes      | Must exist in User collection   |
| features    | Array    | No       | Array of feature objects        |
| createdBy   | ObjectId | No       | Reference to User               |

## Response Status Codes Reference

- **200**: Success (GET, PATCH, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found (resource doesn't exist)
- **500**: Server Error
