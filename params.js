export let p = {
    "trackSetup": {
    },
    "draw": {
        "baseLW": 2,
        "lookAhead": 0.5,
        "panSpeed": 0.15,
        "HUDscl": 25,
        "HUDforceScl": .2,
    },
    "version": {
        "n": "flip01",
    },
    "run": {
        "nMax": 10000000,
    },
    "sfcTypes": { //mu = coeff fric multiplier, drag=resistive force coeff
        // "outOfBounds": { "mu": 1.0, "drag": 0.2 },
        "outOfBounds": { "mu": 0.8, "drag": 0.003 },
        "tarmac": { "mu": 0.8, "drag": 0.001 },
        // "tarmac": { "mu": 0.0, "drag": 0.000 },
        "grass": { "mu": 0.3, "drag": 0.02 },
        "mud": { "mu": 0.2, "drag": 0.3 },
        "ice": { "mu": 0.05, "drag": 0.001 },
        "unknown": { "mu": 0.8, "drag": 0.003 },
    },
    "carDesigns":
    {
        'moss': {
            'body': [[0, -0.2], [-.20, -.15], [-0.30, 0], [-0.30, .7], [-0.14, 1.3],
            [0.14, 1.3], [0.30, .7], [0.30, 0], [.20, -.15],],
            'cockpit': [[0, .15], [-.1, .17], [-.2, .25], [-.2, .5],
            [.2, .5], [.2, .25], [.1, .17],],
            'axels': [[0, 0], [-.5, 0], [0.5, 0], [0, 0], [0, 1.0], [-.5, 1], [0.5, 1], [0, 1.0]],
        },
        'wings': {

            'body': [
                [0, 1.5], [-0.4, 1.5], [-0.5, 1.25], [-0.2, 1.25],
                [-0.3, 0.8], [-0.6, 0.7], [-0.6, 0.3], [-0.3, 0.2],
                [-0.2, 0.05], [-0.55, 0.05], [-.6, -0.30],
                [0.6, -0.30], [0.55, 0.05], [0.2, 0.05],
                [0.3, 0.2], [0.6, 0.3], [0.6, 0.7], [0.3, 0.8],
                [0.2, 1.25], [0.5, 1.25], [0.4, 1.5], [0, 1.5]
            ],

            'cockpit': [
                [0, .7], [-.1, .65], [-.2, .50], [-.2, .32],
                [.2, .32], [.2, .50], [.1, .65],
            ],
            'axels': [[0, 0], [-.5, 0], [0.5, 0], [0, 0], [0, 1.0], [-.5, 1], [0.5, 1], [0, 1.0]],
        },

    },
    "cars": [
        {
            "design": 'moss',
            "width": 2,
            "frontLength": 1,
            "rearLength": 2,
            "height": 0.75,
            "wheelWidth": 0.6,
            "wheelAspect": 1.6,
            "mass": 200,
            "momIfac": 1.53846, // moment of intertia over mass
            "steeringRate": 0.1,
            "steeringMaxBase": 25 * Math.PI / 180, //steering lock at 0 speed.
            "steeringUscl": 2, // U scl of steering lock limiting
            "steeringCentreRate": 1,
            "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=agaoinst motion)
            "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD, 0.5 is 4WD
            "thrustRate": 8, // thrust and brake is N, N/s for whole car, not per wheel.
            "thrustMax": 100,
            "brakeRate": 60,
            "brakeMax": 200,
            "brakeFade": 0.5,
            "downforceFade": 0.5,
            "colour": 'gold',
            "mechV": 2,
            "gamma": 12, // time multiplier
            "phys": {
                "hAero": 0.1, //aerodynamic height
                "CL": 0.1, //lift coefficient (downforce)
                "CD": 100, // Surface Drag resistance
                "Crr": 2, // Rolling resistance
                "CA": 0.5, //Air resistance
                "mu": 1.2, // Max lateral friction multiplier, above 1.0 gives "superweight" force.
                "stiffness": 200, // Newtons (lateral friction) per Radian (slip angle)
            },
        },
        {
            "design": 'wings',
            "width": 2,
            "frontLength": 1,
            "rearLength": 2,
            "height": .3,
            "wheelWidth": 0.5,
            "wheelAspect": 2.0,
            "mass": 300.0,
            "momIfac": .5, // moment of intertia ratio to that of point masses at wheels
            "steeringRate": .2,
            "steeringMaxBase": 25 * Math.PI / 180, //steering lock at 0 speed.
            "steeringUscl": 2, // U scl of steering lock limiting
            "steeringCentreRate": 2,
            "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=against motion)
            "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD, 0.5 is 4WD
            "brakeFade": 1.0,
            "downforceFade":0.1,
            "thrustRate": 300,// thrust and brake is N, N/s for whole car, not per wheel.
            "thrustMax": 500,
            "brakeRate": 8000,
            "brakeMax": 2000,
            "colour": 'gold',
            "mechV": 3,
            "gamma": 10, // time multiplier
            "phys": {
                "alpha0": 10, // max force slip angle
                "hAero": 0.8, //aerodynamic height
                "CA": 1.0, //Air resistance
                "CL": 1.0, //lift coefficient (downforce),frac of air drag acting downwards
                "CD": 200.0, // Surface Drag resistance
                "Crr": 0.005, // Rolling resistance
                "mu": 0.6, // coeff of friction for lateral forces
                "stiffness": 10, // Newtons (lateral friction) per Radian (slip angle)
            },
        },
    ],
    "car": '', // chosen from cars by sessionSetter
    "track": '', // chosen from tracks by sessionSetter
}
