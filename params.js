export let p = {
    "trackSetup": {
    },
    "draw": {
        "baseLW": 2,
        "lookAhead": 0.5,
        "panSpeed": 0.15,
        "HUDscl": 25,
        "HUDforceScl": 50,
    },
    "version": {
        "n": "flip01",
    },
    "run": {
        "nMax": 10000000,
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
            "steeringMaxBase": 45 * Math.PI / 180, //steering lock at 0 speed.
            "steeringUscl": 5, // U scl of steering lock limiting
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
            "sfcTypes": { //mu = coeff fric multiplier, drag=resistive force coeff
                "outOfBounds": { "mu": 0.8, "drag": 0.003 },
                "tarmac": { "mu": 0.8, "drag": 0.001 },
                "grass": { "mu": 0.3, "drag": 0.02 },
                "mud": { "mu": 0.2, "drag": 0.3 },
                "ice": { "mu": 0.05, "drag": 0.001 },
                "unknown": { "mu": 0.8, "drag": 0.003 },
            },
        },
 {
            "design": 'wings',
            "mechV": 3,
            "width": .06,
            "frontLength": .035,
            "rearLength": .035,
            "height": .00,
            "wheelWidth": 0.015,
            "wheelAspect": 2.0,
            "mass": 0.5,
            "momIfac": .3, // moment of inertia ratio to that of point masses at wheels
            "steeringRate": 2,
            "steeringMaxBase": 35 * Math.PI / 180, //steering lock at 0 speed.
            "steeringUscl": 0.20, // U scl of steering lock limiting (half-lock speed)
            "steeringCentreRate": 20,
            "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=against motion)
            "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD, 0.5 is 4WD
            "brakeFade": 0.5,
            "downforceFade":0.5,
            "thrustRate": 4,// thrust and brake is N, N/s for whole car, not per wheel.
            "thrustMax": 1.6,
            "brakeRate": 2,
            "brakeMax": 5,
            "colour": 'gold',
           
            "gamma": 1.0, // time multiplier
            "phys": {
                "alpha0": 30, // max force slip angle
                "hAero": 0.02, //aerodynamic height
                "CA": 50.0, //Air resistance constant
                "CL": 1.0, //lift coefficient (downforce), frac of air drag acting downwards
                "CD": 0.8, // Max Surface Drag resistance
                "Crr": 0.3, // Rolling resistance - N / kg / wheel
                "mu": 1.0, // coeff of friction for sfc forces  
            },
            "sfcTypes": { //mu = coeff fric multiplier, drag=resistive force coeff
                "tarmac": { "mu": 1.00, "drag": 0.00 },
                 "grass": { "mu": 0.7, "drag": 0.0 },
                "mud": { "mu": 0.5, "drag": 1.0 },
				"outOfBounds": { "mu": 1.0, "drag": 0.00 },
				"unknown": { "mu": 1.0, "drag": 0.00 },
				// "ice": { "mu": 1.0, "drag": 0.000 },
    },
        },
    ],
    "car": '', // chosen from cars by sessionSetter
    "track": '', // chosen from tracks by sessionSetter
}
