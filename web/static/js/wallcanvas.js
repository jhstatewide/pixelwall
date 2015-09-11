import socket from "./socket"

function coordToKey(x,y) {
  return "" + x + "," + y;
}

var Pixel = {
  x: null,
  y: null,
  color: null,
  init: function init(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    return this;
  }
};

var WallCanvas = {
  PIXEL_SIZE: 5,
  x1: 0,
  y1: 0,
  x2: 200,
  y2: 200,
  pixels: {},
  channel: null,
  self: this,
  init: function init(name) {
    console.log("WallCanvas initialized");
    this.name = name;
    this.connect();
    this.self = this;
    return this;
  },
  connect: function() {
    socket.connect({token: window.userToken})
    // Now that you are connected, you can join channels with a topic:
    this.channel = socket.channel("wall:" + this.name, {})
    this.channel.join()
      .receive("ok", resp => { console.log("Joined successfully", resp) })
      .receive("error", resp => { console.log("Unable to join", resp) });
  },
  push: function push(px, py) {
    var key = coordToKey(px,py);
    var pixel = this.pixels[key];
    if (pixel) {
      var data = {wall: this.name, x: px, y: py, color: pixel.color};
      // console.log("I'm pushing this over the web socket: %o", data );
      this.channel.push("put", data);
    }
  },
  put: function put(x, y, color) {
    // console.log("WallCanvas: Putting at %o, %o -> %o", x, y, color);
    // console.log("The channel is: %o", this.channel);
    var key = coordToKey(x,y);
    if (this.pixels[key]) {
      this.pixels[key].color = color;
    } else {
      var pixel = Pixel.init(x, y, color);
      this.pixels[key] = pixel;
    }
  },
  get: function get(x, y) {
    var key = coordToKey(x,y);
    if (this.pixels[key]) {
      return this.pixels[key];
    } else {
      return Pixel.init(x, y, "#FFFFFF");
    }
  },
  allPixels: function() {
    var pixelList = [];
    for (var py = this.y1; py < this.y2; py++) {
      for (var px = this.x1; px < this.x2; px++) {
        pixelList.push([px, py]);
      }
    }
    return pixelList;
  }
};

module.exports = WallCanvas;
