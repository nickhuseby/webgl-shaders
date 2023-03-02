import vertexShaderSource from '../glsl/standard.vert.js';
import initFragmentShaderSource from '../glsl/rdInit.frag.js';
import rdShaderSource from '../glsl/reactionDiffusion.frag.js';
import outShaderSource from '../glsl/rdOutput.frag.js';
import { createProgram, createShader, resizeCanvasToDisplaySize, setTexcoords } from '../util/helpers.js';

export default function () {
    const canvas = document.getElementById('c');
    const gl = canvas.getContext("webgl");
    if (!gl) {
        alert('This browser does not support Web GL');
        return;
    }
    
    resizeCanvasToDisplaySize(gl.canvas);

    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, initFragmentShaderSource);
    const initProgram = createProgram(gl, vShader, fShader);
    const initUniRes = gl.getUniformLocation(initProgram, "u_resolution");
    const initPosAtt = gl.getAttribLocation(initProgram, "a_position");
    const initTexAtt = gl.getAttribLocation(initProgram, "a_texcoord");
    setTexcoords(gl);

    // const rdShader = createShader(gl, gl.FRAGMENT_SHADER, rdShaderSource);
    // const rdProgram = createProgram(gl, vShader, rdShader);

    // const outputShader = createShader(gl, gl.FRAGMENT_SHADER, outShaderSource);
    // const outputProgram = createProgram(gl, vShader, outputShader);

    function initDraw() {
        gl.useProgram(initProgram);

        gl.enableVertexAttribArray(initPosAtt);
        gl.enableVertexAttribArray(initTexAtt);

        gl.vertexAttribPointer(initTexAtt, 2, gl.FLOAT, false, 0, 0);

        // setting position attribute in vertex shader
        const size = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const attOffset = 0;
        gl.vertexAttribPointer(initPosAtt, size, type, normalize, stride, attOffset);

        // set uniforms
        gl.uniform2f(initUniRes, gl.canvas.width, gl.canvas.height);
        
        // draw rectangle
        var primitiveType = gl.TRIANGLES;
        var arrOffset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, arrOffset, count);
    }

    initDraw();

}