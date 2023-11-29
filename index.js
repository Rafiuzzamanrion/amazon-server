const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();




// =========== middleware =============
app.use(cors());
app.use(express.json());

// ================= mongodb start ================
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bphasys.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

   
    const productsCollection = client.db('amazon-latest-DB').collection('products');
    const usersCollection = client.db('amazon-latest-DB').collection('users');
    const reviewsCollection = client.db('amazon-latest-DB').collection('reviews');
    const cartCollection = client.db('amazon-latest-DB').collection('cart');


    // --------------- products collection ----------------

    // ---------------- load all products ----------------
    app.get('/products',async(req,res)=>{
        const result = await productsCollection.find().toArray();
        res.send(result);
    });

     //---------------- load specific product ----------------
  app.get('/description/:id',async(req,res)=>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = await productsCollection.findOne(query);
    res.send(result);
  });
    //  ---------------- end products collection----------------


    // ---------------- users collection ----------------
    // ---------------- post users info to database ----------------
    app.post('/users',async(req,res) => {
      const users = req.body;
      const email = users.email;
      const query = {email: email}
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        return res.send('user already exist');
      }
      const result = await usersCollection.insertOne(users)
      res.send(result);
    })

  //  -------------- reviews collection -------------------
  app.get('/reviews',async(req,res)=> {
    const result = await reviewsCollection.find().toArray();
    res.send(result);
  });

  // ------------- post a review from customer ----------------
  app.post('/addReview',async(req,res) => {
    const review = req.body;
    const result = await reviewsCollection.insertOne(review);
    res.send(result);
  })

 

  //  ----------------- cart collection ------------------
  // --------------- post a cart to database -------------------
  app.post('/cart',async(req,res) => {
    const cartData = req.body;
    const result = await cartCollection.insertOne(cartData);
    res.send(result);
  });


  // -------------- load specific users cart -----------------
  app.get('/carts',async(req,res)=> {
    const email = req.query.email;
    console.log(email)
    const query = {email: email};
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  })
























    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ============ mongodb end ==============

app.get('/',(req,res)=>{
    res.send('amazon is running')
});

app.listen(port,()=>{
    console.log(`amazon is running on the port: ${port}`)
})