const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;
const stripe = require("stripe")(process.env.PAYMENT_KEY);

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());
// app.use(cors());

// console.log(process.env.Sending_API_Key)

// CRSWebsite
// OeJDkYxtKe4CKQiE

// payroll
// jtNyh3mXohIlorwR

let varifyToken = (req, res, next) => {
  // console.log("middleware running")

  let token = req.cookies?.token;
  // console.log(token)
  // console.log(token)

  if (!token) {
    return res.status(401).send({ message: "unauthorized token" });
  }

  jwt.verify(token, process.env.JWT_Secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized token" });
    }

    req.user = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bnqcs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("CRMDB");
    const userCollection = database.collection("users");
    const taskCollection = database.collection("task");
    const leadCollection = database.collection("leads");
    const followUpCollection = database.collection("followup");
    const ticketCollection = database.collection("ticket");
     const reviewCollection = database.collection("reviews");
    

    app.post("/jwt", async (req, res) => {
      let userData = req.body;

      let token = jwt.sign(userData, process.env.JWT_Secret, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          // secure:false  ,    // Prevent JavaScript access to the cookie
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Send cookie over HTTPS only
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          // secure:false,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Use true in production with HTTPS
        })
        .send({ success: true });
    });

    app.get("/adminCount",async(req,res)=>{

      let query={role:"admin"}
      let result=await userCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/employeeCount",async(req,res)=>{

      let query={role:"executives"}
      let result=await userCollection.find(query).toArray()
      res.send(result)
    })
    app.get("/userCount",async(req,res)=>{

      
      let result=await userCollection.find().toArray()
      res.send(result)
    })

      app.get("/resolveTicket",async(req,res)=>{

      

      let filter={status:"Resolved"}

      let result=await ticketCollection.find(filter).toArray()

      res.send(result)
    })

       app.get("/myreview/:email",async(req,res)=>{

      let email=req.params.email

      let filter={email}

      let result=await reviewCollection.find(filter).toArray()

      res.send(result)
    })


     app.get("/myfollowup/:email",async(req,res)=>{

      let myEmail=req.params.email

      let filter={myEmail}

      let result=await followUpCollection.find(filter).toArray()

      res.send(result)
    })


     app.get("/myTask/:email",async(req,res)=>{

      let email=req.params.email

      let filter={email}

      let result=await taskCollection.find(filter).toArray()

      res.send(result)
    })



    app.get("/myLead/:email",async(req,res)=>{

      let myEmail=req.params.email

      let filter={myEmail}

      let result=await leadCollection.find(filter).toArray()

      res.send(result)
    })

    app.get("/api/review",async(req,res)=>{

     let result=await reviewCollection.find().toArray()
     res.send(result)
    })


    app.post("/api/reviews",async(req,res)=>{


      let formData=req.body

      //  console.log(formData)
      let result= await reviewCollection.insertOne(formData)

      res.send(result)



    })

     app.get("/alltickets",async(req,res)=>{

    let result=await ticketCollection.find().toArray()
    res.send(result)
  })

  app.patch("/api/tickets/:id", async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

    
    const validStatuses = ['Open', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).send({ error: "Invalid status value" });
    }

    const result = await ticketCollection.updateOne(
      { _id: new ObjectId(ticketId) },
      { $set: { status } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({ message: "Task not found or already has this status" });
    }

    res.send({ message: "Status updated successfully", result });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).send({ error: "Something went wrong" });
  }
});


    app.get("/manageFollowup",async(req,res)=>{

    let result=await followUpCollection.find().toArray()
    res.send(result)
  })




  app.get("/manageLead",async(req,res)=>{

    let result=await leadCollection.find().toArray()
    res.send(result)
  })

    app.delete("/api/tasks/:id", async (req, res) => {
      let idx = req.params.id;

      let filter = { _id: new ObjectId(idx) };

      const result = await taskCollection.deleteOne(filter);
      res.send(result);
    });

    app.get("/mytask/:email", async (req, res) => {
      let email = req.params.email;

      let filter = { email };

      let result = await taskCollection.find(filter).toArray();
      res.send(result);
    });

    app.patch("/api/tasks/:id", async (req, res) => {
      const { status } = req.body;
      const result = await taskCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status } }
      );
      res.send(result);
    });

      app.get("/myaddedticket/:email", async (req, res) => {
      let executiveEmail = req.params.email;

      let filter = { executiveEmail };

      let result = await ticketCollection.find(filter).toArray();
      res.send(result);
    });

     app.delete("/api/tickets/:id", async (req, res) => {
      const { id } = req.params;

    
        const query = { _id: new ObjectId(id) };
        const result = await ticketCollection.deleteOne(query);
        res.send(result);
      
    });

     app.post("/api/tickets", async (req, res) => {
      let data = req.body;

      let result = await ticketCollection.insertOne(data);
      res.send(result);
    });
   
    app.patch("/api/followups/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { status },
        };

        const result = await followUpCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error updating follow-up status:", error);
        res.status(500).send({ error: "Failed to update status" });
      }
    });

   
    app.delete("/api/followups/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const query = { _id: new ObjectId(id) };
        const result = await followUpCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error("Error deleting follow-up:", error);
        res.status(500).send({ error: "Failed to delete follow-up" });
      }
    });

    app.get("/myfollowUp/:email", async (req, res) => {
      let myEmail = req.params.email;

      let filter = { myEmail };

      let result = await followUpCollection.find(filter).toArray();
      res.send(result);
    });

    app.post("/api/followups", async (req, res) => {
      let data = req.body;

      let result = await followUpCollection.insertOne(data);
      res.send(result);
    });

    app.patch("/api/leads/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const result = await leadCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      res.send(result);
    });

    app.delete("/api/leads/:id", async (req, res) => {
      const id = req.params.id;
      const result = await leadCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/myleads/:email", async (req, res) => {
      let myEmail = req.params.email;

      let filter = { myEmail };

      let result = await leadCollection.find(filter).toArray();
      res.send(result);
    });

    app.put("/api/tasks/:id", async (req, res) => {
      let idx = req.params.id;

      let updateData = req.body;

      email = updateData.email;
      title = updateData.title;
      description = updateData.description;
      deadline = updateData.deadline;

      let filter = { _id: new ObjectId(idx) };

      const update = {
        $set: { email, title, description, deadline },
      };
      const options = { upsert: true };

      let result = await taskCollection.updateOne(filter, update, options);

      res.send(result);
    });

    app.get("/specificTask/:id", async (req, res) => {
      let idx = req.params.id;

      let filter = { _id: new ObjectId(idx) };

      let result = await taskCollection.findOne(filter);
      res.send(result);
    });

    app.get("/api/tasks", async (req, res) => {
      let result = await taskCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/leads", async (req, res) => {
      let data = req.body;

      let result = await leadCollection.insertOne(data);
      res.send(result);
    });

    app.post("/api/tasks", async (req, res) => {
      let data = req.body;

      let result = await taskCollection.insertOne(data);
      res.send(result);
    });

    app.get("/users/employee/:email", async (req, res) => {
      let email = req.params.email;

      let query = { email };
      let user = await userCollection.findOne(query);

      let executives = false;
      if (user) {
        executives = user?.role === "executives";
      }

      res.send({ executives });
    });

    app.get("/users/admin/:email", async (req, res) => {
      let email = req.params.email;

      let query = { email };
      let user = await userCollection.findOne(query);

      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }

      res.send({ admin });
    });

    app.get("/users",async(req,res)=>{

      let result=await userCollection.find().toArray()

      res.send(result)
    })

    
app.patch("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    const result = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );

    res.send(result);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).send({ error: "Something went wrong" });
  }
});


    app.post("/users", async (req, res) => {
      let users = req.body;
      // console.log(users)
      let email = users?.email;
      let query = { email };

      let existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.status(404).send({ message: "Users already existed" });
      }

      const result = await userCollection.insertOne(users);
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
