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
       app.get('/bookings' , async(req,res) =>{
         const query = {};
         const cursor =  bookingcollection.find(query);
         const bookings= await cursor.toArray();
         res.send(bookings)
         console.log(bookings);
       })
       app.post('/bookings', async(req,res)=>{
         const booking = req.body;
         const query ={ treatment: booking.treatment, date:booking.date, name:booking.name}
       
         const exists = await bookingcollection.findOne(query)
        console.log(query);
         console.log(exists);
         
         if(exists){
           return res.send({success:false, exists})
         }
        else{
          const result = await bookingcollection.insertOne(booking);
          return res.send({success:true, result})
        }
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