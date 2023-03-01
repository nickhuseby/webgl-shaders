import vertexShaderSource from './mod/vert.js';
import fragmentShaderSource from './mod/cellularAutomataFrag.js';
import initialFragmentShaderSource from './mod/initialFrag.js';
import { setTexcoords, createShader, createProgram, resizeCanvasToDisplaySize } from './util/helpers.js';

(function() {

    const canvas = document.querySelector("#c");
    const gl = canvas.getContext("webgl");
        
    if (!gl) {
        alert("This browser does not support WebGL");
    }
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);
    
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
    const textureLocation = gl.getUniformLocation(program, "u_texture");
    const time = gl.getUniformLocation(program, "u_time");

    const positionBuffer = gl.createBuffer();

    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    
    resizeCanvasToDisplaySize(gl.canvas);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    setTexcoords(gl);

    const iF = createShader(gl, gl.FRAGMENT_SHADER, initialFragmentShaderSource);

    const startProgram = createProgram(gl, vertexShader, iF);

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

    /* FRAMEBUFFERS */

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture as the first color attachment
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0);

    const tfb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, tfb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    function draw(program) {
        // setting program to use
        gl.useProgram(program);

        // setting up vertex attributes
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.enableVertexAttribArray(texcoordLocation);

        // setting texcoord in vertex shader
        gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
        
        // setting position attribute in vertex shader
        const size = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const attOffset = 0;
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, attOffset);

        // set uniforms
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1i(textureLocation, 0);
        gl.uniform1f(time, parseFloat(Date.now()));
        
        // draw rectangle
        var primitiveType = gl.TRIANGLES;
        var arrOffset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, arrOffset, count);
    }
    
    function drawScene() {
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            draw(program);
        }

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, outTexture);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            draw(program);
        }

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, tfb);
            gl.bindTexture(gl.TEXTURE_2D, outTexture);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            draw(program);
        }
        requestAnimationFrame(drawScene);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, tfb);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    draw(startProgram);

    requestAnimationFrame(drawScene);
    
})();