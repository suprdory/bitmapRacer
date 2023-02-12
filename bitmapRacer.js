class Track {
    constructor() {

        this.trackPPM = 1 / p.track.metresPerPix; // track image pixels per metre
        this.trackScl = PPM / this.trackPPM; //screen pix/track pix ratio, use to scale buffered track display and data from initial image
        this.flipX = p.track.flipX;
        this.flipY = p.track.flipY;
        this.gates = p.track.gates;
        this.reverse = p.track.reverse;
        if (!this.reverse) {
            this.startX = this.flipX ? (p.track.x - p.track.startX) / this.trackPPM : p.track.startX / this.trackPPM;
            this.startY = this.flipY ? (p.track.x - p.track.startY) / this.trackPPM : p.track.startY / this.trackPPM;
        }
        else {
            this.startX = this.flipX ? (p.track.x - p.track.startXRev) / this.trackPPM : p.track.startXRev / this.trackPPM;
            this.startY = this.flipY ? (p.track.x - p.track.startYRev) / this.trackPPM : p.track.startYRev / this.trackPPM;
        }
        this.canvas = document.createElement("canvas"); // draw original img here
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.canvasScl = document.createElement("canvas"); // draw prescaled track imgh here
        this.ctxScl = this.canvasScl.getContext("2d", { alpha: false });
        this.trackReady = false;
        this.imageData; // extracted on img load;
        this.sfc_mu; // derived after img load by image2trackDat();
        this.sfc_drag; // derived after img load by image2trackDat();
        this.sfcTypes = p.track.sfcTypes;
        this.img = new Image();
        this.img.onload = () => {
            // console.log("track object img loaded")
            this.getImageData();
            this.trackReady = 1;
            // console.log("track ready", this)
        }
        this.img.src = p.track.fname;
        this.Xi = 0; //img dimensions, obtained after load.
        this.Yi = 0;
        this.flipGates();
    }

    flipGates() {
        log(this.gates)

        if (this.flipY) {
            this.gates = this.gates.map(g => ({
                'n': g.n,
                'right': { 'x': g.left.x, 'y': p.track.y - g.left.y },
                'left': { 'x': g.right.x, 'y': p.track.y - g.right.y }
            }));
            log(this.gates);
        }
        if (this.flipX) {
            this.gates = this.gates.map(g => ({
                'n': g.n,
                'right': { 'x': p.track.x - g.left.x, 'y': g.left.y },
                'left': { 'x': p.track.x - g.right.x, 'y': g.right.y }
            }));
        }


        //     log(this.startY)
        //     this.startY = (this.Yi-p.track.startY) / this.trackPPM;
        //     log(this.startY)
        // }
        // if (this.flipX) {
        //     log(this.startX)
        //     this.startX = (this.Xi - p.track.startX) / this.trackPPM;
        //     log(this.startX)
        // }
    }
    get_sfc_params(x, y) {
        // returns drag and mu at x,y (metres)

        // convert metres to track pixels
        let xw = Math.round(x * PPM / this.trackScl);
        let yw = Math.round(y * PPM / this.trackScl);
        if (xw < 0 | xw > (this.Xi - 1) | yw < 0 | yw > (this.Yi - 1)) {
            // console.log('OOB')
            return [this.sfcTypes.outOfBounds.drag, this.sfcTypes.outOfBounds.mu];
        }
        else {
            return [this.sfc_drag[xw][yw], this.sfc_mu[xw][yw]];
        }
    }
    image2trackDat() {
        //turn imageData into track variables this.sfc_mu and sfc_drag

        // console.log("im2trck")
        let Xi = this.Xi;
        let Yi = this.Yi;
        // read rbg values from image data
        let r = Array(Xi);
        let g = Array(Xi);
        let b = Array(Xi);
        let a = Array(Xi);
        for (let i = 0; i < Xi; i++) {
            let r_col = Array(Yi);
            let g_col = Array(Yi);
            let b_col = Array(Yi);
            let a_col = Array(Yi);
            for (let j = 0; j < Yi; j++) {
                r_col[j] = this.imageData[((j * (Xi * 4)) + (i * 4)) + 0];
                b_col[j] = this.imageData[((j * (Xi * 4)) + (i * 4)) + 1];
                g_col[j] = this.imageData[((j * (Xi * 4)) + (i * 4)) + 2];
                a_col[j] = this.imageData[((j * (Xi * 4)) + (i * 4)) + 2];
            }
            r[i] = r_col
            b[i] = g_col
            g[i] = b_col
            a[i] = a_col
        }
        // console.log(Xi, Yi);

        // convert rbg matrices into hsl matrices for surface type diag
        let h = Array(Xi);
        let s = Array(Xi);
        let l = Array(Xi);
        for (let i = 0; i < Xi; i++) {
            let h_col = Array(Yi);
            let s_col = Array(Yi);
            let l_col = Array(Yi);
            for (let j = 0; j < Yi; j++) {
                let hslj = RGBToHSL(r[i][j], g[i][j], b[i][j]);
                h_col[j] = hslj[0];
                s_col[j] = hslj[1];
                l_col[j] = hslj[2];
            }
            h[i] = h_col
            s[i] = s_col
            l[i] = l_col
        }


        this.sfc_mu = Array(Xi);
        this.sfc_drag = Array(Xi);

        for (let i = 0; i < Xi; i++) {
            let mu_col = Array(Yi);
            let drag_col = Array(Yi);
            for (let j = 0; j < Yi; j++) {
                let sfcType;
                let hx = h[i][j];
                let sx = s[i][j];
                let lx = l[i][j];
                if (lx == 0) { //black
                    sfcType = 'outOfBounds';
                }
                else if (sx < 10) { //colourless, not black
                    sfcType = 'tarmac'
                }
                else if (hx >= 70 & hx <= 150) { // green
                    sfcType = 'grass';
                }
                else if ((hx > 330 | hx < 50) & lx < 50) { //dark red/yellow i.e. brown
                    sfcType = 'mud';
                }
                else {
                    sfcType = 'unknown';
                }

                // console.log(sfcType)
                mu_col[j] = this.sfcTypes[sfcType]['mu']
                drag_col[j] = this.sfcTypes[sfcType]['drag']

                this.sfc_mu[i] = mu_col;
                this.sfc_drag[i] = drag_col;
            }
        }
    }
    getImageData() {
        this.Xi = this.img.width;
        this.Yi = this.img.height;
        this.canvas.height = this.Yi;
        this.canvas.width = this.Xi;

        // console.log(this.Xi,this.Yi)

        let xFlip = this.flipX ? -1 : 1;
        let yFlip = this.flipY ? -1 : 1;
        this.ctx.translate(0 + this.Xi * 1 / 2, 0 + this.Yi * 1 / 2);
        this.ctx.scale(xFlip, yFlip);
        this.ctx.translate(-(0 + this.Xi * 1 / 2), -(0 + this.Yi * 1 / 2));
        this.ctx.drawImage(this.img, 0, 0);
        this.imageData = this.ctx.getImageData(0, 0, this.img.width, this.img.height).data;


        this.image2trackDat()
        this.canvasScl.height = this.Yi * this.trackScl;
        this.canvasScl.width = this.Xi * this.trackScl;

        this.ctxScl.translate(0 + this.Xi * this.trackScl / 2, 0 + this.Yi * this.trackScl / 2);
        this.ctxScl.scale(xFlip, yFlip);
        this.ctxScl.translate(-(0 + this.Xi * this.trackScl / 2), -(0 + this.Yi * this.trackScl / 2));

        this.ctxScl.drawImage(this.img, 0, 0, this.Xi * this.trackScl, this.Yi * this.trackScl)
    }
    drawGates(ctx, xc, yc) {
        let gate = this.gates[0]
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = baseLW / zoom * pixRat;
        ctx.moveTo(gate.left.x * this.trackScl + xc, gate.left.y * this.trackScl + yc)
        ctx.lineTo(gate.right.x * this.trackScl + xc, gate.right.y * this.trackScl + yc);
        ctx.stroke();
        ctx.beginPath();
        // ctx.fillStyle = 'blue';
        // ctx.fillText(gate.n, gate.left.x * this.trackScl + xc, gate.left.y * this.trackScl + yc)

    };

    drawAllGates(ctx, xc, yc) {
        this.gates.forEach(gate => {
            ctx.beginPath();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = baseLW / zoom * pixRat;
            ctx.moveTo(gate.left.x * this.trackScl + xc, gate.left.y * this.trackScl + yc)
            ctx.lineTo(gate.right.x * this.trackScl + xc, gate.right.y * this.trackScl + yc);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = 'blue';
            ctx.fillText(gate.n, gate.left.x * this.trackScl + xc, gate.left.y * this.trackScl + yc)

        });
    }


}
class Car {
    constructor() {
        // car design
        this.w = p.car.width; //width
        this.frontLength = p.car.frontLength; //longitudinal distance to front wheel axis from COM
        this.rearLength = p.car.rearLength; //longitudinal distance to rear wheel axis from COM
        this.l = this.frontLength + this.rearLength // longitudinal distant from front to rear wheel axis
        this.height = p.car.height; //height of CoM
        this.wheelWidth = p.car.wheelWidth;
        this.wheelAspect = p.car.wheelAspect;
        this.oversize = p.car.oversize;
        this.bodyAspect = p.car.bodyAspect;
        this.m = p.car.mass; // mass
        this.momI = p.car.momIfac * this.m; // moment of inertia
        this.colour = p.car.colour;

        // mech + kin
        this.x = track.startX; // x pos 
        this.y = track.startY; // y pos



        this.Fxy = [0, 0]; //resultant Force on car as column vector;
        this.ax = 0; // x accel
        this.ay = 0; // y accel

        this.to = 0; //heading torque;

        this.U = 0; //speed
        this.thetaU = 0; //velocity angle
        this.headOff = 0; // heading - velocity angle



        if (!track.reverse) {
            this.theta = p.track.startTheta; // heading angle
        }
        else {
            this.theta = p.track.startThetaRev; // heading angle
        }
        if (track.flipX) {
            this.theta = -this.theta;
        }
        if (track.flipY) {
            this.theta = Math.PI - this.theta;
        }


        this.thetaDot = 0.0;//heading angle deriv
        this.ux = this.U * Math.sin(this.theta); // x vel
        this.uy = this.U * Math.cos(this.theta); // y vel

        this.n = {}; // "new" mechanics derived in car ref frame
        this.n.Fair = {}; // air resistance
        this.n.Fair.lon = 0;
        this.n.Fair.lat = 0;
        this.n.Fres = {}; // resultant force from car and wheels
        this.n.Fres.lon = 0;
        this.n.Fres.lat = 0;
        this.n.Mres = 0; // resultant moment from wheels


        // specs
        this.steeringRate = p.car.steeringRate;
        this.steeringMaxBase = p.car.steeringMaxBase; //steering lock at 0 speed.
        this.steeringUscl = p.car.steeringUscl; // U scl of steering lock limiting
        this.steeringCentreRate = p.car.steeringCentreRate;
        this.steeringFollow = p.car.steeringFollow; //steering relaxes to motion direction
        this.torqueRate = p.car.torqueRate;
        this.torqueMax = p.car.torqueMax;
        this.fade = p.car.fade; // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD.
        this.brakeMax = p.car.brakeMax;
        this.brakeRate = p.car.brakeRate;

        this.steeringMax = 0; // can vary with speed.

        this.maxUth = (2 * this.torqueMax / p.phys.CA) ** 0.5 // approx theroretical max speed
        // log('max speed:', this.maxUth)


        this.rotMat = calcRotMat(this.theta);

        // let xl = (-this.w / 2 * (1 + this.oversize));
        // let xr = (+this.w / 2 * (1 + this.oversize));
        // let yf = (this.frontLength + this.l / 2 * (this.oversize + this.bodyAspect));
        // let yr = (-this.rearLength - this.l / 2 * (this.oversize + this.bodyAspect));

        // corners in normalized units relative to centre line and rear wheel
        let xl = (-1 / 2 * (1 + this.oversize));
        let xr = (+1 / 2 * (1 + this.oversize));
        let yf = (1 + 1 / 2 * (this.oversize + this.bodyAspect));
        let yr = (0 - 1 / 2 * (this.oversize + this.bodyAspect));

        // car body coords in normalized units relative to centre line and rear wheel
        // this.coordsRel = [[xl, yr], [xl, yf], [0, yf * 1.1], [xr, yf], [xr, yr]];
        this.coordsRel = [ //main body
            [0, -0.2], [-.20, -.15], [-0.30, 0], [-0.30, .7], [-0.14, 1.3],
            [0.14, 1.3], [0.30, .7], [0.30, 0], [.20, -.15],
        ]

        //unscaled for HUD - coords in metres, relative to CoM
        this.coordMatHUD = this.coordsRel.map(x => [x[0] * this.w, x[1] * this.l - this.rearLength])
        // this.coordMatHUD = [[xl, yr], [xl, yf], [0, yf * 1.1], [xr, yf], [xr, yr]];
        //scaled for drawing on track
        this.coordMat = this.coordMatHUD.map(x => x.map(x => x * PPM))

        // cockpit
        this.coordsRel2 = [[0, .15], [-.1, .17], [-.2, .25], [-.2, .5],
        [.2, .5], [.2, .25], [.1, .17],
        ]
        this.coordMat2 = this.coordsRel2.map(x => [PPM * x[0] * this.w, PPM * (x[1] * this.l - this.rearLength)])

        //axels
        this.coordsRel3 = [[-.5, 0], [0.5, 0], [], [-.5, 1], [0.5, 1]]
        this.coordMat3 = this.coordsRel3.map(x => [PPM * x[0] * this.w, PPM * (x[1] * this.l - this.rearLength)])

        this.wheels = [
            new Wheel(-this.w / 2, this.frontLength, this.wheelWidth, this.wheelAspect),
            new Wheel(this.w / 2, this.frontLength, this.wheelWidth, this.wheelAspect),
            new Wheel(-this.w / 2, -this.rearLength, this.wheelWidth, this.wheelAspect),
            new Wheel(this.w / 2, -this.rearLength, this.wheelWidth, this.wheelAspect)
        ];

        this.torqueWheelHUD = this.fade > 0.5 ? this.wheels[0] : this.wheels[2];
        this.maxTorqueHUD = Math.max(this.fade * this.torqueMax, this.fade * this.torqueMax);

    }
    readTrack() {
        this.wheels.forEach(function (wheel) {
            // wheel.sfc_mu=track.get_mu(wheel.xa,wheel.ya);
            // wheel.sfc_drag = track.get_drag(wheel.xa, wheel.ya);
            [wheel.sfc_drag, wheel.sfc_mu] = track.get_sfc_params(wheel.xa, wheel.ya)
        })
    }
    draw(ctx, xc, yc) {
        // let x = this.coordMat;
        let x = MatrixProd(this.coordMat3, this.rotMat);
        x = MatrixTrans(x, [PPM * this.x + xc, PPM * this.y + yc])

        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.fillStyle = this.colour;
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();
        // ctx.fill();

        // let x = this.coordMat;
        x = MatrixProd(this.coordMat, this.rotMat);
        x = MatrixTrans(x, [PPM * this.x + xc, PPM * this.y + yc])

        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.fillStyle = this.colour;
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        // ctx.stroke();
        ctx.fill();

        x = MatrixProd(this.coordMat2, this.rotMat);
        x = MatrixTrans(x, [PPM * this.x + xc, PPM * this.y + yc])

        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.fillStyle = 'black';
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        // ctx.stroke();
        ctx.fill();

        this.wheels.forEach(wheel => wheel.draw(ctx, this, xc, yc));

    }
    drawHUD(ctx) {
        let HUDscl = p.draw.HUDscl * pixRat;
        let HUDforceScl = p.draw.HUDforceScl * pixRat;
        // let HUDx = 50 * pixRat;
        let HUDx = X / 2;
        // log(yOff)
        let HUDy = Y - (50) * pixRat - isTouch * (Y / 3);
        let x = this.coordMatHUD;
        x = MatrixProd(x, calcRotMat(Math.PI));
        x = MatrixProd(x, [[HUDscl, 0], [0, HUDscl]])
        x = MatrixTrans(x, [HUDx, HUDy])
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();
        this.wheels.forEach(wheel => wheel.drawHUD(ctx, this, HUDx, HUDy, HUDscl, HUDforceScl));

        let x0 = [HUDx, HUDy]
        let xd = [[this.n.Fair.lat, this.n.Fair.lon]]
        xd = MatrixProd(xd, calcRotMat(Math.PI));
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]])[0];
        let x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'brown')

        xd = [[this.n.Fres.lat, this.n.Fres.lon]]
        xd = MatrixProd(xd, calcRotMat(Math.PI));
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]])[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'white')

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
            this.wheels[0].theta = Math.max(-this.steeringMax, Math.min(this.steeringMax,
                this.wheels[0].theta + (-this.wheels[0].theta - this.steeringFollow * this.headOff) * this.U ** 0.5 * this.steeringCentreRate * dt));

            this.wheels[0].rotMat = calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = this.wheels[0].theta
            this.wheels[1].rotMat = calcRotMat(this.wheels[1].theta)
        }
        if (inputState.up) {
            // front wheel accel
            this.wheels[0].torque = Math.min(this.torqueMax * (1 - this.fade), this.wheels[0].torque + this.torqueRate * dt);
            this.wheels[1].torque = Math.min(this.torqueMax * (1 - this.fade), this.wheels[1].torque + this.torqueRate * dt);
            this.wheels[2].torque = Math.min(this.torqueMax * (this.fade), this.wheels[2].torque + this.torqueRate * dt);
            this.wheels[3].torque = Math.min(this.torqueMax * (this.fade), this.wheels[3].torque + this.torqueRate * dt);
        }
        else {
            this.wheels[0].torque = Math.max(0, this.wheels[0].torque - this.torqueRate * dt);
            this.wheels[1].torque = Math.max(0, this.wheels[1].torque - this.torqueRate * dt);
            this.wheels[2].torque = Math.max(0, this.wheels[2].torque - this.torqueRate * dt);
            this.wheels[3].torque = Math.max(0, this.wheels[3].torque - this.torqueRate * dt);

        }
        if (inputState.down) {
            // this.wheels[0].torque = 0;
            // this.wheels[1].torque = 0;
            // this.wheels[2].torque = 0;
            // this.wheels[3].torque = 0;
            // 4 wheel braking
            this.wheels[0].brake = Math.min(this.brakeMax, this.wheels[0].brake + this.brakeRate * dt);
            this.wheels[1].brake = Math.min(this.brakeMax, this.wheels[1].brake + this.brakeRate * dt);
            this.wheels[2].brake = Math.min(this.brakeMax, this.wheels[2].brake + this.brakeRate * dt);
            this.wheels[3].brake = Math.min(this.brakeMax, this.wheels[3].brake + this.brakeRate * dt);
        }
        else {
            this.wheels[0].brake = Math.max(0, this.wheels[0].brake - this.brakeRate * dt);
            this.wheels[1].brake = Math.max(0, this.wheels[1].brake - this.brakeRate * dt);;
            this.wheels[2].brake = Math.max(0, this.wheels[2].brake - this.brakeRate * dt);;
            this.wheels[3].brake = Math.max(0, this.wheels[3].brake - this.brakeRate * dt);;
        }
    }
    mech2() {
        // calc all forces in car rel coords before transforming to track from and applying.
        this.n.Fres.lon = 0;
        this.n.Fres.lat = 0;
        this.n.Mres = 0;

        //forces directly on car - air resistance
        this.n.Fair.lon = -CA * this.U ** 2 * Math.cos(-this.headOff);
        this.n.Fair.lat = -CA * this.U ** 2 * Math.sin(-this.headOff);

        this.n.Fres.lon += this.n.Fair.lon;
        this.n.Fres.lat += this.n.Fair.lat;


        for (let i = 0; i < 4; i++) {

            let wh = this.wheels[i];
            let cosTh = Math.cos(wh.theta);
            let sinTh = Math.sin(wh.theta);

            let cos_thth = Math.cos(this.theta + wh.theta);
            let sin_thphi = Math.sin(this.theta + wh.theta);

            // wheel velocity - relative to car
            wh.ux = +this.thetaDot * wh.d * Math.cos(this.theta + wh.phi);
            wh.uy = -this.thetaDot * wh.d * Math.sin(this.theta + wh.phi);
            // wheel velocity - absolute
            wh.uxA = wh.ux + this.ux;
            wh.uyA = wh.uy + this.uy;
            // wheel velocity parallel/perpendicular to wheel
            wh.uApar = -wh.uyA * cos_thth - wh.uxA * sin_thphi;
            wh.uAperp = -wh.uyA * sin_thphi + wh.uxA * cos_thth;


            wh.n.u.lonWheel = -wh.uApar; //wheel speed in wheel direction (sign error in wh.uApar?)
            wh.n.u.latWheel = wh.uAperp; //wheel speed purp to wheel direction

            //accelerating
            wh.n.Fthrust.lon = cosTh * wh.torque;
            wh.n.Fthrust.lat = sinTh * wh.torque;

            // braking
            if (Math.abs(wh.n.u.lonWheel) < .1) {
                wh.n.Fbrake.lon = -wh.n.u.lon / .1 * wh.brake * wh.sfc_mu * cosTh;
                wh.n.Fbrake.lat = -wh.n.u.lon / .1 * wh.brake * wh.sfc_mu * sinTh;
            }
            else {
                wh.n.Fbrake.lon = -Math.sign(wh.n.u.lonWheel) * wh.brake * wh.sfc_mu * cosTh;
                wh.n.Fbrake.lat = -Math.sign(wh.n.u.lonWheel) * wh.brake * wh.sfc_mu * sinTh;
            }
            // rolling resistance
            if (Math.abs(wh.n.u.lonWheel) < .1) {
                wh.n.Frollres.lon = -wh.n.u.lonWheel * Crr * wh.sfc_mu * cosTh;
                wh.n.Frollres.lat = -wh.n.u.lonWheel * Crr * wh.sfc_mu * sinTh;
            }
            else {
                wh.n.Frollres.lon = -Math.sign(wh.n.u.lonWheel) * Crr * wh.sfc_mu * cosTh;
                wh.n.Frollres.lat = -Math.sign(wh.n.u.lonWheel) * Crr * wh.sfc_mu * sinTh;
            }
            //surface drag
            wh.n.Fdrag.lon = -wh.n.u.lonWheel * wh.sfc_drag * CD;
            wh.n.Fdrag.lat = -wh.n.u.latWheel * wh.sfc_drag * CD;


            // lateral friction
            let maxF = F_lat * wh.sfc_mu * wh.load;
            let slipAngle = Math.atan(wh.n.u.latWheel / wh.n.u.lonWheel);
            let skidThresh = maxF / stiffness;

            if (this.ulon < 1) {
                wh.skidFac = 0;
                wh.n.Fcorn.lat = -wh.n.u.latWheel * cosTh * stiffness * .1;
                wh.n.Fcorn.lon = wh.n.u.latWheel * sinTh * stiffness * .1;
            }
            else if (Math.abs(slipAngle) < skidThresh) {
                wh.skidFac = 2;
                // let maximp = dt * this.m * this.ulat
                wh.n.Fcorn.lat = -slipAngle * cosTh * stiffness;
                wh.n.Fcorn.lon = slipAngle * sinTh * stiffness;
                // console.log("tract")
            }
            else {
                wh.skidFac = 5;
                wh.n.Fcorn.lat = -Math.sign(wh.n.u.latWheel) * cosTh * maxF;
                wh.n.Fcorn.lon = Math.sign(wh.n.u.latWheel) * sinTh * maxF;
                // console.log("skid")
            }
            wh.n.Fres.lon = wh.n.Fthrust.lon + wh.n.Fbrake.lon + wh.n.Frollres.lon + wh.n.Fdrag.lon + wh.n.Fcorn.lon;
            wh.n.Fres.lat = wh.n.Fthrust.lat + wh.n.Fbrake.lat + wh.n.Frollres.lat + wh.n.Fdrag.lat + wh.n.Fcorn.lat;


            wh.n.Mres = -wh.n.Fres.lon * wh.x + wh.n.Fres.lat * wh.y;
            this.n.Fres.lon += wh.n.Fres.lon
            this.n.Fres.lat += wh.n.Fres.lat

            this.n.Mres += wh.n.Mres
            // console.log()
        }

        this.Fxy = MatrixProd([[this.n.Fres.lat, this.n.Fres.lon]], calcRotMat(this.theta))[0]
        this.alon = this.n.Fres.lon / this.m;
        this.alat = this.n.Fres.lat / this.m;
        this.ulon = this.ulon + this.alon * dt;
        this.ulat = this.ulat + this.alat * dt;

        this.loadFront = this.m * (this.rearLength - this.height * this.alon) / (this.l);
        this.loadRear = this.m * (this.frontLength + this.height * this.alon) / (this.l);
        this.loadFrontRight = this.loadFront * (this.w / 2 + this.height * this.alat) / (this.w);
        this.loadFrontLeft = this.loadFront * (this.w / 2 - this.height * this.alat) / (this.w);
        this.loadRearRight = this.loadRear * (this.w / 2 + this.height * this.alat) / (this.w);
        this.loadRearLeft = this.loadRear * (this.w / 2 - this.height * this.alat) / (this.w);

        this.wheels[0].load = this.loadFrontRight
        this.wheels[1].load = this.loadFrontLeft
        this.wheels[2].load = this.loadRearRight
        this.wheels[3].load = this.loadRearLeft
        // log(this.loadRear);
        this.steeringMax = this.steeringMaxBase * +this.steeringUscl / (this.steeringUscl + this.U)

        this.ax = this.Fxy[0] / this.m;
        this.ay = this.Fxy[1] / this.m;
        this.ux = this.ux + this.ax * dt;
        this.uy = this.uy + this.ay * dt;
        this.U = (this.ux ** 2 + this.uy ** 2) ** .5
        this.thetaU = Math.atan2(this.ux, this.uy);
        this.x = this.x + this.ux * dt;
        this.y = this.y + this.uy * dt;
        // if (this.n.Mres) {
        this.thetaDot = this.thetaDot + this.n.Mres / this.momI * dt;
        this.theta = this.theta + this.thetaDot * dt;
        this.rotMat = calcRotMat(this.theta);
        this.headOff = (this.thetaU - this.theta) % (Math.PI * 2);
        if (this.headOff > Math.PI) { this.headOff = this.headOff - 2 * Math.PI }
        if (this.headOff < -Math.PI) { this.headOff = this.headOff + 2 * Math.PI }
        this.ulon = this.U * Math.cos(this.headOff)
        this.ulat = this.U * Math.sin(this.headOff)
        // }


    }
}
class Wheel {
    constructor(x, y, width, aspect) {
        this.x = x; // wheel centre position relative to car CoM
        this.y = y;
        this.xa = x; // x pos absolute
        this.ya = y; // y pos

        this.n = {};
        this.n.Fthrust = {};
        this.n.Fthrust.lat = 0;
        this.n.Fthrust.lon = 0;
        this.n.Fbrake = {};
        this.n.Fbrake.lat = 0;
        this.n.Fbrake.lon = 0;
        this.n.Frollres = {};
        this.n.Frollres.lat = 0;
        this.n.Frollres.lon = 0;
        this.n.Fdrag = {};
        this.n.Fdrag.lat = 0;
        this.n.Fdrag.lon = 0;
        this.n.Fcorn = {};
        this.n.Fcorn.lat = 0;
        this.n.Fcorn.lon = 0;
        this.n.Fres = {};
        this.n.Fres.lat = 0;
        this.n.Fres.lon = 0;
        this.n.u = {};
        this.n.u.lon = 0;
        this.n.u.lat = 0;
        this.n.u.lonWheel = 0;
        this.n.u.latWheel = 0;

        this.d = (x ** 2 + y ** 2) ** 0.5; // distance to car CoM
        this.phi = Math.atan2(x, y);
        // this.phiy = Math.atan2(y, -x);
        this.width = width;
        this.length = width * aspect;
        this.theta = 0; // angle relative to car
        this.colour = "black";
        this.torque = 0;
        this.brake = 0;
        this.load = 0;
        let xl = -this.width / 2;
        let xr = this.width / 2;
        let yf = this.length / 2;
        let yr = -this.length / 2;
        //prescaled for drawing on track
        this.coordMat = [[xl * PPM, yr * PPM], [xl * PPM, yf * PPM], [xr * PPM, yf * PPM], [xr * PPM, yr * PPM]];
        //unscaled for hud
        this.coordMatHUD = [[xl, yr], [xl, yf], [xr, yf], [xr, yr]];

        this.rotMat = calcRotMat(this.theta);
    }

    draw(ctx, car, xc, yc) {
        // let x=this.coordMat;
        let x = MatrixProd(this.coordMat, this.rotMat);
        x = MatrixTrans(x, [this.x * PPM, this.y * PPM]);
        x = MatrixProd(x, car.rotMat);
        x = MatrixTrans(x, [car.x * PPM + xc, car.y * PPM + yc])
        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();
        ctx.fillStyle = this.colour;
        ctx.fill();



        //wheel centre abs coords
        x = MatrixProd([[this.x, this.y]], car.rotMat);
        x = MatrixTrans(x, [car.x, car.y]);
        this.xa = x[0][0];
        this.ya = x[0][1];
    }
    drawHUD(ctx, car, HUDx, HUDy, HUDscl, HUDforceScl) {

        let x = MatrixProd(this.coordMatHUD, this.rotMat);

        x = MatrixProd(x, [[HUDscl, 0], [0, HUDscl]])
        x = MatrixTrans(x, [this.x * HUDscl, this.y * HUDscl]);
        x = MatrixProd(x, calcRotMat(Math.PI));
        x = MatrixTrans(x, [HUDx, HUDy])

        let xd, x1;
        let x0 = [[0, 0]];

        x0 = MatrixTrans(x0, [this.x * HUDscl, this.y * HUDscl]);
        x0 = MatrixProd(x0, calcRotMat(Math.PI));
        x0 = MatrixTrans(x0, [HUDx, HUDy])[0]

        xd = [[this.n.Fthrust.lat, this.n.Fthrust.lon]]
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = MatrixProd(xd, calcRotMat(Math.PI))[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'green')

        xd = [[this.n.Fbrake.lat, this.n.Fbrake.lon]]
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = MatrixProd(xd, calcRotMat(Math.PI))[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'red')

        xd = [[this.n.Frollres.lat, this.n.Frollres.lon]]
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = MatrixProd(xd, calcRotMat(Math.PI))[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'purple')

        xd = [[this.n.Fdrag.lat, this.n.Fdrag.lon]]
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = MatrixProd(xd, calcRotMat(Math.PI))[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'blue')

        xd = [[this.n.Fcorn.lat, this.n.Fcorn.lon]]
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = MatrixProd(xd, calcRotMat(Math.PI))[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'yellow')

        xd = [[this.n.Fres.lat, this.n.Fres.lon]]
        xd = MatrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = MatrixProd(xd, calcRotMat(Math.PI))[0];
        x1 = MatrixTrans([x0], xd)[0];
        drawHUDArrow(x0, x1, 'white')

        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        // ctx.stroke();
        ctx.fillStyle = `rgb(${Math.floor(256 * this.load / (car.m / 2))}, 0,0)`;
        ctx.fill();

    }

}
class InputState {
    constructor() {
        this.touch = isTouchDevice();
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        // if (forceBrake) {
        //     this.down = true;
        // }
        // if (forceLeft) {
        //     this.left = true;
        // }
    }
    set(event) {
        // console.log(event)
        if (event['type'] == "keydown" & (event['key'] == "ArrowUp" || event['key'] == "w")) {
            this.up = true;
        }
        if (event['type'] == "keyup" & (event['key'] == "ArrowUp" || event['key'] == "w")) {
            this.up = false;
        }
        if (event['type'] == "keydown" & (event['key'] == "ArrowDown" || event['key'] == "s")) {
            this.down = true;
        }
        if (event['type'] == "keyup" & (event['key'] == "ArrowDown" || event['key'] == "s")) {
            this.down = false;
        }
        if (event['type'] == "keydown" & (event['key'] == "ArrowLeft" || event['key'] == "a")) {
            this.left = true;
        }
        if (event['type'] == "keyup" & (event['key'] == "ArrowLeft" || event['key'] == "a")) {
            this.left = false;
        }
        if (event['type'] == "keydown" & (event['key'] == "ArrowRight" || event['key'] == "d")) {
            this.right = true;
        }
        if (event['type'] == "keyup" & (event['key'] == "ArrowRight" || event['key'] == "d")) {
            this.right = false;
        }
        // console.log(this.left, this.right, this.up, this.down);
        // if (forceBrake) {
        //     this.down = true;
        // }
        // if (forceLeft) {
        //     this.left = true;
        // }
    }
    setTouch(action, state) {
        if (action == "up") {
            this.up = state;
        }
        if (action == "down") {
            this.down = state;
        }
        if (action == "left") {
            this.left = state;
        }
        if (action == "right") {
            this.right = state;
        }

    }
}
class TouchButton {
    constructor(x0, y0, w, h, action, txt, inputState) {
        this.x0 = x0;
        this.y0 = y0;
        this.h = h;
        this.w = w;
        this.active = false; //is being touched
        this.en = null; // touch number
        this.action = action; // action to update in inputState
        this.txt = txt // display text
        this.fontFamily = fontFamily;
    }
    draw(ctx) {
        ctx.beginPath()
        ctx.strokeStyle = "white";
        ctx.rect(this.x0, this.y0, this.w, this.h)
        ctx.stroke();
        if (this.active) {
            ctx.beginPath()
            ctx.fillStyle = "hsla(0,0%,50%,0.5)";
            ctx.rect(this.x0, this.y0, this.w, this.h)
            ctx.fill();
        }
        // ctx.fillStyle = uiTextColor;
        ctx.beginPath()
        ctx.textAlign = "center";
        ctx.font = 20 * pixRat + 'px ' + this.fontFamily;
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.fillText(this.txt, this.x0 + this.w / 2, this.y0 + this.h / 2)

    }

    contains(ex, ey) {
        return ((ex > this.x0) & ex < (this.x0 + this.w) & (ey > this.y0) & (ey < (this.y0 + this.h)));
    }
    pointerDownHandler(ex, ey, en) {
        if (this.contains(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.en = en;
            inputState.setTouch(this.action, true)
        }
    }
    pointerUpHandler(en) {
        if (en == this.en) {
            // debugTxt = "PU: " + en + " " + this.action;
            this.en = null;
            this.active = false;
            inputState.setTouch(this.action, false)
        }
    }

    // pointerMoveHandler(ex, ey) {
    //     if (this.pointerDown) {
    //         this.x = Math.max(-this.halfwidth, Math.min(this.halfwidth, ex - this.x0));
    //         this.y = Math.max(-this.halfheight, Math.min(this.halfheight, ey - this.y0));
    //         this.xax = this.x / this.halfwidth;
    //         this.yax = this.y / this.halfheight;
    //     }
    // }



}
class LapCounter {
    constructor(gates) {
        this.reverse = p.track.reverse;
        this.gates = gates;
        if (this.reverse) {
            this.gates.reverse();
            this.gates.unshift(this.gates.pop())
        }
        // log('gates',this.gates)
        this.nGates = gates.length;
        this.directionSign = this.reverse ? -1 : 1;
        this.oldPoint = {};
        this.oldPoint.x = 0;
        this.oldPoint.y = 0;
        this.newPoint = {};
        this.newPoint.x = 0;
        this.newPoint.y = 0;
        this.intersection = false;
        this.bez = 0; // bezier parameter, fraction through last frame when gate crossing occurs
        this.nextCheck = 0;
        this.finalCheck = gates.length;
        this.nWrongWay = 0;
        this.t0 = Date.now();
        this.n0 = 0;
        // this.lapTime = 0;
        this.lapTimePh = 0;
        this.completeLapTimePh = 0;
        this.bestLap = 0;
        this.lastLap = 0;
        this.tstr = {};
        this.yPos = 0;
        this.fontFamily = fontFamily;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";
        ctx.font = 15 * pixRat + 'px ' + this.fontFamily;
        ctx.fillText(formatDurationTenth(this.lapTimePh), X / 2, this.yPos * pixRat);
        // ctx.fillText(formatDurationTenth(this.lapTime), X / 2, 20 + this.yPos * pixRat);
        // ctx.fillText("Best: " + formatDuration(this.bestLap), this.xPos - 100 * pixRat, this.yPos * pixRat)
        // ctx.fillText("Last: " + formatDuration(this.lastLap), this.xPos + 100 * pixRat, this.yPos * pixRat)

    }

    lapComplete() {
        // log('Complete')
        // this.lapTimes.push(this.lapTime)
        this.completeLapTimePh = Math.round((n - (1 - this.bez) - this.n0) * 1000 / p.run.fps);
        this.lastLap = this.completeLapTimePh;
        if ((this.lastLap < this.bestLap) || this.bestLap == 0) {
            this.bestLap = this.lapTime;
        }
        hiScores.newLap(this.lastLap);
        if (name.name) {
            hiScoresWeb.newLap(this.lastLap);
        }
        else {
            flash.flash("Please enter name to submit lap times");
        }
    }
    gateCrossed(n) {
        // log("gate", n, "next", this.nextCheck, "final", this.finalCheck)
        if (n == 0) {

            if (this.nextCheck == this.finalCheck) {
                this.lapComplete()
            }
            else {
                this.lastLap = 0;
                hiScores.badLap();
            }
            this.reset()
        }
        else if (n == this.nextCheck) {
            // log('forward next')
            this.nextCheck++;

        }
        // log("newNext", this.nextCheck)
    }
    reset() {
        this.t0 = Date.now();
        this.n0 = n - (1 - this.bez);
        // this.lapTime = 0
        this.nextCheck = 1;
    }
    updateLapTime() {
        // this.lapTime = Date.now() - this.t0;
        this.lapTimePh = (n - this.n0) * 1000 / p.run.fps;
    }
    checkGates(x, y) {
        //in track pixel coords
        this.newPoint.x = x;
        this.newPoint.y = y;
        // this.gates.forEach(gate => this.checkGate(gate, this.oldPoint, this.newPoint))

        for (let i = 0; i < this.nGates; i++) {
            // let gate = this.gates[i];
            this.checkGate(i, this.gates[i], this.oldPoint, this.newPoint)
        }
        this.oldPoint.x = this.newPoint.x;
        this.oldPoint.y = this.newPoint.y;



    }
    checkGate(nGate, gate, oldPoint, newPoint) {
        // this.intersection=doLineSegmentsIntersect(oldPoint,newPoint,gate.left,gate.right)
        this.intersection = intersects(oldPoint.x, oldPoint.y, newPoint.x, newPoint.y, gate.left.x, gate.left.y, gate.right.x, gate.right.y)
        // log(oldPoint.y, newPoint.y,  gate.left.y, gate.right.y);
        if (this.intersection) {
            this.direction = this.directionSign * crossProduct(newPoint.x - oldPoint.x, newPoint.y - oldPoint.y, gate.right.x - gate.left.x, gate.right.y - gate.left.y) > 0;
            // log("Gate ", nGate, " crossed.", this.direction);
            if (this.direction) {
                this.bez = secondBezier(
                    gate.left.x, gate.left.y, gate.right.x, gate.right.y,
                    oldPoint.x, oldPoint.y, newPoint.x, newPoint.y
                )
                // log('bez:', this.bez)

                this.gateCrossed(nGate);

                this.nWrongWay = 0;
                // log(nGate)
            }
            else {
                this.nWrongWay++;
                if (this.nWrongWay > 3) {
                    flash.flash("Wrong way!")
                    this.nWrongWay = 0;
                }
            }
            this.intersection = false;
        }
    }

}
class HiScores {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.fontsize = 15 * pixRat;
        this.fontFamily = fontFamily;
        this.dy = 15 * pixRat;
        this.n = 5;
        this.last = 0;
        this.versionTimesList;
        this.times;
        // this.version = p.version.n;
        this.version = sessionLogger.version;
        this.nLaps = 0;
        this.nQual = 10;
        this.qText = '';
        if (localStorage.getItem('versionTimes')) {
            // log('localStorage contains versionTimes')
            this.versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
            let versionTimes = this.versionTimesList.filter(obj => { return obj.version == this.version })
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                // log(versionTimes)
                this.times = versionTimes[0].times;
                this.nLaps = versionTimes[0].nLaps;
                sessionLogger.setnLaps(this.nLaps);
                sessionLogger.currentBestLap = this.times[0];
            }
            else {
                // log('no correct version, created locally')
                this.times = Array(this.n);
                for (let i = 0; i < this.n; i++) {
                    this.times[i] = 0;
                }
                this.versionTimesList.push({
                    'version': this.version,
                    'times': this.times,
                    'nLaps': 0,
                    'qualified': false,
                    'streak': 0,
                    'rank': [0, 0]
                })
                // sessionLogger.currentnLaps = 0;
                // log('no correct version, created in session')
            }
        }
        else {
            log('localStorage contains no versionTimes, create session versionTimes')
            this.times = Array(this.n);
            for (let i = 0; i < this.n; i++) {
                this.times[i] = 0;
            }
            this.versionTimesList = [{
                'version': this.version,
                'times': this.times,
                'nLaps': 0,
                'qualified': false,
                'streak': 0,
                'rank': [0, 0]
            }];
        }
        // log(this.times)
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.textAlign = "left";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";

        // ctx.fillText("Best Laps",this.x,this.y)
        ctx.fillText("L " + formatDuration(this.last), this.x, this.y);

        for (let i = 0; i < this.n; i++) {
            ctx.fillText((i + 1).toString() + " " + formatDuration(this.times[i]), this.x, this.y + (i + 1.2) * this.dy);
        }



        // ctx.fillText("P " + formatDuration(lapCounter.completeLapTimePh), this.x, this.y+(6 + 1.2) * this.dy);
        // ctx.fillText("L: " + this.last + " P: " + lapCounter.completeLapTimePh, this.x, this.y + (7 + 1.2) * this.dy);
    }
    badLap() {
        this.last = 0;
    }
    newLap(t) {
        this.nLaps++;
        // sessionLogger.currentnLaps++;

        this.last = t;
        if (this.times[0] == 0) {
            flash.flash("First Lap")

            sessionLogger.currentBestLap = t;
            sessionLogger.updateRank();
        }
        else if (t < this.times[0]) {
            flash.flash("Best Lap!")
            sessionLogger.currentBestLap = t;
            sessionLogger.updateRank();
        }
        else if (this.times[this.n - 1] != 0 & t < this.times[this.n - 1]) {
            flash.flash("Good Lap")
        }

        if (t < this.times[this.n - 1] || this.times[this.n - 1] == 0) {

            this.times[this.n - 1] = t;
            this.times.sort(function (a, b) {
                if (a == 0 & b != 0) {
                    return 1;
                }
                else if ((b == 0 & a != 0)) {
                    return -1;
                }
                else {
                    return (a - b);
                }
            });

            // log(this.times);
            // remove existing version entry
            // log('creating newVersionTimes')
            // log(this)
            let newVersionTimes = this.versionTimesList.filter((obj) => {
                // log(obj,this)
                return obj.version !== this.version;
            });
            //add currect version
            newVersionTimes.push({
                'version': this.version,
                'times': this.times,
                'nLaps': this.nLaps,
                'qualified': false,
                'streak': 0,
                'rank': [0, 0]
            })
            localStorage.setItem('versionTimes', JSON.stringify(newVersionTimes));

        }
        sessionLogger.newLap(t);
    }
}
class HiScoresWeb {
    constructor() {

        this.y = 0;
        this.fontsize = 15 * pixRat;
        this.fontFamily = fontFamily;
        this.dy = 15 * pixRat;
        this.n = 0;
        this.nMax = 5;
        this.times;


        this.nMaxLapCounts = 5;
        this.nLapCounts = 0
        this.lapCounts = [];
        this.showLapCounts = true;
        this.countStr = '';


        // this.version = p.version.n;
        this.version = sessionLogger.version;
        this.getTimes(this.version);
        this.getLaps(this.version, name.name);
    }

    getTimes(version) {
        fetch(apiURL + '/get_times?version=' + version)
            .then(response => response.json())
            .then(data => {
                this.times = data
                this.n = Math.min(this.nMax, data.length);
                // log("response:")
                // log(data)
            });
    }
    getLaps(version, name) {
        fetch(apiURL + '/get_nlaps?version=' + version + '&name=' + name)
            .then(response => response.json())
            .then(data => {
                this.lapCounts = data
                this.nLapCounts = Math.min(this.nMaxLapCounts, data.length);
                // log("response:")
                // log(data)

            });
    }
    postLap(version, name, time) {
        let formData = new FormData();
        formData.append('name', name);
        formData.append('version', version);
        formData.append('time', time);
        // log(formData)

        fetch(apiURL + '/post_lap', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                this.getTimes(this.version);
                this.getLaps(this.version);
                sessionLogger.updateRank();
                // console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    draw(ctx) {
        // if (this.times) {
        //     if (this.times.length > 0) {
        //         ctx.beginPath();
        //         ctx.textAlign = "right";
        //         ctx.font = this.fontsize + 'px ' + this.fontFamily;
        //         ctx.textBaseline = "top";
        //         ctx.fillStyle = "white";
        //         // ctx.fillText("Best Laps",this.x,this.y)
        //         for (let i = 0; i < this.n; i++) {
        //             ctx.fillText(
        //                 (i + 1).toString() + " " +
        //                 formatDuration(this.times[i].time) + " " +
        //                 pad(this.times[i].name, 3, ' ')
        //                 , X, this.y + (i + 0) * this.dy);
        //         }
        //         // ctx.fillText("L " + formatDuration(this.last), this.x, this.y + (this.n + 0.2) * this.dy);
        //     }
        // }
        if (this.showLapCounts) {
            if (this.lapCounts.length > 0) {
                ctx.beginPath();
                ctx.textAlign = "right";
                ctx.font = this.fontsize + 'px ' + this.fontFamily;
                ctx.textBaseline = "top";
                ctx.fillStyle = "white";
                for (let i = 0; i < this.nLapCounts; i++) {
                    if (showLapCount == 1) {
                        this.countStr = pad((this.lapCounts[i][1]).toString(), 5, ' '); // lap count
                    }
                    else {
                        this.countStr = '';
                    }

                    ctx.fillText(
                        this.countStr + " " + // nLaps
                        (i + 1).toString() + " " + //position
                        pad(this.lapCounts[i][2], 3, ' ') + " " +//name
                        formatDuration(this.lapCounts[i][0])   //best lap time

                        , X,
                        this.y + (i + 0) * this.dy//this.y + Y - isTouch * Y / 3 - (this.nLapCounts + 2 - i) * this.dy
                    );
                }
            }
        }
    }

    newLap(t) {
        this.postLap(this.version, name.name, t);
        // this.getTimes(this.version);
    }
}
class Name {
    constructor() {
        this.fontsize = 15 * pixRat;
        this.fontFamily = fontFamily;
        this.h = this.fontsize + 5 * pixRat;
        this.w = pixRat * 70;
        this.x0 = X - this.w;
        this.y0 = Y - isTouch * Y / 3 - this.h;
        this.en = null;

        this.name = null;
        this.text = 'Enter Name';
        if (localStorage.name) {
            // log(localStorage.name)
            this.name = localStorage.name
            // hiScoresWeb.name=this.name;
            this.text = this.name;
        }
        this.hideNameForm()
        document.getElementById("submit").addEventListener("click", submitName, { passive: true })
        // log(this)
    }
    draw(ctx) {
        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.x0, this.y0, this.w, this.h)
        // ctx.stroke();

        ctx.beginPath();
        ctx.textAlign = "right";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "white";
        ctx.fillText(this.text, X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat)
    }
    contains(ex, ey) {
        return ((ex > this.x0) & ex < (this.x0 + this.w) & (ey > this.y0) & (ey < (this.y0 + this.h)));
    }
    pointerDownHandler(ex, ey, en) {
        // log('PD')
        if (this.contains(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.en = en;
        }
    }
    pointerUpHandler(en) {
        if (en == this.en) {
            // debugTxt = "PU: " + en + " " + this.action;
            this.en = null;
            this.active = false;
            this.showNameForm();
        }
    }

    showNameForm() {
        let form = document.getElementById("nameForm").style;
        // console.log(form.visibility)
        form.visibility = "visible"
        // showgalleryForm = true;

        // else {
        //     form.visibility = "hidden"
        //     // showgalleryForm = false;
        // }
    }
    hideNameForm() {
        let form = document.getElementById("nameForm").style;
        // console.log(form.visibility)
        form.visibility = "hidden"
    }
}
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
function drawHUDArrow(x0, x1, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = baseLW / zoom * pixRat;
    ctx.beginPath();
    ctx.moveTo(x0[0], x0[1]);
    ctx.lineTo(x1[0], x1[1]);
    ctx.stroke();
}
function drawDebug() {
    // xw0 = Math.round(car.wheels[0].xa / scl);
    // yw0 = Math.round(car.wheels[0].ya / scl);
    // xw1 = Math.round(car.wheels[1].xa / scl);
    // yw1 = Math.round(car.wheels[1].ya / scl);

    ctx.fillStyle = "white"
    ctx.textAlign = "left"
    ctx.font = 10 * pixRat + 'px ' + fontFamily;
    // nX = img.width;
    // nY = img.height;
    // r = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 0];
    // g = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 1];
    // b = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 2];
    // a = imageData[((yw0 * (img.width * 4)) + (xw0 * 4)) + 3];
    // let rgba=imageData[((50*(imageData.width*4)) + (200*4)) + 2];

    // show hsl
    // ctx.fillText([
    //     Math.round(car.wheels[0].h),
    //     Math.round(car.wheels[0].s),
    //     Math.round(car.wheels[0].l)
    // ], 100, 100)
    ctx.fillText(debugTxt, X - 500, 20, 500)

    // ctx.fillText(touchControl.xax + " " + touchControl.yax, 100, 120)
    // ctx.fillText(nX + " " + nY, 100, 140);
    // ctx.fillText("theta " + Math.round(car.theta * 360 / (Math.PI * 2)), 100, 160)
    // ctx.fillText("thetaU " + Math.round(car.thetaU * 360 / (Math.PI * 2)), 100, 180)
    // ctx.fillText("headOff " + Math.round((car.headOff) * 360 / (Math.PI * 2)), 100, 200)
    // ctx.fillText(r + " " + g + " " + b + " " + a, 100, 160)
}
function showImage(fileReader) {
    var img = document.getElementById("myImage");
    img.onload = () => getImageData(img);
    img.src = fileReader.result;

}
function drawHUD() {
    let hudX = 10;
    let hudY = 10 + isTouch * Y / 3;
    let barHeight = 50 * pixRat;
    let barWidthSpace = 5 * pixRat;
    let barWidth = 20 * pixRat;
    ctx.lineWidth = baseLW * pixRat;
    ctx.strokeStyle = "green";
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.rect(hudX, Y - hudY, barWidth, -barHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(hudX, Y - hudY, barWidth, -car.torqueWheelHUD.torque / car.maxTorqueHUD * barHeight);
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
    ctx.rect(hudX + 2 * (barWidth + barWidthSpace), Y - hudY, barWidth, -car.U / car.maxUth * barHeight);
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


    // let whX = [hudX + 2 * (barWidth + barWidthSpace), hudX, hudX + 2 * (barWidth + barWidthSpace), hudX]
    // let whY = [Y - hudY - barHeight - 2 * barWidthSpace - 3 * barWidth, Y - hudY - barHeight - 2 * barWidthSpace - 3 * barWidth, Y - hudY - barHeight - 2 * barWidthSpace - barWidth, Y - hudY - barHeight - 2 * barWidthSpace - barWidth]
    // for (let i = 0; i < 4; i++) {
    //     ctx.fillStyle = "rgb(" + car.wheels[i].skidFac * 50 + ",0,0)";
    //     ctx.beginPath();
    //     ctx.rect(whX[i], whY[i], barWidth, -barWidth * 1.5)
    //     ctx.fill();
    //     ctx.strokeStyle = "white";
    //     ctx.beginPath();
    //     ctx.rect(whX[i], whY[i], barWidth, -barWidth * 1.5)
    //     ctx.stroke();

    //     ctx.fillStyle = "white";
    //     ctx.textAlign = "center"
    //     ctx.textBaseline = "middle"
    //     ctx.font = "15px " + fontFamily;
    //     ctx.fillText(Math.round(car.wheels[i].sfc_mu * 10), whX[i] + barWidth / 2, whY[i] - barWidth * 1.5 / 2)
    // }



}
const RGBToHSL = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
    const h = s
        ? l === r
            ? (g - b) / s
            : l === g
                ? 2 + (b - r) / s
                : 4 + (r - g) / s
        : 0;
    return [
        60 * h < 0 ? 60 * h + 360 : 60 * h,
        100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
        (100 * (2 * l - s)) / 2,
    ];
};
function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}
function addPointerListeners(touchControl) {
    // window.addEventListener("resize", () => {
    //     setSize()
    // }
    // );

    if (isTouchDevice()) {
        canvas.addEventListener("touchstart", e => {
            e.preventDefault();
            touchControl.pointerDownHandler(
                e.changedTouches[0].clientX * pixRat,
                e.changedTouches[0].clientY * pixRat,
                e.changedTouches[0].identifier);
        },
            { passive: false }
        );

        canvas.addEventListener("touchend", e => {
            e.preventDefault();
            touchControl.pointerUpHandler(e.changedTouches[0].identifier);
        },
            { passive: false }
        );
    }
    else {
        addEventListener("mousedown", e => {
            // e.preventDefault();
            // pointerDownHandler(e.offsetX, e.offsetY);
            touchControl.pointerDownHandler(e.clientX * pixRat, e.clientY * pixRat, 0)
        },
        );
        addEventListener('mouseup', e => {
            touchControl.pointerUpHandler(0);
        });

    }
}
function addListeners(inputState) {

    window.addEventListener("resize", () => {
        resize();
    }
    );

    if (inputState.touch) {
        accBtn = new TouchButton(X * 2 / 3, Y * 4 / 6, X / 3, Y / 6, "up", "Acc", inputState);
        brkBtn = new TouchButton(X * 2 / 3, Y * 5 / 6, X / 3, Y / 6, "down", "Brake", inputState);
        leftBtn = new TouchButton(X * 0 / 3, Y * 4 / 6, X / 3, Y / 3, "left", "<", inputState);
        rightBtn = new TouchButton(X * 1 / 3, Y * 4 / 6, X / 3, Y / 3, "right", ">", inputState);
        addPointerListeners(accBtn);
        addPointerListeners(brkBtn);
        addPointerListeners(leftBtn);
        addPointerListeners(rightBtn);
    }
    addPointerListeners(name);
    addEventListener('keydown', (event) => { inputState.set(event) });
    addEventListener('keyup', (event) => { inputState.set(event) });
}
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function formatDuration(duration) {
    var seconds = Math.abs(Math.floor(duration / 1000)),
        h = (seconds - seconds % 3600) / 3600,
        m = (seconds - seconds % 60) / 60 % 60,
        s = seconds % 60,
        ms = duration % 1000;
    // return (duration < 0 ? '-' : '') + h + ':' + pad(m.toString(), 2) + ':' + pad(s.toString(), 2) +'.' + pad(ms.toString(),3);
    return pad(m.toString(), 1) + ':' + pad(s.toString(), 2) + '.' + pad(ms.toString(), 3);
}
function formatDurationTenth(duration) {
    var seconds = Math.abs(Math.floor(duration / 1000)),
        h = (seconds - seconds % 3600) / 3600,
        m = (seconds - seconds % 60) / 60 % 60,
        s = seconds % 60,
        ms = duration % 1000,
        ts = Math.floor(ms / 100);
    // return (duration < 0 ? '-' : '') + h + ':' + pad(m.toString(), 2) + ':' + pad(s.toString(), 2) +'.' + pad(ms.toString(),3);
    return pad(m.toString(), 1) + ':' + pad(s.toString(), 2) + '.' + ts.toString();
}
function intersects(a, b, c, d, p, q, r, s) {
    // returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    // log(det)
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
};
function secondBezier(x1, y1, x2, y2, x3, y3, x4, y4) {
    return ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4))
};
function dotProduct(a, b, c, d) {
    return a * c + b * d;
};
function crossProduct(a, b, c, d) {
    return a * d - b * c;
};
function secsToString(seconds) {

    // var seconds = Math.floor((new Date() - date) / 1000);

    var interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1.5) {
        return Math.round(interval) + " hours";
    }
    if (interval > 10) {
        return Math.round(interval) + " hour";
    }
    // if (interval > 1) {
    //     return Math.floor(interval) + " hours " +
    //         Math.round(60 * (interval - Math.floor(interval))) + " minutes";
    // }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
function submitName() {
    let newName = document.getElementById('name').value

    if (newName.trim().length === 0) {
        flash.flash("Empty name, try again")
    }
    else {
        name.name = newName;
        name.text = name.name;
        localStorage.name = name.name;
        hiScoresWeb.name = name.name;
    }
    name.hideNameForm();
    log('submitting name')
}
function resize() {
    canvas = document.getElementById("cw");
    ctx = canvas.getContext("2d", { alpha: false });
    pixRat = window.devicePixelRatio * 1.0;
    canvas.height = window.innerHeight * pixRat;
    canvas.width = window.innerWidth * pixRat;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    X = canvas.width;
    Y = canvas.height;
    xc = 0 // screen centre coords
    yc = 0
    isTouch = isTouchDevice();
    yOff = isTouch ? Y / 6 : 0; // Y offset if touch controls present

}
function anim() {
    n++;
    if (n < nMax) {
        requestAnimationFrame(anim);
    }

    // requestAnimationFrame(anim);

    car.control(inputState);
    if (track.trackReady) {
        car.readTrack();
        car.mech2();
    }
    // calc screen centre coords
    let xct = X / 2 - PPM * (car.x + car.ux * lookAhead)  //centre target, pan to this, screen pixel units
    let yct = Y / 2 - PPM * (car.y + car.uy * lookAhead) - yOff
    xc = xc + (xct - xc) * panSpeed //pan from old centre to target at pan speed 
    yc = yc + (yct - yc) * panSpeed

    //draw scaled stuff
    // ctx.setTransform(zoom, 0, 0, zoom, (1 - zoom) * X / 2, (1 - zoom) * Y / 2);

    // clear screen
    ctx.clearRect(X / 2 - X / 2 / zoom, Y / 2 - Y / 2 / zoom, X / zoom, Y / zoom);

    // flat background for icon making
    // ctx.beginPath()
    // ctx.fillStyle='grey'
    // ctx.rect(X / 2 - X / 2 / zoom, Y / 2 - Y / 2 / zoom, X / zoom, Y / zoom)
    // ctx.fill()

    ctx.drawImage(track.canvasScl, xc, yc);
    track.drawGates(ctx, xc, yc);
    // track.drawAllGates(ctx, xc, yc);
    lapCounter.checkGates(car.x * track.trackPPM, car.y * track.trackPPM);
    lapCounter.updateLapTime();
    lapCounter.draw(ctx);
    car.draw(ctx, xc, yc);

    // draw unscaled scaled stuff
    // ctx.setTransform(1, 0, 0, 1, 0, 0);

    // touchControl.draw(ctx);
    if (inputState.touch) {
        accBtn.draw(ctx);
        brkBtn.draw(ctx);
        leftBtn.draw(ctx);
        rightBtn.draw(ctx);
    }
    // drawDebug();
    // drawHUD();

    // car.drawHUD(ctx);
    hiScores.draw(ctx);
    hiScoresWeb.draw(ctx);
    sessionLogger.draw(ctx);
    name.draw(ctx);
    // drawInfo(ctx);
    flash.draw(ctx);
    drawHUD();
}
class Flash {
    constructor() {
        this.x = X / 2;
        // this.y = Y - isTouch * Y / 3;
        this.y = 15 * pixRat * 2.1
        this.displayPeriod = 1500;
        this.message = "Testing"
        this.mTime = Date.now();
        this.fontFamily = fontFamily;
    }
    flash(message) {
        this.message = message;
        this.mTime = Date.now();
    }
    draw(ctx) {
        if ((Date.now() - this.mTime) < this.displayPeriod) {
            ctx.beginPath();
            ctx.textAlign = "center";
            ctx.font = 15 * pixRat + 'px ' + this.fontFamily;
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "white";
            // log(Y,this.y)

            ctx.fillText(this.message, this.x, this.y)
        }
    }
}
class SessionLogger {
    constructor() {
        this.fontsize = 15 * pixRat;
        this.fontFamily = fontFamily;
        this.qText = '';
        this.nLaps2Qualify = 1;
        let currentTime = Date.now() / (1000 * 60 * 60 * 24) + 0 //it offset for testing session changes
        this.currentSesh = Math.floor(currentTime); //integer, days since 1970
        this.yesterSesh = this.currentSesh - 1;
        this.version = sessionPrefix + '-' + this.currentSesh;
        this.yesterVersion = sessionPrefix + '-' + this.yesterSesh;
        this.currentRank = 0;
        this.currentBestLap = 0;
        this.currentnLaps = 0;
        this.qualified = this.getLocalQual(this.version);

        let timeTillNext = (1 - (currentTime - this.currentSesh)) * 60 * 60 * 24
        this.timeTillNextString = secsToString(timeTillNext);
        // console.log("current sesh:", this.currentSesh, this.timeTillNextString);
        this.yesterStreak = this.getLocalStreak(this.yesterVersion);
        this.yesterQual = this.getLocalQual(this.yesterVersion);
        // streak coming into current session, 0 if no qual yesterday
        this.inStreak = this.yesterQual ? this.yesterStreak : 0;
        // out streak, 0 unless qual in which case this.inStreak+1 - saved to localStorage versionTimes when updated
        this.outStreak = this.qualified ? this.inStreak + 1 : 0
        this.setLocalStreak(this.version, this.currentStreak);
        // log("yesterstreak:", this.yesterStreak,
        //     "yesterqual:", this.yesterQual,
        //     "current streak:", this.outStreak,);
    }

    setLocalQual(version, stat) {
        if (localStorage.getItem('versionTimes')) {
            // log("Setting local qual status")
            // log('localStorage contains versionTimes')
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));

            // log(versionTimesList)
            let newVersionTimes = versionTimesList.filter((obj) => {
                // log(obj,this)
                return obj.version !== version;
            });

            let versionTimes = versionTimesList.filter(obj => { return obj.version == version })
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                versionTimes[0].qualified = stat;
                newVersionTimes.push(versionTimes[0]);
                // log("q updated:", newVersionTimes)
                localStorage.setItem('versionTimes', JSON.stringify(newVersionTimes));
                // log("q saved:", localStorage.versionTimes)
            }
            // log(newVersionTimes)
        }
    }
    setLocalStreak(version, streak) {
        if (localStorage.getItem('versionTimes')) {
            // log("Setting local qual status")
            // log('localStorage contains versionTimes')
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));

            // log(versionTimesList)
            let newVersionTimes = versionTimesList.filter((obj) => {
                // log(obj,this)
                return obj.version !== version;
            });

            let versionTimes = versionTimesList.filter(obj => { return obj.version == version })
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                versionTimes[0].streak = streak;
                newVersionTimes.push(versionTimes[0]);
                // log("q updated:", newVersionTimes)
                localStorage.setItem('versionTimes', JSON.stringify(newVersionTimes));
                // log("q saved:", localStorage.versionTimes)
            }
            // log(newVersionTimes)
        }
    }
    setLocalRank(version, rank) {
        if (localStorage.getItem('versionTimes')) {
            // log("Setting local rank status")
            // log('localStorage contains versionTimes')
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));

            // log(versionTimesList)
            let newVersionTimes = versionTimesList.filter((obj) => {
                // log(obj,this)
                return obj.version !== version;
            });

            let versionTimes = versionTimesList.filter(obj => { return obj.version == version })
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                versionTimes[0].rank = rank;
                newVersionTimes.push(versionTimes[0]);
                // log("q updated:", newVersionTimes)
                localStorage.setItem('versionTimes', JSON.stringify(newVersionTimes));
                // log("q saved:", localStorage.versionTimes)
            }
            // log(newVersionTimes)
        }
    }
    getLocalStreak(version) {
        // log("getting streak")
        if (localStorage.getItem('versionTimes')) {
            // log('localStorage contains versionTimes')
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
            let versionTimes = versionTimesList.filter(
                obj => { return obj.version == version })
            // log(versionTimes)
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                return (versionTimes[0].streak)
            }
            else { return 0; }
        }
        else { return 0; }
    }
    getLocalQual(version) {
        // log("getting streak")
        if (localStorage.getItem('versionTimes')) {
            // log('localStorage contains versionTimes')
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
            let versionTimes = versionTimesList.filter(
                obj => { return obj.version == version })
            // log(versionTimes)
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                return (versionTimes[0].qualified)
            }
            else { return 0; }
        } else { return 0; }
    }
    newLap(t) {
        this.currentnLaps++;
        if (t < this.currentBestLap) { this.currentBestLap = t }
        this.qualTest();
    }
    setnLaps(n) {
        this.currentnLaps = n;
        this.qualTest();
    }
    qualTest() {
        if (this.currentnLaps == this.nLaps2Qualify) {
            flash.flash("Q-streak extended!");
            this.qualified = true;
            this.outStreak = this.inStreak + 1;
        }
        if (this.currentnLaps >= this.nLaps2Qualify) {
            this.qualified = true;
            this.outStreak = this.inStreak + 1;
            this.setLocalQual(this.version, this.qualified);
            this.setLocalStreak(this.version, this.outStreak);
        }
        // log("qtest: yStreak", this.yesterStreak, "outStreak:", this.outStreak, "cQual:", this.qualified)
    }
    updateRank() {
        fetch(apiURL + '/get_rank?version=' + this.version + '&time=' + this.currentBestLap)
            .then(response => response.json())
            .then(data => {
                this.currentRank = data
                // log('current rank:' + data)
            });
    }
    updateYesterRank() {
        if (localStorage.getItem('versionTimes')) {
            // log('localStorage contains versionTimes')
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
            let versionTimes = versionTimesList.filter(obj => { return obj.version == this.yesterVersion })
            if (versionTimes.length > 0) {
                // log('correct version loaded')
                // log(versionTimes)
                // this.times = versionTimes[0].times;
                // this.nLaps = versionTimes[0].nLaps;
                // sessionLogger.currentnLaps = this.nLaps;
                this.yesterBestLap = versionTimes[0].times[0];
            }
            else {
                this.yesterBestLap = 0;
            }
        }
        else {
            this.yesterBestLap = 0;
        }

        // log("yesterlog", this.yesterVersion, this.yesterBestLap, this.yesterQual)
        fetch(apiURL + '/get_rank?version=' + this.yesterVersion + '&time=' + this.yesterBestLap)
            .then(response => response.json())
            .then(data => {
                this.yesterRank = data
                // log('yester rank:' + data)
                this.setLocalRank(this.yesterVersion, data)
            });
    }
    draw(ctx) {
        if (this.currentnLaps >= this.nLaps2Qualify) {
            this.qText = 'Qualified!';
        }
        else {
            this.qText = 'Laps to go: ' + (this.nLaps2Qualify - this.currentnLaps);
        }
        ctx.beginPath();
        ctx.textAlign = "right";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "white";
        ctx.fillText(this.qText, X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - this.fontsize);
        ctx.fillText(this.timeTillNextString + " remaining", X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 3 * this.fontsize)
        // ctx.fillText("Streak: " + this.streak + " days", X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 3 * this.fontsize)
        if (this.currentRank) {
            ctx.fillText("Current Rank " + this.currentRank[0] + "/" + this.currentRank[1], X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 5 * this.fontsize)
        }
        if (this.yesterRank) {
            ctx.fillText("Last Rank " + this.yesterRank[0] + "/" + this.yesterRank[1], X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 4 * this.fontsize)

        }
        if (this.qualified) {
            ctx.fillStyle = "white";
        }
        else {
            ctx.fillStyle = "darkRed";
        }
        ctx.fillText("Q-Streak: " + (this.inStreak + this.qualified), X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 2 * this.fontsize)
    }
}
function cyrb128(str) {
    //string to numeric hash for seeding
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}
function mulberry32(a) {
    //seeded rng
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

class Randomizer {
    constructor(seed) {
        this.colours = ['red', 'gold', 'darkgreen', 'orange', 'darkred', 'white', 'DimGrey', 'darkblue']
        this.xflips = [false, true]
        this.yflips = [false, true]
        this.reverses = [false, true]
        this.scales = [
            { ppm: 10, mpp: 0.2 },
            { ppm: 8, mpp: 0.35 },
            { ppm: 6, mpp: 0.6 }
        ]

        this.colour = null;
        this.xflip = null;
        this.yflip = null
        this.scale = null;
        this.reverse = null;
        this.seed=seed;
        this.rand = mulberry32(this.seed);
    }
    randomElement(array) {
        return array[Math.floor(this.rand() * array.length)];
    }

    gen() {
        this.scale = this.randomElement(this.scales);
        this.yflip = this.randomElement(this.yflips);
        this.xflip = this.randomElement(this.xflips);
        this.reverse = this.randomElement(this.reverses);
        this.colour = this.randomElement(this.colours);
    }
    apply(p) {
        p.car.colour = this.colour;
        p.track.reverse = this.reverse;
        p.track.flipX = this.xflip;
        p.track.flipY = this.yflip;
        p.track.metresPerPix = this.scale.mpp;
        p.draw.pixPerMetre = this.scale.ppm;
    }

}

let log = console.log;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const showLapCount = urlParams.get('nLaps');

// import parameter object
import { p } from './params.js'
const sessionPrefix = p.version.n

let apiURL;
if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "") {
    apiURL = 'http://127.0.0.1:5000'
}
else {
    apiURL = 'https://bitmapRacer.eu.pythonanywhere.com'
}

// screen set up
let canvas, ctx, pixRat, isTouch, X, Y, xc, yc, yOff;
resize();

// draw constants
const fontFamily = 'monospace';
// const fontFamily = 'terminus';
const PPM = p.draw.pixPerMetre * (1 + (pixRat - 1) / 2); // init scale, screen pixels per metre - pre zoom
const baseLW = p.draw.baseLW; // linewidth
const lookAhead = p.draw.lookAhead / (1 + (pixRat - 1) / 3); // seconds
const panSpeed = p.draw.panSpeed; // pixels per frame
let zoom = p.draw.zoom; //initial global zoom - half implemented, need to adjust track cropping, runs slow on mobile

//physics constants
const dt = p.run.dt;
const F_lat = p.phys.F_lat; // max lat fric force
const stiffness = p.phys.stiffness; // cornering stiffness
const CD = p.phys.CD; // surface drag coefficient
const Crr = p.phys.Crr; // rolling resistance
const CA = p.phys.CA; //air drag coefficient
let flash = new Flash();
let sessionLogger = new SessionLogger();
let name = new Name();
let hiScores = new HiScores();
let hiScoresWeb = new HiScoresWeb();
sessionLogger.updateRank();
sessionLogger.updateYesterRank();

// randomize parameters, seeded with daily session name.
let seed = cyrb128(sessionLogger.version)[2]
let randomizer = new Randomizer(seed);
randomizer.gen();
randomizer.apply(p);


//control set up
// const forceBrake = false;
// const forceLeft = false;
let inputState = new InputState;
let accBtn, brkBtn, leftBtn, rightBtn; // touch control buttons
addListeners(inputState);

//track and lapCounter set up
let track = new Track()
let lapCounter = new LapCounter(track.gates);

// car set up
let car = new Car();

// run
let n = 0;
let nMax = p.run.nMax;
anim();
// flash.flash("v: " + p.version.n)
flash.flash("v:" + sessionLogger.version + " " + location.hostname);


// log(localStorage.versionTimes)

// hiScoresWeb.postLap('0.1', 'NJS', 1001)
// getTimes('vTest')
// log(name)
// let t=Date.now()
// let tloc=t.getTimezoneOffset()
// log(t,tloc)

// let date = new Date();