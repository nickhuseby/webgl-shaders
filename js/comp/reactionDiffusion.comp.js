import vertexShaderSource from '../glsl/standard.vert.js';
import initFragmentShaderSource from '../glsl/rdInit.frag.js';
import rdShaderSource from '../glsl/reactionDiffusion.frag.js';
import outShaderSource from '../glsl/rdOutput.frag.js';
import { createProgram, createShader, resizeCanvasToDisplaySize, setTexcoords } from '../util/helpers.js';

export default function () {
    let then = 0;
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
    setTexcoords(gl);

    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, initFragmentShaderSource);
    const initProgram = createProgram(gl, vShader, fShader);
    const initUniRes = gl.getUniformLocation(initProgram, "u_resolution");
    const initPosAtt = gl.getAttribLocation(initProgram, "a_position");
    const initTexAtt = gl.getAttribLocation(initProgram, "a_texcoord");

    const rdShader = createShader(gl, gl.FRAGMENT_SHADER, rdShaderSource);
    const rdProgram = createProgram(gl, vShader, rdShader);
    const rdUniRes = gl.getUniformLocation(rdProgram, "u_resolution");
    const rdDiffA = gl.getUniformLocation(rdProgram, "u_diffA");
    const rdDiffB = gl.getUniformLocation(rdProgram, "u_diffB");
    const rdKill = gl.getUniformLocation(rdProgram, "u_kill");
    const rdFeed = gl.getUniformLocation(rdProgram, "u_feed");
    const rdTime = gl.getUniformLocation(rdProgram, "u_time");
    const rdPosAtt = gl.getAttribLocation(rdProgram, "a_position");
    const rdTexAtt = gl.getAttribLocation(rdProgram, "a_texcoord");

    // const outputShader = createShader(gl, gl.FRAGMENT_SHADER, outShaderSource);
    // const outputProgram = createProgram(gl, vShader, outputShader);

    // Textures

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.canvas.width,
        gl.canvas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );

    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const outTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, outTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.canvas.width,
        gl.canvas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );

    // set the filtering so we don't need mips and it's not filtered
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // FrameBuffers

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);

    const rdfb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rdfb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

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

    function rdDraw() {
        gl.useProgram(rdProgram);

        gl.enableVertexAttribArray(rdPosAtt);
        gl.enableVertexAttribArray(rdTexAtt);

        gl.vertexAttribPointer(rdTexAtt, 2, gl.FLOAT, false, 0, 0);

        const size = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const attOffset = 0;
        gl.vertexAttribPointer(initPosAtt, size, type, normalize, stride, attOffset);

        gl.uniform2f(rdUniRes, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(rdDiffA, 1.0);
        gl.uniform1f(rdDiffB, 0.2);
        gl.uniform1f(rdFeed, 0.022);
        gl.uniform1f(rdKill, 0.0445);

        var primitiveType = gl.TRIANGLES;
        var arrOffset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, arrOffset, count);
    }

    function drawFrame(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1f(rdTime, deltaTime);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            rdDraw();
        }
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, outTexture);
            gl.uniform1f(rdTime, deltaTime);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            rdDraw();
        }
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, rdfb);
            gl.bindTexture(gl.TEXTURE_2D, outTexture);
            gl.uniform1f(rdTime, deltaTime);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            rdDraw();
        }

        requestAnimationFrame(drawFrame);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, rdfb);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    initDraw();

    requestAnimationFrame(drawFrame);
}