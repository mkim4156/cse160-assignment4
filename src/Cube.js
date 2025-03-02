class Cube{
    constructor(segment){
      this.type = 'cube';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.normalMatrix = new Matrix4();

      this.buffer = null;
      this.uvBuffer = null;
      this.normBuffer = null;
      this.vertices = new Float32Array([
        // Front of Cube
        0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0,

        // Top of Cube
        0, 1, 0,  0, 1, 1,  1, 1, 1,
        0, 1, 0,  1, 1, 1,  1, 1, 0,

        // Left side of Cube
        0, 1, 0,  0, 1, 1,  0, 0, 1,
        0, 0, 0,  0, 0, 1,  0, 1, 0,

        // Right side of Cube
        1, 1, 0,  1, 1, 1,  1, 0, 1,
        1, 0, 0,  1, 1, 0,  1, 0, 1,

        // Bottom of Cube
        0, 0, 0,  0, 0, 1,  1, 0, 0,
        1, 0, 0,  1, 0, 1,  0, 0, 1,

        // Back of Cube
        0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0,
        0.0, 0.0, 1.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0
      ]);
      this.uvs = new Float32Array([  // Combined UV coordinates
        0, 0, 1, 1, 1, 0,  // Front
        0, 0, 0, 1, 1, 1,
        0, 0, 0, 1, 1, 1,  // Top
        0, 0, 1, 1, 1, 0,
        1, 1, 0, 1, 0, 0,  // Left
        1, 0, 0, 0, 1, 1,
        0, 1, 1, 1, 1, 0,  // Right
        0, 0, 0, 1, 1, 0,
        0, 1, 1, 1, 0, 0,  // Bottom
        0, 0, 0, 1, 1, 1,
        0, 0, 1, 1, 1, 0,  // Back
        0, 0, 0, 1, 1, 1
    ]);
    this.norms = new Float32Array([
      0,0,-1, 0,0,-1, 0,0,-1, // Front
      0,0,-1, 0,0,-1, 0,0,-1,
      0,1,0, 0,1,0, 0,1,0,  // Top
      0,1,0, 0,1,0, 0,1,0,
      -1,0,0, -1,0,0, -1,0,0,  // left
      -1,0,0, -1,0,0, -1,0,0,
      1,0,0, 1,0,0, 1,0,0,  // Right
      1,0,0, 1,0,0, 1,0,0,
      0,-1,0, 0,-1,0, 0,-1,0,  // Bottom
      0,-1,0, 0,-1,0, 0,-1,0,
      0,0,1, 0,0,1, 0,0,1, // Back
      0,0,1, 0,0,1, 0,0,1,
    ]);
      this.textureNum = -1;
    }
    initBuffers() { // Add this function
      if (this.buffer === null) {  // Only create if it doesn't exist
        this.buffer = gl.createBuffer();
        if (!this.buffer) {
            console.error("Failed to create vertex buffer object");
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW); // STATIC_DRAW

        this.uvBuffer = gl.createBuffer();
        if (!this.uvBuffer) {
            console.error("Failed to create UV buffer object");
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW); // STATIC_DRAW

        this.normBuffer = gl.createBuffer();
        if (!this.normBuffer) {
            console.error("Failed to create UV buffer object");
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.norms, gl.STATIC_DRAW); // STATIC_DRAW
    }
  }
  drawCube(matrix, color) {
    this.matrix = matrix;

    this.initBuffers(); // Initialize if not already done

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    
    //  Combine draw calls by using vertex indices if possible.  This example keeps the triangle pairs, but you can potentially use an index buffer to draw all 12 faces with a single draw call.
    gl.uniform4f(u_FragColor, color[0] * 0.9, color[1] * 0.9, color[2] * 0.9, color[3]);

    // Draw all faces using the same buffer.  This is much more efficient than rebinding the buffer for every face.
    drawTriangle3DUV(this.buffer, this.uvBuffer, this.normBuffer, 36); // 36 vertices for 12 triangles
}

  renderfast() {
    var color = this.color;
    this.initBuffers();

    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
    gl.uniform1i(u_whichTexture, this.textureNum);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, 36); // Draw all triangles at once
  }
}

