//====================================================
// Card class
//====================================================

function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;

  if (!Card.list) Card.list = [];
  this.id = Card.list.length || 0;
  Card.list.push(this);
}

Card.prototype = {
  constructor: Card,
  numSuits: 4,
  numRanks: 13
};

//====================================================
// Deck class
//====================================================

function Deck() {
  this.cards = [];
  var i = 0;
  for (var suit = 0; suit < Card.prototype.numSuits; suit++) {
    for (var rank = 0; rank < Card.prototype.numRanks; rank++) {
      this.cards[i] = new Card(suit, rank);
      i++;
    }
  }
}

Deck.prototype = {
  constructor: Deck,

  deal: function() {
    return this.cards.shift();
  },

  shuffle: function() {
    //Fisher Yates shuffle copied from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    for (var i = this.cards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = this.cards[i];
        this.cards[i] = this.cards[j];
        this.cards[j] = temp;
    }
  },

  getLength: function() {
    return this.cards.length;
  }

};

//====================================================
// Hand class
//====================================================

function Hand(deck, initLength) {
  this.cards = [];
  for (var i = 0; i < initLength; i++) {
    this.addCard(deck.deal());
  }
}

Hand.prototype = {
  constructor: Hand,

  addCard: function(card) {
    if (card === undefined) {
      console.log("this card is undefined");
    }
    this.cards.push(card);
  },

  removeCard: function(indexNum) {
    return this.cards.splice(indexNum, 1)[0]; //splice actually returns an array, so just get the card at the first index
  },

  addCardsByID: function(ids) {
    var hand = this;
    ids.map(function(e){ hand.addCard(Card.list[e]); });
  },

  removeCardsByID: function(ids) {
    //removes all cards from the hand with the passed ID number / contained in the passed array of ID numbers
    this.cards = this.cards.filter(function(e) {
      if (Array.isArray(ids)) {
        return ids.indexOf(e.id) === -1;
      } else if (typeof ids === 'number') {
        return e.id !== ids;
      } else {
        return true;
      }
    });
  },

  getCardByIndex: function(index) {
    return this.cards[index];
  },

  getCardsOfRank: function(rankNum) {
    //checks if a card of the given rank is in the hand
    //returns an array of ids of matching cards
    var cardIDs = [];
    this.cards.forEach(function(card) {
      if (card === undefined) {
        console.log("break here");
      }
      if (card.rank === rankNum) {
        cardIDs.push(card.id);
      }
    });
    return cardIDs;
  },

  getNumCards: function() {
    return this.cards.length;
  }

};

//====================================================
// Player class
//====================================================

function Player(name, deck, handLength) {
  this.hand = new Hand(deck, handLength);
  this.name = name;
  this.checkDiscard();

  if (!Player.list) Player.list = [];
  this.id = Player.list.length || 0;
  Player.list.push(this);
}

Player.getRandomPlayer = function() {
  return Player.list[Math.floor(Math.random() * Player.list.length)];
};

Player.getPlayerAfter = function(player) {
  if (player.id < Player.list.length - 1) {
    return Player.list[player.id + 1];
  } else {
    return Player.list[0];
  }
};

Player.prototype = {
  constructor: Player,

  makeGuess: function() {
    var randomCardIndex = Math.floor(Math.random() * (this.hand.getNumCards() - 1));
    return this.hand.getCardByIndex(randomCardIndex);
  },

  drawUntilRankFound: function(deck, cardRank) {
    var output = new Output();
    if (deck.getLength === 0) return;
    var card;
    do {
      card = deck.deal();
      if (card === undefined) break; //there are no more cards in the deck
      this.hand.addCard(card);
      output.playerDraws(this.name, card.rank, card.suit);
    } while (card.rank !== cardRank);
  },

  checkDiscard: function() {
    //checks the player's hand for collections of 4 cards of identical rank and removes them if found
    var output = new Output();
    for (var i = 0; i < Card.prototype.numRanks; i++) {
      var cardsOfRank = this.hand.getCardsOfRank(i);
      if (cardsOfRank !== undefined && cardsOfRank.length === 4) {
        this.hand.removeCardsByID(cardsOfRank);
        output.playerDiscards(this.name, i);
      }
    }
  },

  getCardsFrom: function(givingPlayer, cardIDs) {
    //give cards from one player to another
    givingPlayer.hand.removeCardsByID(cardIDs);
    this.hand.addCardsByID(cardIDs);
  }

};

function Output() {
  //Singleton
  if (!Output.instance) { Output.instance = this; }
  return Output.instance;
}

//Output.suitChars = ['♠','♣','♥','♦'];
Output.rankStrs = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];
Output.suitStrs = ['Spades','Clubs','Hearts','Diamonds'];

Output.prototype = {
  constructor:  Output,

  getRankStr: function(rankNum) {
    return Output.rankStrs[rankNum];
  },

  getSuitStr: function(suitNum) {
    return Output.suitStrs[suitNum];
  },

  gameBegin: function() {
    console.log("Welcome to DrinkJS");
  },

  turnBegin: function(playerName) {
    console.log(playerName + "'s Turn!");
  },

  cardChoice: function(playerName, cardRank, cardSuit) {
    console.log(playerName + " shows the " + this.getRankStr(cardRank) + " of " + this.getSuitStr(cardSuit));
  },

  giveCards: function(givingPlayer, takingPlayer, cardIDs) {
    var o = this;
    var cardStr = "";
    cardIDs.map(function(e) {
      cardStr += "\n\t" + o.getRankStr(Card.list[e].rank) + " of " + o.getSuitStr(Card.list[e].suit);
    });
    console.log(givingPlayer + " gives " + takingPlayer + " the following:" + cardStr);
  },

  playerHasNo: function(playerName, cardRank) {
    console.log(playerName + " has no " + this.getRankStr(cardRank) + "s!");
  },

  playerDraws: function(playerName, cardRank, cardSuit) {
    console.log(playerName + " draws the " + this.getRankStr(cardRank) + " of " + this.getSuitStr(cardSuit));
  },

  playerDiscards: function(playerName, cardRank) {
    console.log(playerName + " discards four " + this.getRankStr(cardRank) + "s!");
  },

  gameEnd: function(winningPlayerName) {
    console.log("Player " + winningPlayerName + " has won the game!!!!");
  }
};

//====================================================
// Game class
//====================================================

function Game(nameArray) {
  Game.NUM_PLAYERS = 2;
  Game.STARTING_HAND_COUNT = 5;

  this.deck = new Deck();
  this.deck.shuffle();

  for (var i = 0; i < Game.NUM_PLAYERS; i++) {
    new Player(nameArray[i], this.deck, Game.STARTING_HAND_COUNT);
  }

  this.output = new Output();
}

Game.prototype = {
  constructor: Game,

  play: function() {
    var currentPlayer, otherPlayer, winningPlayer;
    this.output.gameBegin();
    do {
      //if this is the first turn, there is no other player. Get a random player to start the game instead.
      currentPlayer = otherPlayer || Player.getRandomPlayer();
      this.output.turnBegin(currentPlayer.name);
      //otherPlayer is the player that currentPlayer takes cards from
      otherPlayer = Player.getPlayerAfter(currentPlayer);
      var guessedCard = currentPlayer.makeGuess();
      this.output.cardChoice(currentPlayer.name, guessedCard.rank, guessedCard.suit);
      var matchingCardIDs = otherPlayer.hand.getCardsOfRank(guessedCard.rank);

      if (matchingCardIDs.length > 0) {
        currentPlayer.getCardsFrom(otherPlayer, matchingCardIDs);
        this.output.giveCards(otherPlayer.name, currentPlayer.name, matchingCardIDs);
      } else {
        this.output.playerHasNo(otherPlayer.name, guessedCard.rank);
        currentPlayer.drawUntilRankFound(this.deck, guessedCard.rank);
      }

      currentPlayer.checkDiscard();
      winningPlayer = this.findWinningPlayerNum([currentPlayer, otherPlayer]); //always check the currentPlayer first, in case they bottomed otherPlayer's hand
      //winningPlayer = true;
    } while (winningPlayer === undefined);

    this.output.gameEnd(Player.list[winningPlayer].name);
  },

  findWinningPlayerNum: function(playerArray) {
    //a player who empties their hand wins.
    //if the deck is emptied, the player with the smallest hand wins.
    //If a winner is found, return their number
    var winningPlayerNum;
    if (this.deck.getLength() === 0) {
      var smallestHandLength;
      Player.list.forEach(function(player, playerNum) {
        if (smallestHandLength === undefined || player.hand.getNumCards() < smallestHandLength) {
          winningPlayerNum = playerNum;
          smallestHandLength = player.hand.getNumCards();
        }
      });
      return winningPlayerNum;
    } else {
      for (var i = 0; i < playerArray.length; i++) {
        var handLength = playerArray[i].hand.getNumCards();
        if (handLength === 0) {
          winningPlayerNum = playerArray[i].id;
          break;
        }
      }

    }
    return winningPlayerNum;
  }

};

//====================================================
// Game starts here
//====================================================

//var game = new Game();
//game.play();