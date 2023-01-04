export let p = {
    "car": {
        "width": 2,
        "frontLength":1,
        "rearLength":2,
        "height": 0.75,
        "wheelWidth": 0.4,
        "wheelAspect": 2,
        "oversize": 0.2,
        "bodyAspect": 0.25,
        "mass": 200,
        "momIfac": 5, // moment of intertia over mass
        "steeringRate": 0.1,
        "steeringMaxBase": 45 * Math.PI / 180, //steering lock at 0 speed.
        "steeringUscl": 5, // U scl of steering lock limiting
        "steeringCentreRate": 1,
        "steeringFollow": 0, //steering relaxation target (0=car,1=motion,-1=agaoinst motion)
        "fade": 0.5, // fraction of power to rear wheels, i.e. 0 is FWD, 1 is RWD.
        "torqueRate": 2,
        "torqueMax": 50,
        "brakeMax": 30,
        "brakeRate": 10,
    },
    "run": {
        "dt": 0.2,
        "nMax": 100000,
    },
    "phys": {
        "CD": 100,
        "Crr": 2,
        "CA": 0.5,
        "F_lat": 50,
        "stiffness": 500,
    },
    "track": {
        "startX":200,
        "startY":200,
        "metresPerPix": 0.35,
        "sfcTypes": {
            "outOfBounds": { "mu": 1.0, "drag": 0.2 },
            "tarmac": { "mu": 0.8, "drag": 0.001 },
            "grass": { "mu": 0.3, "drag": 0.02 },
            "mud": { "mu": 0.2, "drag": 0.3 },
            "unknown": { "mu": 0.8, "drag": 0.01 },
        }
    },
    "draw": {
        "pixPerMetre": 8,
        "baseLW": 2,
        "lookAhead": 5.0,
        "panSpeed": 0.15,
        "zoom": 1.0,
    }
}
