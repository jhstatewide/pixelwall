var PixelBuffer = {
  buffer: [],
  lastFlush: 0,
  interval: 0,
  flushFunction: null,
  self: null,
  init: function init(interval, flushFunction) {
    this.interval = interval;
    this.flushFunction = flushFunction;
    console.log("Initialized with %o and %o", interval, flushFunction);
    this.self = this;
    return this;
  },
  hasElement: function hasElement(e) {
    this.buffer.forEach( function (o) {
      if (_.isEqual(e, o)) {
        return true;
      }
    });
    return false;
  },
  add: function add(e) {
    var self = this;
    if (! self.hasElement(e)) {
      self.buffer.push(e);
    }

    var flushCallback = this.flushFunction;
    var interval = this.interval;
    if (self.buffer.length == 1) {
      // set up the flush...
      setTimeout(function() {
        // console.log("Processing flush function after " + self.interval + " milliseconds!");
        flushCallback(self.buffer);
      }, self.interval);
    }

  }
};

module.exports = PixelBuffer;
