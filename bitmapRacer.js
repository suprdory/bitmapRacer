
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
    constructor() {

        // car design
        this.w = 40; //width
        this.l = 60; //length
        this.wheelWidth = 10;
        this.wheelAspect = 2
        this.oversize = 1.15;
        this.bodyAspect = 1.3;

        // mech + kin
        this.x = 70; // x pos relative to car
        this.y = 150; // y pos

        this.ax = 0; // x accel
        this.ay = 0; // y accel
        this.m = 1; // mass
        this.to = 0; //heading torque;
        this.momI = 10000; // moment of inertia
        this.U = 0; //speed
        this.thetaU = 0; //velocity angle
        this.headOff=0; // heading - velocity angle
        this.theta = 0; // heading angle
        this.thetaDot = 0.0;//heading angle deriv
        this.ux = this.U * Math.sin(this.theta); // x vel
        this.uy = this.U * Math.cos(this.theta); // y vel


        // specs
        this.steeringRate = 0.2;
        this.steeringMax = 45 * Math.PI / 180;
        this.steeringCentreRate = 0.05;
        this.torqueRate = 0.1;
        this.torqueMax = .5;
        this.brakeMax = 1;
        this.brakeRate = 0.4;

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
    readTrack() {
        this.wheels.forEach(function (wheel) {
            //wheel centre abs coords
            let xw = Math.round(wheel.xa * scl / img_scl);
            let yw = Math.round(wheel.ya * scl / img_scl);
            let nX = img.width;
            let nY = img.height;
            if (xw < 0 | xw > nX | yw < 0 | yw > nY) {
                wheel.sfc = 1;
            }
            else {
                // yw=nY-yw
                let r = imageData[((yw * (nX * 4)) + (xw * 4)) + 0];
                let g = imageData[((yw * (nX * 4)) + (xw * 4)) + 1];
                let b = imageData[((yw * (nX * 4)) + (xw * 4)) + 2];
                // a = imageData[((yw * (img.width * 4)) + (xw * 4)) + 3];
                wheel.sfc = (r + g + b) / 3 / 255;
            }
            // console.log(r)
        })
    }
    draw(ctx) {
        this.wheels.forEach(wheel => wheel.draw(ctx, this));

        x = this.coordMat;
        x = MatrixProd(x, this.rotMat);
        x = MatrixTrans(x, [this.x, this.y])

        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = baseLW / scl;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();

        // //velocity vector
        // ctx.beginPath();
        // ctx.strokeStyle = "yellow";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.x + this.ux * vel_scl, this.y + this.uy * vel_scl);
        // ctx.stroke();
        // //acceleration vector
        // ctx.beginPath();
        // ctx.strokeStyle = "magenta";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(this.x, this.y);
        // ctx.lineTo(this.x + this.ax * acc_scl, this.y + this.ay * acc_scl);
        // ctx.stroke();


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
            this.wheels[1].theta = this.wheels[0].theta;
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
            // this.wheels[1].theta = Math.max(-this.steeringMax, this.wheels[1].theta - this.steeringRate * dt);
            // this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        else {
            this.wheels[0].theta = this.wheels[0].theta + (-this.wheels[0].theta-this.headOff) * this.U ** 0.5 * this.steeringCentreRate * dt;
            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = this.wheels[0].theta
            // this.wheels[1].theta = this.wheels[1].theta - this.wheels[1].theta * this.U ** 0.5 * this.steeringCentreRate * dt;
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        if (inputState.up) {
            // front wheel accel
            this.wheels[0].torque = Math.min(this.torqueMax, this.wheels[0].torque + this.torqueRate * dt);
            this.wheels[1].torque = Math.min(this.torqueMax, this.wheels[1].torque + this.torqueRate * dt);
            this.wheels[2].torque = Math.min(this.torqueMax, this.wheels[2].torque + this.torqueRate * dt);
            this.wheels[3].torque = Math.min(this.torqueMax, this.wheels[3].torque + this.torqueRate * dt);
        }
        else {
            this.wheels[0].torque = 0;
            this.wheels[1].torque = 0;
            this.wheels[2].torque = 0;
            this.wheels[3].torque = 0;

        }
        if (inputState.down) {
            this.wheels[0].torque = 0;
            this.wheels[1].torque = 0;
            this.wheels[2].torque = 0;
            this.wheels[3].torque = 0;
            // 4 wheel braking
            this.wheels[0].brake = Math.min(this.brakeMax, this.wheels[0].brake + this.brakeRate * dt);
            this.wheels[1].brake = Math.min(this.brakeMax, this.wheels[1].brake + this.brakeRate * dt);
            this.wheels[2].brake = Math.min(this.brakeMax, this.wheels[2].brake + this.brakeRate * dt);
            this.wheels[3].brake = Math.min(this.brakeMax, this.wheels[3].brake + this.brakeRate * dt);
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
            let cos_thth = Math.cos(this.theta + wh.theta);
            let sin_thphi = Math.sin(this.theta + wh.theta);

            // velocity - relative to car
            wh.ux = +this.thetaDot * wh.d * Math.cos(this.theta + wh.phi);
            wh.uy = -this.thetaDot * wh.d * Math.sin(this.theta + wh.phi);
            // velocity - absolute
            wh.uxA = wh.ux + this.ux;
            wh.uyA = wh.uy + this.uy;

            // velocity parallel/perpendicular to wheel
            wh.uApar = -wh.uyA * cos_thth - wh.uxA * sin_thphi;
            wh.uAperp = -wh.uyA * sin_thphi + wh.uxA * cos_thth;

            //thrust
            wh.FTx = wh.torque * sin_thphi;
            wh.FTy = wh.torque * cos_thth;

            //drag
            wh.FDx = -wh.uxA * wh.drg;
            wh.FDy = -wh.uyA * wh.drg;

            // braking
            if (Math.abs(wh.uApar) < 1) {
                wh.FBx = wh.uApar * wh.brake * wh.sfc * sin_thphi;
                wh.FBy = wh.uApar * wh.brake * wh.sfc * cos_thth;
            }
            else {
                wh.FBx = Math.sign(wh.uApar) * wh.brake * sin_thphi;
                wh.FBy = Math.sign(wh.uApar) * wh.brake * cos_thth;
            }

            // lateral friction
            if (Math.abs(wh.uAperp) < 2) {
                wh.skidFac = 0;
                wh.FLx = -(wh.uAperp) * cos_thth * mu_lat * wh.sfc;
                wh.FLy = (wh.uAperp) * sin_thphi * mu_lat * wh.sfc;
                // console.log("tract")
            }
            else {
                wh.skidFac = 5;
                wh.FLx = -Math.sign(wh.uAperp) * cos_thth * mu_lat * wh.sfc;
                wh.FLy = Math.sign(wh.uAperp) * sin_thphi * mu_lat * wh.sfc;
                // console.log("skid")
            }


            // torque due to thrust
            this.to = this.to + wh.torque * wh.d * Math.sin(wh.theta + wh.phi);

            // torque due to lateral friction
            this.to = this.to + wh.FLx * wh.d * Math.cos(this.theta + wh.phi);
            this.to = this.to + -wh.FLy * wh.d * Math.sin(this.theta + wh.phi);


            // resultant wheel force
            Fx = Fx + wh.FTx + wh.FBx + wh.FLx + wh.FDx;
            Fy = Fy + wh.FTy + wh.FBy + wh.FLy + wh.FDy;

        }

        // console.log(this.wheels[0].theta)
        this.ax = Fx / this.m;
        this.ay = Fy / this.m;
        this.ux = this.ux + this.ax * dt;
        this.uy = this.uy + this.ay * dt;
        this.U = (this.ux ** 2 + this.uy ** 2) ** .5
        this.thetaU = Math.atan2(this.ux, this.uy);
        this.x = this.x + this.ux * dt;
        this.y = this.y + this.uy * dt;
        this.thetaDot = this.thetaDot + this.to / this.momI * dt;
        this.theta = this.theta + this.thetaDot * dt;
        this.rotMat = calcRotMat(this.theta);
        this.headOff = (this.thetaU - this.theta) % (Math.PI * 2);
        if (this.headOff > Math.PI) { this.headOff = this.headOff - 2 * Math.PI }
        if (this.headOff < -Math.PI) { this.headOff = this.headOff + 2 * Math.PI }
    }

}
class Wheel {
    constructor(x, y, width, aspect, th) {
        this.x = x; // wheel centre position relative to car CoM
        this.y = y;
        this.xa = x; // x pos absolute
        this.ya = y; // y pos
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

        this.sfc = 0; //surface, to be read from track img
        this.drg = 0.005;

        this.d = (x ** 2 + y ** 2) ** 0.5; // distance to car CoM
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
        ctx.lineWidth = baseLW / scl;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();

        //wheel centre abs coords
        x = MatrixProd([[this.x, this.y]], car.rotMat);
        x = MatrixTrans(x, [car.x, car.y]);
        this.xa = x[0][0];
        this.ya = x[0][1];
        // //draw rel vel vectors
        // ctx.beginPath();
        // ctx.strokeStyle = "purple";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(this.xa, this.ya);
        // ctx.lineTo(this.xa + this.ux * vel_scl, this.ya + this.uy * vel_scl);
        // ctx.stroke();

        // //draw abs vel vectors
        // ctx.beginPath();
        // ctx.strokeStyle = "yellow";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(x[0][0], x[0][1]);
        // ctx.lineTo(x[0][0] + this.uxA * vel_scl, x[0][1] + this.uyA * vel_scl);
        // ctx.stroke();


        // //draw thrust force vectors
        // ctx.beginPath();
        // ctx.strokeStyle = "green";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(x[0][0], x[0][1]);
        // ctx.lineTo(x[0][0] + this.FTx * force_scl, x[0][1] + this.FTy * force_scl);
        // ctx.stroke();


        // //draw brake force vectors
        // ctx.beginPath();
        // ctx.strokeStyle = "red";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(x[0][0], x[0][1]);
        // ctx.lineTo(x[0][0] + this.FBx * force_scl, x[0][1] + this.FBy * force_scl);
        // ctx.stroke();

        // //draw lateral friction force vectors
        // ctx.beginPath();
        // ctx.strokeStyle = "turquoise";
        // ctx.lineWidth = baseLW;
        // ctx.moveTo(x[0][0], x[0][1]);
        // ctx.lineTo(x[0][0] + this.FLx * force_scl, x[0][1] + this.FLy * force_scl);
        // ctx.stroke();


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
function drawDebug() {
    // xw0 = Math.round(car.wheels[0].xa / img_scl);
    // yw0 = Math.round(car.wheels[0].ya / img_scl);
    // xw1 = Math.round(car.wheels[1].xa / img_scl);
    // yw1 = Math.round(car.wheels[1].ya / img_scl);

    ctx.fillStyle = "white"
    ctx.textAlign = "left"
    nX = img.width;
    nY = img.height;
    // r = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 0];
    // g = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 1];
    // b = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 2];
    // a = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 3];
    // let rgba=imageData[((50*(imageData.width*4)) + (200*4)) + 2];

    // ctx.fillText(xw0.toFixed(1) + " " + yw0.toFixed(1), 100, 100)
    // ctx.fillText(xw1.toFixed(1) + " " + yw1.toFixed(1), 100, 120)
    // ctx.fillText(nX + " " + nY, 100, 140);
    ctx.fillText("theta " + Math.round(car.theta * 360 / (Math.PI * 2)), 100, 160)
    ctx.fillText("thetaU " + Math.round(car.thetaU * 360 / (Math.PI * 2)), 100, 180)
    ctx.fillText("theta-thetaU " + Math.round((car.headOff) * 360 / (Math.PI * 2)), 100, 200)
    // ctx.fillText(r + " " + g + " " + b + " " + a, 100, 160)
}
function showImage(fileReader) {
    var img = document.getElementById("myImage");
    img.onload = () => getImageData(img);
    img.src = fileReader.result;

}
function drawHUD() {
    hudX = 10;
    hudY = 10;
    barHeight = 50;
    barWidthSpace = 5;
    barWidth = 20;
    ctx.lineWidth = baseLW;
    ctx.strokeStyle = "green";
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.rect(hudX, Y - hudY, barWidth, -barHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(hudX, Y - hudY, barWidth, -car.wheels[0].torque / car.torqueMax * barHeight);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.fillStyle = "red";
    ctx.rect(hudX + barWidth + barWidthSpace, Y - hudY, barWidth, -barHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(hudX + barWidth + barWidthSpace, Y - hudY, barWidth, -car.wheels[0].brake / car.brakeMax * barHeight);
    ctx.fill()


    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.fillStyle = "blue"
    ctx.rect(hudX + 2 * (barWidth + barWidthSpace), Y - hudY, barWidth, -barHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(hudX + 2 * (barWidth + barWidthSpace), Y - hudY, barWidth, -car.U / 100 * barHeight);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    ctx.fillStyle = "yellow";
    ctx.rect(hudX, Y - hudY - barHeight - barWidthSpace, barWidth * 3 + barWidthSpace * 2, -barWidth);
    ctx.rect(hudX + (barWidth * 3 + barWidthSpace * 2) / 2, Y - hudY - barHeight - barWidthSpace, 0, -barWidth);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(hudX + (barWidth * 3 + barWidthSpace * 2) / 2, Y - hudY - barHeight - barWidthSpace, -(barWidth * 3 + barWidthSpace * 2) / 2 * car.wheels[0].theta / car.steeringMax, -barWidth);
    ctx.fill();


    whX = [hudX + 2 * (barWidth + barWidthSpace), hudX, hudX + 2 * (barWidth + barWidthSpace), hudX]

    whY = [Y - hudY - barHeight - 2 * barWidthSpace - 3 * barWidth, Y - hudY - barHeight - 2 * barWidthSpace - 3 * barWidth, Y - hudY - barHeight - 2 * barWidthSpace - barWidth, Y - hudY - barHeight - 2 * barWidthSpace - barWidth]
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = "rgb(" + car.wheels[i].skidFac * 50 + ",0,0)";
        ctx.beginPath();
        ctx.rect(whX[i], whY[i], barWidth, -barWidth * 1.5)
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.rect(whX[i], whY[i], barWidth, -barWidth * 1.5)
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "15px arial";
        ctx.fillText(Math.round(car.wheels[i].sfc * 10), whX[i] + barWidth / 2, whY[i] - barWidth * 1.5 / 2)
    }



}
function getImageData() {
    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, img.width, img.height).data;
    console.log("image data:", imageData);
}
// document.getElementById('myFile').onchange = function (evt) {
//     var tgt = evt.target || window.event.srcElement, files = tgt.files;
//     // FileReader support
//     if (FileReader && files && files.length) {
//         var fr = new FileReader();
//         fr.onload = () => showImage(fr);
//         fr.readAsDataURL(files[0]);
//     }
// }
function anim() {
    if (n < nMax) {
        requestAnimationFrame(anim);
    }
    // if (n == 2) {
    //     getImageData(img);
    // }

    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //scaled stuff

    ctx.setTransform(scl, 0, 0, scl, X / 2 - car.x, Y / 2 - car.y);
    ctx.drawImage(img, 0, 0, img_scl * img.width / scl, img_scl * img.height / scl);
    car.draw(ctx);
    car.control(inputState);
    car.readTrack();
    car.mechanic();

    n++;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawDebug();
    drawHUD();
}
const canvas = document.getElementById("cw");
const ctx = canvas.getContext("2d");
const PI2 = Math.PI * 2;
pixRat = window.devicePixelRatio * 1.0;
canvas.height = window.innerHeight * pixRat;
canvas.width = window.innerWidth * pixRat;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";
let baseLW = 2;
let X = canvas.width;
let Y = canvas.height;

console.log("pixel ratio", pixRat)

addEventListener('keydown', (event) => { inputState.set(event) });
addEventListener('keyup', (event) => { inputState.set(event) });

const dt = 0.2
const vel_scl = 1;
const acc_scl = 1;
const force_scl = 20;
const mu_lat = 3;
const forceBrake = false;
const forceLeft = false;
// const forceLeft = true;
// const forceBrake = true;

let scl = 1;
let n = 0;
let nMax = 10000;
let inputState = new InputState;
let car = new Car(x = 200, y = 300, w = 120, l = 200);

// image set up
const img = new Image();   // Create new img element
img.src = 'square_track.png'; // Set source path
img_scl = 2;

let imageData;

img.onload = function () {
    getImageData();
    anim();
    console.log(img.width, img.height)
}


