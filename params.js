export let p = {
    "car": {
        "width": 2,
        "height": 3,
        "wheelWidth": 0.4,
        "wheelAspect": 2,
        "oversize": 1.2,
        "bodyAspect": 1.2,
        "mass": 200,
        "momIfac": 10, // moment of intertia over mass
        "steeringRate": 0.1,
        "steeringMaxBase": 35 * Math.PI / 180, //steering lock at 0 speed.
        "steeringUscl" : 2, // U scl of steering lock limiting
        "steeringCentreRate" : 1,
        "steeringFollow" : 0, //steering relaxes to motion direction
        "torqueRate" : 2,
        "torqueMax" : 10,
        "brakeMax" : 30,
        "brakeRate" : 10,
    },
    "run": {
        "dt": 0.2,
        "nMax": 10000,
    },
    "phys": {
        "CD": 100,
        "Crr": 2,
        "CA": 0.5,
        "F_lat": 30,
        "stiffness": 250,
    },
    "track": {
        "metresPerPix": 0.25,
        "sfcTypes": {
            "outOfBounds": { "mu": 1.0, "drag": 0.2 },
            "tarmac": { "mu": 0.8, "drag": 0.001 },
            "grass": { "mu": 0.3, "drag": 0.02 },
            "mud": { "mu": 0.2, "drag": 0.3 },
            "unknown": { "mu": 0.8, "drag": 0.01 },
        }
    },
    "draw": {
        "baseLW": 2,
        "pixPerMetre": 12,
        "lookAhead": 0.333,
        "panSpeed": 0.2,

    }
}
