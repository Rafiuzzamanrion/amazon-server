const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const SSLCommerzPayment = require('sslcommerz-lts')



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

// ----------- ssl commerz ----------------
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

   
    const productsCollection = client.db('amazon-latest-DB').collection('products');
    const usersCollection = client.db('amazon-latest-DB').collection('users');
    const reviewsCollection = client.db('amazon-latest-DB').collection('reviews');
    const cartCollection = client.db('amazon-latest-DB').collection('cart');
    const paymentCollection = client.db('amazon-latest-DB').collection('payment');


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

  // ------------ post a product to database ---------
      app.post('/product',async(req,res)=>{
        const productData = req.body;
        const result = await productsCollection.insertOne(productData);
        res.send(result);
      });

      // ---------- delete a product from database ----------
      app.delete('/deleteProduct',async(req,res)=>{
        const id = req.query.id;
        const query = {_id : new ObjectId(id)};
        const result = await productsCollection.deleteOne(query);
        res.send(result);
      })
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
    });

    //------------------ load all users ------------------
    app.get('/allUsers',async(req,res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    });

    // ------------- delete user -----------------
    app.delete('/deleteUser',async(req,res)=> {
      const id = req.query.id;
      const query = {_id : new ObjectId(id)}
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });
    
    // ------------ update user --------------
    app.patch('/updateUser',async(req,res)=> {
      const id = req.query.id;
      const query = {_id : new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: `admin`
        },
      };
      const result = await usersCollection.updateOne(query,updateDoc);
      res.send(result)
    });

    // --------------- Admin collection ---------------
    // ------------- get admin -----------------
    app.get('/isAdmin', async(req,res) => {
      const email = req.query.email;
     
      if(!email) {
        return res.send('user not founded')
      }
      const query = {email : email};
      const user = await usersCollection.findOne(query);
     
      if(user?.role === 'admin'){
        res.send(true)
      }
      else{res.send(false)}
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
  });

 

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
    const query = {email: email};
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });

  // --------------- delete a cart item from carts -----------------
  app.delete('/deleteCart',async(req,res) => {
    const id = req.query.id;
    const query = {_id : new ObjectId(id)};
    const result = await cartCollection.deleteOne(query);
   
    
    res.send(result);
  });

  app.delete('/deleteCarts',async(req,res)=> {
    const email = req.query.email;
    const query = {email : email}
    const result = await cartCollection.deleteMany(query);
    res.send(result);
  });
  // --------------- payment collection -------------------

  app.post('/postPayment', async(req,res)=> {
    const paymentData = req.body;
    const {name,time,amount,email,number,postcode,currency,address,quantity} = paymentData;
    const trans_id = new ObjectId().toString();
    const data = {
      total_amount: paymentData?.amount,
      currency: paymentData.currency,
      tran_id: trans_id, // use unique tran_id for each api call
      success_url: `http://localhost:5000/payment/success/${trans_id}`,
      fail_url: `http://localhost:5000/payment/failed/${trans_id}`,
      cancel_url: 'http://localhost:5000/cancel',
      ipn_url: 'http://localhost:5000/ipn',
      shipping_method: 'Courier',
      product_name: 'Computer.',
      product_category: 'Electronic',
      product_profile: 'general',
      cus_name: paymentData.name,
      cus_email: paymentData.email,
      cus_add1: paymentData.address,
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: paymentData.postcode,
      cus_country: 'Bangladesh',
      cus_phone: paymentData.number,
      cus_fax: '01711111111',
      ship_name: 'Customer Name',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
  };
console.log(data)
  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
  sslcz.init(data).then(apiResponse => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL
      res.send({url:GatewayPageURL})

      const finalOrder = {
        name:name,
        email:email,
        time:time,
        amount:amount,
        quantity:quantity,
        number:number,
        postcode:postcode,
        currency:currency,
        address:address,
        paidStatus:false,
        transactionId:trans_id
      }
      const result = paymentCollection.insertOne(finalOrder)
      console.log('Redirecting to: ', GatewayPageURL)
  });


app.post('/payment/success/:tranId',async(req,res) => {
console.log(req.params.tranId)
const result = await paymentCollection.updateOne({transactionId: req.params.tranId},{
  $set:{
    paidStatus:true
  }
})

if(result.modifiedCount > 0){
res.redirect(`http://localhost:5173/payment/success/${req.params.tranId}`)
}
});



app.post('/payment/failed/:tranId',async(req,res) => {
console.log(req.params.tranId)
const result = await paymentCollection.deleteOne({transactionId: req.params.tranId})

if(result.deletedCount){
res.redirect(`http://localhost:5173/payment/failed/${req.params.tranId}`)
}
})

    // const result = await paymentCollection.insertOne(paymentData);
    // res.send(result);
  });

  app.get('/loadSpecificCustomerPayment',async(req,res)=> {
    const email = req.query.email;
    const data = await paymentCollection.find()
    const query = {email : email};
    const result = await paymentCollection.find().toArray();
    res.send(result);
  });

  app.get('/allPayments', async(req,res)=> {
    const result = await paymentCollection.find().toArray();
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
});