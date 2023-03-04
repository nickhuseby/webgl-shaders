export function setTexcoords(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, 1,
            1, -1,
            1, 1,
            -1, -1,
            1, -1,
            -1, 1,
        ]),
        gl.STATIC_DRAW
    );
}

export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

export function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

export function resizeCanvasToDisplaySize(canvas) {
    // init with the default canvas size
    const canvasToDisplaySizeMap = new Map([[canvas, [800, 1200]]]);
    
    function onResize(entries) {
        for (const entry of entries) {
            let width;
            let height;
            let dpr = window.devicePixelRatio;
            if (entry.devicePixelContentBoxSize) {
            // NOTE: Only this path gives the correct answer
            // The other paths are imperfect fallbacks
            // for browsers that don't provide anyway to do this
            width = entry.devicePixelContentBoxSize[0].inlineSize;
            height = entry.devicePixelContentBoxSize[0].blockSize;
            dpr = 1; // it's already in width and height
            } else if (entry.contentBoxSize) {
            if (entry.contentBoxSize[0]) {
                width = entry.contentBoxSize[0].inlineSize;
                height = entry.contentBoxSize[0].blockSize;
            } else {
                width = entry.contentBoxSize.inlineSize;
                height = entry.contentBoxSize.blockSize;
            }
            } else {
                width = entry.contentRect.width;
                height = entry.contentRect.height;
            }
            const displayWidth = Math.round(width * dpr);
            const displayHeight = Math.round(height * dpr);
            canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight]);
        }
    }
    const resizeObserver = new ResizeObserver(onResize);
    try {
    // only call us of the number of device pixels changed
        resizeObserver.observe(canvas, {box: 'device-pixel-content-box'});
    } catch (ex) {
    // device-pixel-content-box is not supported so fallback to this
        resizeObserver.observe(canvas, {box: 'content-box'});
    }
    // Get the size the browser is displaying the canvas in device pixels.
    const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas);
    
    // Check if the canvas is not the same size.
    const needResize = canvas.width  != displayWidth || canvas.height != displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}