import { createServer } from 'http';
import app from './app';

const port = process.env.PORT || 3000;

var express    = require('express');
var exp        = express();
var bodyParser = require('body-parser');

// this will let us get the data from a POST
exp.use(bodyParser.urlencoded({ extended: true }));
exp.use(bodyParser.json());

let router = express.Router();

exp.use('/api', router);


router.get("/investors/:id/exchange_rate/:from_symbol/:to_symbol", function(req, res) {
    console.log(req.params.id)
    console.dir(app)

    const user = app.getUser(req.params.id)
    const from = req.params.from_symbol
    const to = req.params.to_symbol

    app.rateLookup(`${from}-${to}`)
      .then((json) => {
          let p = json['ticker']['price']
          let msg = `The exchange rate for ${from} to ${to} is ${p}`
          res.json({ message: msg })
      })
      .catch((err) => {
        console.log(err)
        let msg = `Error: ${err}`
        res.json({ message: msg })
      });

});

router.get("/investors/:id/buy_order/:from_symbol/:to_symbol/:from_amt", function(req, res) {
    const account_id = app.getAccount(req.params.id)
    const from = req.params.from_symbol
    const to = req.params.to_symbol
    const from_amt = req.params.from_amt

    app.buyOrder(account_id, from, to, from_amt)
      .then(([amt, p]) => {
        let msg = `${amt} paid for ${from_amt} ${from}/${to} at price ${p} by ${account_id}.`
        res.json({
          amt: amt,
          from_amt: from_amt,
          from: from,
          to: to,
          price: p,
          account: account_id,
          message: msg
        })
      })
      .catch((err) => {
        res.json({ message: err })
      });
});

router.get("/investors/:id/sell_order/:from_symbol/:to_symbol/:from_amt", function(req, res) {
    const user = app.getAccount(req.params.id)
    const from = req.params.from_symbol
    const to = req.params.to_symbol
    const from_amt = req.params.from_amt

    app.sellOrder(user, from , to, from_amt)
      .then(([amt, p]) => {
        let msg = `${amt} received for ${from_amt} ${from}/${to} at price ${p} by ${user}.`
        res.json({
          amt: amt,
          from_amt: from_amt,
          from: from,
          to: to,
          price: p,
          user: user,
          message: msg
        })
      })
      .catch((err) => {
        res.json({ message: err })
      });
});

// createServer((request, response) => response.end(app()))
//   .listen(port, () => process.stdout.write(`Running on :${port}\n`));
exp.listen(port);
if (module.hot) {
  module.hot.accept('./app');
}
