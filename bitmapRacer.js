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
        this.ux = 0; // x vel
        this.uy = 30;  // y vel
        this.U = 0; //speed
        this.ax = 0; // x accel
        this.ay = 0; // y accel
        this.m = 1; // mass
        this.to = 0; //heading torque;
        this.momI = 10000; // moment of inertia
        this.theta = 0; // heading angle
        this.thetaDot = 0.0;//heading angle deriv

        // specs
        this.steeringRate = 0.1;
        this.steeringMax = 45 * Math.PI / 180;
        this.steeringCentreRate = 0.01;
        this.torqueRate = 0.5;
        this.torqueMax = 100;
        this.brakeMax = 0.5;
        this.brakeRate = .1;

        this.rotMat = calcRotMat(this.theta);

        let xl = -this.w / 2 * this.oversize;
        let xr = +this.w / 2 * this.oversize;
        let yf = this.l / 2 * this.oversize * this.bodyAspect;
        let yr = -this.l / 2 * this.oversize * this.bodyAspect;
        this.coordMat = [[xl, yr], [xl, yf], [0, yf * 1.1], [xr, yf], [xr, yr]];
        this.wheels = [
            new Wheel(-this.w / 2, this.l / 2, this.wheelWidth, this.wheelAspect, 0.0),
            new Wheel(this.w / 2, this.l / 2, this.wheelWidth, this.wheelAspect, 0.0),
            new Wheel(-this.w / 2, -this.l / 2, this.wheelWidth, this.wheelAspect, 0.0),
            new Wheel(this.w / 2, -this.l / 2, this.wheelWidth, this.wheelAspect, 0.0)
        ];
    }
    draw(ctx) {
        this.wheels.forEach(wheel => wheel.draw(ctx, this));

        x = this.coordMat;
        x = MatrixProd(x, this.rotMat);
        x = MatrixTrans(x, [this.x, this.y])

        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = baseLW;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();
        // console.log(this);

        //velocity vector
        ctx.beginPath();
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = baseLW;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.ux * vel_scl, this.y + this.uy * vel_scl);
        ctx.stroke();
        //acceleration vector
        ctx.beginPath();
        ctx.strokeStyle = "magenta";
        ctx.lineWidth = baseLW;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.ax * acc_scl, this.y + this.ay * acc_scl);
        ctx.stroke();


    }
    control(inputState) {
        if (inputState.left) {
            this.wheels[0].theta = Math.min(this.steeringMax, this.wheels[0].theta + this.steeringRate * dt);
            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = Math.min(this.steeringMax, this.wheels[1].theta + this.steeringRate * dt);
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        else if (inputState.right) {
            this.wheels[0].theta = Math.max(-this.steeringMax, this.wheels[0].theta - this.steeringRate * dt);
            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = Math.max(-this.steeringMax, this.wheels[1].theta - this.steeringRate * dt);
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        else {
            this.wheels[0].theta = this.wheels[0].theta - this.wheels[0].theta * this.U * this.steeringCentreRate * dt;
            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = this.wheels[1].theta - this.wheels[1].theta * this.U * this.steeringCentreRate * dt;
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        if (inputState.up) {
            // front wheel accel
            this.wheels[0].torque = Math.min(this.torqueMax, this.wheels[0].torque + this.torqueRate * dt);
            this.wheels[1].torque = Math.min(this.torqueMax, this.wheels[1].torque + this.torqueRate * dt);
        }
        else {
            this.wheels[0].torque = 0;
            this.wheels[1].torque = 0;
        }
        if (inputState.down) {
            // 4 wheel braking
            this.wheels[0].brake = Math.min(this.brakeMax, this.wheels[0].brake + this.brakeRate * dt);
            this.wheels[1].brake = Math.min(this.brakeMax, this.wheels[1].brake + this.brakeRate * dt);
            this.wheels[2].brake = Math.min(this.brakeMax, this.wheels[1].brake + this.brakeRate * dt);
            this.wheels[3].brake = Math.min(this.brakeMax, this.wheels[1].brake + this.brakeRate * dt);
        }
        else {
            this.wheels[0].brake = 0;
            this.wheels[1].brake = 0;
            this.wheels[2].brake = 0;
            this.wheels[3].brake = 0;
        }

    }
    mechanic() {
        // console.log(this);
        this.to = 0;
        this.ax = 0;
        this.ay = 0;
        let Fx = 0;
        let Fy = 0;

        for (let i = 0; i < 4; i++) {
            let wh = this.wheels[i];

            // velocity - relative to car
            wh.ux = +this.thetaDot * wh.d * Math.cos(this.theta + wh.phi);
            wh.uy = -this.thetaDot * wh.d * Math.sin(this.theta + wh.phi);
            // velocity - absolute
            wh.uxA = wh.ux + this.ux;
            wh.uyA = wh.uy + this.uy;

            // velocity parallel/perpendicular to wheel
            wh.uApar = -wh.uyA * Math.cos(this.theta + wh.theta) - wh.uxA * Math.sin(this.theta + wh.theta);
            wh.uAperp = -wh.uyA * Math.sin(this.theta + wh.theta) + wh.uxA * Math.cos(this.theta + wh.theta);

            //thrust
            wh.FTx = wh.torque * Math.sin(this.theta + wh.theta);
            wh.FTy = wh.torque * Math.cos(this.theta + wh.theta);

            // braking
            wh.FBx = Math.sin(this.theta + wh.theta) * wh.uApar * wh.brake;
            wh.FBy = Math.cos(this.theta + wh.theta) * wh.uApar * wh.brake;

            // lateral friction

            if (Math.abs(wh.uAperp<5)){
                wh.skidFac=1;
                // console.log("tract")
            }
            else{
                wh.skidFac = .01;
                // console.log("skid")
            } 
            wh.FLx = -wh.uAperp * Math.cos(this.theta + wh.theta) * mu_lat*wh.skidFac;
            wh.FLy = wh.uAperp * Math.sin(this.theta + wh.theta) * mu_lat*wh.skidFac;

            // torque due to thrust
            this.to = this.to + wh.torque * wh.d * Math.sin(wh.theta + wh.phi);

            // torque due to lateral friction
            this.to = this.to + wh.FLx * wh.d * Math.cos(this.theta + wh.phi);
            this.to = this.to + -wh.FLy * wh.d * Math.sin(this.theta + wh.phi);


            // resultant wheel force
            Fx = Fx + wh.FTx + wh.FBx + wh.FLx;
            Fy = Fy + wh.FTy + wh.FBy + wh.FLy;

        }

        // console.log(this.wheels[0].theta)
        this.ax = Fx / this.m;
        this.ay = Fy / this.m;
        this.ux = this.ux + this.ax * dt;
        this.uy = this.uy + this.ay * dt;
        this.U = (this.ux ** 2 + this.uy ** 2) ** .5
        this.x = this.x + this.ux * dt;
        this.y = this.y + this.uy * dt;

        this.thetaDot = this.thetaDot + this.to / this.momI * dt;
        this.theta = this.theta + this.thetaDot * dt;
        this.rotMat = calcRotMat(this.theta);

    }

}
class Wheel {
    constructor(x, y, width, aspect, th) {
        this.x = x; // wheel centre position relative to car
        this.y = y;
        this.ux = 0; // relative (to car) velocity
        this.uy = 0;
        this.uxA = 0; // abs velocity
        this.uyA = 0;
        this.FTx = 0;// thrust force components
        this.FTy = 0;
        this.FBx = 0;// brake force components
        this.FBy = 0;
        this.FLx = 0;// perpendicular force components
        this.FLy = 0;

        this.d = (x ** 2 + y ** 2) ** 0.5;
        this.phi = Math.atan2(x, y);
        // this.phiy = Math.atan2(y, -x);
        this.width = width;
        this.length = width * aspect;
        this.theta = th;
        this.grip = 1;
        this.color = "white";
        this.torque = 0;
        this.brake = 0;
        let xl = -this.width / 2;
        let xr = this.width / 2;
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

        //wheel centre abs coords
        x = MatrixProd([[this.x, this.y]], car.rotMat);
        x = MatrixTrans(x, [car.x, car.y])

        //draw rel vel vectors
        ctx.beginPath();
        ctx.strokeStyle = "purple";
        ctx.lineWidth = baseLW;
        ctx.moveTo(x[0][0], x[0][1]);
        ctx.lineTo(x[0][0] + this.ux * vel_scl, x[0][1] + this.uy * vel_scl);
        ctx.stroke();

        //draw abs vel vectors
        ctx.beginPath();
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = baseLW;
        ctx.moveTo(x[0][0], x[0][1]);
        ctx.lineTo(x[0][0] + this.uxA * vel_scl, x[0][1] + this.uyA * vel_scl);
        ctx.stroke();


        //draw thrust force vectors
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.lineWidth = baseLW;
        ctx.moveTo(x[0][0], x[0][1]);
        ctx.lineTo(x[0][0] + this.FTx * force_scl, x[0][1] + this.FTy * force_scl);
        ctx.stroke();


        //draw brake force vectors
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = baseLW;
        ctx.moveTo(x[0][0], x[0][1]);
        ctx.lineTo(x[0][0] + this.FBx * force_scl, x[0][1] + this.FBy * force_scl);
        ctx.stroke();

        //draw lateral friction force vectors
        ctx.beginPath();
        ctx.strokeStyle = "turquoise";
        ctx.lineWidth = baseLW;
        ctx.moveTo(x[0][0], x[0][1]);
        ctx.lineTo(x[0][0] + this.FLx * force_scl, x[0][1] + this.FLy * force_scl);
        ctx.stroke();


    }

}

class InputState {
    constructor() {
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        if (forceBrake) {
            this.down = true;
        }
        if (forceLeft) {
            this.left = true;
        }
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
        if (forceBrake) {
            this.down = true;
        }
        if (forceLeft) {
            this.left = true;
        }
    }
}

function anim() {
    if (n < nMax) {
        requestAnimationFrame(anim);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //scaled stuff
    ctx.setTransform(scl, 0, 0, scl, 0, 0);

    car.draw(ctx);
    car.control(inputState);
    car.mechanic();
    n++;
}


addEventListener('keydown', (event) => { inputState.set(event) });
addEventListener('keyup', (event) => { inputState.set(event) });
const dt = 0.2
const vel_scl = 1;
const acc_scl = 1;
const force_scl = 1;
const mu_lat = 1;
const forceBrake = false;
const forceLeft=false;
// const forceLeft = true;

// const forceBrake = true;

let scl = 1 / 2;
let n = 0;
let nMax = 10000;
let inputState = new InputState;
let car = new Car(x = 300, y = 400, w = 120, l = 200);
// car.draw(ctx);
anim();

