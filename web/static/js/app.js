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

function pixelsForCircle(x, y, radius) {
  var newPixels = [];
  for(var cy=-radius; cy<=radius; cy++) {
      for(var cx=-radius; cx<=radius; cx++) {
        if(cx*cx+cy*cy <= radius*radius) {
          newPixels.push([x+cx, y+cy]);
        }
      }
  }
  return newPixels;
}

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
  var cx1 = px * WallCanvas.PIXEL_SIZE;
  var cy1 = py * WallCanvas.PIXEL_SIZE;
  context.fillStyle = pixel.color;
  context.fillRect(cx1, cy1, WallCanvas.PIXEL_SIZE, WallCanvas.PIXEL_SIZE);
}

function render(wall, canvas) {
  var context = canvas.getContext('2d');
  context.width = (wall.x2 - wall.x1) * WallCanvas.PIXEL_SIZE;
  context.height = (wall.y2 - wall.y1) * WallCanvas.PIXEL_SIZE;
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

function drawCircle(wall1, canvasContext, px, py, color, brushSize) {
  var circlePixels = pixelsForCircle(px, py, brushSize);
  circlePixels.forEach( function(coords) {
    var px = coords[0];
    var py = coords[1];
    wall1.putPixel(px, py, color);
    renderSinglePixel(wall1, canvasContext, px, py);
  });
}

function handleCanvasDrag(canvas, x, y) {
  var px = localToPixel(x);
  var py = localToPixel(y);
  if (lastPx != px || lastPy != py) {
    var newPoints = lineInterpolate({x: lastPx, y: lastPy}, {x: px, y: py}, 1);
    lastPx = px;
    lastPy = py;
    newPoints.forEach( function(point) {
      var px = point.x;
      var py = point.y;
      if (brushSize == 1) {
        wall1.putPixel(px, py, currentColor);
        wall1.push({type: 'pixel', x: px, y: py});
        renderSinglePixel(wall1, canvas.getContext('2d'), px, py);
      } else {
        drawCircle(wall1, canvas.getContext('2d'), px, py, currentColor, brushSize);
        wall1.push({type: 'circle', x: px, y: py, color: currentColor, size: brushSize})
      }
    });
  }
}

var lastPx = 0;
var lastPy = 0;
var brushSize = 1;
var mouseDown = false;

var currentColor = '#'+(function lol(m,s,c){return s[m.floor(m.random() * s.length)] +
  (c && lol(m,s,c-1));})(Math,'0123456789ABCDEF',4);

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
        wall.putPixel(x, row, data[idx]);
        renderSinglePixel(wall, wallCanvas.getContext('2d'), x, row);
      }
      recursiveLoad(wall, rows);
    },
    error: function(data, status, xhr) {
      recursiveLoad(wall, rows);
    }
  });
}

updateCurrentColor(currentColor);

$(document).ready( function() {
  console.log("The document is ready!");

  $("#sizeSlider").slider({
     formatter: function(value) {
  		    return 'Current value: ' + value;
	   }
  });

  $('#sizeSlider').on("change", function(evt) {
    var newSize = evt.value.newValue;
    console.log("Changed brush size to: %o", newSize);
    brushSize = newSize;
  });

  $(wallCanvas).mousemove( function(evt) {
    if (mouseDown) {
      var x = evt.offsetX;
      var y = evt.offsetY;
      handleCanvasDrag(wallCanvas, x, y);
    }
  });

  $(wallCanvas).mouseup( function(evt) {
    mouseDown = false;
  })

  $(wallCanvas).mousedown( function(evt) {
    mouseDown = true;
    var x = evt.offsetX;
    var y = evt.offsetY;
    lastPx = localToPixel(x);
    lastPy = localToPixel(y);
    if (brushSize == 1) {
      wall1.putPixel(lastPx, lastPy, currentColor);
      wall1.push({type: 'pixel', x: lastPx, y: lastPy});
      renderSinglePixel(wall1, wallCanvas.getContext('2d'), lastPx, lastPy);
    } else {
      drawCircle(wall1, wallCanvas.getContext('2d'), lastPx, lastPy, currentColor, brushSize);
      wall1.push({type: 'circle', x: lastPx, y: lastPy, color: currentColor, size: brushSize})
    }

  });

  var rowCount = wall1.y2 - wall1.y1;
  var rows = Array.apply(null, Array(rowCount)).map(function (_, i) {return i;});
  recursiveLoad(wall1, rows);

  render(wall1, wallCanvas);

  wall1.channel.on("put", function(data) {
    setTimeout( function() {
      wall1.put(data.x, data.y, data.color);
      renderSinglePixel(wall1, wallCanvas.getContext('2d'), data.x, data.y);
    }, 100);
  });

  wall1.channel.on("put_multi", function(datas) {
    setTimeout( function() {
      datas['commands'].forEach(function(command) {
        if (command.type == 'pixel') {
          wall1.putPixel(command.x, command.y, command.color);
          renderSinglePixel(wall1, wallCanvas.getContext('2d'), command.x, command.y);
        } else if (command.type == 'circle') {
          drawCircle(wall1, wallCanvas.getContext('2d'), command.x, command.y, command.color, command.size);
        } else {
          throw "Unknown command type: " + command.type;
        }
      });
    }, 100);
  });

  $('.color-btn').click( function(evt) {
    var selectedColor = $(this).attr("data-color");
    updateCurrentColor(selectedColor);
  });

  $('.bootstrap-colorpicker').colorpicker();
  $('.bootstrap-colorpicker').colorpicker('setValue', currentColor);
  $('.bootstrap-colorpicker input').on('click', function() {
      $('.bootstrap-colorpicker').colorpicker('show');
  });

  $('.bootstrap-colorpicker').colorpicker().on('changeColor.colorpicker', function(event){
    var selectedColor = event.color.toHex();
    $('.bootstrap-colorpicker input').css("background-color", selectedColor);
    updateCurrentColor(selectedColor);
  });

});
