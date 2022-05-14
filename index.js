const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ld9mo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const servicecollection = client.db("doctorPortal").collection("services");
        const bookingcollection = client.db("doctorPortal").collection("bookings");
       app.get('/services', async(req,res)=>{
           const query ={};
           const cursor =servicecollection.find(query);
           const services = await cursor.toArray();
           res.send(services)
       })
       app.post('/bookings', async(req,res)=>{
         const booking = req.body;
         const result = await bookingcollection.insertOne(booking);
         res.send(result)
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