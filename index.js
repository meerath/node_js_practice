let dotenv = require("dotenv");
let express = require("express");
let mongoose = require("mongoose");
let axios = require("axios");
let bcrypt = require("bcrypt");
let cors = require("cors");

dotenv.config();

let app = express();
let port = process.env.PORT || 9800;
let dbUri = process.env.MongoLive;

// Middleware to parse JSON request bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  rollno: {
    type: Number,
    unique: true,
  },
});


const notificationSchema = new mongoose.Schema({
  postedBy: {
    type: String,
    required: true,
  },
  postedOn: {
    type: Date,
    required: true,
  },
  paraBody: {
    type: String,
    required: true,
  },
  documents: {
    type: [String], // Assuming documents is an array of strings (URLs or file paths)
    required: true,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
// Specify the custom collection name 'student'
const student = mongoose.model("student", studentSchema, "student");

mongoose.connect(dbUri, { dbName: 'nodePractice' }).then((res) => {
    console.log("successfully connected to the database");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("Failed to connect: " + err);
  });

app.post("/", async (req, res) => {
  const body = req.body;
  console.log(body);
  try {
    await student.create({
      name: body.name,
      age: body.age,
      rollno: body.rollno,
    });
    const allStudents = await student.find();
    return res.status(201).json(allStudents);
  } catch (err) {
    return res.status(500).json({ msg: "Failed to post data", error: err.message });
  }
});

// Route to consume Northwind OData service and save data as employees collection
app.get("/northwind/:entity", async (req, res) => {
  const entity = req.params.entity;
  const url = `https://services.odata.org/V3/Northwind/Northwind.svc/${entity}`;
  try {
    const response = await axios.get(url);
    const employees = response.data.value;

    // Save the fetched data to the employees collection without defining a schema
    const db = mongoose.connection;
    const collection = db.collection('employees');
    await collection.insertMany(employees);

    return res.status(200).json({ msg: "Data fetched and saved successfully", data: employees });
  } catch (err) {
    return res.status(500).json({ msg: "Failed to fetch data from Northwind OData service", error: err.message });
  }
});

// Route to update an employee by EmployeeID
app.put("/update/employee", async (req, res) => {
  const empId = req.body.EmployeeID;
  const newData = req.body;
  const q = { "EmployeeID": parseInt(empId) };
  const db = mongoose.connection;
  try {
    const result = await db.collection("employees").updateOne(q, { $set: newData });
    if (result.matchedCount > 0) {
      res.status(200).json({ msg: "Employee updated" });
    } else {
      res.status(404).json({ msg: "Employee not found" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Failed to update employee", error: err.message });
  }
});

app.post("/addUser", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const db = mongoose.connection;
  const collection = db.collection('users');
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword
    };
    await collection.insertOne(newUser);
    res.status(201).json({ msg: "User added successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to add user", error: err.message });
  }
});

app.post('/addNotification', async (req, res) => {
  const body = req.body;
  console.log(body);
  try {
    const newNotification = await Notification.create({
      postedBy: body.postedBy,
      postedOn: body.postedOn,
      paraBody: body.paraBody,
      documents: body.documents
    });
    return res.status(201).json(newNotification);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to post data', error: err.message });
  }
});

app.get("/:name", async (req, res) => {
  const name = req.params.name;
  const query = { name: name };
  try {
    const result = await student.find(query);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ msg: "Failed to get data", error: err.message });
  }
});

app.get('/getNotifications', async (req, res) => {
  try {
    const notifications = await Notification.find();
    return res.status(200).json(notifications);
  } catch (err) {
    return res.status(500).json({ msg: 'Failed to get notifications', error: err.message });
  }
});

app.get("/home", (req, res) => {
  res.send("Hello, World from the home page!");
});