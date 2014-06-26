//====================================================
// Card class
//====================================================

function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
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
    this.cards.push(card);
  },

  removeCard: function(indexNum) {
    return this.cards.splice(indexNum, 1)[0]; //splice actually returns an array, so just get the card at the first index
  },

  getCardByIndex: function(index) {
    return this.cards[index];
  },

  getCardsOfRank: function(rankNum) {
    //checks if a card of the given rank is in the hand
    //returns an array of indices of matching cards
    var cardIndices = [];
    this.cards.forEach(function(card, index) {
      if (card.rank === rankNum) {
        cardIndices.push(index);
      }
    });
    return cardIndices;
  },

  getCardIndicesByRank: function() {
    //returns an array of all unique ranks found in the hand and the card indices of that rank
    //array keys are the ranks
    //array values are arrays of the matching card indices
    var cardIndicesByRank = [];
    this.cards.forEach(function(card, index) {
      if (cardIndicesByRank[card.rank] === undefined) {
        cardIndicesByRank[card.rank] = [index];
      } else {
        cardIndicesByRank[card.rank].push(index);
      }
    });
    return cardIndicesByRank;
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
  this.order = Player.list.length || 0;
  Player.list.push(this);
}

Player.getRandomPlayer = function() {
  return Player.list[Math.floor(Math.random() * Player.list.length)];
};

Player.getPlayerAfter = function(player) {
  if (player.order < Player.list.length - 1) {
    return Player.list[player.order + 1];
  } else {
    return Player.list[0];
  }
};

Player.prototype = {
  constructor: Player,

  makeGuess: function() {
    var randomCardIndex = Math.floor(Math.random() * (this.hand.getNumCards() - 1));
    return this.hand.getCardByIndex(randomCardIndex).rank;
  },

  drawUntilRankFound: function(deck, cardRank) {
    if (deck.getLength === 0) return;
    var card;
    do {
      card = deck.deal();
      if (card === undefined) break; //there are no more cards in the deck
      this.hand.addCard(card);
    } while (card.rank !== cardRank);
  },

  checkDiscard: function() {
    //checks the player's hand for collections of 4 cards of identical rank and removes them if found
    var player = this;
    for (var i = 0; i < Card.prototype.numRanks; i++) {
      var cardsOfRank = player.hand.getCardsOfRank(i);
      if (cardsOfRank !== undefined && cardsOfRank.length === 4) {
        var shift = 0;
        cardsOfRank.forEach(function(index) {
          player.hand.removeCard(index - shift);
          shift++;
        });
      }
    }
  },

  getCardsFrom: function(givingPlayer, handIndices) {
    //give cards from one player to another
    var player = this;
    var shift = 0; //as cards are removed from givingPlayer's hand, we need to adjust the index to match the new length
    handIndices.forEach(function(cardNum) {
      var card = givingPlayer.hand.removeCard(cardNum - shift);
      player.hand.addCard(card);
      shift++;
    });
  }

};

//====================================================
// Game class
//====================================================

function Game() {
  Game.NUM_PLAYERS = 2;
  Game.STARTING_HAND_COUNT = 5;

  this.deck = new Deck();
  this.deck.shuffle();

  for (var i = 0; i < Game.NUM_PLAYERS; i++) {
    //we don't actually use this var, player instances are held in Player.list
    var player = new Player(i, this.deck, Game.STARTING_HAND_COUNT);
  }
}

Game.prototype = {
  constructor: Game,

  play: function() {
    var winningPlayer;
    var currentPlayer;
    var otherPlayer;
    do {
      currentPlayer = otherPlayer || Player.getRandomPlayer();
      //otherPlayer is the player that currentPlayer takes cards from
      otherPlayer = Player.getPlayerAfter(currentPlayer);
      var guess = currentPlayer.makeGuess();
      var matchingCardIndices = otherPlayer.hand.getCardsOfRank(guess);

      if (matchingCardIndices.length > 0) {
        currentPlayer.getCardsFrom(otherPlayer, matchingCardIndices);
      } else {
        currentPlayer.drawUntilRankFound(this.deck, guess);
      }

      currentPlayer.checkDiscard();
      winningPlayer = this.findWinningPlayerNum([currentPlayer, otherPlayer]); //always check the currentPlayer first, in case they bottomed otherPlayer's hand
      //winningPlayer = true;
    } while (winningPlayer === undefined);

    this.gameOver(winningPlayer);
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
          winningPlayerNum = playerArray[i].order;
          break;
        }
      }

    }
    return winningPlayerNum;
  },

  gameOver: function(winningPlayer) {
    console.log("Player " + Player.list[winningPlayer].name + " is victorious!");
  }

};

//====================================================
// Game starts here
//====================================================

var game = new Game();
game.play();
