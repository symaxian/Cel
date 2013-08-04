# Cel

A small HTML5 canvas shim that records and analyzes your usage of the API, providing some tips on how to better use the API.

### Usage

First ensure that the Cel JavaScript and CSS files are included in the web page.

To have Cel record a 2d canvas context, the context must be wrapped and the wrapper must then be treated as the canvas context that it is wrapping.

```JavaScript
var myCanvas = document.getElementById('myCanvas');
var myContext = Cel.wrap(myCanvas.getContext('2d'));
myContext.fillStyle = 'blue';
myContext.fillText(30, 30, 'Hi!');
```

Currently the history of a context can only be outputted directly as HTML.
Call the exportHTML() method on the context wrapper to obtain a DIV element with a visual history of the usage of the canvas element.

```JavaScript
document.body.appendChild(myContext.exportHTML());
```

### Analysis

Cel will also analyze the history of a canvas context, how methods were invoked and what modifications were made to properties.
In the exported HTML, certain events will be highlighted as being suspicious.
Upon hovering over the highlighted event text the reason for why it was flagged as suspicious is revealed.

An example is below. Where the rect() and stroke() method calls may be replaced by a single strokeRect() method call.

<div style="background: lightgray; padding: 12px">
	<div>set strokeStyle = "blue"</div>
	<div style="padding: 4px; margin: 4px; border: 1px solid blue; background: aqua;" title="Notice: Might be able to combine into one strokeRect() call">rect( 0, 0, 60, 40 )</div>
	<div>stroke()</div>
</div>