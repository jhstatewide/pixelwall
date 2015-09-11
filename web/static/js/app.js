// Brunch automatically concatenates all files in your
// watched paths. Those paths can be configured at
// config.paths.watched in "brunch-config.js".
//
// However, those files will only be executed if
// explicitly imported. The only exception are files
// in vendor, which are never wrapped in imports and
// therefore are always executed.

// Import dependencies
//
// If you no longer want to use a dependency, remember
// to also remove its path from "config.paths.watched".
import "deps/phoenix_html/web/static/js/phoenix_html"

// Import local files
//
// Local files can be imported directly using relative
// paths "./socket" or full ones "web/static/js/socket".

import socket from "./socket"
import WallCanvas from "./wallcanvas"

var wall1 = WallCanvas.init("1");
var wallCanvas = document.getElementById('pixelwall');
console.log("Our wall starts at: ", wall1.x1);

function lineInterpolate( point1, point2, distance )
{
  var xabs = Math.abs( point1.x - point2.x );
  var yabs = Math.abs( point1.y - point2.y );
  var xdiff = point2.x - point1.x;
  var ydiff = point2.y - point1.y;

  var length = Math.sqrt( ( Math.pow( xabs, 2 ) + Math.pow( yabs, 2 ) ) );
  var steps = length / distance;
  var xstep = xdiff / steps;
  var ystep = ydiff / steps;

  var newx = 0;
  var newy = 0;
  var result = new Array();

  for( var s = 0; s < steps; s++ )
  {
    newx = point1.x + ( xstep * s );
    newy = point1.y + ( ystep * s );

    result.push( {
      x: Math.round(newx),
      y: Math.round(newy)
    } );
  }

  return result;
}

function renderSinglePixel(wall, context, px, py) {
  var pixel = wall.get(px, py);
  // console.log("Rending pixel at %o,%o is equal to %o", px, py, pixel);
  var cx1 = px * WallCanvas.PIXEL_SIZE;
  var cy1 = py * WallCanvas.PIXEL_SIZE;
  context.fillStyle = pixel.color;
  // console.log("The bounds of %o,%o are %o,%o -> %o,%o", px, py, cx1, cy1, WallCanvas.PIXEL_SIZE, WallCanvas.PIXEL_SIZE);
  context.fillRect(cx1, cy1, WallCanvas.PIXEL_SIZE, WallCanvas.PIXEL_SIZE);
}

function render(wall, canvas) {
  // console.log("Our canvas is: %o", canvas);
  var context = canvas.getContext('2d');
  context.width = (wall.x2 - wall.x1) * WallCanvas.PIXEL_SIZE;
  context.height = (wall.y2 - wall.y1) * WallCanvas.PIXEL_SIZE;
  //$(canvas).width(context.width);
  //$(canvas).height(context.height);
  $(canvas).css("border", "1px solid #000000");
  // OK, now iterate over EVERY pixel and get the data...
  for (var py = wall.y1; py < wall.y2; py++) {
    for (var px = wall.x1; px < wall.x2; px++) {
      renderSinglePixel(wall, context, px, py);
    }
  }
}

function localToPixel(x) {
  return Math.floor(x / WallCanvas.PIXEL_SIZE);
}

function handleCanvasClick(canvas, x, y) {
  var px = localToPixel(x);
  var py = localToPixel(y);
  if (lastPx != px || lastPy != py) {
    // console.log("We clicked the canvas at: %o, %o (raw: %o, %o)", px, py, x, y);
    var newPoints = lineInterpolate({x: lastPx, y: lastPy}, {x: px, y: py}, 1);
    console.log("The new points are: %o", newPoints);
    lastPx = px;
    lastPy = py;
    newPoints.forEach( function(point) {
      var px = point.x;
      var py = point.y;
      wall1.put(px, py, currentColor);
      wall1.push(px, py);
      renderSinglePixel(wall1, canvas.getContext('2d'), px, py);
    });
  }
}

var lastPx = 0;
var lastPy = 0;
var currentColor = '#000000';

function updateCurrentColor(color) {
  $('#color-area').css("background-color", color);
  currentColor = color;
}

function recursiveLoad(wall, rows) {
  var row = rows.shift();
  if (row == null) {
    return;
  }
  var name = wall.name;
  var startX = wall.x1;
  var endX = wall.x2;
  if (! name ) {
    throw("Name can't be null!");
  }
  $.ajax({
    type: 'GET',
    url: "/api/wall/" + name + "/row/" + startX + "/" + endX + "/" + row,
    success: function(data, status, xhr) {
      // console.log("We got: %o", data);
      for (var x = startX; x < endX; x++) {
        var idx = endX - x;
        wall.put(x, row, data[idx]);
        renderSinglePixel(wall, wallCanvas.getContext('2d'), x, row);
      }
      recursiveLoad(wall, rows);
    }
  });
}

updateCurrentColor(currentColor);

$(document).ready( function() {
  console.log("The document is ready!");

  $('.demo2').colorpicker();

  $(wallCanvas).mousemove( function(evt) {
    if (evt.which == 1) {
      var x = evt.offsetX;
      var y = evt.offsetY;
      handleCanvasClick(wallCanvas, x, y);
    }
  });

  $(wallCanvas).mousedown( function(evt) {
    var x = evt.offsetX;
    var y = evt.offsetY;
    lastPx = localToPixel(x);
    lastPy = localToPixel(y);
    wall1.put(lastPx, lastPy, currentColor);
    wall1.push(lastPx, lastPy);
    renderSinglePixel(wall1, canvas.getContext('2d'), lastPx, lastPy);
  });

  var rowCount = wall1.y2 - wall1.y1;
  var rows = Array.apply(null, Array(rowCount)).map(function (_, i) {return i;});
  recursiveLoad(wall1, rows);

  render(wall1, wallCanvas);

  wall1.channel.on("put", function(data) {
    // console.log("We got this from the socket: %o", data);
    wall1.put(data.x, data.y, data.color);
    renderSinglePixel(wall1, wallCanvas.getContext('2d'), data.x, data.y);
  });

  $('.color-btn').click( function(evt) {
    // console.log("We clicked: %o", this);
    var selectedColor = $(this).attr("data-color");
    // console.log("We selected color: " + selectedColor)
    updateCurrentColor(selectedColor);
  });
});
