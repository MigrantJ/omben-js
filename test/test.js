describe('Card', function() {
  it('should pass this test', function() {
    var card = new Card(0, 0);
    expect(card.testKarma(5)).toBe(7);
  });
});
