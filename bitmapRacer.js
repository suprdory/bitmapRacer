const canvas = document.getElementById("cw");
const ctx = canvas.getContext("2d");
const PI2 = Math.PI * 2;
pixRat = window.devicePixelRatio * 1.0;

canvas.height = window.innerHeight * pixRat;
canvas.width = window.innerWidth * pixRat;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
let baseLW = 2;
X = canvas.width;
Y = canvas.height;

let MatrixProd = (A, B) =>
    A.map((row, i) =>
        B[0].map((_, j) =>
            row.reduce((acc, _, n) =>
                acc + A[i][n] * B[n][j], 0
            )
        )
    )
function MatrixTrans(A, B) {
    let ni = A.length;
    let nj = A[0].length;
    let C = new Array(ni);
    for (let i = 0; i < ni; i++) {
        C[i] = new Array(nj);
    }
    for (let i = 0; i < ni; i++) {
        for (let j = 0; j < nj; j++) {
            C[i][j] = A[i][j] + B[j];
        }
    }
    // console.log(ni, nj);
    return C;
}
function calcRotMat(theta) {
    return [[Math.cos(theta), -Math.sin(theta)],
    [Math.sin(theta), Math.cos(theta)]];
}
class Car {
    constructor(x, y, w, l) {

        // car design
        this.w = w; //width
        this.l = l; //length
        this.wheelWidth = 30;
        this.wheelAspect = 2
        this.oversize = 1.15;
        this.bodyAspect = 1.3;

        // mech + kin
        this.x = x; // x pos
        this.y = y; // y pos
        this.u = 0; // x vel
        this.v = 0;  // y vel
        this.ax = 0; // x accel
        this.ay = 0; // y accel
        this.m = 10; // mass
        this.to = 0; //heading torque;
        this.momI = 100; // moment of inertia
        this.theta = 0.0; // heading angle
        this.thetaDot = 0.0;//heading angle deriv

        // specs
        this.steeringRate = 0.05;
        this.steeringMax = 45 * Math.PI / 180;
        this.torqueRate = 0.5;
        this.torqueMax = 100;

        this.rotMat = calcRotMat(this.theta);

        let xl = -this.w / 2 * this.oversize;
        let xr = +this.w / 2 * this.oversize;
        let yf = this.l / 2 * this.oversize * this.bodyAspect;
        let yr = -this.l / 2 * this.oversize * this.bodyAspect;
        this.coordMat = [[xl, yr], [xl, yf], [0, yf * 1.1], [xr, yf], [xr, yr]];
        this.wheels = [
            new Wheel(-this.w / 2, this.l / 2, this.wheelWidth, this.wheelAspect, 0.2),
            new Wheel(this.w / 2, this.l / 2, this.wheelWidth, this.wheelAspect, 0.2),
            new Wheel(-this.w / 2, -this.l / 2, this.wheelWidth, this.wheelAspect, 0.0),
            new Wheel(this.w / 2, -this.l / 2, this.wheelWidth, this.wheelAspect, 0.0)
        ];
    }
    draw(ctx) {
        this.wheels.forEach(wheel => wheel.draw(ctx, this));
        this.rotMat = calcRotMat(this.theta);
        x = this.coordMat;
        x = MatrixProd(x, this.rotMat);
        x = MatrixTrans(x, [this.x, this.y])
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = baseLW;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();
        // console.log(this);

    }
    control(inputState) {
        if (inputState.left) {
            this.wheels[0].theta = Math.min(this.steeringMax, this.wheels[0].theta + this.steeringRate);
            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = Math.min(this.steeringMax, this.wheels[1].theta + this.steeringRate);
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)


        }
        if (inputState.right) {
            this.wheels[0].theta = Math.max(-this.steeringMax, this.wheels[0].theta - this.steeringRate);
            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = Math.max(-this.steeringMax, this.wheels[1].theta - this.steeringRate);
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        if (inputState.up) {
            this.wheels[0].torque = Math.min(this.torqueMax, this.wheels[0].torque + this.torqueRate);
            // this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].torque = Math.min(this.torqueMax, this.wheels[1].torque + this.torqueRate);
            // this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        else {
            this.wheels[0].torque = 0;
            this.wheels[1].torque = 0;
        }

    }
    mechanic() {
        // console.log(this);
        this.to = 0;
        this.ax = 0;
        this.ay = 0;
        for (let i = 0; i < 4; i++) {
            let wh = this.wheels[i];
            // sum acceleration and torque over wheels
            //accel
            this.ax = this.ax + wh.torque * Math.sin(this.theta + wh.theta) / this.m;
            this.ay = this.ay + wh.torque * Math.cos(this.theta + wh.theta) / this.m;
            // torque
            this.to = this.to + wh.torque * wh.d*pixPerMetre * Math.sin(wh.theta + wh.phi) / this.momI;
        }
        // console.log(this.thetaDot)
        this.u = this.u + this.ax * dt;
        this.v = this.v + this.ay * dt;
        this.x = this.x + this.u * dt;
        this.y = this.y + this.v * dt;

        this.thetaDot = this.thetaDot + this.to * dt;
        this.theta = this.theta + this.thetaDot * dt;

    }

}
class Wheel {
    constructor(x, y, width, aspect, th) {
        this.x = x;
        this.y = y;
        this.d = (x ** 2 + y ** 2) ** 0.5;
        this.phi = Math.atan2(x, y);
        this.width = width;
        this.length = width * aspect;
        this.theta = th;
        this.grip = 1;
        this.color = "white";
        this.torque = 0;
        let xl = -this.width / 2;
        let xr = +this.width / 2;
        let yf = this.length / 2;
        let yr = -this.length / 2;
        this.coordMat = [[xl, yr], [xl, yf], [xr, yf], [xr, yr]];
        this.rotMat = calcRotMat(this.theta);
    }

    draw(ctx, car) {
        // let x=this.coordMat;
        let x = MatrixProd(this.coordMat, this.rotMat);
        x = MatrixTrans(x, [this.x, this.y]);
        x = MatrixProd(x, car.rotMat);
        x = MatrixTrans(x, [car.x, car.y])
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = baseLW;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();
    }

}

class InputState {
    constructor() {
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
    }
    set(event) {
        // console.log(event)
        if (event['type'] == "keydown" & event['key'] == "ArrowUp") {
            this.up = true;
        }
        if (event['type'] == "keyup" & event['key'] == "ArrowUp") {
            this.up = false;
        }
        if (event['type'] == "keydown" & event['key'] == "ArrowDown") {
            this.down = true;
        }
        if (event['type'] == "keyup" & event['key'] == "ArrowDown") {
            this.down = false;
        }
        if (event['type'] == "keydown" & event['key'] == "ArrowLeft") {
            this.left = true;
        }
        if (event['type'] == "keyup" & event['key'] == "ArrowLeft") {
            this.left = false;
        }
        if (event['type'] == "keydown" & event['key'] == "ArrowRight") {
            this.right = true;
        }
        if (event['type'] == "keyup" & event['key'] == "ArrowRight") {
            this.right = false;
        }
        // console.log(this.left, this.right, this.up, this.down);
    }
}

function anim() {
    if (n < 1000) {
        requestAnimationFrame(anim);
    }

    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    car.draw(ctx);
    car.control(inputState);
    car.mechanic();
    n++;
}


addEventListener('keydown', (event) => { inputState.set(event) });
addEventListener('keyup', (event) => { inputState.set(event) });
const pixPerMetre=0.01
const dt = 0.1
let n = 0;
let inputState = new InputState;
let car = new Car(x = 300, y = 400, w = 120, l = 200);
// car.draw(ctx);
anim();

