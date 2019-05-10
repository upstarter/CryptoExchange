let rp = require('request-promise');
const def = x => typeof x !== 'undefined'

const app =
  {
    getAccount(id) {
      // TODO: accountLookup
      return new Account(id, 1000, 1000)
    },

    rateLookup(pair) { return Request(pair) },

    buyOrder(account_id, from, to, amt) {
      let ob = new OrderBook
      return ob.buy(account_id, from, to, amt)
    },

    sellOrder(account_id, from, to, amt) {
      let ob = new OrderBook
      return ob.sell(account_id, from, to, amt)
    }
  }

// an order to exchange cryptocurrencies
class Order {
  constructor(account_id, amt, price, side, from, to) {
    this.id = ('oid-' + Math.random().toString(36).substr(2, 9)),
    this.account_id = account_id,
    this.amt = amt,
    this.price = price,
    this.side = side,
    this.from = from,
    this.to = to,
    this.asJSON = () => {
      return JSON.stringify(this)
    }
  }
}

class OrderBook {
  constructor() {
    this.bids = [],
    this.asks = [],

    // populated by this.findMatches
    this.matches = [],

    this.asJSON = () => {
      return JSON.stringify(this)
    }

    this.fetchRate = this.fetchRate.bind(this);
    this.addBid = this.addBid.bind(this);
    this.addAsk = this.addAsk.bind(this);
  }

  buy(account_id, from, to, from_amt) {
    const pair = `${from}-${to}`

    return this.fetchRate(pair)
      .then((json) => {
        let p = parseFloat(json['ticker']['price']).toFixed(2)
        let o = new Order(1, account_id, from_amt, p, 'bid', from, to)
        this.addBid(o)
        let amt = parseFloat(from_amt * p).toFixed(2);
        return [amt, p]
      })
      .catch((err) => {
        console.log(err)
      });

  }

  addBid(o) {
      // this.bids should be ordered lowest to highest price
      // naive implementation for adding bids to orderbook
      let n = this.bids.length

      let buyOrder;
      let i = n;
      for (i; i >= 0; i++) {
        buyOrder = this.bids[i]
    		if (typeof buyOrder == 'undefined'){
          break
        } else if (buyOrder.price < o.price) {
    			break
    		}
      }
      if (i == n-1) {
        this.bids.push(o)
      } else {
        this.bids[i] = buyOrder
      }
  }

  sell(account_id, from, to, from_amt) {
    const pair = `${from}-${to}`
    return this.fetchRate(pair)
      .then((json) => {
        let p = parseFloat(json['ticker']['price']).toFixed(2)
        let o = new Order(account_id, from_amt, p, 'buy', from, to)
        this.addAsk(o)
        let amt = parseFloat(from_amt * p).toFixed(2);
        return [amt, p]
      })
      .catch((err) => {
        console.log(err)
      });
  }

  addAsk(o) {
      // this.asks should be ordered highest to lowest price
      // naive implementation
      let n = this.asks.length

      let sellOrder;
      let i = n;
      for (i; i >= 0; i++) {
        sellOrder = this.asks[i]
        if (typeof sellOrder == 'undefined'){
          break
        } else if (sellOrder.price > o.price) {
          break
        }
      }
      if (i == n-1) {
        this.asks.push(o)
      } else {
        this.asks[i] = sellOrder
      }
  }

  checkMatches() {
    let newMatches = this.findMatches(this.asks, this.bids)
    let updatedMatches = newMatches + this.matches
    let updatedAsks = this.updateAsks(this.asks)
    let updatedBids = this.updateBids(this.bids)
    let as = new AccountServer()

    if (updatedMatches.length < 1) {
      as.updateMatches(updatedMatches, updatedAsks, updatedBids)
    }
  }

  findMatches(asks, bids) {
    // todo: Pro-Rata, FIFO, etc.?
  }

  updateAsks(asks) {
    // todo
  }

  updateBids(bids) {
    // todo
  }

  fetchRate(pair) {
    return app.rateLookup(pair)
  }
}

const Request = (pair) => {
  const url = `https://api.cryptonator.com/api/ticker/${pair}`
  let options = {
      uri: url,
      headers: {
          'User-Agent': 'Request-Promise'
      },
      json: true
  };
  return rp(options)
}

class AccountServer {
  constructor(ID, accounts) {
    this.id = ID,
    this.accounts = accounts, // cached accounts
    this.asJSON = () => {
      return JSON.stringify(this)
    }
  }

  scheduleSendAsk(account_info) {
    let ask = generateAsk(account_info.id)
    let acctId = this.accounts.reduce(() => {   })

    if (ask.size <= account_info.crypto_balance) {  }
    let as = new AskServer()
    as.sendAsk(ask)
  }

  scheduleSendBid(account_info) {
    let bid = generateBid(account_info.id)
    let acctId = this.accounts.reduce(() => {  })
    let bs = new BidServer()
    bs.sendBid(bid)
  }

  updateAccount(acct, match) {
    let askValue = findAskValue(match)

    Account.credit(askValue,  match.ask.crypto_balance)

    let bidValue = findBidValue(match)

    Account.debit(bidValue, match.bid.crypto_balance)
  }
}

class AskServer {
  constructor(ID, askOrders) {
    this.askID = ID
    this.askOrders = askOrders, // cached ask orders
    this.asJSON = () => {
      return JSON.stringify(this)
    }
  }

  sendAsk() { }
}

class BidServer {
  constructor(ID, bidOrders) {
    this.askID = ID
    this.bidOrders = bidOrders, // cached bid orders
    this.asJSON = () => {
      return JSON.stringify(this)
    }
  }
  sendBid() { }
}

class Account {
  constructor(ID, balance, crypto_balance ) {
    this.id = ID,
    this.balance = balance,
    this.crypto_balance = crypto_balance,
    this.asJSON = () => {
      return JSON.stringify(this)
    }
  }

  credit(amt, crypto_amt) {
    this.balance += amt
    this.crypto_balance -= amt
  }

  debit(amt, crypto_amt) {
    this.balance -= amt
    this.crypto_balance += amt
  }
}

class Trade {
  constructor(toID, moID, amt, price) {
    this.taker_order_id = toID,
    this.maker_order_id = moID,
    this.amt = amt,
    this.price = price,
    this.asJSON = () => {
      return JSON.stringify(this)
    }
  }
}

export default app
