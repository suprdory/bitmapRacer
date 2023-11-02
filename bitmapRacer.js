class Track {
    constructor() {

        this.trackPPM = 1 / p.trackSetup.metresPerPix; // track image pixels per metre
        this.trackScl = PPM / this.trackPPM; //screen pix/track pix ratio, use to scale buffered track display and data from initial image
        this.flipX = p.trackSetup.flipX;
        this.flipY = p.trackSetup.flipY;
        // this.flipX = 0;
        // this.flipY = 0;
        this.gates = p.track.gates;
        this.reverse = p.trackSetup.reverse;
        if (!this.reverse) {
            this.startX = this.flipX ? (p.track.x - p.track.startX) / this.trackPPM : p.track.startX / this.trackPPM;
            this.startY = this.flipY ? (p.track.x - p.track.startY) / this.trackPPM : p.track.startY / this.trackPPM;
        }
        else {
            this.startX = this.flipX ? (p.track.x - p.track.startXRev) / this.trackPPM : p.track.startXRev / this.trackPPM;
            this.startY = this.flipY ? (p.track.x - p.track.startYRev) / this.trackPPM : p.track.startYRev / this.trackPPM;
        }
        // this.startX=220;
        // this.startY=220;
        // log(p.ctrack)
        this.bgColour = p.track.bgColour;
        // log("track bgColour", this.bgColour)
        this.canvas = document.createElement("canvas"); // draw original img here
        this.ctx = this.canvas.getContext("2d", { alpha: false });
        this.canvasScl = document.createElement("canvas"); // draw prescaled track imgh here
        this.ctxScl = this.canvasScl.getContext("2d", { alpha: false });
        this.trackReady = false;
        this.imageData; // extracted on img load;
        this.sfc_mu; // derived after img load by image2trackDat();
        this.sfc_drag; // derived after img load by image2trackDat();
        this.sfcTypes = p.sfcTypes;
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
        // log(this.gates)
        if (this.flipY) {
            this.gates = this.gates.map(g => ({
                'n': g.n,
                'right': { 'x': g.left.x, 'y': p.track.y - g.left.y },
                'left': { 'x': g.right.x, 'y': p.track.y - g.right.y }
            }));
            // log(this.gates);
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
            // return [0.01,1] // for debugging
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
                let hslj = fs.RGBToHSL(r[i][j], g[i][j], b[i][j]);
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
                else if (hx > 150 & hx <= 200 & sx > 10 & lx > 80) {
                    sfcType = 'ice';
                }
                else if (hx >= 70 & hx <= 150) { // green
                    sfcType = 'grass';
                }
                else if ((hx > 330 | hx < 50) & lx < 75 & lx > 10) { //dark red/yellow i.e. brown
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

        // log(xFlip,yFlip,this.img.width,this.img.height)
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.translate(0 + this.Xi * 1 / 2, 0 + this.Yi * 1 / 2);
        this.ctx.scale(xFlip, yFlip);
        this.ctx.translate(-(0 + this.Xi * 1 / 2), -(0 + this.Yi * 1 / 2));
        this.ctx.drawImage(this.img, 0, 0);
        this.imageData = this.ctx.getImageData(0, 0, this.img.width, this.img.height).data;
        // this.imgFlipped = this.ctx;

        this.image2trackDat()

        // create prescaled canvas for faster track drawing;
        this.canvasScl.height = this.Yi * this.trackScl;
        this.canvasScl.width = this.Xi * this.trackScl;
        this.ctxScl.imageSmoothingEnabled = false;
        this.ctxScl.translate(0 + this.Xi * this.trackScl / 2, 0 + this.Yi * this.trackScl / 2);
        this.ctxScl.scale(xFlip, yFlip);
        this.ctxScl.translate(-(0 + this.Xi * this.trackScl / 2), -(0 + this.Yi * this.trackScl / 2));
        this.ctxScl.drawImage(this.img, 0, 0, this.Xi * this.trackScl, this.Yi * this.trackScl)
    }
    drawGates(ctx, xc, yc) {
        let gate = this.gates[0]
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = baseLW * pixRat;
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
            ctx.lineWidth = baseLW * pixRat;
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
        this.momI = p.car.momIfac * this.m * ((this.l / 2) ** 2 + (this.w / 2) ** 2); // moment of inertia
        // log("momI", this.momI)
        this.colour = p.car.colour;
        this.design = p.car.design;
        this.relCoords = p.carDesigns[this.design];
        // log(this.relCoords)

        //physics constants
        this.mu = p.car.phys.mu; //coeff of friction for lateral force
        this.stiffness = p.car.phys.stiffness; // cornering stiffness
        this.CD = p.car.phys.CD; // surface drag coefficient
        this.Crr = p.car.phys.Crr; // rolling resistance
        this.CA = p.car.phys.CA; //air drag coefficient
        this.CL = p.car.phys.CL; //lift coefficient (downforce)
        this.g = 9.8;//grav const
        this.hAero = p.car.phys.hAero; //aerodynamic height
        this.fadeDownforce = p.car.downforceFade;
        this.alpha0 = p.car.phys.alpha0;
        // log("alpha0",this.alpha0)

        this.W = this.m * this.g; //weight
        this.Across = this.hAero * this.w; // cross section area
        this.airDragK = 1.23 / 2 * this.Across * this.CA; //air resistance constant;
        this.airDrag = 0;
        this.rollK = this.Crr * this.m;
        this.downForceFront = 0;
        this.downForceRear = 0;
        // log("airDragK", this.airDragK)
        // log("fade downforce", this.fadeDownforce)

        //mechanics version
        this.mechV = p.car.mechV;

        // mech + kin
        this.x = track.startX; // x pos 
        this.y = track.startY; // y pos
        this.Fxy = [0, 0]; //resultant Force on car as column vector;
        this.ax = 0; // x accel
        this.ay = 0; // y accel
        this.to = 0; //heading torque;

        // circular motion exp
        this.thetaFixed = null;
        this.U0 = 0;
        this.radius = 5;
        this.omega = this.U0 / this.radius;
        this.Fcirc = this.m * this.radius * this.omega ** 2;
        this.thetaDot = this.omega;
        this.period = 2 * Math.PI / this.omega;
        // log('Fcirc=', this.Fcirc)
        // log("T=", this.period)

        this.U = this.U0; //speed
        this.thetaU = 0; //velocity angle
        this.headOff = 0; // heading - velocity angle

        if (!track.reverse) {
            this.thetaStart = p.track.startTheta; // heading angle
        }
        else {
            this.thetaStart = p.track.startThetaRev; // heading angle
        }
        if (track.flipX) {
            this.thetaStart = -this.thetaStart;
        }
        if (track.flipY) {
            this.thetaStart = Math.PI - this.thetaStart;
        }

        this.theta = this.thetaStart;


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
        this.torqueRate = p.car.thrustRate;
        this.torqueMax = p.car.thrustMax;
        this.fade = p.car.fade; // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD.
        this.brakeMax = p.car.brakeMax;
        this.brakeRate = p.car.brakeRate;
        this.brakeFade = p.car.brakeFade;

        this.steeringMax = 0; // can vary with speed.

        if (this.mechV == 2) {
            this.maxUth = (this.torqueMax / p.car.phys.CA) ** 0.5 // approx theroretical max speed
            // log('max speed:', this.maxUth)
        }
        if (this.mechV == 3) {
            log(this.airDragK, this.rollK, this.torqueMax)
            // this.maxUth = (-4 * this.rollK + ((4 * this.rollK) ** 2 + 4 * this.airDragK * this.torqueMax) ** 0.5) / (2 * this.airDragK);
            this.maxUth = ((this.torqueMax - 4 * this.rollK) / this.airDragK) ** 0.5
            // log('max speed:', this.maxUth)
        }
        this.rotMat = fs.calcRotMat(this.theta);

        // car design relCoords in normalized units relative to centre line and rear wheel

        //unscaled for HUD - coords in metres, relative to CoM
        this.coordMatHUDbody = this.relCoords.body.map(x => [x[0] * this.w, x[1] * this.l - this.rearLength])
        //scaled for drawing on track
        this.coordMatBody = this.coordMatHUDbody.map(x => x.map(x => x * PPM))
        // cockpit
        this.coordMatCockpit = this.relCoords.cockpit.map(x => [PPM * x[0] * this.w, PPM * (x[1] * this.l - this.rearLength)])
        //axels
        this.coordMatAxels = this.relCoords.axels.map(x => [PPM * x[0] * this.w, PPM * (x[1] * this.l - this.rearLength)])

        this.wheels = [
            new Wheel(-this.w / 2, this.frontLength, this.wheelWidth, this.wheelAspect),
            new Wheel(this.w / 2, this.frontLength, this.wheelWidth, this.wheelAspect),
            new Wheel(-this.w / 2, -this.rearLength, this.wheelWidth, this.wheelAspect),
            new Wheel(this.w / 2, -this.rearLength, this.wheelWidth, this.wheelAspect)
        ];

        this.torqueWheelHUD = this.fade <= 0.5 ? this.wheels[0] : this.wheels[2];
        this.brakeWheelHUD = this.brakeFade <= 0.5 ? this.wheels[0] : this.wheels[2];
        this.maxTorqueHUD = Math.max(this.fade * this.torqueMax / 2, (1 - this.fade) * this.torqueMax / 2);
        this.maxBrakeHUD = Math.max(this.brakeFade * this.brakeMax / 2, (1 - this.fade) * this.brakeMax / 2);
        // log("maxTorqueHUD", this.maxTorqueHUD)
    }
    readTrack() {
        this.wheels.forEach(function (wheel) {
            // wheel.sfc_mu=track.get_mu(wheel.xa,wheel.ya);
            // wheel.sfc_drag = track.get_drag(wheel.xa, wheel.ya);
            [wheel.sfc_drag, wheel.sfc_mu] = track.get_sfc_params(wheel.xa, wheel.ya)
        })
    }
    checkVoid() {
        //void condition - both front wheels in the rough
        if (this.wheels[0].sfc_drag >= 0.2 & this.wheels[1].sfc_drag >= 0.2) {
            lapCounter.voidLap();
        }
    }
    reset() {
        // mech + kin
        this.x = track.startX; // x pos 
        this.y = track.startY; // y pos
        this.Fxy = [0, 0]; //resultant Force on car as column vector;
        this.ax = 0; // x accel
        this.ay = 0; // y accel
        this.to = 0; //heading torque;
        this.theta = this.thetaStart;
        this.thetaDot = 0.0;//heading angle deriv

        this.U = 0;

        this.ux = this.U * Math.sin(this.theta); // x vel
        this.uy = this.U * Math.cos(this.theta); // y vel
        for (let i = 0; i < 4; i++) {
            this.wheels[i].xa = this.x;
            this.wheels[i].ya = this.y;
        }
    }
    draw(ctx, xc, yc) {
        let x;

        //axles
        x = fs.matrixProd(this.coordMatAxels, this.rotMat);
        x = fs.matrixTrans(x, [PPM * this.x + xc, PPM * this.y + yc])
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.fillStyle = this.colour;
        ctx.lineWidth = baseLW / zoom * pixRat;//* PPM / 10;
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.stroke();

        this.wheels.forEach(wheel => wheel.draw(ctx, this.rotMat, this.x, this.y, xc, yc));

        // body
        x = fs.matrixProd(this.coordMatBody, this.rotMat);
        x = fs.matrixTrans(x, [PPM * this.x + xc, PPM * this.y + yc])
        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.fillStyle = this.colour;
        ctx.lineWidth = baseLW / zoom * pixRat;
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.fill();

        // cockpit
        x = fs.matrixProd(this.coordMatCockpit, this.rotMat);
        x = fs.matrixTrans(x, [PPM * this.x + xc, PPM * this.y + yc])
        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.fillStyle = 'black';
        ctx.lineWidth = baseLW / zoom * pixRat;
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.fill();



    }
    drawHUD(ctx) {
        let HUDscl = p.draw.HUDscl * pixRat * 3 / this.l;
        let HUDforceScl = p.draw.HUDforceScl * pixRat;
        // let HUDx = 50 * pixRat;
        let HUDx = X / 2;
        // log(yOff)
        let HUDy = Y - (100) * pixRat - isTouch * (Y / 3);
        let x = this.coordMatHUDbody;
        x = fs.matrixProd(x, fs.calcRotMat(Math.PI));
        x = fs.matrixProd(x, [[HUDscl, 0], [0, HUDscl]])
        x = fs.matrixTrans(x, [HUDx, HUDy])
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
        let xd = [[this.n.Fair.lat / 4, this.n.Fair.lon / 4]]
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI));
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]])[0];
        let x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'brown')

        xd = [[this.n.Fres.lat / 4, this.n.Fres.lon / 4]]
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI));
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]])[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'rgba(255,255,255,0.5)')

    }
    control(inputState) {
        if (inputState.left) {
            this.wheels[0].theta = Math.min(this.steeringMax, this.wheels[0].theta + this.steeringRate * dt);
            this.wheels[0].rotMat = fs.calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = Math.min(this.steeringMax, this.wheels[1].theta + this.steeringRate * dt);
            this.wheels[1].rotMat = fs.calcRotMat(this.wheels[1].theta)
        }
        else if (inputState.right) {
            this.wheels[0].theta = Math.max(-this.steeringMax, this.wheels[0].theta - this.steeringRate * dt);
            this.wheels[0].rotMat = fs.calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = this.wheels[0].theta;
            this.wheels[1].rotMat = fs.calcRotMat(this.wheels[1].theta)
            // this.wheels[1].theta = Math.max(-this.steeringMax, this.wheels[1].theta - this.steeringRate * dt);
            // this.wheels[1].rotMat = fs.calcRotMat(this.wheels[1].theta)
        }
        else {
            // this.wheels[0].theta = Math.max(-this.steeringMax, Math.min(this.steeringMax,
            //     this.wheels[0].theta + (-this.wheels[0].theta - this.steeringFollow * this.headOff) * this.U ** 0.5 * this.steeringCentreRate * dt));

            this.wheels[0].theta = Math.max(-this.steeringMax, Math.min(this.steeringMax,
                this.wheels[0].theta + (-this.wheels[0].theta - this.steeringFollow * this.headOff) * this.U ** 0.5 * this.steeringCentreRate * dt));

            this.wheels[0].rotMat = fs.calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = this.wheels[0].theta
            this.wheels[1].rotMat = fs.calcRotMat(this.wheels[1].theta)
        }
        if (inputState.up) {
            // front wheel accel
            this.wheels[0].torque = Math.min(this.torqueMax / 2 * (1 - this.fade), this.wheels[0].torque + this.torqueRate / 2 * dt);
            this.wheels[1].torque = Math.min(this.torqueMax / 2 * (1 - this.fade), this.wheels[1].torque + this.torqueRate / 2 * dt);
            this.wheels[2].torque = Math.min(this.torqueMax / 2 * (this.fade), this.wheels[2].torque + this.torqueRate / 2 * dt);
            this.wheels[3].torque = Math.min(this.torqueMax / 2 * (this.fade), this.wheels[3].torque + this.torqueRate / 2 * dt);
        }
        else if (!inputState.down) {
            this.wheels[0].torque = Math.max(0, this.wheels[0].torque - this.torqueRate / 2 * dt);
            this.wheels[1].torque = Math.max(0, this.wheels[1].torque - this.torqueRate / 2 * dt);
            this.wheels[2].torque = Math.max(0, this.wheels[2].torque - this.torqueRate / 2 * dt);
            this.wheels[3].torque = Math.max(0, this.wheels[3].torque - this.torqueRate / 2 * dt);

        }
        if (inputState.down) {
            // this.wheels[0].torque = 0;
            // this.wheels[1].torque = 0;
            // this.wheels[2].torque = 0;
            // this.wheels[3].torque = 0;
            if (this.ulon > 0.1) {
                // relax throttle
                this.wheels[0].torque = Math.max(0, this.wheels[0].torque - this.torqueRate / 2 * dt);
                this.wheels[1].torque = Math.max(0, this.wheels[1].torque - this.torqueRate / 2 * dt);
                this.wheels[2].torque = Math.max(0, this.wheels[2].torque - this.torqueRate / 2 * dt);
                this.wheels[3].torque = Math.max(0, this.wheels[3].torque - this.torqueRate / 2 * dt);

                // 4 wheel braking
                this.wheels[0].brake = Math.min(this.brakeMax / 2 * (1 - this.brakeFade), this.wheels[0].brake + this.brakeRate / 2 * dt);
                this.wheels[1].brake = Math.min(this.brakeMax / 2 * (1 - this.brakeFade), this.wheels[1].brake + this.brakeRate / 2 * dt);
                this.wheels[2].brake = Math.min(this.brakeMax / 2 * (this.brakeFade), this.wheels[2].brake + this.brakeRate / 2 * dt);
                this.wheels[3].brake = Math.min(this.brakeMax / 2 * (this.brakeFade), this.wheels[3].brake + this.brakeRate / 2 * dt);


            }
            if (this.ulon <= 0.1) {

                this.wheels[0].brake = Math.max(0, this.wheels[0].brake - this.brakeRate / 2 * dt);
                this.wheels[1].brake = Math.max(0, this.wheels[1].brake - this.brakeRate / 2 * dt);
                this.wheels[2].brake = Math.max(0, this.wheels[2].brake - this.brakeRate / 2 * dt);
                this.wheels[3].brake = Math.max(0, this.wheels[3].brake - this.brakeRate / 2 * dt);

                // reverse thrust
                this.wheels[0].torque = Math.max(-this.torqueMax / 4 * (1 - this.fade), this.wheels[0].torque - this.torqueRate / 2 * dt);
                this.wheels[1].torque = Math.max(-this.torqueMax / 4 * (1 - this.fade), this.wheels[1].torque - this.torqueRate / 2 * dt);
                this.wheels[2].torque = Math.max(-this.torqueMax / 4 * (this.fade), this.wheels[2].torque - this.torqueRate / 2 * dt);
                this.wheels[3].torque = Math.max(-this.torqueMax / 4 * (this.fade), this.wheels[3].torque - this.torqueRate / 2 * dt);
            }

        }
        else {
            this.wheels[0].brake = Math.max(0, this.wheels[0].brake - this.brakeRate / 2 * dt);
            this.wheels[1].brake = Math.max(0, this.wheels[1].brake - this.brakeRate / 2 * dt);;
            this.wheels[2].brake = Math.max(0, this.wheels[2].brake - this.brakeRate / 2 * dt);;
            this.wheels[3].brake = Math.max(0, this.wheels[3].brake - this.brakeRate / 2 * dt);;
        }
        if (carDev & (this.thetaFixed != null)) {
            this.wheels[0].theta = this.thetaFixed;
            this.wheels[0].rotMat = fs.calcRotMat(this.wheels[0].theta)
            this.wheels[1].theta = this.thetaFixed;
            this.wheels[1].rotMat = fs.calcRotMat(this.wheels[1].theta)
        }
    }

    mech() {
        if (this.mechV == 2) {
            this.mechV2();
        }
        if (this.mechV == 3) {
            this.mechV3();
        }
    }
    mechV3() {
        // calc all forces in car rel coords before transforming to track from and applying.
        this.n.Fres.lon = 0;
        this.n.Fres.lat = 0;
        this.n.Mres = 0;

        //forces directly on car - air resistance
        this.airDrag = this.airDragK * this.U ** 2;
        // log(this.airDrag)
        this.n.Fair.lon = -this.airDrag * Math.cos(-this.headOff);
        this.n.Fair.lat = -this.airDrag * Math.sin(-this.headOff);

        this.n.Fres.lon += this.n.Fair.lon;
        this.n.Fres.lat += this.n.Fair.lat;


        for (let i = 0; i < 4; i++) {

            let wh = this.wheels[i];

            // max Force from wheel (excluding  sfc drag), occurs at and above alpha0 in cornering
            let Fmax = this.mu * wh.sfc_mu * wh.load;

            let cosTh = Math.cos(wh.theta);
            let sinTh = Math.sin(wh.theta);

            let cos_thth = Math.cos(this.theta + wh.theta);
            let sin_thth = Math.sin(this.theta + wh.theta);

            // wheel velocity - relative to car
            wh.ux = +this.thetaDot * wh.d * Math.cos(this.theta + wh.phi);
            wh.uy = -this.thetaDot * wh.d * Math.sin(this.theta + wh.phi);
            // wheel velocity - absolute
            wh.uxA = wh.ux + this.ux;
            wh.uyA = wh.uy + this.uy;
            // wheel velocity parallel/perpendicular to wheel
            wh.uApar = -wh.uyA * cos_thth - wh.uxA * sin_thth;
            wh.uAperp = -wh.uyA * sin_thth + wh.uxA * cos_thth;


            wh.n.u.lonWheel = -wh.uApar; //wheel speed in wheel direction (sign error in wh.uApar?)
            wh.n.u.latWheel = wh.uAperp; //wheel speed purp to wheel direction

            //accelerating
            wh.n.Fthrust.lon = cosTh * Math.min(Fmax, wh.torque);
            wh.n.Fthrust.lat = sinTh * Math.min(Fmax, wh.torque);

            // braking
            if (Math.abs(wh.n.u.lonWheel) < .1) {
                wh.n.Fbrake.lon = -wh.n.u.lon / .1 * wh.brake * wh.sfc_mu * cosTh;
                wh.n.Fbrake.lat = -wh.n.u.lon / .1 * wh.brake * wh.sfc_mu * sinTh;
            }
            else {
                wh.n.Fbrake.lon = -Math.sign(wh.n.u.lonWheel) * Math.min(Fmax, wh.brake) * cosTh;
                wh.n.Fbrake.lat = -Math.sign(wh.n.u.lonWheel) * Math.min(Fmax, wh.brake) * sinTh;
            }
            // rolling resistance
            if (Math.abs(wh.n.u.lonWheel) < .1) {
                wh.n.Frollres.lon = -wh.n.u.lonWheel * this.rollK * cosTh;
                wh.n.Frollres.lat = -wh.n.u.lonWheel * this.rollK * sinTh;
            }
            else {
                wh.n.Frollres.lon = -Math.sign(wh.n.u.lonWheel) * this.rollK * cosTh;
                wh.n.Frollres.lat = -Math.sign(wh.n.u.lonWheel) * this.rollK * sinTh;
            }
            //surface drag
            wh.n.Fdrag.lon = -wh.n.u.lonWheel * wh.sfc_drag * this.CD;
            wh.n.Fdrag.lat = -wh.n.u.latWheel * wh.sfc_drag * this.CD;
            // wh.n.Fdrag.lon = 0;
            // wh.n.Fdrag.lat = 0;

            // // lateral friction (orig)
            // let maxF = this.mu * wh.sfc_mu * wh.load;
            // // log(wh.load)
            // let slipAngle = Math.atan(wh.n.u.latWheel / wh.n.u.lonWheel);
            // let skidThresh = maxF / this.stiffness;
            // // log(wh.load)
            // if (this.U < 1) {
            //     wh.skidFac = 0;
            //     wh.n.Fcorn.lat = -wh.n.u.latWheel * cosTh * this.stiffness * .1;
            //     wh.n.Fcorn.lon = wh.n.u.latWheel * sinTh * this.stiffness * .1;
            //     // log('corn: slow', this.stiffness, wh.n.Fcorn.lon)
            // }
            // else if (Math.abs(slipAngle) < skidThresh) {
            //     wh.skidFac = 1;
            //     // let maximp = dt * this.m * this.ulat
            //     wh.n.Fcorn.lat = -slipAngle * cosTh * this.stiffness;
            //     wh.n.Fcorn.lon = slipAngle * sinTh * this.stiffness;
            //     // log("corn: tract")
            // }
            // else {
            //     wh.skidFac = 2;
            //     wh.n.Fcorn.lat = -Math.sign(wh.n.u.latWheel) * cosTh * maxF;
            //     wh.n.Fcorn.lon = Math.sign(wh.n.u.latWheel) * sinTh * maxF;
            //     // log("corn: skid")
            // }


            // wh.n.Fcorn.lat = this.Fcirc / 4;
            // wh.n.Fcorn.lon = 0;
            // this.thetaDot = this.omega;

            let alpha0 = this.alpha0; // should pass as car param, slip angle in degs at Max lat force, Fmax
            let alpha = 180 / Math.PI * Math.atan(wh.n.u.latWheel / wh.n.u.lonWheel); // slipangle in degs

            let cs = Fmax / alpha0; //cornering stiffness in N/deg. Varies with load.
            // log('alpha',alpha)
            if (this.U < .5) {
                wh.skidFac = 0;
                wh.n.Fcorn.lat = -wh.n.u.latWheel * cosTh * cs * .1;
                wh.n.Fcorn.lon = wh.n.u.latWheel * sinTh * cs * .1;
                // log('corn: slow', this.stiffness, wh.n.Fcorn.lon)
            }
            else if (Math.abs(alpha) < alpha0) {
                wh.skidFac = 1;
                wh.n.Fcorn.lat = -alpha * cs * cosTh;
                wh.n.Fcorn.lon = alpha * cs * sinTh;
            }
            else {
                wh.n.Fcorn.lat = -Math.sign(wh.n.u.latWheel) * cosTh * Fmax;
                wh.n.Fcorn.lon = Math.sign(wh.n.u.latWheel) * sinTh * Fmax;
                wh.skidFac = 2;
            }

            if (i == 1) {
                // log(Math.round(Fmax * 1000) / 1000,Math.round(wh.n.Fcorn.lat * 1000) / 1000, Math.round(wh.n.Fcorn.lon * 1000) / 1000)
            }
            // if(i<2){
            // log(sinTh)
            // //trial 0 cornering force
            // wh.n.Fcorn.lat = 0;
            // wh.n.Fcorn.lon = 0;
            // }

            wh.n.Fres.lon = wh.n.Fthrust.lon + wh.n.Fbrake.lon + wh.n.Frollres.lon + wh.n.Fdrag.lon + wh.n.Fcorn.lon;
            wh.n.Fres.lat = wh.n.Fthrust.lat + wh.n.Fbrake.lat + wh.n.Frollres.lat + wh.n.Fdrag.lat + wh.n.Fcorn.lat;

            wh.n.Mres = -wh.n.Fres.lon * wh.x + wh.n.Fres.lat * wh.y;
            this.n.Fres.lon += wh.n.Fres.lon
            this.n.Fres.lat += wh.n.Fres.lat

            this.n.Mres += wh.n.Mres
            // console.log()
        }
        // ser circ force
        // this.n.Fres.lon = 0
        // this.n.Fres.lat = this.Fcirc;

        this.Fxy = fs.matrixProd([[this.n.Fres.lat, this.n.Fres.lon]], fs.calcRotMat(this.theta))[0]

        this.alon = this.n.Fres.lon / this.m;
        this.alat = this.n.Fres.lat / this.m;
        this.ulon = this.ulon + this.alon * dt;
        this.ulat = this.ulat + this.alat * dt;

        // calc wheel loadings
        this.loadRear = Math.max(0, Math.min(this.W, this.m / this.l * (this.g * this.frontLength + this.height * this.alon)));
        this.loadFront = this.W - this.loadRear;
        this.loadRight = this.m / this.w * (this.g * this.w / 2 + this.height * this.alat);
        this.loadLeft = this.W - this.loadRight;

        this.downForceFront = this.airDrag * this.CL / 4 * (1 - this.fadeDownforce);
        this.downForceRear = this.airDrag * this.CL / 4 * (this.fadeDownforce);

        // log("downforceRear", this.downForceRear)
        this.loadFrontRight = this.loadFront * this.loadRight / this.W + this.downForceFront;
        this.loadFrontLeft = this.loadFront * this.loadLeft / this.W + this.downForceFront;
        this.loadRearRight = this.loadRear * this.loadRight / this.W + this.downForceRear;
        this.loadRearLeft = this.loadRear * this.loadLeft / this.W + this.downForceRear;

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
        this.rotMat = fs.calcRotMat(this.theta);
        this.headOff = (this.thetaU - this.theta) % (Math.PI * 2);
        if (this.headOff > Math.PI) { this.headOff = this.headOff - 2 * Math.PI }
        if (this.headOff < -Math.PI) { this.headOff = this.headOff + 2 * Math.PI }
        this.ulon = this.U * Math.cos(this.headOff)
        this.ulat = this.U * Math.sin(this.headOff)
        // }


    }
    mechV2() {
        // calc all forces in car rel coords before transforming to track from and applying.
        this.n.Fres.lon = 0;
        this.n.Fres.lat = 0;
        this.n.Mres = 0;

        //forces directly on car - air resistance
        this.n.Fair.lon = -this.CA * this.U ** 2 * Math.cos(-this.headOff);
        this.n.Fair.lat = -this.CA * this.U ** 2 * Math.sin(-this.headOff);

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
                wh.n.Frollres.lon = -wh.n.u.lonWheel * this.Crr * wh.sfc_mu * cosTh;
                wh.n.Frollres.lat = -wh.n.u.lonWheel * this.Crr * wh.sfc_mu * sinTh;
            }
            else {
                wh.n.Frollres.lon = -Math.sign(wh.n.u.lonWheel) * this.Crr * wh.sfc_mu * cosTh;
                wh.n.Frollres.lat = -Math.sign(wh.n.u.lonWheel) * this.Crr * wh.sfc_mu * sinTh;
            }
            //surface drag
            wh.n.Fdrag.lon = -wh.n.u.lonWheel * wh.sfc_drag * this.CD;
            wh.n.Fdrag.lat = -wh.n.u.latWheel * wh.sfc_drag * this.CD;


            // lateral friction (orig)
            let maxF = this.mu * wh.sfc_mu * wh.load;
            // log(wh.load)
            let slipAngle = Math.atan(wh.n.u.latWheel / wh.n.u.lonWheel);
            let skidThresh = maxF / this.stiffness;
            // log(wh.load)

            // //previous Fcorn
            // wh.n.Fcorn.latLast = wh.n.Fcorn.lat; 
            // wh.n.Fcorn.lonLast = wh.n.Fcorn.lon;

            if (this.ulon < .1) {
                wh.skidFac = 0;
                wh.n.Fcorn.lat = -wh.n.u.latWheel * cosTh * this.stiffness * .1;
                wh.n.Fcorn.lon = wh.n.u.latWheel * sinTh * this.stiffness * .1;
                // log('corn: slow', this.stiffness, wh.n.Fcorn.lon)
            }
            else
                if (Math.abs(slipAngle) < skidThresh) {
                    wh.skidFac = 1;
                    // let maximp = dt * this.m * this.ulat
                    wh.n.Fcorn.lat = -slipAngle * cosTh * this.stiffness;
                    wh.n.Fcorn.lon = slipAngle * sinTh * this.stiffness;
                    // log("corn: tract")
                }
                else {
                    wh.skidFac = 2;
                    wh.n.Fcorn.lat = -Math.sign(wh.n.u.latWheel) * cosTh * maxF;
                    wh.n.Fcorn.lon = Math.sign(wh.n.u.latWheel) * sinTh * maxF;
                    // log("corn: skid")
                }
            // // test for Fcorn oscillation and attenuate
            // if (wh.n.Fcorn.lat * wh.n.Fcorn.latLast == 0){
            //     log("Fcorn.lat Osc")
            //     // wh.n.Fcorn.lat=0;
            //     wh.n.Fcorn.lat = wh.n.Fcorn.lat*0.3;
            // }
            // if (wh.n.Fcorn.lon * wh.n.Fcorn.lonLast == 0) {
            //     log("Fcorn.lon Osc")
            //     // wh.n.Fcorn.lon = 0;
            //     wh.n.Fcorn.lon = wh.n.Fcorn.lon*0.3;
            // }

            // let alpha0 = 8; // should pass as car param, slip angle in degs at Max lat force, Fmax
            // let alpha = 180 / Math.PI * Math.atan2(wh.n.u.latWheel / wh.n.u.lonWheel); // slipangle in degs
            // let Fmax = this.mu * wh.sfc_mu * wh.load*9.8; // max Force, occurs at alpha0
            // let cs = Fmax / alpha0; //cornering stiffness in N/deg. Varies with load.
            // log('Fmax',Fmax)
            // if (Math.abs(alpha) < alpha0) {
            //     wh.skidFac = 1;
            //     wh.n.Fcorn.lat = -alpha * cs * cosTh;
            //     wh.n.Fcorn.lon = alpha * cs * sinTh;
            // }
            // else{
            //     wh.n.Fcorn.lat = -Math.sign(wh.n.u.latWheel) * cosTh * Fmax;
            //     wh.n.Fcorn.lon = Math.sign(wh.n.u.latWheel) * sinTh * Fmax;
            //     wh.skidFac = 2;
            // }

            // if (i == 1) {
            //     log(Math.round(Fmax * 1000) / 1000,Math.round(wh.n.Fcorn.lat * 1000) / 1000, Math.round(wh.n.Fcorn.lon * 1000) / 1000)
            // }
            // if(i<2){
            //     // log(sinTh)
            // // //trial 0 cornering force
            // wh.n.Fcorn.lat = 0;
            // wh.n.Fcorn.lon = 0;
            // }

            wh.n.Fres.lon = wh.n.Fthrust.lon + wh.n.Fbrake.lon + wh.n.Frollres.lon + wh.n.Fdrag.lon + wh.n.Fcorn.lon;
            wh.n.Fres.lat = wh.n.Fthrust.lat + wh.n.Fbrake.lat + wh.n.Frollres.lat + wh.n.Fdrag.lat + wh.n.Fcorn.lat;

            wh.n.Mres = -wh.n.Fres.lon * wh.x + wh.n.Fres.lat * wh.y;
            this.n.Fres.lon += wh.n.Fres.lon
            this.n.Fres.lat += wh.n.Fres.lat

            this.n.Mres += wh.n.Mres
            // console.log()
        }

        this.Fxy = fs.matrixProd([[this.n.Fres.lat, this.n.Fres.lon]], fs.calcRotMat(this.theta))[0]
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
        this.rotMat = fs.calcRotMat(this.theta);
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

        // this.void = false; // wheel is voided by touching high friction surface (i.e. dirt), maybe generalize

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

        this.rotMat = fs.calcRotMat(this.theta);
    }

    draw(ctx, carrot, carx, cary, xc, yc) {
        // let x=this.coordMat;
        let x = fs.matrixProd(this.coordMat, this.rotMat);
        x = fs.matrixTrans(x, [this.x * PPM, this.y * PPM]);
        x = fs.matrixProd(x, carrot);
        x = fs.matrixTrans(x, [carx * PPM + xc, cary * PPM + yc])
        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.lineWidth = baseLW / zoom * pixRat;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }

        // ctx.stroke();
        ctx.lineTo(x[0][0], x[0][1]);
        ctx.fillStyle = this.colour;
        if (carDev) {
            if (this.skidFac == 0) {
                ctx.fillStyle = 'black';
            }
            ctx.fillStyle = this.colour;
            if (this.skidFac == 1) {
                ctx.fillStyle = 'green';
            }
            if (this.skidFac == 2) {
                ctx.fillStyle = 'red';
            }
        }

        ctx.fill();

        //wheel centre abs coords
        x = fs.matrixProd([[this.x, this.y]], carrot);
        x = fs.matrixTrans(x, [carx, cary]);
        this.xa = x[0][0];
        this.ya = x[0][1];
    }
    drawHUD(ctx, car, HUDx, HUDy, HUDscl, HUDforceScl) {

        let x = fs.matrixProd(this.coordMatHUD, this.rotMat);

        x = fs.matrixProd(x, [[HUDscl, 0], [0, HUDscl]])
        x = fs.matrixTrans(x, [this.x * HUDscl, this.y * HUDscl]);
        x = fs.matrixProd(x, fs.calcRotMat(Math.PI));
        x = fs.matrixTrans(x, [HUDx, HUDy])

        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = baseLW / zoom * pixRat;
        // ctx.globalAlpha=0.5;
        // console.table(this.coordMat)
        ctx.moveTo(x[0][0], x[0][1])
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(x[i][0], x[i][1]);
        }
        ctx.lineTo(x[0][0], x[0][1]);
        // ctx.stroke();
        ctx.fillStyle = `rgb(${Math.floor(256 * this.load / (0.5 * car.g * car.m))}, 0,0)`;
        ctx.fill();
        // ctx.globalAlpha = 1;


        let xd, x1;
        let x0 = [[0, 0]];

        x0 = fs.matrixTrans(x0, [this.x * HUDscl, this.y * HUDscl]);
        x0 = fs.matrixProd(x0, fs.calcRotMat(Math.PI));
        x0 = fs.matrixTrans(x0, [HUDx, HUDy])[0]

        xd = [[this.n.Fthrust.lat, this.n.Fthrust.lon]]
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI))[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'green')

        xd = [[this.n.Fbrake.lat, this.n.Fbrake.lon]]
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI))[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'red')

        xd = [[this.n.Frollres.lat, this.n.Frollres.lon]]
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI))[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'purple')

        xd = [[this.n.Fdrag.lat, this.n.Fdrag.lon]]
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI))[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'blue')

        xd = [[this.n.Fcorn.lat, this.n.Fcorn.lon]]
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI))[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'yellow')

        xd = [[this.n.Fres.lat, this.n.Fres.lon]]
        xd = fs.matrixProd(xd, [[HUDforceScl, 0], [0, HUDforceScl]]);
        xd = fs.matrixProd(xd, fs.calcRotMat(Math.PI))[0];
        x1 = fs.matrixTrans([x0], xd)[0];
        fs.drawHUDArrow(x0, x1, 'rgba(255,255,255,0.5)')



    }

}
class InputState {
    constructor() {
        this.touch = fs.isTouchDevice();
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
        if (event['type'] == "keydown" & (event['key'] == "r")) {
            resetButton.reset();
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
        ctx.lineWidth = baseLW * pixRat;
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
        this.reverse = p.trackSetup.reverse;
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
        this.yPos = (1 + 1.2 * fontSizeBase) * pixRat;
        this.fontFamily = fontFamily;
        this.void = false


        //multilap vars
        if (!multilap) {
            multilapn = 1;
        }
        // log('mln =', multilapn)
        this.lapn = 0
    }
    voidLap() {
        // log('voiding')
        this.void = true;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        if (this.void) {
            ctx.fillStyle = "red";
        }
        else {
            ctx.fillStyle = "white";
        }
        ctx.font = fontSizeBase * pixRat + 'px ' + this.fontFamily;
        if (this.lapn == 0) {
            ctx.fillText(fs.formatDurationTenth(0), X / 2, this.yPos);
        }
        else {
            ctx.fillText(fs.formatDurationTenth(this.lapTimePh), X / 2, this.yPos);
        }
        // ctx.fillText(fs.formatDurationTenth(this.lapTime), X / 2, 20 + this.yPos * pixRat);
        // ctx.fillText("Best: " + formatDuration(this.bestLap), this.xPos - 100 * pixRat, this.yPos * pixRat)
        // ctx.fillText("Last: " + formatDuration(this.lastLap), this.xPos + 100 * pixRat, this.yPos * pixRat)

        if (this.void) {
            ctx.beginPath();
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "white";
            ctx.font = fontSizeBase * pixRat + 'px ' + this.fontFamily;
            ctx.fillText('Void', X / 2, Y - Y / 3 * isTouch - 5 * pixRat);
        }
        else if (multilap) {
            ctx.beginPath();
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "white";
            ctx.font = fontSizeBase * pixRat + 'px ' + this.fontFamily;
            ctx.fillText('Lap ' + this.lapn + '/' + multilapn, X / 2, Y - Y / 3 * isTouch - 5 * pixRat);
        }

    }
    lapComplete() {
        this.completeLapTimePh = Math.round((n - (1 - this.bez) - this.n0) * 1000 / Fps.fps);
        this.lastLap = this.completeLapTimePh;
        if ((this.lastLap < this.bestLap) || this.bestLap == 0) {
            this.bestLap = this.lapTime;
        }
        ghost.completeLap(this.lastLap)
        hiScores.newLap(this.lastLap);
        if (name.name) {
            hiScoresWeb.newLap(this.lastLap);
        }
        else {
            flash.flash("Please enter name to submit lap times");
        }
        sessionLogger.checkLive();
    }
    gateCrossed(n) {
        if (n == 0) {
            // start/finish line crossed
            // if (this.void & (this.nextCheck == this.finalCheck)){
            if (this.void) {
                this.lastLap = 0;
                hiScores.badLap();
                sessionLogger.stats.voids++;
                sessionLogger.setLocalStats();
                this.reset()
            }
            else if (this.nextCheck == this.finalCheck) {
                if (this.lapn == multilapn) { // lap complete
                    this.lapComplete();
                    this.reset();
                }
                else {  //next lap 
                    this.lapn++;
                    this.nextCheck = 1;
                }
            }
            else {
                // bad lap
                this.reset()
            }
        }

        else if (n == this.nextCheck) {
            // log('forward next')
            this.nextCheck++;
        }
        // log("newNext", this.nextCheck)
    }
    reset() { // finish line cross reset
        this.t0 = Date.now();
        this.n0 = n - (1 - this.bez);
        this.nextCheck = 1;
        this.void = false;
        this.lapn = 1;

        ghost.started = true;
        ghost.newLap();
        sessionLogger.setCountDown();
    }
    resetStart() { // button reset, dont trigger ghost
        this.t0 = Date.now();
        this.n0 = n - (1 - this.bez);
        this.nextCheck = 0;
        this.void = false;
        this.lapn = 0;
        sessionLogger.setCountDown();


        // ghost.started = true;
        // ghost.newLap();

    }
    updateLapTime() {
        // this.lapTime = Date.now() - this.t0;
        this.lapTimePh = (n - this.n0) * 1000 / Fps.fps;
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
        this.intersection = fs.intersects(oldPoint.x, oldPoint.y, newPoint.x, newPoint.y, gate.left.x, gate.left.y, gate.right.x, gate.right.y)
        // log(oldPoint.y, newPoint.y,  gate.left.y, gate.right.y);
        if (this.intersection) {
            this.direction = this.directionSign * fs.crossProduct(newPoint.x - oldPoint.x, newPoint.y - oldPoint.y, gate.right.x - gate.left.x, gate.right.y - gate.left.y) > 0;
            // log("Gate ", nGate, " crossed.", this.direction);
            if (this.direction) {
                this.bez = fs.secondBezier(
                    gate.left.x, gate.left.y, gate.right.x, gate.right.y,
                    oldPoint.x, oldPoint.y, newPoint.x, newPoint.y
                )
                // log('bez:', this.bez)

                this.gateCrossed(nGate);

                this.nWrongWay = 0;
                // log(nGate)
            }
            else {
                if (nGate == 0) { // wrong way over start line
                    this.resetStart()
                }
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
        this.y = 1 * pixRat;
        this.fontsize = fontSizeBase * pixRat;
        this.fontFamily = fontFamily;
        this.dy = fontSizeBase * pixRat;
        this.n = 5;
        this.last = 0;
        this.versionTimesList;
        this.times;
        // this.version = p.version.n;
        this.version = sessionLogger.version;
        this.nLaps = 0;
        // this.nQual = 10;
        // this.qText = '';
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
                sessionLogger.qualTest();
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
        ctx.fillText("L " + fs.formatDuration(this.last), this.x, this.y);

        for (let i = 0; i < this.n; i++) {
            ctx.fillText((i + 1).toString() + " " + fs.formatDuration(this.times[i]), this.x, this.y + (i + 1.2) * this.dy);
        }

        // ctx.fillText("P " + fs.formatDuration(lapCounter.completeLapTimePh), this.x, this.y+(6 + 1.2) * this.dy);
        // ctx.fillText("L: " + this.last + " P: " + lapCounter.completeLapTimePh, this.x, this.y + (7 + 1.2) * this.dy);
    }
    badLap() {
        this.last = 0;
    }
    newLap(t) {
        this.nLaps++;
        // sessionLogger.currentnLaps++;
        this.last = t;
        if (timeTravel.ttDays == 0) {
            if (this.times[0] == 0) {
                if (multilap) {
                    flash.flash("First Time");
                }
                else {
                    flash.flash("First Lap");
                }
                sessionLogger.currentBestLap = t;
            }
            else if (t < this.times[0]) {
                if (multilap) {
                flash.flash("Best Time!")
                }
                else {
                    flash.flash("Best Lap!");
                }
                sessionLogger.currentBestLap = t;
            }
            else if (t < Math.max(...this.times)) {
                if (multilap) {
                    flash.flash("Good Time")
                }
                else {
                    flash.flash("Good Lap");
                }
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
        }
        sessionLogger.newLap(t);
    }
}
class HiScoresWeb {
    constructor() {

        this.y = 1 * pixRat;
        this.fontsize = fontSizeBase * pixRat;
        this.fontFamily = fontFamily;
        this.dy = fontSizeBase * pixRat;
        this.n = 0;
        this.nMax = 5;
        // this.times;
        this.yesterChamp = '';


        this.nMaxLapCounts = showLapCount ? 10 : 5;
        this.nLapCounts = 0
        this.lapCounts = [];
        // this.showLapCounts = true;
        this.countStr = '';

        // this.version = p.version.n;
        this.version = sessionLogger.version;
        this.yesterVersion = sessionLogger.yesterVersion
        // this.getTimes(this.version);
        this.getLaps(this.version, hiScores.times[0]);
        this.setYesterChamp()
    }

    getLaps(version, time) {
            fetch(apiURL + '/get_laps?version=' + version + '&time=' + time)
                .then(response => response.json())
                .then(data => {
                    // log('getLaps()', data)
                    // if (false){
                    if (this.showLapCount) {
                        this.lapCounts = data.laps;
                        this.nLapCounts = Math.min(this.nMaxLapCounts, data.laps.length);
                    }
                    else{
                        this.lapCounts = data.comp_laps;
                        this.nLapCounts = Math.min(this.nMaxLapCounts, data.comp_laps.length);
                    }
                    sessionLogger.setRank(data.rank)

                });
    }
    setYesterChamp() {
        fetch(apiURL + '/get_laps?version=' + this.yesterVersion + '&time=0')
            .then(response => response.json())
            .then(data => {
                // log('setYesterChamp()', data)
                if (data.laps.length>0){
                this.yesterChamp = data.laps[0][2]}
                else {
                    this.yesterChamp=''
                }
                // log("yesterChamp:",this.yesterChamp)

            });

    }

    postLap(version, name, time,bestTime) {
        let formData = new FormData();
        formData.append('name', name);
        formData.append('version', version);
        formData.append('time', time);
        formData.append('bestTime', bestTime);
        // log(formData)

        fetch(apiURL + '/post_lap', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                // this.getTimes(this.version);
                // this.getLaps(this.version, hiScores.times[0]);
                // sessionLogger.updateRank();
                console.log("postLap:",data);
                if (this.showLapCount) {
                    this.lapCounts = data.laps;
                    this.nLapCounts = Math.min(this.nMaxLapCounts, data.laps.length);
                }
                else {
                    this.lapCounts = data.comp_laps;
                    this.nLapCounts = Math.min(this.nMaxLapCounts, data.comp_laps.length);
                }
                sessionLogger.setRank(data.rank)
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }

    draw(ctx) {

        // if (this.showLapCounts) {
        if (this.lapCounts.length > 0) {
            ctx.beginPath();
            ctx.textAlign = "right";
            ctx.font = this.fontsize + 'px ' + this.fontFamily;
            ctx.textBaseline = "top";
            ctx.fillStyle = "white";
            for (let i = 0; i < this.nLapCounts; i++) {

                if (this.yesterChamp == this.lapCounts[i][2]) {
                    this.champSym = '*';
                }
                else {
                    this.champSym = '';
                }

                this.posStr = (this.lapCounts[i][3]).toString()
                if (showLapCount == 1) {
                    this.countStr = this.lapCounts[i][1].toString() + ' '; // lap count
                }
                else {
                    this.countStr = '';
                }

                ctx.fillText(
                    this.champSym + // yesterWin asterisk
                    this.countStr + // nLaps
                    this.posStr + " " + //position
                    fs.pad(this.lapCounts[i][2], 3, ' ') + " " +//name
                    fs.formatDuration(this.lapCounts[i][0])   //best lap time
                    , X,
                    this.y + (i + (i != 0) * .2) * this.dy//this.y + Y - isTouch * Y / 3 - (this.nLapCounts + 2 - i) * this.dy
                );
            }
            // }
        }
    }

    newLap(t) {
        if ((!dayxmode)&(timeTravel.ttDays == 0)) {
            this.postLap(this.version, name.name, t,Math.min(t,hiScores.times[0]));
        }

    }
}
class Name {
    constructor() {
        this.fontsize = fontSizeBase * pixRat;
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
            document.getElementById('name').value = this.name
        }
        this.hideNameForm()
        document.getElementById("submit").addEventListener("click", fs.submitName, { passive: true })
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
class ViewMode {
    constructor() {
        this.fontsize = fontSizeBase * pixRat;
        this.fontFamily = fontFamily;
        this.h = this.fontsize + 8 * pixRat;
        this.w = pixRat * 150;
        this.x0 = X - this.w;
        this.y0 = Y - isTouch * Y / 3 - this.fontsize * 5 - this.h;
        this.en = null;
        this.vState = 0;
        if (localStorage.vState) {
            this.vState = JSON.parse(localStorage.getItem('vState'))
        }
        this.setText();
        // log("vState:", this.vState, this.text)
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
        ctx.fillText('Cam: ' + this.text, X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - this.fontsize * 5)
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
            this.toggle();
        }
    }
    toggle() {
        this.vState++;
        if (this.vState > 2) {
            this.vState = 0;
        }
        if (this.vState == 2) {
            // when switching to fixed, change screen centre manually for smoothness
            // log('manual sc')
            xct = X / 2 - PPM * (car.x)  //centre target, pan to this, screen pixel units
            yct = Y / 2 - PPM * (car.y) - yOff
            xc = xct
            yc = yct

        }

        this.setText();
        localStorage.setItem('vState', this.vState)
        // log("vState:", this.vState, this.text)

    }
    setText() {
        if (this.vState == 0) {
            this.text = 'Dyn';
        }
        if (this.vState == 1) {
            this.text = 'Overview';
        }
        if (this.vState == 2) {
            this.text = 'Fix';
        }

    }


}
class Flash {
    constructor() {
        this.x = X / 2;
        // this.y = Y - isTouch * Y / 3;
        this.y = 15 * pixRat * 2.1
        this.dy = 15 * pixRat;
        this.displayPeriod = 1500;
        this.blankPeriod = 400;
        //this.message = "Happy Birthday Fumi!"
        this.message = "";
        this.mTime = Date.now(); //message display time
        this.bTime = Date.now(); //blank display time
        this.fontFamily = fontFamily;
        this.queue = [];
        // log(this.message)

    }
    flash(message) {
        this.queue.push(message)
        // this.message = message;
        // this.mTime = Date.now();
    }

    draw(ctx) {
        // log((Date.now() - this.bTime) > this.blankPeriod)
        //no current message, blankPeriod expired but stuff in queue
        if ((this.message == "") & (this.queue.length > 0) & ((Date.now() - this.bTime) > this.blankPeriod)) {
            this.message = this.queue.shift()
            this.mTime = Date.now();
            // log('shift:', this.message, this.queue)
        }
        //current message out of date
        if (((Date.now() - this.mTime) > this.displayPeriod) & (this.message != "")) {
            this.bTime = Date.now();
            // this.mTime = Date.now();
            this.message = ""
            // log('shift:', this.message, this.queue)
        }

        if ((Date.now() - this.mTime) < this.displayPeriod) {
            ctx.beginPath();
            ctx.textAlign = "center";
            ctx.font = fontSizeBase * pixRat + 'px ' + this.fontFamily;
            ctx.textBaseline = "bottom";
            ctx.fillStyle = "white";
            // log(Y,this.y)

            ctx.fillText(this.message, this.x, this.y + 6 * this.dy)
        }
    }
}
class SessionLogger {
    constructor(timeTravelDaysURL, dev) {
        this.fontsize = fontSizeBase * pixRat;
        this.fontFamily = fontFamily;
        this.qText = '';
        this.nLaps2Qualify = 3;
        if (timeTravelDaysURL != 0) { // tt url arg overides session browser
            this.timeTravelDays = timeTravelDaysURL;
        }
        else {
            this.timeTravelDays = timeTravel.ttDays;
        }
        if (dayxmode){//day selct mode in url arg

            this.currentTime = 19400 + parseInt(dayxURL)+0.5
            this.currentSesh = Math.floor(19400+parseInt(dayxURL)); //integer, days since 1970
            // limit to current day - no peeking!
            if (this.currentSesh > Math.floor(Date.now() / (1000 * 60 * 60 * 24))){
                this.currentSesh = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
            }
        }
        else{
            this.currentTime = Date.now() / (1000 * 60 * 60 * 24) + this.timeTravelDays //it offset for testing session changes
            this.currentSesh = Math.floor(this.currentTime); //integer, days since 1970
        }
        // log(this.currentSesh, this.timeTravelDays)
        this.yesterSesh = this.currentSesh - 1;
        this.versionBase = sessionPrefix + '-' + this.currentSesh;
        this.yesterBase = sessionPrefix + '-' + this.yesterSesh;
        if (dev) {
            this.version = this.versionBase + '-' + 'dev';
            this.yesterVersion = this.yesterBase + '-' + 'dev';
        }
        else {
            this.version = this.versionBase;
            this.yesterVersion = this.yesterBase;
        }
        if (multilapUrl) {
            this.version = this.version + '-ml_' + multilapn;
            this.yesterVersion = this.yesterVersion + '-ml_' + multilapn;
        }

        if (lonBorMode) {
            this.version = '03-dev-LB' + lonBor;
        }


        this.currentRank = 0;
        this.currentBestLap = 0;
        this.currentnLaps = 0;
        this.qualified = this.getLocalQual(this.version);

        let timeTillNext = (1 - (this.currentTime - this.currentSesh)) * 60 * 60 * 24
        this.timeTillNextString = fs.secsToString(timeTillNext);
        // console.log("current sesh:", this.currentSesh, this.timeTillNextString);
        this.yesterStreak = this.getLocalStreak(this.yesterVersion);
        this.yesterQual = this.getLocalQual(this.yesterVersion);
        // streak coming into current session, 0 if no qual yesterday
        this.inStreak = this.yesterQual ? this.yesterStreak : 0;
        // out streak, 0 unless qual in which case this.inStreak+1 - saved to localStorage versionTimes when updated
        this.outStreak = this.qualified ? this.inStreak + 1 : 0
        // this.qualTest();
        this.setLocalStreak(this.version, this.currentStreak);
        // log("yesterstreak:", this.yesterStreak,
        //     "yesterqual:", this.yesterQual,
        //     "current streak:", this.outStreak,);
        this.stats = this.getLocalStats();

        this.checkLive()
    }
    checkLive() {
        let currentTime = Date.now() / (1000 * 60 * 60 * 24) + this.timeTravelDays //it offset for testing session changes
        let currentSeshNow = Math.floor(currentTime); //integer, days since 1970
        // log('live', currentSeshNow == this.currentSesh)
        if ((currentSeshNow != this.currentSesh) & !dayxmode) {
            location.reload()
        }
    }

    setCountDown() {
        let currentTime = Date.now() / (1000 * 60 * 60 * 24) + this.timeTravelDays //it offset for testing session changes
        this.currentSesh = Math.floor(currentTime); //integer, days since 1970
        let timeTillNext = (1 - (currentTime - this.currentSesh)) * 60 * 60 * 24
        this.timeTillNextString = fs.secsToString(timeTillNext);
    }

    getLocalStats() {
        // log("gettingStats")
        let stats0 = { 'laps': 0, 'voids': 0, 'resets': 0 }
        if (localStorage.getItem('versionTimes')) {

            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
            let versionTimes = versionTimesList.filter(
                obj => { return obj.version == this.version })
            // log('versionTimes', versionTimesList)
            if (versionTimes.length > 0) {
                // log("gettingStats:")
                // log('versionTimes[0]:', versionTimes)
                if (versionTimes[0].nLapsStat !== undefined) {// stats exist
                    log('stats exist')
                    return { 'laps': versionTimes[0].nLapsStat, 'voids': versionTimes[0].nVoidsStat, 'resets': versionTimes[0].nResetsStat }
                }
                return (stats0)
            }
            else { return (stats0); }
        }
        else { return (stats0); }
    }
    setLocalStats() {
        if (localStorage.getItem('versionTimes')) {
            // log("Setting local stats")
            let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
            let newVersionTimes = versionTimesList.filter((obj) => {
                return obj.version !== this.version;
            });
            let versionTimes = versionTimesList.filter(obj => { return obj.version == this.version })
            if (versionTimes.length > 0) {

                versionTimes[0].nLapsStat = this.stats.laps;
                versionTimes[0].nVoidsStat = this.stats.voids;
                versionTimes[0].nResetsStat = this.stats.resets;
                // log(versionTimes[0])

                newVersionTimes.push(versionTimes[0]);
                localStorage.setItem('versionTimes', JSON.stringify(newVersionTimes));
            }
        }
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

        this.stats.laps++;
        this.setLocalStats()

    }
    setnLaps(n) {
        this.currentnLaps = n;
    }
    qualTest() {
        if (qdev) {
            flash.flash('qtest ' +
                this.currentnLaps + ' ' +
                this.qualified + ' ' +
                this.inStreak + ' ' +
                this.outStreak)
        }
        if (this.currentnLaps == this.nLaps2Qualify) {
            this.outStreak = this.inStreak + 1;
            if (!this.qualified) {
                if (this.outStreak == 1) {
                    flash.flash("New Q-streak Started");
                    flash.flash("Extend it tomorrow!");
                }
                else {
                    flash.flash("Q-streak extended!");
                }
                if (this.outStreak == 2) {
                    flash.flash("Two Qs in a Row");
                    flash.flash("Keep it up!");
                }
                if (this.outStreak == 7) {
                    flash.flash("1-week Q-Streak!");
                    flash.flash("Nearly there...");
                }
                if (this.outStreak == 14) {
                    flash.flash("2-week Q-Streak!");
                    flash.flash("Almost got it...");
                }
                if (this.outStreak == 30) {
                    flash.flash("1-Month Q-Streak!");
                    flash.flash("You can do it!");
                }

                if (this.outStreak == 50) {
                    flash.flash("Half-Century Q-Streak!");
                    flash.flash("Just wow");
                }
                if (this.outStreak == 100) {
                    flash.flash("Centurian!");
                    flash.flash("Incredible Streak");
                }
                if (this.outStreak == 365) {
                    flash.flash("1-Year Streak!");
                    flash.flash("Are you insane?");
                    flash.flash("Time to stop.");
                }
            }
            this.qualified = true;
        }
        if (this.currentnLaps >= this.nLaps2Qualify) {

            this.qualified = true;
            this.outStreak = this.inStreak + 1;
            this.setLocalQual(this.version, this.qualified);
            this.setLocalStreak(this.version, this.outStreak);
            if (qdev) {
                flash.flash('qset ' +
                    this.currentnLaps + ' ' +
                    this.qualified + ' ' +
                    this.inStreak + ' ' +
                    this.outStreak)
            }
        }
        // log("qtest: yStreak", this.yesterStreak, "outStreak:", this.outStreak, "cQual:", this.qualified)
    }
    setRank(rankData){
        this.currentRank = rankData
        // log('setRank():' + rankData)
    }
    // updateYesterRank() {
    //     if (localStorage.getItem('versionTimes')) {
    //         // log('localStorage contains versionTimes')
    //         let versionTimesList = JSON.parse(localStorage.getItem('versionTimes'));
    //         let versionTimes = versionTimesList.filter(obj => { return obj.version == this.yesterVersion })
    //         if (versionTimes.length > 0) {
    //             // log('correct version loaded')
    //             // log(versionTimes)
    //             // this.times = versionTimes[0].times;
    //             // this.nLaps = versionTimes[0].nLaps;
    //             // sessionLogger.currentnLaps = this.nLaps;
    //             this.yesterBestLap = versionTimes[0].times[0];
    //         }
    //         else {
    //             this.yesterBestLap = 0;
    //         }
    //     }
    //     else {
    //         this.yesterBestLap = 0;
    //     }

    //     // log("yesterlog", this.yesterVersion, this.yesterBestLap, this.yesterQual)
    //     fetch(apiURL + '/get_rank?version=' + this.yesterVersion + '&time=' + this.yesterBestLap)
    //         .then(response => response.json())
    //         .then(data => {
    //             this.yesterRank = data
    //             log('updateYesterRank():' + data)
    //             this.setLocalRank(this.yesterVersion, data)
    //         });
    // }
    draw(ctx) {

        if (this.currentnLaps >= this.nLaps2Qualify) {
            this.qText = 'Qualified!';
        }
        else {
            this.qText = 'Races to Q: ' + (this.nLaps2Qualify - this.currentnLaps);
        }
        ctx.beginPath();
        ctx.textAlign = "right";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "white";
        if ((dayxmode)||timeTravel.ttDays != 0) {
            ctx.fillStyle = "dimGrey";
        }
        ctx.fillText(this.qText, X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - this.fontsize);
        if ((dayxmode) || timeTravel.ttDays != 0) {
            ctx.fillStyle = "dimGrey";
        }
        ctx.fillText(this.timeTillNextString + " remaining", X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 3 * this.fontsize)
        // ctx.fillText("Streak: " + this.streak + " days", X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 3 * this.fontsize)
        ctx.fillStyle = "white";
        if (this.currentRank) {
            ctx.fillText("Rank: " + this.currentRank[0] + "/" + this.currentRank[1], X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 4 * this.fontsize)
        }
        // if (this.yesterRank) {
        //     ctx.fillText("Yesterday: " + this.yesterRank[0] + "/" + this.yesterRank[1], X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 4 * this.fontsize)

        // }
        if (this.qualified) {
            ctx.fillStyle = "white";
        }
        else {
            ctx.fillStyle = "darkRed";
        }
        if (timeTravel.ttDays != 0) {
            ctx.fillStyle = "dimGrey";
        }
        ctx.fillText("Q-Streak: " + (this.inStreak + this.qualified), X - 5 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - 2 * this.fontsize)

        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText("L:" + this.stats.laps + " V:" + this.stats.voids + " R:" + this.stats.resets, 4 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat)



    }
}
class SessionSetter {
    constructor(seedstr) {
        // log("seed",seedstr)
        this.colours = ['red', 'gold', 'orange', 'greenyellow', 'cornflowerblue', 'hotpink', 'blueviolet']
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
        this.seed = this.cyrb128(seedstr)[2]
        this.rand = this.mulberry32(this.seed);
    }
    set(sesh) {
        this.randGenOG(); //required here to maintain rand call count for historical track sessions

        if (sesh >= 19401 & sesh <= 19433) {
            this.randGenOG();
        }
        if (sesh >= 19434 & sesh <= 19466) {
            log('borough ')
            this.boroughSeriesOG();
        }
        if (sesh >= 19467 & sesh <= 19499) {
            log('borough rev')
            this.boroughSeriesRevOG();
        }
        if (sesh >= 19500 & sesh <= 19534) {
            log('county')
            this.countySeriesOG();
        }
        if (sesh >= 19535 & sesh <= 19536) {
            log('RandSel')
            this.randSel();
        }
        if (sesh >= 19537 & sesh <= 19547) {
            log('RandOG')
            this.randGen();
        }
        if (sesh >= 19544 & sesh <= 19545) {
            log('RandBC')
            this.randBC();
        }
        if (sesh >= 19546 & sesh <= 19552) {
            log('Rand1OG')
            this.randGen1OG();
        }
        if (sesh >= 19553 & sesh <= 19652) {
            log('RandCountry')
            this.randCountry();
        }
        if (sesh >= 19653 & sesh <=19662) {
            log('RandCountry+nLaps')
            this.randCountrynLaps();
        }
        if (sesh >= 19663) {
            log('RandCountry2+nLaps')
            this.randCountry2nLaps();
        }
        if (trackDev) {
            // this.setDev();
        }
        if (carDev) {
            this.setCarDev();
        }
        if (lonBorMode) {
            this.setLondonBorough();
        }
        this.apply(p);
    }
    randSel() {
        this.trackTypeRand = this.rand() * 100;
        if (this.trackTypeRand < 10) {
            this.randGen()
        }
        else if (this.trackTypeRand < 55) {
            this.randCounty();
        }
        else {
            this.randBorough();
        }

        // log(this.trackTypeRand)
    }
    randGen() {

        this.mult = this.randomElement([0.4, 0.6, 0.8, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        // this.mult=2.0
        this.scale = { ppm: 4 + 3 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = this.randomElement(this.yflips);
        this.xflip = this.randomElement(this.xflips);
        this.reverse = this.randomElement(this.reverses);
        this.colour = this.randomElement(this.colours);
        this.car = p.cars[0]
        this.trackSelRand = this.rand()
        // this.trackSelRand=0.97;
        if (this.trackSelRand < 0.3) {
            this.track = tracksOG[0]
            this.trackImgName = this.track.fnames[0]
        }
        else if (this.trackSelRand < 0.6) {
            this.track = tracksOG[1]
            this.trackImgName = this.track.fnames[0]
        }
        else if (this.trackSelRand < 0.75) {
            this.track = tracksOG[2]
            this.trackImgName = this.track.fnames[0]
        }
        else if (this.trackSelRand < 1.0) {
            this.track = tracksOG[3]
            this.trackImgName = this.track.fnames[0]
        }
    }
    randGen1OG() {

        this.mult = this.randomElement([0.4, 0.6, 0.8, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 4 + 3 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = this.randomElement(this.yflips);
        this.xflip = this.randomElement(this.xflips);
        this.reverse = this.randomElement(this.reverses);
        this.colour = this.randomElement(this.colours);
        this.car = p.cars[0]
        this.track = tracksOG[0]
        this.trackImgName = this.track.fnames[0]
    }
    randBC() {
        this.mult = this.randomElement([0.4, 0.6, 0.8, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 4 + 3 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = this.randomElement(this.yflips);
        this.xflip = this.randomElement(this.xflips);
        this.reverse = this.randomElement(this.reverses);
        this.colour = this.randomElement(this.colours);
        this.car = p.cars[0]
        this.track = tracksOG[3]
        this.trackImgName = this.track.fnames[0]
    }
    randCounty() {
        this.mult = this.randomElement([0.7, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 7 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = false;
        this.xflip = false;
        this.colour = this.randomElement(this.colours);
        this.reverse = this.randomElement([true, false]);
        this.track = this.randomElement(tracksEC);
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
    }
    randCountry() {
        this.mult = this.randomElement([0.7, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 7 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = false;
        this.xflip = false;
        this.colour = this.randomElement(this.colours);
        this.reverse = this.randomElement([true, false]);
        this.track = this.randomElement(tracksWC);
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
        // log("scale",this.scale)
    }
    randCountrynLaps() {
        // first batch of countries
        this.mult = this.randomElement([0.7, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 7 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = false;
        this.xflip = false;
        this.colour = this.randomElement(this.colours);
        // this.colour=evaluate_cmap(this.rand(),'tab10',false)

        this.reverse = this.randomElement([true, false]);
        this.track = this.randomElement(tracksWC);
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
        this.randomizeMultiLap();

    }
    randCountry2nLaps() {
        //second and final batch of countries
        this.mult = this.randomElement([0.7, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 7 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = false;
        this.xflip = false;
        // this.colour = this.randomElement(this.colours);
        // this.colour=[255,255,0]
        this.colour=evaluate_cmap(this.rand(),'jet',false)

        this.reverse = this.randomElement([true, false]);
        this.track = this.randomElement(tracksWC2);
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
        this.randomizeMultiLap();

    }


    randBorough() {
        this.mult = this.randomElement([0.7, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 7 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = false;
        this.xflip = false;
        this.colour = this.randomElement(this.colours);
        this.reverse = this.randomElement([true, false]);
        this.track = this.randomElement(tracksLB);
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
    }
    randomElement(array) {
        return array[Math.floor(this.rand() * array.length)];
    }
    randomizeMultiLap() {
        if (!multilapUrl) {
            let rnd = this.rand()
            if (rnd < 0.6) {
                multilapn = 1;
            }
            else if (rnd < 0.8) {
                multilapn = 2;
            }
            else if (rnd < 0.95) {
                multilapn = 3;
            }
            else {
                multilapn = 5;
            }
            multilap = multilapn > 1
            // log("random ml", rnd, multilapn, multilap)

        }
    }
    setDev() {
        this.scale = { ppm: 8, mpp: 0.35 };
        this.yflip = false;
        this.xflip = false;
        this.reverse = true;
        if (revDev) {
            this.reverse = Boolean(revDev);
        }
        this.colour = 'white';
        // this.track = p.tracks[1];
        // this.trackImgName = this.track.fnames[trackDev - 1]

        this.track = tracksLB[18];
        this.trackImgName = this.track.fnames[trackDev - 1]

        this.car = p.cars[0];
        // this.track.startX= 500;
        // this.track.startY = 500;
    }
    setLondonBorough() {
        this.scale = { ppm: 7, mpp: 0.4 };
        this.yflip = false;
        this.xflip = false;
        this.reverse = false;
        // this.colour = 'white';
        this.track = tracksLB[lonBor];
        this.trackImgName = this.track.fnames[1]
        this.car = p.cars[0];
    }
    setCarDev() {
        // this.scale = { ppm: 8, mpp: 0.35 };
        // this.yflip = false;
        // this.xflip = false;
        // this.reverse = false
        if (revDev) {
            this.reverse = Boolean(revDev);
        }
        this.colour = 'grey';
        // this.track = p.tracks[0];
        // this.trackImgName = this.track.fnames[0]
        // this.car = p.cars[1];
        // this.track.startX = 135;
        // this.track.startY = 450;
    }
    randGenOG() {
        // log("RandOG")
        this.scale = this.randomElement(this.scales);
        this.yflip = this.randomElement(this.yflips);
        this.xflip = this.randomElement(this.xflips);
        this.reverse = this.randomElement(this.reverses);
        this.colour = this.randomElement(this.colours);
        this.track = this.randomElement(tracksOG);
        this.trackImgName = this.randomElement(this.track.fnames)
        this.car = p.cars[0]
    }
    boroughSeriesOG() {
        this.scale = { ppm: 7, mpp: 0.4 };
        this.yflip = false;
        this.xflip = false;
        this.reverse = false;
        this.colour = this.randomElement(this.colours);
        // this.track = this.randomElement(tracksLB);
        this.track = tracksLB[sessionLogger.currentSesh - 19434]
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
    }
    countySeriesOG() {
        this.mult = this.randomElement([0.7, 0.8, 0.9, 0.95, 1.0, 1.1, 1.25, 1.5, 2.0])
        this.scale = { ppm: 7 * this.mult, mpp: 0.4 / this.mult };
        this.yflip = false;
        this.xflip = false;
        this.colour = this.randomElement(this.colours);
        this.reverse = this.randomElement([true, false]);
        // this.track = this.randomElement(tracksEC);
        this.track = tracksEC[sessionLogger.currentSesh - 19500]
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
    }
    boroughSeriesRevOG() {
        this.scale = { ppm: 7, mpp: 0.4 };
        this.yflip = false;
        this.xflip = false;
        this.reverse = true;
        this.colour = this.randomElement(this.colours);
        // this.track = this.randomElement(tracksLB);
        this.track = tracksLB[33 - (sessionLogger.currentSesh - 19466)]
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0]
    }

    apply(p) {
        p.track = this.track;
        p.track.fname = this.trackImgName;
        p.car = this.car;
        
        if (typeof this.colour === 'string'){
            p.car.colour = this.colour;
        }
        else{
            let colString = "rgb("+this.colour[0].toString()+","+this.colour[1].toString()+","+this.colour[2].toString()+")"
            p.car.colour=colString
        }
        log("p.car.colour",p.car.colour)
        p.trackSetup.reverse = this.reverse;
        p.trackSetup.flipX = this.xflip;
        p.trackSetup.flipY = this.yflip;
        let carScale = (p.car.frontLength + p.car.rearLength) / 3; //car length relatic to car0
        p.trackSetup.metresPerPix = 1 * this.scale.mpp * p.track.trackScale * carScale;
        p.draw.pixPerMetre = this.scale.ppm / carScale;
        // log('trackScale',p.track.trackScale)
        let screenScl = Math.min(X / 700, Y / 700)
        // log(screenScl)
        // PPM = p.track.drawScale * p.draw.pixPerMetre * (1 + (pixRat - 1) / 2); // init scale, screen pixels per metre - pre zoom
        PPM = p.track.drawScale * p.draw.pixPerMetre * screenScl; // init scale, screen pixels per metre - pre zoom


        let maxPPM = 4096 / this.track.x / p.trackSetup.metresPerPix;

        // log("target PPM", PPM)
        // log("max PPM", maxPPM)
        if (PPM > maxPPM) {
            // log('targetPPM', PPM, 'limited to', maxPPM);
            // zoomMult = PPM / maxPPM;
            // log('zoomMult:', zoomMult)
            // PPM = Math.floor(maxPPM);
            PPM = maxPPM;
            // this.zoomLimFact = PPM / maxPPM;

        }
        // log("final PPM", PPM)
    }
    specialCase1() {
        this.scale = { ppm: 8, mpp: 0.35 };
        this.yflip = 1;
        this.xflip = 0;
        this.reverse = 1;
        this.colour = 'gold';
        // this.track = tracksLB[0];
        this.track = p.tracks[2];
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0];

    }
    specialCase2() {
        this.scale = { ppm: 8, mpp: 0.35 };
        this.yflip = true;
        this.xflip = 1;
        this.reverse = true;
        this.colour = 'gold';
        this.track = p.tracks[2];
        this.trackImgName = this.track.fnames[0]
        this.car = p.cars[0];

    }
    cyrb128(str) {
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

    mulberry32(a) {
        //seeded rng
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

}
class Ghost {
    constructor() {
        //current recording
        this.n = 0; // current frame index
        this.recLap = [];
        this.recLap.n0 = 0;
        this.recLap.x = [];
        this.recLap.y = [];
        this.recLap.th = [];

        //playback ghost
        this.savedLap = [];
        this.savedLap.time = 0;

        this.started = false; // set true once start line crossed
        this.ghostAvail = false; // set true when first ghost created, or when loaded from local

        //web ghost
        this.webLap = [];
        this.webLap.time = 0;
        this.webLap.name = 'Web'
        this.webGhostAvail = false;

        // this.oldLap.y=[];

        this.loadFromWeb();
        this.loadFromLocal();
        // toggle
        this.toggleState = 2;
        // this.drawGhost = true;
        // this.drawWebGhost = ;
        this.dispText = "Off";
        if ("ghostToggleState" in localStorage) {
            this.toggleState = localStorage.getItem("ghostToggleState");
        }
        this.toggleState--;
        this.toggleDraw();
        // log(this.drawGhost,this.dispText)

        this.fontsize = fontSizeBase * pixRat;
        this.fontFamily = fontFamily;
        this.ch = this.fontsize + 15 * pixRat;
        this.cw = pixRat * 100;
        this.cx0 = 0;
        this.cy0 = Y - isTouch * Y / 3 - 0 * pixRat - this.ch - this.fontsize;
        // log(Y, isTouch,pixRat)
        this.en = null;
        this.active = false;


        // drawing, same as car
        this.w = p.car.width; //width
        this.frontLength = p.car.frontLength; //longitudinal distance to front wheel axis from COM
        this.rearLength = p.car.rearLength; //longitudinal distance to rear wheel axis from COM
        this.l = this.frontLength + this.rearLength // longitudinal distant from front to rear wheel axis
        this.height = p.car.height; //height of CoM
        this.wheelWidth = p.car.wheelWidth;
        this.wheelAspect = p.car.wheelAspect;


        this.colour = p.car.colour;
        this.colourWeb = 'black';
        this.alpha = 0.4;
        this.webAlpha = 0.3;

        this.rotMat = fs.calcRotMat(0);

        this.wheels = [
            new Wheel(-this.w / 2, this.frontLength, this.wheelWidth, this.wheelAspect),
            new Wheel(this.w / 2, this.frontLength, this.wheelWidth, this.wheelAspect),
            new Wheel(-this.w / 2, -this.rearLength, this.wheelWidth, this.wheelAspect),
            new Wheel(this.w / 2, -this.rearLength, this.wheelWidth, this.wheelAspect)
        ];


    }
    addState(x, y, th) {
        if (this.started) {
            this.n++;
            this.recLap.x.push(x);
            this.recLap.y.push(y);
            this.recLap.th.push(th);
        }
    }
    completeLap(t) {

        // log('ghost new lap, t=',t)
        // log(t, this.savedLap.time)
        if ((!dayxmode)&(timeTravel.ttDays == 0) & (t != 0) & ((t < this.savedLap.time) | (this.savedLap.time == 0))) {
            this.saveGhost(t);
        }
        // log((t != 0), true & name.name!=null, this.webLap.time, t < this.webLap.time)
        if ((!dayxmode)&(timeTravel.ttDays == 0) & !trackDev & (t != 0) & name.name != null & ((t < this.webLap.time) | (this.webLap.time == 0))) {
            this.postGhost(t);
        }

    }
    newLap() {
        this.n = 0;
        this.recLap.x = [];
        this.recLap.y = [];
        this.recLap.th = [];
    }
    saveGhost(t) {
        log('saving ghost')
        this.savedLap.x = this.recLap.x.slice();
        this.savedLap.y = this.recLap.y.slice();
        this.savedLap.th = this.recLap.th.slice();
        this.savedLap.time = t;
        this.ghostAvail = true;

        this.lapDataJSON = JSON.stringify({
            'x': JSON.stringify(this.savedLap.x, function (key, val) {
                return val.toFixed ? Number(val.toFixed(3)) : val;
            }),
            'y': JSON.stringify(this.savedLap.y, function (key, val) {
                return val.toFixed ? Number(val.toFixed(3)) : val;
            }),
            'th': JSON.stringify(this.savedLap.th, function (key, val) {
                return val.toFixed ? Number(val.toFixed(3)) : val;
            }),
            'time': JSON.stringify(t),
        })

        if (!trackDev) {
            localStorage.setItem('ghostVersion', JSON.stringify(sessionLogger.version));
            localStorage.setItem('ghost', this.lapDataJSON);
        }
    }
    postGhost(t) {
        log('posting ghost')
        this.savedLap.x = this.recLap.x.slice();
        this.savedLap.y = this.recLap.y.slice();
        this.savedLap.th = this.recLap.th.slice();
        this.savedLap.time = t;
        this.lapDataJSON = JSON.stringify({
            'x': JSON.stringify(this.savedLap.x, function (key, val) {
                return val.toFixed ? Number(val.toFixed(3)) : val;
            }),
            'y': JSON.stringify(this.savedLap.y, function (key, val) {
                return val.toFixed ? Number(val.toFixed(3)) : val;
            }),
            'th': JSON.stringify(this.savedLap.th, function (key, val) {
                return val.toFixed ? Number(val.toFixed(3)) : val;
            }),
            'time': JSON.stringify(t),
        })
        let formData = new FormData();
        formData.append('name', name.name);
        formData.append('version', sessionLogger.version);
        formData.append('time', t);
        formData.append('fps', Fps.fps);
        formData.append("lapData", this.lapDataJSON);
        // log(formData)

        fetch(apiURL + '/post_ghost', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                // this.getTimes(this.version);
                // this.getLaps(this.version);
                // sessionLogger.updateRank();
                // console.log(data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
    draw(ctx, xc, yc) {
        // log(this.n)
        if (this.ghostAvail & this.started & this.drawGhost) {
            if (this.n < this.savedLap.x.length) {

                ctx.globalAlpha = this.alpha;
                this.rotMat = fs.calcRotMat(this.savedLap.th[this.n]);


                let x = fs.matrixProd(car.coordMatAxels, this.rotMat);
                x = fs.matrixTrans(x, [PPM * this.savedLap.x[this.n] + xc, PPM * this.savedLap.y[this.n] + yc])

                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.fillStyle = this.colour;
                ctx.lineWidth = baseLW / zoom * pixRat;
                ctx.moveTo(x[0][0], x[0][1])
                for (let i = 1; i < x.length; i++) {
                    ctx.lineTo(x[i][0], x[i][1]);
                }
                ctx.lineTo(x[0][0], x[0][1]);
                ctx.stroke();

                x = fs.matrixProd(car.coordMatBody, this.rotMat);
                x = fs.matrixTrans(x, [PPM * this.savedLap.x[this.n] + xc, PPM * this.savedLap.y[this.n] + yc])

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

                x = fs.matrixProd(car.coordMatCockpit, this.rotMat);
                x = fs.matrixTrans(x, [PPM * this.savedLap.x[this.n] + xc, PPM * this.savedLap.y[this.n] + yc])

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

                this.wheels.forEach(wheel => wheel.draw(ctx, this.rotMat, this.savedLap.x[this.n], this.savedLap.y[this.n], xc, yc));
                ctx.globalAlpha = 1.0;
            }
        }
    }
    drawWeb(ctx, xc, yc) {
        // log(this.n)
        if (this.webGhostAvail & this.started & this.drawWebGhost) {
            if (this.n < this.webLap.x.length) {

                ctx.globalAlpha = this.webAlpha;
                this.rotMat = fs.calcRotMat(this.webLap.th[this.n]);


                let x = fs.matrixProd(car.coordMatAxels, this.rotMat);
                x = fs.matrixTrans(x, [PPM * this.webLap.x[this.n] + xc, PPM * this.webLap.y[this.n] + yc])

                ctx.beginPath();
                ctx.strokeStyle = 'black';
                ctx.fillStyle = this.colour;
                ctx.lineWidth = baseLW / zoom * pixRat;
                ctx.moveTo(x[0][0], x[0][1])
                for (let i = 1; i < x.length; i++) {
                    ctx.lineTo(x[i][0], x[i][1]);
                }
                ctx.lineTo(x[0][0], x[0][1]);
                ctx.stroke();

                x = fs.matrixProd(car.coordMatBody, this.rotMat);
                x = fs.matrixTrans(x, [PPM * this.webLap.x[this.n] + xc, PPM * this.webLap.y[this.n] + yc])

                ctx.beginPath();
                ctx.strokeStyle = this.colourWeb;
                ctx.fillStyle = this.colourWeb;
                ctx.lineWidth = baseLW / zoom * pixRat;
                // console.table(this.coordMat)
                ctx.moveTo(x[0][0], x[0][1])
                for (let i = 1; i < x.length; i++) {
                    ctx.lineTo(x[i][0], x[i][1]);
                }
                ctx.lineTo(x[0][0], x[0][1]);
                // ctx.stroke();
                ctx.fill();

                x = fs.matrixProd(car.coordMatCockpit, this.rotMat);
                x = fs.matrixTrans(x, [PPM * this.webLap.x[this.n] + xc, PPM * this.webLap.y[this.n] + yc])

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

                this.wheels.forEach(wheel => wheel.draw(ctx, this.rotMat, this.webLap.x[this.n], this.webLap.y[this.n], xc, yc));
                ctx.globalAlpha = 1.0;
            }
        }
    }
    loadFromLocal() {
        let localGhostVersion = JSON.parse(localStorage.getItem('ghostVersion'))
        if (localGhostVersion == sessionLogger.version) {
            // log(typeof (localStorage.getItem('ghost')))
            let localGhost = JSON.parse(localStorage.getItem('ghost'));
            this.savedLap.x = JSON.parse(localGhost.x)
            this.savedLap.y = JSON.parse(localGhost.y)
            this.savedLap.th = JSON.parse(localGhost.th)
            if (localGhost.time) {
                this.savedLap.time = JSON.parse(localGhost.time)
            }
            else {
                this.savedLap.time = 9999999; //catched previous version with not ghost time stored
            }
            this.ghostAvail = true;
        }
    }
    loadFromWeb() {
        fetch(apiURL + '/get_ghost?version=' + sessionLogger.version + '&fps=' + Fps.fps)
            .then(response => response.json())
            .then(data => {
                // log(data)
                if (data.avail) {
                    this.webLap.name = data.name;
                    if (this.toggleState == 1) {
                        this.dispText = data.name;
                    }
                    this.webLap.time = data.time;
                    let lapData = JSON.parse(data.lapData);
                    this.webLap.x = JSON.parse(lapData.x);
                    this.webLap.y = JSON.parse(lapData.y);
                    this.webLap.th = JSON.parse(lapData.th);
                    this.webGhostAvail = true;
                    // log(this.webLap.time)
                }
                else {
                    // log("no web ghost avail")
                }

                // log(this.name)
                // let localGhost = JSON.parse(localStorage.getItem('ghost'));
                // this.times = data
                // this.n = Math.min(this.nMax, data.length);
                // log("response:")

            });
    }
    toggleDraw() {
        this.toggleState++;
        if (this.toggleState > 3) {
            this.toggleState = 0;
        }
        if (this.toggleState == 0) {
            this.drawGhost = true;
            this.drawWebGhost = true;
            this.dispText = 'Both';
        }

        if (this.toggleState == 1) {
            this.drawGhost = false;
            this.drawWebGhost = true;
            this.dispText = this.webLap.name;
        }
        if (this.toggleState == 2) {
            this.drawGhost = true;
            this.drawWebGhost = false;
            this.dispText = 'On';
        }

        if (this.toggleState == 3) {
            this.drawGhost = false;
            this.drawWebGhost = false;
            this.dispText = 'Off';
        }
        localStorage.setItem('ghostToggleState', this.toggleState)
    }
    drawToggle() {
        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.cx0, this.cy0, this.cw, this.ch)
        // ctx.stroke();

        ctx.beginPath();
        ctx.textAlign = "left";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "white";
        ctx.fillText('Ghost:' + this.dispText, + 4 * pixRat, Y - isTouch * Y / 3 - 5 * pixRat - this.fontsize)
    }
    contains(ex, ey) {
        // log(ex,ey)
        // log(this.cy0,this.cy0 + this.ch)
        return ((ex > this.cx0) & ex < (this.cx0 + this.cw) & (ey > this.cy0) & (ey < (this.cy0 + this.ch)));
    }
    pointerDownHandler(ex, ey, en) {

        // log('PD')
        if (this.contains(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.en = en;
            // log('PD in box')
        }
    }
    pointerUpHandler(en) {
        if (en == this.en) {
            // debugTxt = "PU: " + en + " " + this.action;

            this.en = null;
            this.active = false;
            this.toggleDraw();

            // log('PU',this.drawGhost,this.dispText)
        }
    }

}
class FPS {
    constructor() {
        this.defaultFPS = 60;
        this.fps = parseInt(this.getLocal());
        this.nSmooth = this.fps;
        this.t0 = 0;
        this.t = 0;
        this.fdtm10 = 0;
        this.fdt = 0;
        this.fdtarr = new Array(this.nSmooth).fill(0);
        this.fdtmean = 0;
        this.maxfps = 0;
        this.fpsMatch = 0;
        this.matchTime = this.fps * 3;//get fps after 2 secs
        // this.fpss = [30, 60, 90, 120, 144, 240];
        this.fpss = [60, 90, 120, 144, 240]; // trial no 30
        // log(this.fdtarr)

    }
    getLocal() {
        if (localStorage.getItem('fps')) {
            // log("Local FPS retrieved:", localStorage.getItem('fps'))
            return localStorage.getItem('fps');
        }
        else {
            // log("No local FPS, setting default:", this.defaultFPS)
            return this.defaultFPS;
        }
    }
    setLocal(fps) {
        // log('local set:', fps)
        localStorage.setItem('fps', fps)
    }
    calc() {
        // call from anim every frame until matchTime
        this.t = Date.now()
        this.fdt = this.t - this.t0;
        this.t0 = this.t;
        this.fdtarr.push(this.fdt)
        this.fdtm10 = this.fdtarr.shift()
        this.fdtmean += this.fdt / this.nSmooth;
        this.fdtmean -= this.fdtm10 / this.nSmooth;
        this.maxfps = Math.max(1000 / this.fdtmean, this.maxfps);
    }
    match() {
        //call from anim at matchTime
        this.fpsMatch = this.fpss.reduce((a, b) => {
            return Math.abs(b - this.maxfps) < Math.abs(a - this.maxfps) ? b : a;
        });
        this.fps = this.fpsMatch;
        // log('matched: ', this.fpsMatch);
        if (this.fpsMatch != this.fps) {
            this.setLocal(this.fpsMatch);
            flash.flash(this.fps + " Hz detected");
        }
        // flash.flash(this.fps + " Hz detected");
        dt = p.car.gamma / Fps.fps;
    }
}
class ResetButton {
    constructor() {
        this.fontsize = fontSizeBase * pixRat;
        this.fontFamily = fontFamily;

        this.x0 = X - this.w;
        this.y0 = Y - isTouch * Y / 3 - this.h;
        this.en = null;
        this.text = 'Reset'

        this.fontFamily = fontFamily;
        this.ch = this.fontsize + 20 * pixRat;
        this.cw = pixRat * 100;
        this.cx0 = 0;
        this.cy0 = Y - isTouch * Y / 3 - 65 * pixRat - this.ch - this.fontsize;
        // log(Y, isTouch,pixRat)
        this.en = null;
        this.active = false;
    }
    draw() {
        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.cx0, this.cy0, this.cw, this.ch)
        // ctx.stroke();

        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "white";
        ctx.fillText(this.text, 35 * pixRat, Y - isTouch * Y / 3 - 75 * pixRat - this.fontsize)
    }
    contains(ex, ey) {
        // log(ex,ey)
        // log(this.cy0,this.cy0 + this.ch)
        return ((ex > this.cx0) & ex < (this.cx0 + this.cw) & (ey > this.cy0) & (ey < (this.cy0 + this.ch)));
    }
    pointerDownHandler(ex, ey, en) {

        // log('PD')
        if (this.contains(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.en = en;
            // log('PD in reset box')
        }
    }
    pointerUpHandler(en) {
        if (en == this.en) {
            // debugTxt = "reset PU: " + en + " " + this.action;

            this.en = null;
            this.active = false;
            // this.toggleDraw();
            this.reset();
            // log('PU in reset box');
        }
    }
    reset() {
        car.reset();
        lapCounter.resetStart();
        sessionLogger.checkLive();
        sessionLogger.stats.resets++;
        sessionLogger.setLocalStats();
    }

}
let fs = function () {
    var matrixProd = (A, B) =>
        A.map((row, i) =>
            B[0].map((_, j) =>
                row.reduce((acc, _, n) =>
                    acc + A[i][n] * B[n][j], 0
                )
            )
        )
    function matrixTrans(A, B) {
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
    function drawMultiLapDebug() {
        ctx.fillStyle = "white"
        ctx.textAlign = "left"
        ctx.font = 10 * pixRat + 'px ' + fontFamily;
        let x0 = 100

        // let debugTxt1 = 'lap ' + lapCounter.lapn + '/' + multilapn
        // ctx.fillText(debugTxt1, 5, x0 + 10, 500)
        // let debugTxt2 = 'check ' + lapCounter.nextCheck + '/' + lapCounter.finalCheck
        // ctx.fillText(debugTxt2, 5, x0 + 20, 500)

        let debugTxt1 = 'ulon ' + Math.round(car.ulon * 10) / 10
        ctx.fillText(debugTxt1, 5, x0 + 10, 500)
        // let debugTxt2 = 'check ' + lapCounter.nextCheck + '/' + lapCounter.finalCheck
        // ctx.fillText(debugTxt2, 5, x0 + 20, 500)

    }
    function drawDebug() {
        // xw0 = Math.round(car.wheels[0].xa / scl);
        // yw0 = Math.round(car.wheels[0].ya / scl);
        // xw1 = Math.round(car.wheels[1].xa / scl);
        // yw1 = Math.round(car.wheels[1].ya / scl);

        let debugTxt1 =
            car.n.Fair.lon.toFixed(2) + " "
        // car.downForceFront.toFixed(1) + " " +
        // car.downForceRear.toFixed(1) + " "
        // let debugTxt1 =
        //     car.wheels[0].load.toFixed(1) + " " +
        //     car.wheels[1].load.toFixed(1) + " " +
        //     car.wheels[2].load.toFixed(1) + " " +
        //     car.wheels[3].load.toFixed(1) + " "
        let debugTxt2 =
            car.wheels[0].n.Fthrust.lon.toFixed(2) + " " +
            car.wheels[1].n.Fthrust.lon.toFixed(2) + " " +
            car.wheels[2].n.Fthrust.lon.toFixed(2) + " " +
            car.wheels[3].n.Fthrust.lon.toFixed(2)
        let debugTxt3 =
            car.wheels[0].n.Fbrake.lon.toFixed(2) + " " +
            car.wheels[1].n.Fbrake.lon.toFixed(2) + " " +
            car.wheels[2].n.Fbrake.lon.toFixed(2) + " " +
            car.wheels[3].n.Fbrake.lon.toFixed(2)
        let debugTxt4 =
            car.wheels[0].n.Frollres.lon.toFixed(2) + " " +
            car.wheels[1].n.Frollres.lon.toFixed(2) + " " +
            car.wheels[2].n.Frollres.lon.toFixed(2) + " " +
            car.wheels[3].n.Frollres.lon.toFixed(2)
        let debugTxt5 =
            car.wheels[0].n.Fdrag.lon.toFixed(2) + " " +
            car.wheels[1].n.Fdrag.lon.toFixed(2) + " " +
            car.wheels[2].n.Fdrag.lon.toFixed(2) + " " +
            car.wheels[3].n.Fdrag.lon.toFixed(2)
        let debugTxt6 =
            car.wheels[0].n.Fcorn.lon.toFixed(2) + " " +
            car.wheels[1].n.Fcorn.lon.toFixed(2) + " " +
            car.wheels[2].n.Fcorn.lon.toFixed(2) + " " +
            car.wheels[3].n.Fcorn.lon.toFixed(2)
        let debugTxt7 =
            car.n.Fres.lon.toFixed(2) + " "


        // wh.n.Fthrust.lon + wh.n.Fbrake.lon + wh.n.Frollres.lon + wh.n.Fdrag.lon + wh.n.Fcorn.lon

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
        let x0 = 100
        ctx.fillText(debugTxt1, 5, x0 + 10, 500)
        ctx.fillText(debugTxt2, 5, x0 + 20, 500)
        ctx.fillText(debugTxt3, 5, x0 + 30, 500)
        ctx.fillText(debugTxt4, 5, x0 + 40, 500)
        ctx.fillText(debugTxt5, 5, x0 + 50, 500)
        ctx.fillText(debugTxt6, 5, x0 + 60, 500)
        ctx.fillText(debugTxt7, 5, x0 + 70, 500)
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
        let hudX = 10 * pixRat;
        let hudY = 100 * pixRat + isTouch * Y / 3;
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
        ctx.rect(hudX + barWidth + barWidthSpace, Y - hudY, barWidth, -car.brakeWheelHUD.brake / car.maxBrakeHUD * barHeight);
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
        // window.addEventListener("touchmove", function (event) {
        //     event.preventDefault();
        // }, { passive: false });
        // window.addEventListener("touchstart", function (event) {
        //     event.preventDefault();
        // }, { passive: false });

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
        addPointerListeners(ghost);
        addPointerListeners(resetButton);
        addPointerListeners(viewMode);
        addPointerListeners(timeTravel);
        addPointerListeners(docPanel);
        addEventListener('keydown', (event) => { inputState.set(event) });
        addEventListener('keyup', (event) => { inputState.set(event) });
    }
    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
    function formatDuration(duration) {
        if (duration == 0) {
            return "--.---"
        }
        var seconds = Math.abs(Math.floor(duration / 1000)),
            h = (seconds - seconds % 3600) / 3600,
            m = (seconds - seconds % 60) / 60 % 60,
            s = seconds % 60,
            ms = duration % 1000;
        // return (duration < 0 ? '-' : '') + h + ':' + pad(m.toString(), 2) + ':' + pad(s.toString(), 2) +'.' + pad(ms.toString(),3);
        return pad(s.toString(), 2) + '.' + pad(ms.toString(), 3);
    }
    function formatDurationTenth(duration) {
        if (duration == 0) {
            return '-:--.-'
        }
        else {
            var seconds = Math.abs(Math.floor(duration / 1000)),
                h = (seconds - seconds % 3600) / 3600,
                m = (seconds - seconds % 60) / 60 % 60,
                s = seconds % 60,
                ms = duration % 1000,
                ts = Math.floor(ms / 100);
            // return (duration < 0 ? '-' : '') + h + ':' + pad(m.toString(), 2) + ':' + pad(s.toString(), 2) +'.' + pad(ms.toString(),3);
            return pad(m.toString(), 1) + ':' + pad(s.toString(), 2) + '.' + ts.toString();
        }
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
        ctx.imageSmoothingEnabled = false;
        pixRat = window.devicePixelRatio * 1.0;
        canvas.height = window.innerHeight * pixRat;
        canvas.width = window.innerWidth * pixRat;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        X = canvas.width;
        Y = canvas.height;
        halfMinDim = Math.min(X, Y) / 2;
        xc = 0 // screen centre coords
        yc = 0
        isTouch = fs.isTouchDevice();
        yOff = isTouch ? Y / 6 : 0; // Y offset if touch controls present
        // log('X',X,'Y',Y)

    }
    function drawSpeedo() {
        let x0 = 10 * pixRat;
        let y0 = Y - isTouch * Y / 3 - 20 * pixRat - fontSizeBase * pixRat;
        let rad = 25 * pixRat;
        let th0 = Math.PI * 45 / 180;
        let th = car.U / car.maxUth * (Math.PI * 2 - 2 * th0) - Math.PI / 2 + th0;
        ctx.lineWidth = baseLW * pixRat;
        ctx.beginPath()
        ctx.strokeStyle = 'white';


        ctx.arc(x0 + rad, y0 - rad, rad, th0 + Math.PI / 2, Math.PI * 5 / 2 - th0)
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0 + rad, y0 - rad);
        ctx.lineTo(x0 + rad - .9 * rad * Math.cos(-th), y0 - rad + .9 * rad * Math.sin(-th));
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(car.U * 5), x0 + rad, y0 - rad / 2)
    }
    return {
        matrixProd: matrixProd,
        matrixTrans: matrixTrans,
        calcRotMat: calcRotMat,
        drawHUD: drawHUD,
        drawHUDArrow: drawHUDArrow,
        RGBToHSL: RGBToHSL,
        isTouchDevice: isTouchDevice,
        addPointerListeners: addPointerListeners,
        addListeners: addListeners,
        pad: pad,
        formatDuration: formatDuration,
        formatDurationTenth: formatDurationTenth,
        intersects: intersects,
        secondBezier: secondBezier,
        dotProduct: dotProduct,
        crossProduct: crossProduct,
        resize: resize,
        secsToString: secsToString,
        submitName: submitName,
        drawDebug: drawDebug,
        drawSpeedo: drawSpeedo,
        drawMultiLapDebug: drawMultiLapDebug,
    }
}();
function anim() {
    n++;
    if (n < nMax) {
        requestAnimationFrame(anim);
    }
    if (n < Fps.matchTime) {
        Fps.calc()
    }
    if (n == Fps.matchTime) {
        Fps.match();
    }

    // requestAnimationFrame(anim);

    car.control(inputState);
    if (track.trackReady) {
        car.readTrack();
        car.checkVoid();
        car.mech();
    }


    // set zoom depending on view mode
    if (viewMode.vState == 0) { // dynamic zoom tracking
        zoomTarget = zoomBase - zoomMax * car.U / car.maxUth;
        zoom = zoom + (zoomTarget - zoom) * zoomSpeed;
    }
    if (viewMode.vState == 1) { // overview
        zoom = Math.min(X / track.Xi, (Y - Y / 3 * isTouch) / track.Yi) / track.trackScl
    }
    if (viewMode.vState == 2) {// fixed zoom tracking
        zoom = zoomBase - zoomMax * 1;
        // zoom = zoomMax * 1;
    }


    // clear screen
    ctx.beginPath()
    ctx.fillStyle = track.bgColour;
    ctx.rect(0, 0, X, Y)
    ctx.fill()
    // set screen centre coords and transform
    if (viewMode.vState == 0 | viewMode.vState == 2) {//either dynamic or fixed zoom mode
        //look ahead
        Lmax = halfMinDim / Math.max(Math.abs(car.ux), Math.abs(car.uy)) / PPM; //max look ahead distance
        dynLookAhead = Math.min(lookAhead * p.car.gamma, Lmax) //desired look ahead distance

        // calc screen centre coords
        xct = X / 2 - PPM * (car.x + car.ux * dynLookAhead)  //centre target, pan to this, screen pixel units
        yct = Y / 2 - PPM * (car.y + car.uy * dynLookAhead) - yOff
        xc = xc + (xct - xc) * panSpeed //pan from old centre to target at pan speed 
        yc = yc + (yct - yc) * panSpeed

        ctx.setTransform(zoom, 0, 0, zoom, (1 - zoom) * X / 2, (1 - zoom) * Y / 2);
    }
    else {//overview mode
        xc = X / 2 / zoom - track.Xi / 2 * track.trackScl
        yc = (Y - Y / 3 * isTouch) / 2 / zoom - track.Yi / 2 * track.trackScl
        ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
    }


    //draw scaled stuff
    //draw track

    // log( xc , yc)
    // this method scales track image live every frame, is too slow when smooth scaling is enables, maybe ok without?
    // ctx.drawImage(track.canvas, -xc / track.trackScl, -yc / track.trackScl, X / track.trackScl, Y / track.trackScl, 0, 0, X, Y);

    // this method user prescaled track from 'offscreen' (but not officially) canvas, was sig faster when
    // the canvas smooth scaling was set to true. may be uncessary when smooth is false?
    // prescaled track is too big for iphone (maybe, not tested).

    ctx.drawImage(track.canvasScl, xc, yc);

    track.drawGates(ctx, xc, yc);
    if (trackDev) {
        track.drawAllGates(ctx, xc, yc);
    }
    lapCounter.checkGates(car.x * track.trackPPM, car.y * track.trackPPM);
    lapCounter.updateLapTime();

    car.draw(ctx, xc, yc);
    ghost.draw(ctx, xc, yc);
    ghost.drawWeb(ctx, xc, yc);


    // draw unscaled scaled stuff
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    lapCounter.draw(ctx);
    ghost.drawToggle();
    // touchControl.draw(ctx);
    if (inputState.touch) {
        accBtn.draw(ctx);
        brkBtn.draw(ctx);
        leftBtn.draw(ctx);
        rightBtn.draw(ctx);
    }
    if (carDev) {
        fs.drawDebug();
        fs.drawHUD();
        car.drawHUD(ctx);
    }

    // fs.drawMultiLapDebug();

    hiScores.draw(ctx);
    hiScoresWeb.draw(ctx);
    sessionLogger.draw(ctx);
    name.draw(ctx);
    viewMode.draw(ctx);
    resetButton.draw();
    docPanel.draw();
    flash.draw(ctx);
    // fs.drawHUD();
    fs.drawSpeedo();
    timeTravel.draw()

    ghost.addState(car.x, car.y, car.theta);

}
function urlArgHandler() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    showLapCount = urlParams.get('nLaps') || urlParams.has('tt');
    trackDev = parseInt(urlParams.get('trackDev'));
    revDev = parseInt(urlParams.get('revDev'));
    carDev = parseInt(urlParams.get('carDev'));
    lonBorMode = urlParams.has('lb')
    lonBor = parseInt(urlParams.get('lb'));
    timeTravelDaysURL = urlParams.has('tt') ? parseInt(urlParams.get('tt')) : 0;
    dayxmode = urlParams.has('d') // choose day since 19400
    if (dayxmode){
        dayxURL = parseInt(urlParams.get('d'))
    }
    else{
        dayxURL = null;
    }
   
    dev =  urlParams.has('tt') || urlParams.has('trackDev') || urlParams.has('carDev') || urlParams.has('lb') || urlParams.has('ml');
    qdev = urlParams.has('qdev')

    multilapUrl = urlParams.get('ml');// if false, sessionSetter can overwrite below multiLap params
    multilap = urlParams.get('ml') > 1;
    multilapn = urlParams.get('ml');

}
class TimeTravel {
    constructor() {
        this.ttLim = -100;

        this.yPos = (1 + 0.0 * fontSizeBase) * pixRat;
        this.y0 = this.yPos - 0.5 * fontSizeBase * pixRat;
        this.x0 = X / 2 - fontSizeBase * 3 * pixRat / 2;
        this.h = 2 * fontSizeBase * pixRat;
        this.w = fontSizeBase * 3 * pixRat

        this.xL = X / 2 - fontSizeBase * (3 / 2 + 3) * pixRat;
        this.xR = X / 2 - fontSizeBase * (3 / 2 - 3) * pixRat;

        if ("ttDays" in localStorage) {
            this.ttDays = JSON.parse(localStorage.getItem("ttDays"));
        }
        else {
            this.ttDays = 0;
        }
        this.text = "T:" + this.ttDays
        if (this.ttDays == 0) {
            this.text = "Live"
        }
    }
    draw() {

        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.x0, this.y0, this.w, this.h)
        // ctx.stroke();
        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.xL, this.y0, this.w, this.h)
        // ctx.stroke();
        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.xR, this.y0, this.w, this.h)
        // ctx.stroke();

        ctx.beginPath();
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";
        ctx.fillText(this.text, X / 2, this.yPos);

        ctx.beginPath();
        ctx.fillStyle = "white";
        if (timeTravel.ttDays <= this.ttLim) {
            ctx.fillStyle = "darkGrey";
        }
        ctx.fillText("<", this.xL + this.w / 2, this.yPos);
        ctx.beginPath();
        ctx.fillStyle = "white";
        if (timeTravel.ttDays >= 0) {
            ctx.fillStyle = "darkGrey";
        }
        ctx.fillText(">", this.xR + this.w / 2, this.yPos);

    }
    contains0(ex, ey) {
        return ((ex > this.x0) & ex < (this.x0 + this.w) & (ey > this.y0) & (ey < (this.y0 + this.h)));
    }
    containsL(ex, ey) {
        return ((ex > this.xL) & ex < (this.xL + this.w) & (ey > this.y0) & (ey < (this.y0 + this.h)));
    }
    containsR(ex, ey) {
        return ((ex > this.xR) & ex < (this.xR + this.w) & (ey > this.y0) & (ey < (this.y0 + this.h)));
    }
    pointerDownHandler(ex, ey, en) {
        // log('PD')
        if (this.contains0(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.en0 = en;
        }
        if (this.containsL(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.enL = en;
        }
        if (this.containsR(ex, ey)) {
            // debugTxt = "PD: " + en + " " + this.action;
            this.active = true;
            this.enR = en;
        }

    }
    pointerUpHandler(en) {
        if (en == this.en0) {
            // debugTxt = "PU: " + en + " " + this.action;
            this.en0 = null;
            this.active = false;
            this.settt(0);
        }
        if (en == this.enL) {
            // debugTxt = "PU: " + en + " " + this.action;
            this.enL = null;
            this.active = false;
            this.settt(this.ttDays - 1);
        }
        if (en == this.enR) {
            // debugTxt = "PU: " + en + " " + this.action;
            this.enR = null;
            this.active = false;
            this.settt(this.ttDays + 1);
        }


    }

    settt(tt) {
        tt = Math.min(0, Math.max(tt, this.ttLim))
        log("Setting tt", tt)
        localStorage.setItem('ttDays', tt)
        if (this.ttDays != tt) {
            this.ttDays = tt;
            location.reload()
        }

    }
}
class DocPanel {
    constructor() {
        this.x0 = X * 0;
        // this.y0 = Y - isTouch * Y / 3 - 5 * pixRat;
        this.y0 = fontSizeBase * pixRat * 6.5
        this.en = null;
        this.text = '?'

        this.ch = (fontSizeBase * 2) * pixRat;
        this.cw = pixRat * fontSizeBase;
        this.cx0 = this.x0
        this.cy0 = this.y0 - this.ch * 0.3;
        if ("showDocs" in localStorage) {
            this.showDocs = JSON.parse(localStorage.getItem("showDocs"));
        }
        else {
            this.showDocs = true;
        }

        document.getElementById("closeDocs").addEventListener("click", this.hideDocs, { passive: true })
        if (this.showDocs) {
            this.unhideDocs()
        }
        // log("showDocs:", this.showDocs)
    }
    unhideDocs() {
        let docs = document.getElementById("docs").style
        docs.visibility = "visible"
        this.showDocs = true;
        localStorage.setItem("showDocs", true)
    }
    hideDocs() {
        let docs = document.getElementById("docs").style
        docs.visibility = "hidden"
        this.showDocs = false;
        localStorage.setItem("showDocs", false)
    }
    draw() {
        // ctx.beginPath()
        // ctx.strokeStyle = "white";
        // ctx.rect(this.cx0, this.cy0, this.cw, this.ch)
        // ctx.stroke();

        ctx.beginPath();
        ctx.textAlign = "left";
        ctx.font = this.fontsize + 'px ' + this.fontFamily;
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";
        ctx.fillText(this.text, this.x0, this.y0)
    }
    contains(ex, ey) {
        // log("contains doc")
        // log("x:",this.cx0, ex, this.cx0 + this.cw)
        // log("y:", this.cy0, ey, this.cy0 + this.ch)
        return ((ex > this.cx0) & ex < (this.cx0 + this.cw) & (ey > this.cy0) & (ey < (this.cy0 + this.ch)));
    }
    pointerDownHandler(ex, ey, en) {
        // log('PD')
        if (this.contains(ex, ey)) {
            this.active = true;
            this.en = en;
        }
    }
    pointerUpHandler(en) {
        if (en == this.en) {

            this.en = null;
            this.active = false;
            this.unhideDocs();
        }
    }
}

let log = console.log;
let showLapCount, carDev, revDev, trackDev, timeTravelDaysURL, dev, lonBor, 
lonBorMode, qdev, multilapUrl, multilap, multilapn,dayxURL,dayxmode



urlArgHandler();
// log('multilap',multilap,multilapn)

// import parameter object, input data for car
import { p } from './params.js'
import { tracksLB } from './trackParmsLB.js'
import { tracksEC } from './trackParmsEC.js'
import { tracksOG } from './trackParmsOG.js'
import { tracksWC } from './trackParmsWC.js'
import { tracksWC2 } from './trackParmsWC2.js'
const sessionPrefix = p.version.n

let Fps = new FPS(); // frames per second handler

// set API URL
let serverOveride = false;
serverOveride = true;
let apiURL;
if ((dev || location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "") & !serverOveride) {
    apiURL = 'http://127.0.0.1:5000'
}
else {
    apiURL = 'https://bitmapRacer.eu.pythonanywhere.com'
}

// screen set up
let canvas, ctx, pixRat, isTouch, X, Y, xc, yc, xct, yct, yOff, halfMinDim, dynLookAhead, Lmax
let PPM;// init drawing scale, screen pixels per metre - pre zoom
fs.resize();

// draw constants
const fontFamily = 'monospace';
const fontSizeBase = 13;
const baseLW = p.draw.baseLW; // linewidth
const lookAhead = p.draw.lookAhead; // seconds
const panSpeed = p.draw.panSpeed * 60 / Fps.fps; // fraction to target per frame

const zoomBase = 1.2
const zoomMax = 0.5
const zoomSpeed = 0.2
let zoom = 1, zoomTarget

let docPanel = new DocPanel(); //handles info (?) screen
let timeTravel = new TimeTravel(); //session browsing
let flash = new Flash(); //on-screen messaging
let sessionLogger = new SessionLogger(timeTravelDaysURL, dev);  // handles all record keeping
let name = new Name();
let viewMode = new ViewMode();
let resetButton = new ResetButton();
let hiScores = new HiScores();
let hiScoresWeb = new HiScoresWeb();


let setter = new SessionSetter(sessionLogger.versionBase);// init track setter
setter.set(sessionLogger.currentSesh) // set track based on current session ID
let dt = p.car.gamma / Fps.fps; //time step, updated by FPS class after fps check/match
let inputState = new InputState;// input setup
let accBtn, brkBtn, leftBtn, rightBtn; // touch control buttons
let track = new Track() //track and lapCounter set up
let lapCounter = new LapCounter(track.gates);
let car = new Car();// car set up
let ghost = new Ghost();//ghost set up

fs.addListeners(inputState);

// run
let n = 0;
let nMax = p.run.nMax;
log(sessionLogger.version)
anim();

if (lonBorMode || p.track.name) {
    flash.flash("Welcome to " + p.track.name)
}
else {
    flash.flash("Welcome")
}
if (dev || dayxmode){
    flash.flash("Day " +  (sessionLogger.currentSesh-19400).toString())
}
if (multilap) {
    flash.flash(multilapn + "-lap Race")
}