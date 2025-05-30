/*
EyeGesturesLite License

Copyright (c) 2024 Piotr Walas

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to use the Software in personal and commercial projects, subject to the following conditions:

Attribution: 
The EyeGesturesLite logo must be prominently displayed in all projects or products that use this Software.

No Warranty: 
The Software is provided "as is", without warranty of any kind, express or implied,
including but not limited to the warranties of merchantability, 
fitness for a particular purpose, and noninfringement. 
In no event shall the authors or copyright holders be liable for any claim, 
damages, or other liability, whether in an action of contract, tort, 
or otherwise, arising from, out of, or in connection with 
the Software or the use or other dealings in the Software.
*/

const euclideanDistance = (t, s) => Math.sqrt(t.reduce((t, e, i) => t + Math.pow(e - s[i], 2), 0));
class Calibrator {
    static PRECISION_LIMIT = 50;
    static PRECISION_STEP = 10;
    static ACCEPTANCE_RADIUS = 500;
    constructor(t = 1e3) {
        (this.X = []),
            (this.__tmp_X = []),
            (this.Y_y = []),
            (this.Y_x = []),
            (this.__tmp_Y_y = []),
            (this.__tmp_Y_x = []),
            (this.reg = null),
            (this.reg_x = null),
            (this.reg_y = null),
            (this.currentAlgorithm = "MLR"),
            (this.fitted = !1),
            (this.cvNotSet = !0),
            (this.matrix = new CalibrationMatrix()),
            (this.precisionLimit = Calibrator.PRECISION_LIMIT),
            (this.precisionStep = Calibrator.PRECISION_STEP),
            (this.acceptanceRadius = Math.floor(t / 2)),
            (this.calibrationRadius = Math.floor(t));
    }
    add(t, e) {
        t = [].concat(t.flat());
        this.__tmp_X.push(t),
            this.__tmp_Y_y.push([e[0]]),
            this.__tmp_Y_x.push([e[1]]),
            40 < this.__tmp_Y_y.length && (this.__tmp_Y_y.shift(), this.__tmp_Y_x.shift(), this.__tmp_X.shift()),
            (this.reg_x = new ML.MultivariateLinearRegression([].concat(this.__tmp_X, this.X), [].concat(this.__tmp_Y_y, this.Y_y))),
            (this.reg_y = new ML.MultivariateLinearRegression([].concat(this.__tmp_X, this.X), [].concat(this.__tmp_Y_x, this.Y_x))),
            (this.fitted = !0);
    }
    predict(t) {
        return this.fitted ? ((t = [].concat(t.flat())), [this.reg_x.predict(t)[0], this.reg_y.predict(t)[0]]) : [0, 0];
    }
    movePoint() {
        this.matrix.movePoint(), (this.Y_y = this.Y_y.concat(this.__tmp_Y_y)), (this.Y_x = this.Y_x.concat(this.__tmp_Y_x)), (this.X = this.X.concat(this.__tmp_X)), (this.__tmp_X = []), (this.__tmp_Y_y = []), (this.__tmp_Y_x = []);
    }
    getCurrentPoint(t, e) {
        return this.matrix.getCurrentPoint(t, e);
    }
    updMatrix(t) {
        return this.matrix.updMatrix(t);
    }
    unfit() {
        (this.acceptanceRadius = Calibrator.ACCEPTANCE_RADIUS), (this.calibrationRadius = this.calibrationRadius), (this.fitted = !1), (this.Y_y = []), (this.Y_x = []), (this.X = []);
    }
}
class CalibrationMatrix {
    constructor() {
        (this.iterator = 0),
            (this.points = [
                [0.25, 0.25],
                [0.5, 0.75],
                [1, 0.5],
                [0.75, 0.5],
                [0, 0.75],
                [0.5, 0.5],
                [1, 0.25],
                [0.75, 0],
                [0.25, 0.5],
                [0.5, 0],
                [0, 0.5],
                [1, 1],
                [0.75, 1],
                [0.25, 0],
                [1, 0],
                [0, 1],
                [0.25, 1],
                [0.75, 0.75],
                [0.5, 0.25],
                [0, 0.25],
                [1, 0.5],
                [0.75, 0.25],
                [0.5, 1],
                [0.25, 0.75],
                [0, 0],
            ]);
    }
    updMatrix(t) {
        (this.points = t), (this.iterator = 0);
    }
    movePoint() {
        this.iterator = (this.iterator + 1) % this.points.length;
    }
    getCurrentPoint(t = 1, e = 1) {
        var i = this.points[this.iterator];
        return [i[0] * t, i[1] * e];
    }
}
class EyeGestures {
    constructor(t, e) {
        this._listeners = {}; // <- For custom events
        var i = document.createElement("div"),
            i = ((i.id = "cursor"), (i.style.display = "None"), document.body.appendChild(i), document.createElement("div")),
            s = ((i.id = "calib_cursor"), (i.style.display = "None"), document.createElement("div")),
            a =
                ((s.id = "logoDivEyeGestures"),
                (s.style.width = "200px"),
                (s.style.height = "60px"),
                (s.style.position = "fixed"),
                (s.style.bottom = "10px"),
                (s.style.right = "10px"),
                (s.style.zIndex = "9999"),
                (s.style.background = "black"),
                (s.style.borderRadius = "10px"),
                (s.style.display = "none"),
                (s.onclick = function () {
                    window.location.href = "https://eyegestures.com/";
                }),
                document.createElement("div")),
            a = ((a.style.margin = "10px"), (a.innerHTML = '<img src="https://eyegestures.com/logoEyeGesturesNew.png" alt="Logo" width="120px">'), s.appendChild(a), document.createElement("canvas"));
        (a.id = "output_canvas"),
            (a.width = "50"),
            (a.height = "50"),
            (a.style.margin = "5px"),
            (a.style.borderRadius = "10px"),
            (a.style.border = "none"),
            (a.style.background = "#222"),
            s.appendChild(a),
            document.body.appendChild(s),
            document.body.appendChild(i),
            (this.calibrator = new Calibrator()),
            (this.screen_width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)),
            (this.screen_height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)),
            (this.prev_calib = [0, 0]),
            (this.head_starting_pos = [0, 0]),
            (this.calib_counter = 0),
            (this.calib_max = 5),
            (this.counter = 0),
            (this.collected_points = 0),
            (this.buffor = []),
            (this.buffor_max = 20),
            (this.start_width = 0),
            (this.start_height = 0),
            (this.onGaze = e),
            (this.run = !1),
            (this.__invisible = !1),
            window.isSecureContext ? this.init(t) : console.error("This application requires a secure context (HTTPS or localhost)");
    }
    on(event, callback) {
    if (!this._listeners[event]) {
        this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
}

emit(event, data) {
    if (this._listeners[event]) {
        this._listeners[event].forEach(callback => callback(data));
    }
}
    showCalibrationInstructions(t) {
        const e = document.createElement("div");
        (e.id = "calibrationOverlay"),
            (e.style.position = "fixed"),
            (e.style.top = "0"),
            (e.style.left = "0"),
            (e.style.width = "100vw"),
            (e.style.height = "100vh"),
            (e.style.backgroundColor = "rgba(0, 0, 0, 0.9)"),
            (e.style.display = "flex"),
            (e.style.justifyContent = "center"),
            (e.style.alignItems = "center"),
            (e.style.zIndex = "1000");
        var i = document.createElement("div"),
            s = ((i.style.textAlign = "center"), (i.style.color = "#fff"), (i.style.fontFamily = "Arial, sans-serif"), document.createElement("h3")),
            a = ((s.textContent = ""), (s.style.fontSize = "1.5rem"), (s.style.marginBottom = "20px"), document.createElement("p")),
            r = ((a.innerHTML = 'To calibrate properly you need to gaze on <span style="color: #ff5757; font-weight: bold;"> red circles</span>.'), (a.style.marginBottom = "20px"), document.createElement("p")),
            n =
                ((r.innerHTML = 'The <span style="color: #5e17eb; font-weight: bold;">blue circle</span> is your estimated gaze. With every calibration point, the tracker will gradually listen more and more to your gaze.'),
                (r.style.marginBottom = "20px"),
                document.createElement("button"));
        (n.textContent = "Continue"),
            (n.style.padding = "10px 20px"),
            (n.style.fontSize = "1rem"),
            (n.style.border = "none"),
            (n.style.borderRadius = "5px"),
            (n.style.backgroundColor = "#5e17eb"),
            (n.style.color = "#fff"),
            (n.style.cursor = "pointer"),
            n.addEventListener("click", () => {
                document.body.removeChild(e), t();
            }),
            i.appendChild(s),
            i.appendChild(a),
            i.appendChild(r),
            i.appendChild(n),
            e.appendChild(i),
            document.body.appendChild(e),
            setTimeout(() => {
                document.body.removeChild(e), t();
            }, 15e3);
    }
    updateStatus(t) {
        document.getElementById("status").textContent = t;
    }
    showError(t) {
        var e = document.getElementById("error");
        (e.textContent = t), (e.style.display = "block");
    }
    loadScript(s) {
        return new Promise((t, e) => {
            var i = document.createElement("script");
            (i.src = s), (i.onload = t), (i.onerror = e), document.head.appendChild(i);
        });
    }
    async init(t) {
        try {
            if (
                (this.updateStatus("Loading MediaPipe library..."),
                await this.loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js"),
                await this.loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js"),
                this.updateStatus("MediaPipe library loaded, initializing..."),
                "undefined" == typeof FaceMesh)
            )
                throw new Error("FaceMesh is not defined. Library not loaded correctly.");
            await this.setupMediaPipe(t);
        } catch (t) {
            console.error("Initialization error:", t), this.showError("Initialization error: " + t.message);
        }
    }
    async setupMediaPipe(t) {
        try {
            const a = new FaceMesh({ locateFile: (t) => (console.log("Loading file:", t), "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/" + t) });
            a.setOptions({ maxNumFaces: 1, refineLandmarks: !0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 }),
                await a.initialize(),
                this.updateStatus("FaceMesh initialized successfully"),
                a.onResults(this.onFaceMeshResults.bind(this));
            var e = await navigator.mediaDevices.getUserMedia({ video: {} });
            const i = document.getElementById(t);
            async function s() {
                var t = document.getElementById("video");
                if (t.readyState === t.HAVE_ENOUGH_DATA) {
                    var e = document.getElementById("output_canvas"),
                        i = e.getContext("2d");
                    try {
                        i.save(), i.scale(-1, 1), i.translate(-e.width, 0), a.send({ image: t }), i.restore();
                    } catch (t) {
                        console.error("Error processing frame:", t), showError("Error processing frame: " + t.message);
                    }
                }
                requestAnimationFrame(s);
            }
            (i.srcObject = e),
                (i.onloadeddata = () => {
                    this.updateStatus("Video stream started"), i.play(), requestAnimationFrame(s);
                });
        } catch (t) {
            console.error("Error initializing MediaPipe:", t), showError("Error initializing MediaPipe: " + t.message);
        }
    }
    onFaceMeshResults(t) {
        var s = [33, 133, 160, 159, 158, 157, 173, 155, 154, 153, 144, 145, 153, 246, 468],
            a = [362, 263, 387, 386, 385, 384, 398, 382, 381, 380, 374, 373, 374, 466, 473];
        let r = 0,
            n = 0,
            o,
            h,
            l = 0,
            c = 0,
            d = [],
            p = [];
        if (t.multiFaceLandmarks && this.run) {
            const y = document.getElementById("output_canvas"),
                g = y.getContext("2d");
            g.clearRect(0, 0, y.width, y.height);
            for (var u of t.multiFaceLandmarks) {
                (r = u[0].x),
                    (n = u[1].y),
                    u.forEach((t) => {
                        (r = Math.min(r, t.x)), (n = Math.min(n, t.y)), (l = Math.max(l, t.x)), (c = Math.max(c, t.y));
                    }),
                    (o = l - r),
                    (h = c - n),
                    this.start_width * this.start_height == 0 && ((this.start_width = o), (this.start_height = h));
                let e = o / this.start_width,
                    i = h / this.start_height;
                var _ = s.map((t) => u[t]),
                    m = a.map((t) => u[t]);
                (g.fillStyle = "#ff5757"),
                    _.forEach((t) => {
                        d.push([((t.x - r) / o) * e, ((t.y - n) / h) * i]), g.beginPath(), g.arc(t.x * y.width, t.y * y.height, 3, 0, 2 * Math.PI), g.fill();
                    }),
                    (g.fillStyle = "#5e17eb"),
                    m.forEach((t) => {
                        p.push([((t.x - r) / o) * e, ((t.y - n) / h) * i]), g.beginPath(), g.arc(t.x * y.width, t.y * y.height, 3, 0, 2 * Math.PI), g.fill();
                    }),
                    this.processKeyPoints(d, p, r * e, n * e, e, i, o, h);
            }
        }
    }
    processKeyPoints(t, e, i, s, a, r, n, o) {
        let h = t;
        (h = (h = (h = h.concat(e)).concat([[a, r]])).concat([[n, o]])),
            0 == this.head_starting_pos[0] && 0 == this.head_starting_pos[1] && ((this.head_starting_pos[0] = i), (this.head_starting_pos[1] = s)),
            (h = h.concat([[i - this.head_starting_pos[0], s - this.head_starting_pos[1]]]));
        (t = this.calib_counter < this.calib_max), (e = this.calibrator.predict(h));
        this.buffor.push(e), this.buffor_max < this.buffor.length && this.buffor.shift();
        let l = [0, 0];
        (e = l = 0 < this.buffor.length ? this.buffor.reduce((t, e) => [t[0] + e[0], t[1] + e[1]], [0, 0]).map((t) => t / this.buffor.length) : l),
            t
                ? ((a = this.calibrator.getCurrentPoint(this.screen_width, this.screen_height)),
                  this.calibrator.add(h, a),
                  euclideanDistance(e, a) < 0.1 * this.screen_width && 5 < this.counter ? (this.calibrator.movePoint(), (this.counter = 0)) : euclideanDistance(e, a) < 0.1 * this.screen_width && (this.counter = this.counter + 1),
                  (this.prev_calib[0] == a[0] && this.prev_calib[1] == a[1]) || ((this.prev_calib = a), (this.calib_counter = this.calib_counter + 1)))
                : (document.getElementById("calib_cursor").style.display = "None");
        (r = document.getElementById("cursor")),
            (n = Math.min(Math.max(e[0], 0), this.screen_width)),
            (o = Math.min(Math.max(e[1], 0), this.screen_height)),
            (r.style.left = n - 25 + "px"),
            (r.style.top = o - 25 + "px"),
            (i = document.getElementById("calib_cursor"));
        (i.style.left = this.prev_calib[0] - 100 + "px"), (i.style.top = this.prev_calib[1] - 100 + "px"), this.onGaze(e, t);
        console.log(r.style.left, r.style.top)
        this.emit('processKeyPoints', { left: n-25, top: o-25 });

    }
    __run() {
        this.run = !0;
    }
    start() {
        //(document.getElementById("logoDivEyeGestures").style.display = "flex"),
            this.showCalibrationInstructions(this.__run.bind(this)),
            this.__invisible || (document.getElementById("cursor").style.display = "block"),
            (document.getElementById("calib_cursor").style.display = "block");
    }
    invisible() {
        (this.__invisible = !0), (document.getElementById("cursor").style.display = "none");
    }
    visible() {
        (this.__invisible = !1), (document.getElementById("cursor").style.display = "block");
    }
    stop() {
        (this.run = !1), console.log("stop");
    }
    recalibrate() {
        this.calibrator.unfit(), (this.calib_counter = 0);
    }
}