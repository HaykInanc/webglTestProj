function degToRad(d) {
	return d * Math.PI / 180;
}

function startGame(){
	curGame = new Game();
	curSpaceship = new Spaceship(curGame.gl);
	meteorArr = []

	for(let i=0; i<=10; i++){
		meteorArr.push(new Meteor(curGame.gl))
	}	
}

function gameOverHandler(){
	let modalWindow = document.createElement('div')
	let modalButton = document.createElement('button')
	modalButton.innerText = 'никогда не поздно начать заново'

	modalWindow.innerHTML = '<p> Game Over! </p>'
	modalWindow.innerHTML += `<p> время: ${curGame.timeHandler()} </p>`
	modalWindow.id = 'modal'
	modalWindow.appendChild(modalButton)

	modalButton.addEventListener('click', ()=>{
		modalWindow.remove()
		startGame()
	})
	document.body.appendChild(modalWindow)
}

function createFlattenedVertices(gl, vertices) {
	return webglUtils.createBufferInfoFromArrays(
    gl,
    primitives.makeRandomVertexColors(
        primitives.deindexVertices(vertices),
        {
          vertsPerColor: 6,
          rand: function(ndx, channel) {
            return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
          }
        })
  	);
	};

function checkCollision(obj1, obj2){
	if (Math.abs(obj1.Xpos - obj2.Xpos) < 10 && 
		Math.abs(obj1.Ypos - obj2.Ypos) < 10 &&
		Math.abs(obj1.Zpos - obj2.Zpos) < 10){
		curGame.gameOver = true

	}
}

function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation, zRotation, scale) {
	var matrix = m4.translate(viewProjectionMatrix,
	    translation[0],
	    translation[1],
	    translation[2]);

	if (xRotation){
	    matrix = m4.xRotate(matrix, xRotation)
	}

	if (yRotation){
	    matrix = m4.yRotate(matrix, yRotation)
	}
	if (zRotation){
	    matrix = m4.zRotate(matrix, zRotation)
	}

	if (scale){
	  	matrix = m4.scale(matrix,
	    	scale[0],
	    	scale[1],
	    	scale[2]);
	}
	return matrix
}


class Game {
	constructor(){
		var canvas = document.getElementById("canvas");
  		this.gl = canvas.getContext("webgl");
  		this.cameraAngleRadians = degToRad(0);
  		this.fieldOfViewRadians = degToRad(60);
  		this.cameraHeight = 50;
  		this.cameraMatrix = null
  		this.programInfo = webglUtils.createProgramInfo(this.gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  		this.Xcamera = 0
  		this.Ycamera = 30
  		this.Zcamera = 100
  		this.timeElem = document.getElementById('time')
  		this.timeStart = Date.now()
  		this.timeEnd = Date.now()
  		this.gameOver  = false
	}

	timeHandler(){
  		this.timeEnd = Date.now()
  		let time = this.timeEnd - this.timeStart
  		let timeMilsec = time % 1000
  		let timeSec = Math.round(time/1000)%60
  		let timeMin = Math.round(time/(1000*60))%60
  		let timeH = Math.round(time/(1000*60*60))%60
  		let formTime = timeH
						+ ':' + timeMin
						+ ':' + timeSec
						+ ':' + timeMilsec
  		this.timeElem.innerText = formTime

		return formTime
	}



  	preDrawScene(){
  		webglUtils.resizeCanvasToDisplaySize(this.gl.canvas);

  		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

	    this.gl.enable(this.gl.CULL_FACE);
	    this.gl.enable(this.gl.DEPTH_TEST);

	    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	    var aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
	    var projectionMatrix =
	        m4.perspective(this.fieldOfViewRadians, aspect, 1, 2000);

	    var cameraPosition = [this.Xcamera, this.Ycamera, this.Zcamera];
	    var target = [0, 0, 0];
	    var up = [0, 1, 0];
	    this.cameraMatrix = m4.lookAt(cameraPosition, target, up);

	    // Make a view matrix from the camera matrix.
	    var viewMatrix = m4.inverse(this.cameraMatrix);


	    viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  	}

  	drawScene(objectsToDraw){
		var programInfo = objectsToDraw.programInfo;
		var bufferInfo = objectsToDraw.bufferInfo;

		this.gl.useProgram(programInfo.program);

		// Setup all the needed attributes.
		webglUtils.setBuffersAndAttributes(this.gl, programInfo, bufferInfo);

		// Set the uniforms.
		webglUtils.setUniforms(programInfo, objectsToDraw.uniforms);

		// Draw
		this.gl.drawArrays(this.gl.TRIANGLES, 0, bufferInfo.numElements);
  	}
}


class Meteor{
	constructor(gl){
		this.gl = gl
		this.Zpos = -2000 
		this.Xpos = (Math.random()-0.5)*1000
		this.Ypos = 0
		this.Zspeed = Math.random()*3 + 3
		this.Xspeed = Math.random()*2-1
		this.XRotation   = 0
		this.YRotation   = 0
		this.ZRotation   = 0
		this.size = [0, 0, 0]
		this.bufferInfo = createFlattenedVertices(this.gl, primitives.createSphereVertices(10, 10, 10))
		this.uniforms = {
		    u_colorMult: [0.1, 0.8, 0.1, 1], 
		    u_matrix: m4.identity()
		  };
	}
	update(viewProjectionMatrix, shift){
		this.Zpos +=this.Zspeed
		this.Xpos +=this.Xspeed + shift
		this.translation = [this.Xpos, this.Ypos, this.Zpos];
		this.size[0]+=0.003
		this.size[1]+=0.003
		this.size[2]+=0.003
		this.uniforms.u_matrix = computeMatrix(
			viewProjectionMatrix
			,this.translation
			,this.XRotation
			,this.YRotation
			,this.ZRotation
			,this.size
		);
	}

	getForDraw(programInfo){
		return     {
	      programInfo: programInfo,
	      bufferInfo:  this.bufferInfo,
	      uniforms:    this.uniforms,
	    }
	}
}

class Spaceship{
	constructor(gl){
		this.gl = gl
		this.Zpos = 20
		this.Xpos = 1
		this.Ypos = 1
		this.Zspeed =0
		this.Xspeed = 0
		this.XRotation   = -90
		this.YRotation   = 0
		this.ZRotation   = 0
		this.size = [1.2, 1.2, 1.2]
		this.bufferInfo = createFlattenedVertices(this.gl, primitives.createTruncatedConeVertices(10, 1, 40,10,20))
		this.shift = 0
		this.uniforms = {
		    u_colorMult: [0.8, 0.1, 0.1, 1], 
		    u_matrix: m4.identity()
		  };
		this.translation = [this.Xpos, this.Ypos, this.Zpos];
	}
	update(viewProjectionMatrix, event, game){
		if(event){
			var coef = event.layerX/this.gl.canvas.width*2-1
			this.shift = -coef*4
			this.YRotation = coef*90
			this.Xpos = coef *30
			game.Xcamera = -coef * 30
		}

		this.uniforms.u_matrix = computeMatrix(
			viewProjectionMatrix
			,this.translation
			,degToRad(this.XRotation)
			,degToRad(this.YRotation)
			,degToRad(this.ZRotation)
		);
	}

	getForDraw(programInfo){
		return     {
	      programInfo: programInfo,
	      bufferInfo:  this.bufferInfo,
	      uniforms:    this.uniforms,
	    }
	}
}



var curGame = new Game();
var curSpaceship = new Spaceship(curGame.gl);
var meteorArr = []

for(let i=0; i<=10; i++){
	meteorArr.push(new Meteor(curGame.gl))
}

var viewProjectionMatrix=[]
setInterval(function(){
	if (curGame.gameOver){
		return
	}
	curGame.timeHandler()
	curGame.preDrawScene()
	meteorArr.forEach( function(element, index) {
		element.update(viewProjectionMatrix, curSpaceship.shift)
		curGame.drawScene(element.getForDraw(curGame.programInfo))
	});
	meteorArr.forEach(function(element, index){
		if (element.Zpos>200){
			
			meteorArr[index] = new Meteor(curGame.gl)
		}
	})
	curSpaceship.update(viewProjectionMatrix)
	curGame.drawScene(curSpaceship.getForDraw(curGame.programInfo))
	for (let i=0; i<meteorArr.length ; i++){
		checkCollision(meteorArr[i], curSpaceship)
	}
	if (curGame.gameOver){
		gameOverHandler()
	}
}, 10)

addEventListener('mousemove', (event)=>{curSpaceship.update(viewProjectionMatrix, event, curGame)})

