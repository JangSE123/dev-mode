const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/init', function (req, res) {
   let user = req.query.user;
   let cash = req.query.cash;
   let point = req.query.point;
   let args = [user, cash, point];
   sdk.send(false, 'init', args, res);
});

app.get('/invoke', function (req, res) {
   let sender = req.query.sender;
   let receiver = req.query.receiver;
   let amount = req.query.amount;
   let args = [sender, receiver, amount];
   sdk.send(false, 'invoke', args, res);
});

app.get('/payment', function (req, res) {
   let buyer = req.query.buyer;
   let seller = req.query.seller;
   let amount = req.query.amount;
   let args = [buyer, seller, amount];
   sdk.send(false, 'payment', args, res);
})

app.get('/query', async function (req, res) {
   try {
      let name = req.query.name;
      let cashArgs = [name + '_cash'];
      let pointArgs = [name + '_point'];

      let cashResult = await sdk.query('query',cashArgs);
      let pointResult = await sdk.query('query', pointArgs);

      res.json({
         cash: cashResult.toString(),
         point: pointResult.toString()
      });
   } catch (error) {
      console.log(`Failed to Query : ${error}`);
      res.status(500).send(error.toString());
   }
});

app.get('/delete', function(req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(false, 'delete', args, res);
})



app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
