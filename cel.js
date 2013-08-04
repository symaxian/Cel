/*

	TODO:
		Add more checks
		Export data to json
		Generate output faster, use string concatenation then native parsing?
		Prettier output
		Move to enumerations for event names, then to a typed array for speed

*/

Cel = {

		//
		//  Properties
		//______________//
	
	contexts: [],

	wrappers: [],

	parameterCounts: {

		'duplicate': 1,
		'duplicate-end': 0,

		'get fillStyle': 0,
		'set fillStyle': 1,

		'get strokeStyle': 0,
		'set strokeStyle': 1,

		'createLinearGradient': 4,

		'createRadialGradient': 5,

		'createPattern': 2,

		'get lineWidth': 0,
		'set lineWidth': 1,

		'get lineCap': 0,
		'set lineCap': 1,

		'get lineJoin': 0,
		'set lineJoin': 1,

		'get miterLimit': 0,
		'set miterLimit': 1,

		'getLineDash': 0,
		'setLineDash': 1,

		'get shadowColor': 0,
		'set shadowColor': 1,

		'get shadowOffsetX': 0,
		'set shadowOffsetX': 1,

		'get shadowOffsetY': 0,
		'set shadowOffsetY': 1,

		'get shadowBlur': 0,
		'set shadowBlur': 1,

		'fillRect': 4,
		'strokeRect': 4,
		'clearRect': 4,

		'get fillRule': 0,
		'set fillRule': 1,

		'beginPath': 0,
		'moveTo': 2,
		'lineTo': 2,
		'arcTo': 5,
		'arc': 6,
		'ellipse': 8,
		'quadraticCurveTo': 4,
		'bezierCurveTo': 4,
		'rect': 4,
		'closePath': 0,

		'fill': 0,
		'stroke': 0,
		'clip': 0,
		'resetClip': 0,

		'isPointInPath': 2,

		'get font': 0,
		'set font': 1,

		'get textAlign': 0,
		'set textAlign': 1,

		'get baseLine': 0,
		'set baseLine': 1,

		'get direction': 0,
		'set direction': 1,

		'fillText': 4,
		'strokeText': 4,
		'measureText': 1,

		'drawImage': 9,

		'createImageData': 2,
		'getImageData': 4,
		'putImageData': 7,

		'save': 0,
		'restore': 0,

		'scale': 2,
		'rotate': 1,
		'translate': 2,

		'transform': 6,
		'setTransform': 6,

		'get globalAlpha': 0,
		'set globalAlpha': 1,

		'get globalCompositeOperation': 0,
		'set globalCompositeOperation': 1,

		'get enableImageSmoothing': 0,
		'set enableImageSmoothing': 1

	},

		//
		//  Methods
		//___________//

	applyObject: function Cel_applyObject(src, dest){
		for(var item in src){
			if(src.hasOwnProperty(item)){
				dest[item] = src[item];
			}
		}
		return dest;
	},

	wrap: function Cel_wrap(ctx){
		var wrapper,
			index = this.contexts.indexOf(ctx);
		if(index === -1){
			this.contexts.push(ctx);
			wrapper = new Cel.Wrapper(ctx);
			this.wrappers.push(wrapper);
			return wrapper;
		}
		return this.wrappers[index];
	},

	toString: function Cel_toString(v){
		if(typeof v === 'string'){
			return '"'+v+'"';
		}
		return v;
	},

	Wrapper: function Cel_Wrapper(ctx){
		this.ctx = ctx;
		this.events = [];
	}

};

//
//  Wrapper
//___________//

Cel.Wrapper.prototype = Object.create(CanvasRenderingContext2D.prototype);

Cel.applyObject({

	ctx: null,

	events: null,

	analysis: null,

	messageCounts: null,

	compressionEnabled: false,
		// Compression is currently broken

		//
		//  Methods
		//___________//

	analyze: function Wrapper_analyze(){

		var i,
			event,
			paramCount,
			msg,
			msgOffset;

		if(this.compressionEnabled){
			this.compress();
		}

		this.analysis = new Array(this.events.length);
		this.messageCounts = {};

		for(i=0;i<this.events.length;){

			event = this.events[i];
			paramCount = Cel.parameterCounts[event] || 0;
			msg = '';
			msgOffset = 0;

			
			if(event === 'rect'){
				if(this.events[i+5] === 'fill'){
					msg = 'Notice: Might be able to combine into one fillRect() call';
				}
				else if(this.events[i+5] === 'stroke'){
					msg = 'Notice: Might be able to combine into one strokeRect() call';
				}
			}
			else if(event === 'set globalAlpha'){
				if(this.events[i+1] === 1){
					msg = 'Notice: Possibly overwriting default value';
				}
			}
			else if(event === 'scale'){
				if(this.events[i+1] === 1 && this.events[i+2] === 1){
					msg = 'Warning: Redundant scaling performed';
				}
			}
			else if(event === 'rotate'){
				if(this.events[i+1] === 0){
					msg = 'Warning: Redundant rotation performed';
				}
			}
			else if(event === 'translate'){
				if(this.events[i+1] === 0 && this.events[i+2] === 0){
					msg = 'Warning: Redundant translation performed';
				}
				else if(this.events[i+3] === 'translate'){
					msg = 'Notice: Can be combined with previous translation';
					msgOffset = 3;
				}
			}
			else if(event === 'transform'){
				if(this.events[i+1] === 1 && this.events[i+2] === 0 && this.events[i+3] === 0 && this.events[i+4] === 1 && this.events[i+5] === 0 && this.events[i+6] === 0){
					msg = 'Warning: Redundant transformation applied';
				}
			}
			else if(event === 'setTransform'){
				if(this.events[i+1] === 1 && this.events[i+2] === 0 && this.events[i+3] === 0 && this.events[i+4] === 1 && this.events[i+5] === 0 && this.events[i+6] === 0){
					msg = 'Notice: Possibly overwriting default value';
				}
			}
			else if(event === 'set lineWidth'){
				if(this.events[i+1] === 1){
					msg = 'Notice: Possibly overwriting default value';
				}
			}
			else if(event === 'set lineCap'){
				if(this.events[i+1] === 'butt'){
					msg = 'Notice: Possibly overwriting default value';
				}
			}
			else if(event === 'set lineJoin'){
				if(this.events[i+1] === 'miter'){
					msg = 'Notice: Possibly overwriting default value';
				}
			}
			else if(event === 'set miterLimit'){
				if(this.events[i+1] === 10){
					msg = 'Notice: Possibly overwriting default value';
				}
			}

			if(msg.length){
				this.analysis[i+msgOffset] = msg;
				if(typeof this.messageCounts[msg] === 'number'){
					this.messageCounts[msg]++;
				}
				else{
					this.messageCounts[msg] = 1;
				}
			}

			i += 1+paramCount;

		}
	},

	compress: function Wrapper_compress(){

		var sectionMax = 200,
			section,
			sectionStart = 0,
			atEnd = false,
			done,
			matchCount,
			matches,
			i,
			testIndex;

		while(!atEnd){

			// console.log('Start: '+sectionStart);
			// console.log('events.length: '+this.events.length);

			section = [this.events[sectionStart]];

			if(section[0] !== 'save' && section[0] !== 'restore'){

				// Keep growing section until compressed or until max
				while(!atEnd && section.length < sectionMax){

					done = false;
					matchCount = 0;

					// Gather subsequent matches if any
					while(!atEnd && !done){

						matches = true;
						
						// Compare the current section to the events right after it
						for(i=0;i<section.length;i++){
							testIndex = sectionStart+section.length*(matchCount+1)+i;
							if(testIndex > this.events.length){
								atEnd = true;
								done = true;
								break;
							}
							if(section[i] !== this.events[testIndex]){
								matches = false;
								done = true;
								break;
							}
						}

						if(matches){
							matchCount++;
						}

					}

					if(matchCount){

						// Have some matches, remove all but the original and wrap in a duplicate block, then abandon this section
						this.events.splice(sectionStart+section.length, section.length*matchCount, 'duplicate-end');
						this.events.splice(sectionStart, 0, matchCount+1);
						this.events.splice(sectionStart, 0, 'duplicate');
						break;

					}

					// No matches, grow the section to the next event and repeat
					section.push(this.events[sectionStart+section.length]);

				}

			}

			sectionStart += 1+Cel.parameterCounts[this.events[sectionStart]] || 0;

			if(sectionStart > this.events.length){
				atEnd = true;
			}

		}

	},

	exportHTML: function Wrapper_exportHTML(){
		this.analyze();

		var div = document.createElement('div');
		div.className = 'cel-chart';

		var title = document.createElement('h2');
		title.innerText = 'Cel Canvas Rendering History';
		div.appendChild(title);

		div.appendChild(document.createElement('br'));

		var blockList = [],
			currentBlock = div,
			i, event, paramCount, text;

		for(i=0;i<this.events.length;){
			event = this.events[i];
			paramCount = Cel.parameterCounts[event] || 0;

			span = document.createElement('div');
			span.className = 'event';

			if(event === 'save'){

				span.innerText = 'save()';
				currentBlock.appendChild(span);

				newBlock = document.createElement('div');
				newBlock.className = 'save-block';
				blockList.push(currentBlock);

				currentBlock.appendChild(newBlock);
				currentBlock = newBlock;

				i += 1+paramCount;

			}
			else if(event === 'restore'){

				currentBlock = blockList.pop();

				span.innerText = 'restore()';
				currentBlock.appendChild(span);

				i += 1+paramCount;

			}
			else if(event === 'duplicate'){

				span.innerText = 'Duplicated '+this.events[i+1]+' times:';
				currentBlock.appendChild(span);

				newBlock = document.createElement('div');
				newBlock.className = 'duplicate-block';
				blockList.push(currentBlock);

				currentBlock.appendChild(newBlock);
				currentBlock = newBlock;

				i += 1+paramCount;

			}
			else if(event === 'duplicate-end'){

				currentBlock = blockList.pop();

				i += 1+paramCount;

			}
			else{
			
				text = event;

				if(event.slice(0, 4) === 'set '){
					text += ' = '+Cel.toString(this.events[i+1]);
				}
				else if(paramCount){
					text += '( ';
					for(var j=1;j<=paramCount;j++){
						text += Cel.toString(this.events[i+j]);
						if(j < paramCount){
							text += ', ';
						}
					}
					text += ' )';
				}
				else if(event[3] !== ' '){
					text += '()';
				}

				if(this.analysis[i]){
					var msg = this.analysis[i];
					if(msg.indexOf('Notice') === 0){
						span.className = 'block notice';
					}
					else if(msg.indexOf('Warning') === 0){
						span.className = 'block warning';
					}
					span.title = msg;
				}

				span.innerText = text;
				currentBlock.appendChild(span);

				i += 1+paramCount;

			}

		}

		div.appendChild(document.createElement('br'));
		div.appendChild(document.createElement('br'));

		for(var msg in this.messageCounts){
			block = document.createElement('p');
			if(!msg.indexOf('Notice')){
				block.className = 'block notice';
			}
			else if(!msg.indexOf('Warning')){
				block.className = 'block warning';
			}
			block.innerHTML = msg+' - '+this.messageCounts[msg]+' Occurrences';
			div.appendChild(block);
		}

		return div;
	},

	createLinearGradient: function(x1, y1, x2, y2){
		this.events.push('createLinearGradient', x1, y1, x2, y2);
		return this.ctx.createLinearGradient(x1, y1, x2, y2);
	},

	createRadialGradient: function(x1, y1, r1, x2, y2, r2){
		this.events.push('createRadialGradient', x1, y1, r1, x2, y2, r2);
		return this.ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
	},

	createPattern: function(image, repetition){
		this.events.push('createPattern', image, repetition);
		return this.ctx.createPattern(image, repetition);
	},

	getLineDash: function(){
		this.events.push('getLineDash');
		return this.ctx.getLineDash();
	},

	setLineDash: function(v){
		this.events.push('setLineDash', v);
		return this.ctx.setLineDash(v);
	},

	fillRect: function(x, y, width, height){
		this.events.push('fillRect', x, y, width, height);
		return this.ctx.fillRect(x, y, width, height);
	},

	strokeRect: function(x, y, width, height){
		this.events.push('strokeRect', x, y, width, height);
		return this.ctx.strokeRect(x, y, width, height);
	},

	clearRect: function(x, y, width, height){
		this.events.push('clearRect', x, y, width, height);
		return this.ctx.clearRect(x, y, width, height);
	},

	beginPath: function(){
		this.events.push('beginPath');
		return this.ctx.beginPath();
	},

	moveTo: function(x, y){
		this.events.push('moveTo', x, y);
		return this.ctx.moveTo(x, y);
	},

	lineTo: function(x, y){
		this.events.push('lineTo', x, y);
		return this.ctx.lineTo(x, y);
	},

	arcTo: function(x1, y1, x2, y2, radius){
		this.events.push('arcTo', x1, y1, x2, y2, radius);
		return this.ctx.arcTo(x1, y1, x2, y2, radius);
	},

	arc: function(x, y, radius, startAngle, endAngle, anticlockwise){
		this.events.push('arc', x, y, radius, startAngle, endAngle, anticlockwise);
		return this.ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	},

	ellipse: function(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise){
		this.events.push('ellipse', x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
		return this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
	},

	quadraticCurveTo: function(cpx, cpy, x, y){
		this.events.push('quadraticCurveTo', cpx, cpy, x, y);
		return this.ctx.quadraticCurveTo(cpx, cpy, x, y);
	},

	bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y){
		this.events.push('bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y);
		return this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
	},

	rect: function(x, y, width, height){
		this.events.push('rect', x, y, width, height);
		return this.ctx.rect(x, y, width, height);
	},

	closePath: function(){
		this.events.push('closePath');
		return this.ctx.closePath();
	},

	fill: function(){
		this.events.push('fill');
		return this.ctx.fill();
	},

	stroke: function(){
		this.events.push('stroke');
		return this.ctx.stroke();
	},

	clip: function(){
		this.events.push('clip');
		return this.ctx.clip();
	},

	resetClip: function(){
		this.events.push('resetClip');
		return this.ctx.resetClip();
	},

	isPointInPath: function(x, y){
		this.events.push('isPointInPath', x, y);
		return this.ctx.isPointInPath(x, y);
	},

	fillText: function(text, x, y, maxWidth){
		this.events.push('fillText', text, x, y, maxWidth || null);
		if(maxWidth === undefined){
			return this.ctx.fillText(text, x, y);
		}
		return this.ctx.fillText(text, x, y, maxWidth);
	},

	strokeText: function(text, x, y, maxWidth){
		this.events.push('strokeText', text, x, y, maxWidth || null);
		return this.ctx.strokeText(text, x, y, maxWidth);
	},

	measureText: function(text){
		this.events.push('measureText', text);
		return this.ctx.measureText(text);
	},

	drawImage: function(image, sx, sy, sw, sh, dx, dy, dw, dh){
		this.events.push('drawImage', image, sx, sy, sw || null, sh || null, dx || null, dy || null, dw || null, dh || null);
		if(sw === undefined){
			return this.ctx.drawImage(image, sx, sy);
		}
		if(dx === undefined){
			return this.ctx.drawImage(image, sx, sy, sw, sh);
		}
		return this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
	},

	createImageData: function(width, height){
		this.events.push('createImageData', width, height || null);
		return this.ctx.createImageData(width, height);
	},

	putImageData: function(imageData, dx, dy, dirtyX, dirtyY, dirtyW, dirtyH){
		this.events.push('putImageData', imageData, dx, dy, dirtyX || null, dirtyY || null, dirtyW || null, dirtyH || null);
		return this.ctx.putImageData(imageData, dx, dy, dirtyX, dirtyY, dirtyW, dirtyH);
	},

	save: function(){
		this.events.push('save');
		return this.ctx.save();
	},

	restore: function(){
		this.events.push('restore');
		return this.ctx.restore();
	},

	scale: function(x, y){
		this.events.push('scale', x, y);
		return this.ctx.scale(x, y);
	},

	rotate: function(angle){
		this.events.push('rotate', angle);
		return this.ctx.rotate(angle);
	},

	translate: function(x, y){
		this.events.push('translate', x, y);
		return this.ctx.translate(x, y);
	},

	transform: function(m11, m12, m21, m22, dx, dy){
		this.events.push('transform', m11, m12, m21, m22, dx, dy);
		return this.ctx.transform(m11, m12, m21, m22, dx, dy);
	},

	setTransform: function(m11, m12, m21, m22, dx, dy){
		this.events.push('setTransform', m11, m12, m21, m22, dx, dy);
		return this.ctx.setTransform(m11, m12, m21, m22, dx, dy);
	}

}, Cel.Wrapper.prototype);


Object.defineProperty(Cel.Wrapper.prototype, 'fillStyle', {

	get: function(){
		this.events.push('get fillStyle');
		return this.ctx.fillStyle;
	},

	set: function(v){
		this.events.push('set fillStyle', v);
		return this.ctx.fillStyle = v;
	}

});


Object.defineProperty(Cel.Wrapper.prototype, 'strokeStyle', {

	get: function(){
		this.events.push('get strokeStyle');
		return this.ctx.strokeStyle;
	},

	set: function(v){
		this.events.push('set strokeStyle', v);
		return this.ctx.strokeStyle = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'lineWidth', {

	get: function(){
		this.events.push('get lineWidth');
		return this.ctx.lineWidth;
	},

	set: function(v){
		this.events.push('set lineWidth', v);
		return this.ctx.lineWidth = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'lineCap', {

	get: function lineCap(){
		this.events.push('get lineCap');
		return this.ctx.lineCap;
	},

	set: function lineCap(v){
		this.events.push('set lineCap', v);
		return this.ctx.lineCap = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'lineJoin', {

	get: function lineJoin(){
		this.events.push('get lineJoin');
		return this.ctx.lineJoin;
	},

	set: function lineJoin(v){
		this.events.push('set lineJoin', v);
		return this.ctx.lineJoin = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'miterLimit', {

	get: function miterLimit(){
		this.events.push('get miterLimit');
		return this.ctx.miterLimit;
	},

	set: function miterLimit(v){
		this.events.push('set miterLimit', v);
		return this.ctx.miterLimit = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'shadowColor', {

	get: function shadowColor(){
		this.events.push('get shadowColor');
		return this.ctx.shadowColor;
	},

	set: function shadowColor(v){
		this.events.push('set shadowColor', v);
		return this.ctx.shadowColor = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'shadowOffsetX', {

	get: function shadowOffsetX(){
		this.events.push('get shadowOffsetX');
		return this.ctx.shadowOffsetX;
	},

	set: function shadowOffsetX(v){
		this.events.push('set shadowOffsetX', v);
		return this.ctx.shadowOffsetX = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'shadowOffsetY', {

	get: function shadowOffsetY(){
		this.events.push('get shadowOffsetY');
		return this.ctx.shadowOffsetY;
	},

	set: function shadowOffsetY(v){
		this.events.push('set shadowOffsetY', v);
		return this.ctx.shadowOffsetY = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'shadowBlur', {

	get: function shadowBlur(){
		this.events.push('get shadowBlur');
		return this.ctx.shadowBlur;
	},

	set: function shadowBlur(v){
		this.events.push('set shadowBlur', v);
		return this.ctx.shadowBlur = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'fillRule', {

	get: function fillRule(){
		this.events.push('get fillRule');
		return this.ctx.fillRule;
	},

	set: function fillRule(v){
		this.events.push('set fillRule', v);
		return this.ctx.fillRule = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'font', {

	get: function font(){
		this.events.push('get font');
		return this.ctx.font;
	},

	set: function font(v){
		this.events.push('set font', v);
		return this.ctx.font = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'textAlign', {

	get: function textAlign(){
		this.events.push('get textAlign');
		return this.ctx.textAlign;
	},

	set: function textAlign(v){
		this.events.push('set textAlign', v);
		return this.ctx.textAlign = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'baseLine', {

	get: function baseLine(){
		this.events.push('get baseLine');
		return this.ctx.baseLine;
	},

	set: function baseLine(v){
		this.events.push('set baseLine', v);
		return this.ctx.baseLine = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'direction', {

	get: function direction(){
		this.events.push('get direction');
		return this.ctx.direction;
	},

	set: function direction(v){
		this.events.push('set direction', v);
		return this.ctx.direction = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'globalAlpha', {

	get: function globalAlpha(){
		this.events.push('get globalAlpha');
		return this.ctx.globalAlpha;
	},

	set: function globalAlpha(v){
		this.events.push('set globalAlpha', v);
		return this.ctx.globalAlpha = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'globalCompositeOperation', {

	get: function globalCompositeOperation(){
		this.events.push('get globalCompositeOperation');
		return this.ctx.globalCompositeOperation;
	},

	set: function globalCompositeOperation(v){
		this.events.push('set globalCompositeOperation', v);
		return this.ctx.globalCompositeOperation = v;
	}

});

Object.defineProperty(Cel.Wrapper.prototype, 'enableImageSmoothing', {

	get: function enableImageSmoothing(){
		this.events.push('get enableImageSmoothing');
		return this.ctx.enableImageSmoothing;
	},

	set: function enableImageSmoothing(v){
		this.events.push('set enableImageSmoothing', v);
		return this.ctx.enableImageSmoothing = v;
	}

});
