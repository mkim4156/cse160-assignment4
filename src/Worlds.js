// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    //v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform bool u_colorOn;
  uniform vec3 u_lightColor;
  void main() {
    if(u_whichTexture == -3){
      gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);
    }
    else if(u_whichTexture == -2){
      gl_FragColor = u_FragColor;
    } else if(u_whichTexture == -1){
      gl_FragColor = vec4(v_UV, 1.0, 1.0); 
    }else if(u_whichTexture == 0){
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }else if(u_whichTexture == 1){
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    }else if(u_whichTexture == 2){
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    }
    else{
      gl_FragColor = vec4(1,.2,.2,1);
    }

    vec3 lightVector =  u_lightPos -vec3(v_VertPos);
    float r = length(lightVector);
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    // Reflection
    vec3 R = reflect(-L, N);

    // eye
    vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

    //Specular
    float specular = pow(max(dot(E,R), 0.0), 10.0);

    vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7 * u_lightColor;
    vec3 ambient = vec3(gl_FragColor) * 0.3;
    vec3 spec = vec3(specular) * u_lightColor;
    if(u_colorOn){
        gl_FragColor = vec4(spec+diffuse+ambient, 1.0);
    }
    else{
      if(u_lightOn){
        gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
      }
      else{
          gl_FragColor = vec4(diffuse+ambient, 1.0);
      }
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_position;
let u_FragColor;
let g_globalAngle = 0;
let g_shinAngle = 0;
let g_thighAngle = 0;
let g_footAngle = 0;
let g_legAnimation = false;
let g_neckAngle = -77;
let g_tailAngle = -45;
let special_button = false;
let g_normalOn = false;

//Assignment 3 Global Variables
let a_UV;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_NormalMatrix;
let u_lightColor;
let u_colorOn;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  // Register event handlers
  canvas.onmousedown = onMouseDown;
  canvas.onmousemove = onMouseMove;
  canvas.onmouseup = onMouseUp;
  canvas.onmouseleave = onMouseUp;
}

let g_lightPos = [0, 2, -1];
let g_lightOn = false;
let g_selectedColor = [1, 1, 1];
let g_colorOn = false;

function addHTMLVariables(){
  document.getElementById('normalButtonOn').onclick = function() {g_normalOn = true};
  document.getElementById('normalButtonOff').onclick = function() {g_normalOn = false};

  // Button Events
  document.getElementById('animationShinOnButton').onclick = function()  {g_legAnimation = true;};
  document.getElementById('animationShinOffButton').onclick = function()  {g_legAnimation = false;};

  document.getElementById('lightOn').onclick = function()  {g_lightOn = true;};
  document.getElementById('lightOff').onclick = function()  {g_lightOn = false;};

  // Color Slider Events
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev){if(ev.buttons == 1) { g_lightPos[0] = this.value/100; renderScene();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev){if(ev.buttons == 1) { g_lightPos[1] = this.value/100; renderScene();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev){if(ev.buttons == 1) { g_lightPos[2] = this.value/100; renderScene();}});

  // Limb Slide Events
  document.getElementById('neckSlide').addEventListener('mousemove', function(){g_neckAngle = this.value; renderScene(); });
  document.getElementById('shinSlide').addEventListener('mousemove', function(){g_shinAngle = this.value; renderScene(); });
  document.getElementById('thighSlide').addEventListener('mousemove', function(){g_thighAngle = this.value; renderScene(); });
  document.getElementById('tailSlide').addEventListener('mousemove', function(){g_tailAngle = this.value; renderScene(); });

  // Slider Events
  document.getElementById("redSlide").addEventListener("mouseup", function () {
    g_selectedColor[0] = this.value / 100;
  });
  document
    .getElementById("greenSlide")
    .addEventListener("mouseup", function () {
      g_selectedColor[1] = this.value / 100;
    });
  document.getElementById("blueSlide").addEventListener("mouseup", function () {
    g_selectedColor[2] = this.value / 100;
  });
  
  // Color Events
  document.getElementById('colorOn').onclick = function()  {g_colorOn = true;};
  document.getElementById('colorOff').onclick = function()  {g_colorOn = false;};
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }

  
  // // Get the storage location of a_UV
  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_UV < 0) {
    console.log("Failed to get the storage location of a_Normal");
    return;
  }
  
  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }
  
  // Get the storage location of u_lightPos
  u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
  if (!u_lightPos) {
    console.log("Failed to get the storage location of u_lightPos");
    return;
  }
  
  // Get the storage location of u_lightPos
  u_lightColor = gl.getUniformLocation(gl.program, "u_lightColor");
  if (!u_lightColor) {
    console.log("Failed to get the storage location of u_lightColor");
    return;
  }

  // Get the storage location of u_colorOn
  u_colorOn = gl.getUniformLocation(gl.program, "u_colorOn");
  if (!u_colorOn) {
    console.log("Failed to get the storage location of u_colorOn");
    return;
  }

  // Get the storage location of u_cameraPos
  u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
  if (!u_cameraPos) {
    console.log("Failed to get the storage location of u_cameraPos");
    return;
  }

  // Get the storage location of u_cameraPos
  u_lightOn = gl.getUniformLocation(gl.program, "u_lightOn");
  if (!u_lightOn) {
    console.log("Failed to get the storage location of u_lightOn");
    return;
  }

  // Get the storage location of u_FragColor
  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichTexture");
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  
  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix){
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix){
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix){
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0){
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }
  
  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1){
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  // Get the storage location of u_Sampler2
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2){
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  }

  // Set an initial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  
}

function initTextures(){
  var image0 = new Image();
  if(!image0){
    console.log("Failed to create the image object");
    return false;
  }

  var image1 = new Image();
  if(!image1){
    console.log("Failed to create the image object");
    return false;
  }

  var image2 = new Image();
  if(!image2){
    console.log("Failed to create the image object");
    return false;
  }

  image0.onload = function(){sendImageToTEXTURE0(image0);}
  image1.onload = function(){sendImageToTEXTURE1(image1);}
  image2.onload = function(){sendImageToTEXTURE2(image2);}


  image0.src = 'sky.jpg';
  image1.src = 'diamond.jpg';
  image2.src = 'grass.jpg';

  // Add more texture here

  return true;
}


function sendImageToTEXTURE0(image){
  var texture = gl.createTexture();
  if(!texture){
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler0, 0);

  console.log("Finished loadTexture");
}

function sendImageToTEXTURE1(image){
  var texture = gl.createTexture();
  if(!texture){
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE1);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler1, 1);

  console.log("Finished loadTexture");
}

function sendImageToTEXTURE2(image){
  var texture = gl.createTexture();
  if(!texture){
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE2);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler2, 2);

  console.log("Finished loadTexture");
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addHTMLVariables();
  
  document.onkeydown = keydown;

  initTextures();
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //renderAllShapes();
  requestAnimationFrame(tick);
}

let g_globalX = 0;
let g_globalY = 0;
let g_startX = 0;
let g_startY = 0;
let g_isDragging = false;

function onMouseDown(ev) {
    g_startX = ev.clientX;
    g_startY = ev.clientY;
    g_isDragging = true;
}

function onMouseMove(ev) {
  if (!g_isDragging) return;

  let dx = ev.clientX - g_startX;
  let dy = ev.clientY - g_startY;

  let horizontalRotation = dx * 0.5;
  let verticalRotation = dy * 0.5;

  rotateView(horizontalRotation, verticalRotation);

  g_startX = ev.clientX;
  g_startY = ev.clientY;

  renderScene();
}

function rotateView(horizontalAngle, verticalAngle) {
  // Calculate the direction vector from eye to at
  let direction = new Vector3().set(g_at).sub(g_eye).normalize();
  let right = Vector3.cross(direction, g_up).normalize();
  let up = Vector3.cross(right, direction).normalize();

  // Calculate rotation matrices
  let horizontalRotationMatrix = new Matrix4().rotate(-horizontalAngle, g_up.elements[0], g_up.elements[1], g_up.elements[2]);
  let verticalRotationMatrix = new Matrix4().rotate(-verticalAngle, right.elements[0], right.elements[1], right.elements[2]);

  // Apply rotations
  direction = verticalRotationMatrix.multiplyVector3(direction);
  direction = horizontalRotationMatrix.multiplyVector3(direction);

  // Calculate new "at" point
  g_at.set(g_eye).add(direction);

  // Recalculate the up vector to keep it perpendicular.
  g_up = Vector3.cross(right, direction).normalize();

} 

function onMouseUp(ev) {
  // Stop dragging
  g_isDragging = false;
}

function onMouseLeave(ev) {
  // In case the mouse leaves the canvas during dragging
  g_isDragging = false;
}


var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

// Called by browser repeatedly whenever its time
function tick(){
  // Print some debug information so we know we are running
  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();

  // Draw everything
  renderScene();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles(){
  if(g_legAnimation){
    g_thighAngle = (45*Math.sin(g_seconds));
    g_shinAngle = (45*Math.sin(g_seconds));
  }
  g_lightPos[0] = 2.3*Math.cos(g_seconds);

}

var g_map = [
  [4,4,4,4,4],
  [0,0,0,0,4],
  [0,0,0,0,4],
  [0,0,0,0,4],
  [0,0,0,0,4],
];

function drawMap(map, sizex, sizey, height, text, xaxis, yaxis) {

  for (let x = 0; x < sizex; x++) {
    for (let y = 0; y < sizey; y++) {
      const tileType = map[x][y]; // Store the tile type

      if (tileType === 1) {
        const wall = new Cube();
        wall.matrix.translate(x - xaxis, height === 1 ? -0.75 : 0.75 * height, y - yaxis);
        wall.textureNum = text;
        if(g_normalOn) wall.textureNoum=-3;
        wall.renderfast();
      } else if (tileType >= 2 && tileType <= 4) { // Combine conditions
        let heightMultiplier = 1;
        if (tileType === 3){
          heightMultiplier = 2.5;
        } else if (tileType === 4){
          heightMultiplier = 3.5;
        }

        const startHeight = -0.75 * height;
        const endHeight = 0.75 * heightMultiplier;
        const step = 0.75;

        for (let i = startHeight; i <= endHeight; i += step) {
          const wall = new Cube();
          wall.matrix.translate(x - xaxis, i, y - yaxis);
          wall.textureNum = text;
          if(g_normalOn) wall.textureNum=-3;
          wall.matrix.scale(-1,1,-1);
          wall.renderfast();
        }
      }
    }
  }
}

// w is 87 go forward
// s is 83 backward
// a is 65 left
// d is 68 right
// q is 81 rotate left
// e is 69 rotate left
var g_eye = new Vector3([0,0,-3]);
var g_at = new Vector3([0,0, 100]);
var g_up = new Vector3([0, 1, 0]);
function keydown(ev){
  if(ev.keyCode == 87){ // W - Forward
      var d = new Vector3().set(g_at).sub(g_eye).normalize(); // Create a new Vector3
      g_eye.add(d);
      g_at.add(d); // Correct: Add the change (d) to g_at
  } else if(ev.keyCode == 83){ // S - Backward
      var d = new Vector3().set(g_at).sub(g_eye).normalize(); // Create a new Vector3
      g_eye.sub(d);
      g_at.sub(d); // Correct: Subtract the change (d) from g_at
  } else if (ev.keyCode == 65) { // A - Left
    var d = new Vector3().set(g_at).sub(g_eye).normalize(); // Create a new Vector3
    var leftDirection = Vector3.cross(g_up, d).normalize(); // Normalize leftDirection
    g_eye.add(leftDirection);
    g_at.add(leftDirection); // Correct: Add the left direction to g_at
    } else if (ev.keyCode == 68) { // D - Right
      var d = new Vector3().set(g_at).sub(g_eye).normalize(); // Create a new Vector3
      var rightDirection = Vector3.cross(d, g_up).normalize(); // Normalize rightDirection
      g_eye.add(rightDirection);
      g_at.add(rightDirection); // Correct: Add the right direction to g_at
    }
  renderScene();
}


// Function to convert radians to degrees
function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

// Function to convert degrees to radians
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Function to calculate the arctangent of y/x in degrees
function calculateArctanFromCoordinates(y, x) {
  return Math.atan2(y, x) * (180 / Math.PI);
}


// this is going to be renderScene() in the future
function renderScene() {
  // Check the time at the start of this function
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width/canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(g_eye.elements[0], g_eye.elements[1], g_eye.elements[2], g_at.elements[0], g_at.elements[1], g_at.elements[2], g_up.elements[0], g_up.elements[1], g_up.elements[2]);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  gl.uniform3f(u_cameraPos, g_eye.elements[0], g_eye.elements[1], g_eye.elements[2]);
  gl.uniform1i(u_lightOn, g_lightOn);
  gl.uniform1i(u_colorOn, g_colorOn);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0).rotate(g_globalY, 1, 0, 0); 
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);


  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  //drawMap(g_map, 5, 5, 1, 1, 3, 2);

  // Create Giraffe Here:
  createWorld(g_shinAngle, g_thighAngle, g_neckAngle, g_tailAngle);

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}


function createWorld(shinAngle, thighAngle, neckAngle, tailAngle){


  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_lightColor, g_selectedColor[0], g_selectedColor[1], g_selectedColor[2]);

  // Draw the light
  var light = new Cube();
  light.color = [2,2,0,1];
  light.textureNum = -2;
  light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
  light.matrix.scale(-.1,-.1,-.1);
  light.renderfast();

  // Draw the Cube
  var cube = new Cube();
  cube.color = [2,1,1,1];
  cube.textureNum = -2;
  if(g_normalOn) cube.textureNum=-3;
  cube.matrix.translate(1.2, -.6, -.3);
  cube.matrix.scale(-0.5,0.5,0.5);
  cube.renderfast();

  var floor = new Cube();
  floor.textureNum = -2;
  if(g_normalOn) floor.textureNum=-3;
  floor.matrix.translate(0, -.75, 0);
  floor.matrix.scale(10, 0, 10);
  floor.matrix.translate(-.5, 0, -0.5);
  floor.renderfast();

  var sky = new Cube();
  sky.color = [.5,0.5,.5,1];
  sky.textureNum = -2;
  if(g_normalOn) sky.textureNum=-3;
  sky.matrix.scale(7, -6, -7);
  sky.matrix.translate(-.5, -.5, -.5, -.5);
  sky.renderfast();

  var sphere = new Sphere();
  sphere.color = [1,1,1,1];
  sphere.textureNum = -1;
  if(g_normalOn) sphere.textureNum=-3;
  sphere.matrix.scale(-.5, .5, .5);
  sphere.matrix.translate(3, 0.1, .1);
  sphere.render();


  ////////////////////////////

  if(shinAngle <= 0){
    shinAngle = 0;
  }
  
  let angle = -45*Math.sin(g_seconds);
  if(angle < 0){
    angle = 0;
  }
  let angle2 = 45*Math.sin(g_seconds);
  if(angle2 < 0){
    angle2 = 0;
  }

  var fallDistance;

  if (special_button) {
    // Apply random falling distance in the x, y, and z directions
    fallDistance = 5 * 1.5 + 0.5;  // Randomize fall distance between 0.5 and 2.0
  }

  // LEFT FRONT LEG ------------------------------------------------------------------------------------------------------------------------
  // Draw a Thigh
  var leftFrontThigh = new Cube();
  var leftFrontThighMatrix = leftFrontThigh.matrix;
  leftFrontThighMatrix.translate(-0.254, -0.24, -0.02);
  if(special_button){
    leftFrontThighMatrix.translate(0, -0.09*g_seconds, -0.02);
  }
  if(g_legAnimation){
    leftFrontThighMatrix.rotate(-15*Math.sin(g_seconds), 0, 0, 1);
  }
  else{
    leftFrontThighMatrix.rotate(thighAngle, 0, 0, 1);
  }
  var leftFrontThighCoord = new Matrix4(leftFrontThighMatrix);
  leftFrontThighMatrix.scale(-0.07, -.3, .12);  // Scaling happen first then translate
  leftFrontThigh.color = [1, .69, 0, 1];
  leftFrontThigh.textureNum = -2;
  if(g_normalOn) leftFrontThigh.textureNum = -3;
  leftFrontThigh.renderfast();

  // Draw a Shin
  var leftFrontShin = new Cube();
  var leftFrontShinMatrix = new Matrix4(leftFrontThighCoord);
  leftFrontShinMatrix.translate(-0.02, -0.3, 0.02);
  if(g_legAnimation){
    leftFrontShinMatrix.rotate(angle, 0, 0, 1);
  }
  else{
    leftFrontShinMatrix.rotate(shinAngle, 0, 0, 1);
  }

  var leftFrontShinCoord = new Matrix4(leftFrontShinMatrix);
  leftFrontShinMatrix.scale(-0.041, -.3, 0.08);
  leftFrontShin.color = [1, .69, 0, 1];
  leftFrontShin.matrix = leftFrontShinMatrix;
  leftFrontShin.textureNum = -2;
  if(g_normalOn) leftFrontShin.textureNum = -3;
  leftFrontShin.renderfast();

  // // Draw a Foot
  var leftFrontFoot = new Cube();
  var leftFrontFootMatrix = new Matrix4(leftFrontShinCoord);
  leftFrontFootMatrix.translate(0.03, -.3, -0.02);
  leftFrontFootMatrix.rotate(shinAngle, 0, 0, 1);
  leftFrontFootMatrix.scale(-0.125, .0225, .125);
  leftFrontFoot.matrix = leftFrontFootMatrix;
  leftFrontFoot.color = [1, .69, 0, 1];
  leftFrontFoot.textureNum = -2;
  if(g_normalOn) leftFrontFoot.textureNum = -3;
  leftFrontFoot.renderfast();
  
  //   // LEFT Back LEG ------------------------------------------------------------------------------------------------------------------------
  // // Draw a Thigh
  var leftBackThigh = new Cube();
  var leftBackThighMatrix = leftBackThigh.matrix;
  leftBackThighMatrix.translate(0.254, -0.24, -0.02);
  if(special_button){
    leftBackThighMatrix.translate(0.09*g_seconds, -0.24, -0.02);
  }
  if(g_legAnimation){
    leftBackThighMatrix.rotate(15*Math.sin(g_seconds), 0, 0, 1);
  }
  else{
    leftBackThighMatrix.rotate(thighAngle, 0, 0, 1);
  }
  var leftBackThighCoord = new Matrix4(leftBackThighMatrix);
  leftBackThighMatrix.scale(-0.07, -.3, .12);  // Scaling happen first then translate
  leftBackThigh.color = [1, .69, 0, 1];
  leftBackThigh.textureNum = -2;
  if(g_normalOn) leftBackThigh.textureNum = -3;
  leftBackThigh.renderfast();

  // // Draw a Shin
  var leftBackShin = new Cube();
  var leftBackShinMatrix = new Matrix4(leftBackThighCoord);
  leftBackShinMatrix.translate(-0.02, -0.3, 0.02);
  if(g_legAnimation){
    leftBackShinMatrix.rotate(angle2, 0, 0, 1);
  }
  else{
    leftBackShinMatrix.rotate(shinAngle, 0, 0, 1);
  }

  var leftBackShinCoord = new Matrix4(leftBackShinMatrix);
  leftBackShinMatrix.scale(-0.04, -.3, 0.08);
  leftBackShin.color = [1, .69, 0, 1];
  leftBackShin.matrix = leftBackShinMatrix;
  leftBackShin.textureNum = -2;
  if(g_normalOn) leftBackShin.textureNum = -3;
  leftBackShin.renderfast();

  // // // Draw a Foot
  var leftBackFoot = new Cube();
  var leftBackFootMatrix = new Matrix4(leftBackShinCoord);
  leftBackFootMatrix.translate(0.03, -.3, -0.02);
  leftBackFootMatrix.rotate(shinAngle, 0, 0, 1);
  leftBackFootMatrix.scale(-0.125, .0225, .125);
  leftBackFoot.color = [1, .69, 0, 1];
  leftBackFoot.matrix = leftBackFootMatrix;
  leftBackFoot.textureNum = -2;
  if(g_normalOn) leftBackFoot.textureNum = -3;
  leftBackFoot.renderfast();

  // // RIGHT Back LEG ------------------------------------------------------------------------------------------------------------------------
  // // Draw a Thigh
  var rightBackThigh = new Cube();
  var rightBackThighMatrix = rightBackThigh.matrix;
  rightBackThighMatrix.translate(0.254, -0.24, -0.25);
  if(special_button){
    rightBackThighMatrix.translate(-0.1*(g_seconds), 0.1*(g_seconds), -0.25);
    rightBackThighMatrix.rotate(-45 + 30*g_seconds, 0, 0, 1);
  }
  if(g_legAnimation){
    rightBackThighMatrix.rotate(-15*Math.sin(g_seconds), 0, 0, 1);
  }
  else{
    rightBackThighMatrix.rotate(thighAngle, 0, 0, 1);
  }
  var rightBackThighCoord = new Matrix4(rightBackThigh.matrix);
  rightBackThighMatrix.scale(-0.07, -.3, .12);  // Scaling happen first then translate
  rightBackThigh.color = [1, .69, 0, 1];
  rightBackThigh.textureNum = -2;
  if(g_normalOn) rightBackThigh.textureNum = -3;
  rightBackThigh.renderfast();

  // // Draw a Shin
  var rightBackShin = new Cube();
  var rightBackShinMatrix = new Matrix4(rightBackThighCoord);
  rightBackShinMatrix.translate(-0.02, -0.3, 0.02);
  if(g_legAnimation){
    rightBackShinMatrix.rotate(angle, 0, 0, 1);
  }
  else{
    rightBackShinMatrix.rotate(shinAngle, 0, 0, 1);
  }
  var rightBackShinCoord = new Matrix4(rightBackShinMatrix);
  rightBackShinMatrix.scale(-0.04, -.3, 0.08);
  rightBackShin.color = [1, .69, 0, 1];
  rightBackShin.textureNum = -2;
  rightBackShin.matrix = rightBackShinMatrix;
  if(g_normalOn) rightBackShin.textureNum = -3;
  rightBackShin.renderfast();

  // // // Draw a Foot
  var rightBackFoot = new Cube();
  var rightBackFootMatrix = new Matrix4(rightBackShinCoord);
  rightBackFootMatrix.translate(0.03, -.3, -0.02);
  rightBackFootMatrix.rotate(shinAngle, 0, 0, 1);
  rightBackFootMatrix.scale(-0.125, .0225, .125);
  rightBackFoot.color = [1, .69, 0, 1];
  rightBackFoot.textureNum = -2;
  rightBackFoot.matrix = rightBackFootMatrix;
  if(g_normalOn) rightBackFoot.textureNum = -3;
  rightBackFoot.renderfast();

  // // RIGHT FRONT LEG ------------------------------------------------------------------------------------------------------------------------
  // Draw a Thigh
  var rightFrontThigh = new Cube();
  var rightFrontThighMatrix = rightFrontThigh.matrix;
  rightFrontThighMatrix.translate(-0.254, -0.24, -0.25);
  if(special_button){
    rightFrontThighMatrix.translate(-0.1*(g_seconds), 0.1*(g_seconds), -0.25);
    rightFrontThighMatrix.rotate(45 + 30*g_seconds, 0, 0, 1);
  }
  if(g_legAnimation){
    rightFrontThighMatrix.rotate(15*Math.sin(g_seconds), 0, 0, 1);
  }
  else{
    rightFrontThighMatrix.rotate(thighAngle, 0, 0, 1);
  }
  var rightFrontThighCoord = new Matrix4(rightFrontThighMatrix);
  rightFrontThighMatrix.scale(-0.07, -.3, .12);  // Scaling happen first then translate
  rightFrontThigh.color = [1, .69, 0, 1];
  rightFrontThigh.textureNum = -2;
  if(g_normalOn) rightFrontThigh.textureNum = -3;
  rightFrontThigh.renderfast();

  // // Draw a Shin
  var rightFrontShin = new Cube();
  var rightFrontShinMatrix = new Matrix4(rightFrontThighCoord);
  rightFrontShinMatrix.translate(-0.02, -0.3, 0.02);
  if(g_legAnimation){
    rightFrontShinMatrix.rotate(angle2, 0, 0, 1);
  }
  else{
    rightFrontShinMatrix.rotate(shinAngle, 0, 0, 1);
  }

  var rightFrontShinCoord = new Matrix4(rightFrontShinMatrix);
  rightFrontShinMatrix.scale(-0.04, -.3, 0.08);
  rightFrontShin.color = [1, .69, 0, 1];
  rightFrontShin.matrix = rightFrontShinMatrix;
  rightFrontShin.textureNum = -2;
  if(g_normalOn) rightFrontShin.textureNum = -3;
  rightFrontShin.renderfast();

  // // // Draw a Foot
  var rightFrontFoot = new Cube();
  var rightFrontFootMatrix = new Matrix4(rightFrontShinCoord);
  rightFrontFootMatrix.translate(0.03, -.3, -0.02);
  rightFrontFootMatrix.rotate(shinAngle, 0, 0, 1);
  rightFrontFootMatrix.scale(-0.125, .0225, .125);
  rightFrontFoot.color = [1, .69, 0, 1];
  rightFrontFoot.matrix = rightFrontFootMatrix;
  rightFrontFoot.textureNum = -2;
  if(g_normalOn) rightFrontFoot.textureNum = -3;
  rightFrontFoot.renderfast();

  // // Body
  var body = new Cube();
  var bodyMatrix = body.matrix;
  bodyMatrix.translate(0.3, -0.25, -0.32);
  if(special_button){
    bodyMatrix.translate(-0.1*(g_seconds), 0.1*(g_seconds), -0.25);
    bodyMatrix.rotate(45 + 30*g_seconds, 0, 0, 1);
  }
  bodyMatrix.rotate(0, 0, 0, 1);
  bodyMatrix.scale(-0.7, .3, .5);
  body.color = [1, .69, 0, 1];
  body.textureNum = -2;
  if(g_normalOn) body.textureNum = -3;
  body.renderfast();

  // //Neck
  var neck = new Cube();
  var neckMatrix = neck.matrix;
  neckMatrix.translate(-0.29, 0.05, -.15);
  if(special_button){
    neckMatrix.translate(0.1*(g_seconds), -0.1*(g_seconds), -0.25);
    neckMatrix.rotate(-45*g_seconds, 0, 0, 1);
  }
  if(g_legAnimation){
    neckMatrix.rotate(7.5*Math.sin(.35*3.14*g_seconds) - 72.5, 0, 0, 1);
  } else{
    neckMatrix.rotate(neckAngle, 0, 0, 1);
  }
  var neckCoord = new Matrix4(neckMatrix);
  
  neckMatrix.scale(-0.75, -.12, .15);
  neck.color = [1, .69, 0, 1];
  neck.textureNum = -2;
  if(g_normalOn) neck.textureNum = -3;
  neck.normalMatrix.setInverseOf(neck.matrix).invert().transpose();
  neck.renderfast();

  // //Head
  var head = new Cube();
  var headMatrix = new Matrix4(neckCoord);
  headMatrix.translate(-.75, 0, 0);
  headMatrix.rotate(180 - (g_neckAngle * -1), 0, 0, 1);
  var headCoord = new Matrix4(headMatrix);
  headMatrix.scale(-0.3, .12, .15);
  head.matrix = headMatrix;
  head.color = [1, .69, 0, 1];
  head.textureNum = -2;
  if(g_normalOn) head.textureNum = -3;
  head.renderfast();

  var rightEar = new Cube();
  var rightEarMatrix = new Matrix4(headCoord);
  rightEarMatrix.translate(0.03, .20, 0);
  rightEarMatrix.rotate(70, 0, 0, 1);
  var rightEarCoord = new Matrix4(rightEarMatrix);
  rightEarMatrix.scale(-0.125, .03, .03);
  rightEar.matrix = rightEarMatrix;
  rightEar.color = [1, .69, 0, 1];
  rightEar.textureNum = -2;
  if(g_normalOn) rightEar.textureNum = -3;
  rightEar.normalMatrix.setInverseOf(rightEar.matrix).invert().transpose();
  rightEar.renderfast();

  var leftEar = new Cube();
  leftEarMatrix = new Matrix4(headCoord);
  leftEarMatrix.translate(0.03, .20, .10);
  leftEarMatrix.rotate(70, 0, 0, 1);
  var leftEarCoord = new Matrix4(leftEarMatrix);
  leftEarMatrix.scale(-0.125, .03, .03);
  leftEar.matrix = leftEarMatrix;
  leftEar.color = [1, .69, 0, 1];
  leftEar.textureNum = -2;
  if(g_normalOn) leftEar.textureNum = -3;
  leftEar.normalMatrix.setInverseOf(leftEarMatrix).invert().transpose();
  leftEar.renderfast();

  var leftEarBall = new Cube();
  var leftEarBallMatrix = new Matrix4(leftEarCoord);
  leftEarBallMatrix.translate(0.03, 0, 0);
  leftEarBallMatrix.rotate(0, 0, 0, 1);
  leftEarBallMatrix.scale(-0.03, .03, .05);
  leftEarBall.color = [0, 0, 0, 0];
  leftEarBall.matrix = leftEarBallMatrix;
  leftEarBall.textureNum = -2;
  if(g_normalOn) leftEarBall.textureNum = -3;
  leftEarBall.normalMatrix.setInverseOf(leftEarBall.matrix).transpose();
  leftEarBall.renderfast();

  var rightEarBall = new Cube();
  var rightEarBallMatrix = new Matrix4(rightEarCoord);
  rightEarBallMatrix.translate(0.03, 0, 0);
  rightEarBallMatrix.rotate(0, 0, 0, 1);
  rightEarBallMatrix.scale(-0.03, .03, .05);
  leftEarBall.drawCube(rightEarBallMatrix, [0, 0, 0, 1]);
  rightEarBall.matrix = rightEarBallMatrix;
  rightEarBall.textureNum = -2;
  if(g_normalOn) rightEarBall.textureNum = -3;
  rightEarBall.normalMatrix.setInverseOf(rightEarBall.matrix).transpose();
  rightEarBall.renderfast();

  // //Tail
  var tail = new Cube();
  var tailMatrix = tail.matrix;
  tailMatrix.translate(0.32, -0, -.15);
  if(special_button){
    tailMatrix.translate(0.1*(g_seconds), -0.1*(g_seconds), -0.25);
    tailMatrix.rotate(-45*g_seconds, 0, 0, 1);
  }
  if(g_legAnimation){
    let tailAngleCap = 55*Math.sin(g_seconds);
    if(tailAngleCap >= 0){
      tailAngleCap = -55*Math.sin(g_seconds)
    }
    tailMatrix.rotate(tailAngleCap, 0, 0, 1);
  }else{
    tailMatrix.rotate(tailAngle, 0, 0, 1);
  }
  var tailCoord = new Matrix4(tailMatrix);
  tail.matrix.scale(0.3, -.04, .15);
  tail.color = [1, .69, 0, 1];
  tail.textureNum = -2;
  if(g_normalOn) tail.textureNum = -3;
  tail.normalMatrix.setInverseOf(tail.matrix).transpose();
  tail.renderfast();

  // // Tail End
  var end = new Cube();
  var endMatrix = new Matrix4(tailCoord);
  endMatrix.translate(.3, -0.05, 0);
  endMatrix.rotate(0, 0, 0, 1);
  endMatrix.scale(0.12, .06, .15);
  end.color = [0, 0, 0, 0];
  end.matrix = endMatrix;
  end.textureNum = -2;
  if(g_normalOn) end.textureNum = -3;
  end.normalMatrix.setInverseOf(end.matrix).invert().transpose();
  end.renderfast();
}