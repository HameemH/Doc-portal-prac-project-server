const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ld9mo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}
async function run(){
    try{
        await client.connect();
        const servicecollection = client.db("doctorPortal").collection("services");
        const bookingcollection = client.db("doctorPortal").collection("bookings");
        const userscollection = client.db("doctorPortal").collection("users");
       app.get('/services', async(req,res)=>{
           const query ={};
           const cursor =servicecollection.find(query);
           const services = await cursor.toArray();
           res.send(services)
       })
       app.get('/bookings', verifyJWT, async (req, res) => {
        const email = req.query.email;
        console.log(req.body);
        const decodedEmail = req.decoded.email;
        if (email === decodedEmail) {
          const query = {email:email};
          const cursor =  bookingcollection.find(query);
          const bookings= await cursor.toArray();
          return res.send(bookings);
        }
        else {
          return res.status(403).send({ message: 'forbidden access' });
        }
      })
      
       app.post('/bookings', async(req,res)=>{
         const booking = req.body;
         const query ={ treatment: booking.treatment, date:booking.date, name:booking.name}
       
         const exists = await bookingcollection.findOne(query)
         
         if(exists){
           return res.send({success:false, exists})
         }
        else{
          const result = await bookingcollection.insertOne(booking);
          return res.send({success:true, result})
        }
       })
       app.get('/available', async(req, res) =>{
        const date = req.query.date;
        const services = await servicecollection.find().toArray();
        const query = {date: date};
        const bookings = await bookingcollection.find(query).toArray();

        services.forEach(service=>{
          const serviceBookings = bookings.filter(book => book.treatment === service.name);
          const bookedSlots = serviceBookings.map(book => book.slot);
          const available = service.slots.filter(slot => !bookedSlots.includes(slot));
          service.slots = available;
        });
       
  
        res.send(services);
       })
       app.get('/user', verifyJWT, async (req, res) => {
        const users = await userscollection.find().toArray();
        res.send(users);
      });
       app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await userscollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ result, token });
      })
      app.put('/user/admin/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAccount = await userscollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
          const filter = { email: email };
          const updateDoc = {
            $set: { role: 'admin' },
          };
          const result = await userscollection.updateOne(filter, updateDoc);
          res.send(result);
        }
        else{
          res.status(403).send({message: 'forbidden'});
        }
  
      })
      app.get('/admin/:email', async(req, res) =>{
        const email = req.params.email;
        const user = await userscollection.findOne({email: email});
        const isAdmin = user.role === 'admin';
        res.send({admin: isAdmin})
      })

    }
    finally{

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})