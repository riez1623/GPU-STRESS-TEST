// main.js
const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const fpsCounter = document.getElementById('fps-counter');
const countdownScreen = document.getElementById('countdown-screen');
const countdownText = document.getElementById('countdown-text');

let frameCount = 0;
let lastTime = performance.now();

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const fragShaderSrc = `
  precision highp float;
  uniform float time;
  uniform vec2 resolution;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float n = noise(uv * 80.0 + time);
    gl_FragColor = vec4(vec3(n), 1.0);
  }
`;

const vertShaderSrc = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
`;

function compileShader(src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vertShader = compileShader(vertShaderSrc, gl.VERTEX_SHADER);
const fragShader = compileShader(fragShaderSrc, gl.FRAGMENT_SHADER);
const program = gl.createProgram();
gl.attachShader(program, vertShader);
gl.attachShader(program, fragShader);
gl.linkProgram(program);
gl.useProgram(program);

const positionAttrib = gl.getAttribLocation(program, 'position');
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,  1, -1,  -1, 1,
  -1, 1,   1, -1,   1, 1,
]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionAttrib);
gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

const timeLoc = gl.getUniformLocation(program, 'time');
const resLoc = gl.getUniformLocation(program, 'resolution');

let startTime = performance.now();

function render() {
  const currentTime = performance.now();
  const time = (currentTime - startTime) * 0.001;
  gl.uniform1f(timeLoc, time);
  gl.uniform2f(resLoc, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  frameCount++;
  const delta = currentTime - lastTime;
  if (delta > 1000) {
    const fps = Math.round((frameCount / delta) * 1000);
    fpsCounter.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = currentTime;
  }

  requestAnimationFrame(render);
}

function flashEffect(callback) {
  let flashes = 0;
  const maxFlashes = 20;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = flashes % 2 === 0 ? 'white' : 'black';
    flashes++;
    if (flashes >= maxFlashes) {
      clearInterval(interval);
      document.body.style.backgroundColor = 'black';
      callback();
    }
  }, 50);
}

function startCountdown() {
  let count = 5;
  countdownScreen.style.display = 'flex';
  countdownText.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownText.textContent = count;
    } else {
      clearInterval(interval);
      countdownScreen.style.display = 'none';
      flashEffect(() => {
        canvas.style.display = 'block';
        fpsCounter.style.display = 'block';
        document.body.requestFullscreen();
        render();
      });
    }
  }, 1000);
}

startButton.onclick = () => {
  startScreen.style.display = 'none';
  startCountdown();
};
