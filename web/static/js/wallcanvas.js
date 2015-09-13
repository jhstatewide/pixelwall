import socket from "./socket"
import PixelBuffer from "./pixel_buffer"

function coordToKey(x,y) {
  return "" + x + "," + y;
}

function Pixel(wallName, x, y, color) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.wallName = wallName;
  return this;
}

var PIXEL_SIZE = 2;

var WallCanvas = {
  PIXEL_SIZE: PIXEL_SIZE,
  x1: 0,
  y1: 0,
  x2: 720 / PIXEL_SIZE,
  y2: 720 / PIXEL_SIZE,
  pixels: {},
  pixelBuffer: null,
  channel: null,
  self: this,
  init: function init(name) {
    console.log("WallCanvas initialized");
    var self = this;
    this.name = name;
    this.connect();
    this.self = this;
    this.pixelBuffer = PixelBuffer.init(100, function(list) {
      self.channel.push("put_multi", list);
      list.length = 0;
    })
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
  push: function push(drawObject) {
    // console.log("Doing a push to %o, %o", px, py);
    var x = drawObject.x;
    var y = drawObject.y;
    if (drawObject.type == "pixel") {
      var key = coordToKey(x,y);
      var pixel = this.pixels[key];
      if (pixel.x != x || pixel.y != y) {
        throw("Pixel we looked up isn't the same coordinates!");
      }
      if (pixel) {
        var pushObject = {type: 'pixel', x: pixel.x, y: pixel.y, color: pixel.color, wall: this.name}
        this.pixelBuffer.add(pushObject);
      }
    } else if (drawObject.type == "circle") {
      this.pixelBuffer.add({type: 'circle', x: x, y: y, color: drawObject.color, wall: this.name, size: drawObject.size})
    } else {
      throw "Unknown drawObject type: " + drawObject.type;
    }

  },
  putPixel: function put(x, y, color) {
    var key = coordToKey(x,y);
    if (this.pixels[key]) {
      this.pixels[key].color = color;
    } else {
      var pixel = new Pixel(this.name, x, y, color);
      this.pixels[key] = pixel;
    }
  },
  get: function get(x, y) {
    var key = coordToKey(x,y);
    if (this.pixels[key]) {
      return this.pixels[key];
    } else {
      return new Pixel(this.name, x, y, "#FFFFFF");
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
