const express = require('express')
const app = express()
require('dotenv').config();
const cors = require('cors');
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.PAYMENT_KEY);


app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true
}))



app.use(cookieParser());





app.use(express.json());
// app.use(cors());


 
  // console.log(process.env.Sending_API_Key)




// CRSWebsite
// OeJDkYxtKe4CKQiE

// payroll
// jtNyh3mXohIlorwR

let varifyToken=(req,res,next)=>{
  // console.log("middleware running")

  let token =req.cookies?.token
  // console.log(token)
  // console.log(token)



  

  if(!token){
    return res.status(401).send({message:"unauthorized token"})
  }


  jwt.verify(token, process.env.JWT_Secret,(err, decoded)=>{

    if(err){
      return res.status(401).send({message:"unauthorized token"})
    }

    req.user=decoded
    next()
  });
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bnqcs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});





async function run() {
  try {





    const database = client.db("CRMDB");
    const userCollection = database.collection("users");
  


    app.post("/jwt",async(req,res)=>{
      

      let userData=req.body
  
      let token= jwt.sign(userData, process.env.JWT_Secret, { expiresIn: "1h" });
  
      res
      .cookie('token', token, {
        httpOnly: true, 
        // secure:false  ,    // Prevent JavaScript access to the cookie
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",         // Send cookie over HTTPS only
        
    })
      .send({success:true})
      
    });

    app.post("/logout",(req,res)=>{
      res
      .clearCookie('token',  {
        httpOnly: true,
        // secure:false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Use true in production with HTTPS
      })
      .send({success:true})
    })



    app.get("/users/employee/:email",async(req,res)=>{

      let email=req.params.email

     
      let query={email}
      let user= await userCollection.findOne(query)

      let executives=false
      if(user){
        executives= user?.role === "executives"
      }

      res.send({ executives })


    })


    app.get("/users/admin/:email",async(req,res)=>{

      let email=req.params.email

     
      let query={email}
      let user= await userCollection.findOne(query)

      let admin=false
      if(user){
        admin= user?.role === "admin"
      }

      res.send({ admin })


    })


    app.post("/users",async(req,res)=>{

      let users=req.body;
      // console.log(users)
      let email=users?.email
      let query= {email}

      let existingUser= await userCollection.findOne(query)
      if(existingUser){
        return res.status(404).send({message:"Users already existed"})
      }
      
      


      const result = await userCollection.insertOne(users);
      res.send(result)
    })














    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




  





app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})