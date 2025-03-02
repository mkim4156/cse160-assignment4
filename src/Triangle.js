class Triangle {
  constructor(angle) {
    this.type = 'triangle';
    this.position = [0.0, 0.0, 0.0];  // Position of the triangle's center
    this.color = [1.0, 1.0, 1.0, 1.0];  // Color (RGBA)
    this.size = 5.0;  // Size of the triangle
    this.rotationAngle = angle;  // Rotation angle in radians

    this.buffer == null;
  }

  // Function to apply rotation transformation
  rotate(x, y, angle) {
    var cosA = Math.cos(angle);
    var sinA = Math.sin(angle);
    var xNew = cosA * (x - this.position[0]) - sinA * (y - this.position[1]) + this.position[0];
    var yNew = sinA * (x - this.position[0]) + cosA * (y - this.position[1]) + this.position[1];
    return [xNew, yNew];
  }

  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
    var angle = this.rotationAngle;

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
    // Pass the size of the point to u_Size variable
    gl.uniform1f(u_Size, size);

    // Calculate delta (for triangle size adjustment)
    var d = this.size / 200.0; // delta
    
    // Vertices before rotation
    var vertices = [
      [xy[0], xy[1]], 
      [xy[0] + d, xy[1]], 
      [xy[0], xy[1] + d]
    ];
    
    // Apply rotation to each vertex
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] = this.rotate(vertices[i][0], vertices[i][1], angle);
    }
    
    // Draw rotated triangle
    drawTriangle([vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1]]);
  }
}

function drawTriangle(vertices){
    // var vertices = new Float32Array([
    // 0, 0.5, -0.5, -0.5, 0.5, -0.5
    // ]);
    var n = 3; // The number of vertices
    
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if(!vertexBuffer){
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
    // return n;
}

function drawTriangle3D(buffer, uvBuffer, n){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(buffer, uvBuffer, normBuffer, n) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);


  gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
