let dotenv = require("dotenv");
let express = require("express");
let mongoose = require("mongoose");

let axios = require("axios");

dotenv.config();

let app = express();
let port = process.env.PORT || 9800;
let dbUri = process.env.MongoLive;

// Middleware to parse JSON request bodies
app.use(express.json());

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

const student = mongoose.model("student", studentSchema);

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
    // console.log(result);
    var allStudents = await student.find();

    return res.status(201).json(allStudents);
  } catch (err) {
    return res.status(500).json({ msg: "Failed to post data", error: err.message });
  }
});

app.get("/:name", async (req, res)=>{
    const name = req.params.name;
    const query={name: name};
    try {
        const result = await student.find(query);
        return res.status(200).json(result);
    } catch (err){
        return res.status(500).json({msg: "Failed to get data", error: err.message});
    }
   
});

app.get("/northwind/:entity", async (req, res) => {
    const entity = req.params.entity;
    const url = `https://services.odata.org/V3/Northwind/Northwind.svc/${entity}`;
    try {
      const response = await axios.get(url);
      const employees = response.data.value;
      const db = mongoose.connection;
      const collection = db.collection(`${entity}`);
      await collection.insertMany(employees);
  
      return res.status(200).json({ msg: "Data fetched and saved successfully", data: employees });
    } catch (err) {
      return res.status(500).json({ msg: "Failed to fetch data from Northwind OData service", error: err.message });
    }
  });

  app.get("/employee/:empId", async (req, res) => {
       const empId= req.params.empId;
       const q= {"EmployeeID" : parseInt(empId)};
       const db= mongoose.connection;
       try{
        const results= await db.collection("Employees").find(q).toArray();
        res.status(200).json(results)
       } catch(err){
        res.status(500).json({msg: "Failed to get data", error: err.message});
       }
  });


app.get("/home", (req, res) => {
  res.send("Hello, World from the home page!");
});