export let p = {
    "car": {
        "width": 2,
        "frontLength": 1,
        "rearLength": 2,
        "height": 0.75,
        "wheelWidth": 0.4,
        "wheelAspect": 2,
        "oversize": 0.15,
        "bodyAspect": 0.25,
        "mass": 200,
        "momIfac": 5, // moment of intertia over mass
        "steeringRate": 0.1,
        "steeringMaxBase": 45 * Math.PI / 180, //steering lock at 0 speed.
        "steeringUscl": 5, // U scl of steering lock limiting
        "steeringCentreRate": 1,
        "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=agaoinst motion)
        "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD, 0.5 is 4WD
        "torqueRate": 4,
        "torqueMax": 50,
        "brakeRate": 20,
        "brakeMax": 100,
        "colour": 'gold',
    },
    "phys": {
        "CD": 100, // Surface Drag resistance
        "Crr": 2, // Rolling resistance
        "CA": 0.5, //Air resistance
        "F_lat": 1.2, // Max lateral friction multiplier, above 1.0 gives "superweight" force.
        "stiffness": 200, // Newtons (lateral friction) per Radian (slip angle)
    },
    "track": {
        "fname": 'tracks/square_track.png',
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,
        "reverse":false,
        "flipX": false,
        "flipY": false,

        "startTheta": -.10,
        "startX": 180,
        "startY": 260,

        "startThetaRev": Math.PI,
        "startXRev": 180,
        "startYRev": 720,


        "metresPerPix": 0.35,
        "sfcTypes": {
            "outOfBounds": { "mu": 1.0, "drag": 0.2 },
            "tarmac": { "mu": 0.8, "drag": 0.001 },
            "grass": { "mu": 0.3, "drag": 0.02 },
            "mud": { "mu": 0.2, "drag": 0.3 },
            "unknown": { "mu": 0.8, "drag": 0.01 },
        },
        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 250, 'y': 500 }, 'right': { 'x': 70, 'y': 500 } },
            { 'n': 1, 'left': { 'x': 700, 'y': 500 }, 'right': { 'x': 1000, 'y': 500 } },
            { 'n': 2, 'left': { 'x': 450, 'y': 770 }, 'right': { 'x': 450, 'y': 580 } },
            { 'n': 3, 'left': { 'x': 330, 'y': 250 }, 'right': { 'x': 330, 'y': 0 } },
        ]
    },
    "draw": {
        "pixPerMetre": 8,
        "baseLW": 2,
        "lookAhead": 5.0,
        "panSpeed": 0.15,
        "zoom": 1.0,
        "HUDscl": 15,
        "HUDforceScl": .8,
    },
    "version": {
        "n": "flip01",
    },
    "run": {
        "dt": 0.2,
        "nMax": 1000000,
        "fps":60,
    },

}
