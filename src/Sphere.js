class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1, 1, 1, 1];
        this.matrix = new Matrix4();
        this.textureNum = -2;
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.buffer = null;
        this.uvBuffer = null;
        this.normBuffer = null;
        this.createSphere();
        this.initBuffers(this.vertices, this.uvs, this.normals);
    }

    createSphere() {
        var d = Math.PI / 20; // Increased resolution
        for (var t = 0; t <= Math.PI; t += d) {
            for (var r = 0; r <= 2 * Math.PI; r += d) {
                var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
                var p2 = [Math.sin(t + d) * Math.cos(r), Math.sin(t + d) * Math.sin(r), Math.cos(t + d)];
                var p3 = [Math.sin(t) * Math.cos(r + d), Math.sin(t) * Math.sin(r + d), Math.cos(t)];
                var p4 = [Math.sin(t + d) * Math.cos(r + d), Math.sin(t + d) * Math.sin(r + d), Math.cos(t + d)];


                this.vertices.push(...p1, ...p2, ...p4, ...p1, ...p4, ...p3);
                this.normals.push(...p1, ...p2, ...p4, ...p1, ...p4, ...p3); //Normals are the same as the vertex position, because the sphere is centered at origin.
                this.uvs.push(r / (2 * Math.PI), t / Math.PI, (r / (2 * Math.PI)), (t + d) / Math.PI, (r + d) / (2 * Math.PI), (t + d) / Math.PI, r / (2 * Math.PI), t / Math.PI, (r + d) / (2 * Math.PI), (t + d) / Math.PI, (r + d) / (2 * Math.PI), t / Math.PI);
            }
        }
    }

    initBuffers(v, uv, v1) {
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);

        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);

        this.normBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v1), gl.STATIC_DRAW);
    }

    render() {
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}