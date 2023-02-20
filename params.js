export let p = {
    "cars": [
        {
            "width": 2,
            "frontLength": 1,
            "rearLength": 2,
            "height": 0.75,
            "wheelWidth": 0.6,
            "wheelAspect": 1.6,
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
        {
            "width": 2,
            "frontLength": 1,
            "rearLength": 2,
            "height": 0.75,
            "wheelWidth": 0.6,
            "wheelAspect": 1.6,
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
    ],

    "phys": {
        "CD": 100, // Surface Drag resistance
        "Crr": 2, // Rolling resistance
        "CA": 0.5, //Air resistance
        "F_lat": 1.2, // Max lateral friction multiplier, above 1.0 gives "superweight" force.
        "stiffness": 200, // Newtons (lateral friction) per Radian (slip angle)
    },
    "trackSetup": {
        "metresPerPix": 0.35,
        "reverse": false,
        "flipX": false,
        "flipY": false,
    },
    "draw": {
        "pixPerMetre": 10,
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
        "dt": 0.2, // time per frame at 60Hz
        "nMax": 1000000,
    },
    "tracks": [{
        "fnames": ['tracks/square_track.png'],
        "bgColour": "#381b00",
        "scale":1,

        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": -.10,
        "startX": 180,
        "startY": 260,

        "startThetaRev": Math.PI,
        "startXRev": 180,
        "startYRev": 720,

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
    {
        "fnames": ['tracks/square_track2_allpath.png'],
        "bgColour": "#381b00",
        "scale":1,
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 3.3,
        "startX": 140,
        "startY": 840,

        "startThetaRev": -0.4,
        "startXRev": 180,
        "startYRev": 200,

        "sfcTypes": {
            "outOfBounds": { "mu": 1.0, "drag": 0.2 },
            "tarmac": { "mu": 0.8, "drag": 0.001 },
            "grass": { "mu": 0.3, "drag": 0.02 },
            "mud": { "mu": 0.2, "drag": 0.3 },
            "unknown": { "mu": 0.8, "drag": 0.01 },
        },
        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 16, 'y': 500 }, 'right': { 'x': 187, 'y': 500 } },
            { 'n': 1, 'left': { 'x': 580, 'y': 150 }, 'right': { 'x': 438, 'y': 250 } },
            { 'n': 2, 'left': { 'x': 805, 'y': 252 }, 'right': { 'x': 975, 'y': 237 } },
            { 'n': 3, 'left': { 'x': 365, 'y': 531 }, 'right': { 'x': 195, 'y': 529 } },
            { 'n': 4, 'left': { 'x': 940, 'y': 783 }, 'right': { 'x': 767, 'y': 794 } },
        ]
    },

    {
        "fnames": ['tracks/BC1-Regular.png', 'tracks/BC1-GrassTrack.png', 'tracks/BC1-Overgrown.png',],
        "bgColour": "#B97A56",
        "scale":0.7,
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 3.141,
        "startX": 180,
        "startY": 840,

        "startThetaRev": 0,
        "startXRev": 180,
        "startYRev": 200,

        "sfcTypes": {
            "outOfBounds": { "mu": 1.0, "drag": 0.2 },
            "tarmac": { "mu": 0.8, "drag": 0.001 },
            "grass": { "mu": 0.3, "drag": 0.02 },
            "mud": { "mu": 0.2, "drag": 0.3 },
            "unknown": { "mu": 0.8, "drag": 0.01 },
        },
        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 0, 'y': 500 }, 'right': { 'x': 199, 'y': 500 } },
            { 'n': 1, 'left': { 'x': 500, 'y': 0 }, 'right': { 'x': 500, 'y': 185 } },
            { 'n': 2, 'left': { 'x': 1000, 'y': 195 }, 'right': { 'x': 790, 'y': 195 } },
            { 'n': 3, 'left': { 'x': 784, 'y': 357 }, 'right': { 'x': 555, 'y': 357 } },
            { 'n': 4, 'left': { 'x': 1000, 'y': 489 }, 'right': { 'x': 805, 'y': 489 } },
            { 'n': 5, 'left': { 'x': 945, 'y': 630 }, 'right': { 'x': 612, 'y': 630 } },
            { 'n': 6, 'left': { 'x': 800, 'y': 1000 }, 'right': { 'x': 800, 'y': 794 } },
            { 'n': 7, 'left': { 'x': 398, 'y': 369 }, 'right': { 'x': 398, 'y': 189 } },
            { 'n': 8, 'left': { 'x': 258, 'y': 1000 }, 'right': { 'x': 258, 'y': 793 } },
        ]
    },

    ],
}
