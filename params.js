export let p = {
    "trackSetup": {
        "metresPerPix": 0.35,
        "reverse": false,
        "flipX": false,
        "flipY": false,
    },
    "draw": {
        "pixPerMetre": 10,
        "baseLW": 2,
        "lookAhead": .5,
        "panSpeed": 0.15,
        "zoom": 1.0,
        "HUDscl": 25,
        "HUDforceScl": 12,
    },
    "version": {
        "n": "flip01",
    },
    "run": {
        "nMax": 10000000,
    },
    "sfcTypes": { //mu = coeff fric multiplier, drag=resistive force coeff
        "outOfBounds": { "mu": 1.0, "drag": 0.2 },
        "tarmac": { "mu": 0.8, "drag": 0.001 },
        "grass": { "mu": 0.3, "drag": 0.02 },
        "mud": { "mu": 0.2, "drag": 0.3 },
        "ice": { "mu": 0.05, "drag": 0.001 },
        "unknown": { "mu": 0.8, "drag": 0.01 },
    },
    "tracks": [
        {
            "fnames": ['tracks/square_track.png'],
            "bgColour": "#381b00",
            "drawScale": 1,
            "trackScale": 1.0,

            "x": 1000, // size, helpful for setting params before img loaded
            "y": 1000,

            "startTheta": -.10,
            "startX": 180,
            "startY": 260,

            "startThetaRev": Math.PI,
            "startXRev": 180,
            "startYRev": 720,

            "gates": [ // in track pixels
                { 'n': 0, 'left': { 'x': 250, 'y': 500 }, 'right': { 'x': 70, 'y': 500 } },
                { 'n': 1, 'left': { 'x': 700, 'y': 500 }, 'right': { 'x': 1000, 'y': 500 } },
                { 'n': 2, 'left': { 'x': 450, 'y': 770 }, 'right': { 'x': 450, 'y': 580 } },
                { 'n': 3, 'left': { 'x': 330, 'y': 250 }, 'right': { 'x': 330, 'y': 0 } },
            ]
        },
        {
            "fnames": ['tracks/square_track3_mark.png'],
            "bgColour": "#462402",
            "drawScale": 0.6,
            "trackScale": 1.6,
            "x": 1000, // size, helpful for setting params before img loaded
            "y": 1000,

            "startTheta": 1.4,
            "startX": 240,
            "startY": 60,

            "startThetaRev": -1.6,
            "startXRev": 800,
            "startYRev": 136,

            "gates": [ // in track pixels
                { 'n': 0, 'left': { 'x': 433, 'y': 33 }, 'right': { 'x': 423, 'y': 130 } },
                { 'n': 1, 'left': { 'x': 546, 'y': 504 }, 'right': { 'x': 594, 'y': 417 } },
                { 'n': 2, 'left': { 'x': 367, 'y': 553 }, 'right': { 'x': 265, 'y': 567 } },
                { 'n': 3, 'left': { 'x': 669, 'y': 970 }, 'right': { 'x': 651, 'y': 868 } },
                { 'n': 4, 'left': { 'x': 112, 'y': 267 }, 'right': { 'x': 171, 'y': 181 } },
            ]
        },
        {
            "fnames": ['tracks/square_track2_allpath.png'],
            "bgColour": "#381b00",
            "drawScale": 0.8,
            "trackScale": 1.0,
            "x": 1000, // size, helpful for setting params before img loaded
            "y": 1000,

            "startTheta": 3.3,
            "startX": 140,
            "startY": 840,

            "startThetaRev": -0.4,
            "startXRev": 180,
            "startYRev": 200,

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
            "drawScale": 0.7,
            "trackScale": 1.0,
            "x": 1000, // size, helpful for setting params before img loaded
            "y": 1000,

            "startTheta": 3.141,
            "startX": 180,
            "startY": 840,

            "startThetaRev": 0,
            "startXRev": 180,
            "startYRev": 200,

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
        {
            "fnames": ['tracks/spiralator-0.png', 'tracks/spiralator-1.png'],
            "bgColour": "#4c0f00",
            "drawScale": 0.6,
            "trackScale": 2.0,
            "x": 1000, // size, helpful for setting params before img loaded
            "y": 1000,

            "startTheta": 4.9,
            "startX": 470,
            "startY": 720,

            "startThetaRev": 1,
            "startXRev": 88,
            "startYRev": 658,

            "gates": [ // in track pixels
                { 'n': 0, 'left': { 'x': 246, 'y': 784 }, 'right': { 'x': 275, 'y': 662 } },
                { 'n': 1, 'left': { 'x': 0, 'y': 660 }, 'right': { 'x': 163, 'y': 627 } },
                { 'n': 2, 'left': { 'x': 211, 'y': 449 }, 'right': { 'x': 356, 'y': 541 } },
                { 'n': 3, 'left': { 'x': 337, 'y': 0 }, 'right': { 'x': 371, 'y': 163 } },
                { 'n': 4, 'left': { 'x': 550, 'y': 210 }, 'right': { 'x': 459, 'y': 355 } },
                { 'n': 5, 'left': { 'x': 1000, 'y': 335 }, 'right': { 'x': 836, 'y': 371 } },
                { 'n': 6, 'left': { 'x': 789, 'y': 550 }, 'right': { 'x': 644, 'y': 459 } },
                { 'n': 7, 'left': { 'x': 662, 'y': 1000 }, 'right': { 'x': 628, 'y': 836 } },
                { 'n': 8, 'left': { 'x': 449, 'y': 789 }, 'right': { 'x': 541, 'y': 644 } },
            ]
        },

    ],
    "cars": [
        {
            "width": 2,
            "frontLength": 1,
            "rearLength": 2,
            "height": 0.75,
            "wheelWidth": 0.6,
            "wheelAspect": 1.6,
            "mass": 200,
            "momIfac": 1.53846, // moment of intertia over mass
            "steeringRate": 0.1,
            "steeringMaxBase": 45 * Math.PI / 180, //steering lock at 0 speed.
            "steeringUscl": 5, // U scl of steering lock limiting
            "steeringCentreRate": 1,
            "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=agaoinst motion)
            "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD, 0.5 is 4WD
            "torqueRate": 4,
            "torqueMax": 50,
            "brakeRate": 30,
            "brakeMax": 50,
            "colour": 'gold',
            "gamma": 12, // time multiplier
            "phys": {
                "CD": 100, // Surface Drag resistance
                "Crr": 2, // Rolling resistance
                "CA": 0.5, //Air resistance
                "mu": 1.2, // Max lateral friction multiplier, above 1.0 gives "superweight" force.
                "stiffness": 200, // Newtons (lateral friction) per Radian (slip angle)
            },
        },
        // {
        //     "width": .3,
        //     "frontLength": .3,
        //     "rearLength": .2,
        //     "height": 0.01,
        //     "wheelWidth": 0.1,
        //     "wheelAspect": 1.6,
        //     "mass": 1,
        //     "momIfac": .3, // moment of intertia ratio to that of point masses at wheels
        //     "steeringRate": 1,
        //     "steeringMaxBase": 45 * Math.PI / 180, //steering lock at 0 speed.
        //     "steeringUscl": 5, // U scl of steering lock limiting
        //     "steeringCentreRate": 1,
        //     "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=agaoinst motion)
        //     "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD, 0.5 is 4WD
        //     "torqueRate": 4,
        //     "torqueMax": 5,
        //     "brakeRate": 30,
        //     "brakeMax": 5,
        //     "colour": 'gold',
        //     "gamma": 1, // time multiplier
        //     "phys": {
        //         "CD": 50, // Surface Drag resistance
        //         "Crr": .2, // Rolling resistance
        //         "CA": 0.1, //Air resistance
        //         "mu": 1.2, // coeff of friction for lateral forces
        //         "stiffness": 20, // Newtons (lateral friction) per Radian (slip angle)
        //     },
        // },
    ],
    "car": '', // chosen from cars by sessionSetter
    "track": '', // chosen from tracks by sessionSetter
}
