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
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float val = sin(dot(uv * 40.0, vec2(time))) * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(val), 1.0);
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
  let count = 0;
  const flashes = 30;
  const interval = setInterval(() => {
    document.body.style.backgroundColor = count % 2 === 0 ? 'white' : 'black';
    count++;
    if (count >= flashes) {
      clearInterval(interval);
      document.body.style.backgroundColor = 'black';
      callback();
    }
  }, 60);
}

function startCountdown() {
  let count = 5;
  countdownScreen.style.display = 'flex';
  countdownText.textContent = count;

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownText.textContent = count;
    } else {
      clearInterval(timer);
      countdownScreen.style.display = 'none';
      flashEffect(() => {
        document.body.requestFullscreen().catch(() => {});
        canvas.style.display = 'block';
        fpsCounter.style.display = 'block';
        render();
      });
    }
  }, 1000);
}

startButton.onclick = () => {
  startScreen.style.display = 'none';
  startCountdown();
};
