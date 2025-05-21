document.getElementById('fileInput').addEventListener('change', function (event) {
    const fileReader = new FileReader();
    fileReader.onload = function (loadEvent) {
        const arrayBuffer = loadEvent.target.result;
        // Convert the DOCX file to HTML using Mammoth
        mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
            .then(function (resultObject) { // Display the converted content
                document.getElementById('displayArea').innerHTML = resultObject.value;
                document.getElementById('displayArea').classList.remove('hidden');


                const scrollSpeed = 5; // px per frame
                const edgeThreshold = 100; // px from top/bottom edge that triggers scrolling
                const screenHeight = window.innerHeight;
                let gazeOverThresholdStart = null;
                const closedEyesThreshold = 3000;

                function onPoint(point, calibration) {
                    point[0]; // x
                    point[1]; // y
                    true; // true - for calibrated data, false if calibration is ongoing
                };

                const gestures = new EyeGestures('video', onPoint);
                // gestures.invisible(); // to disable blue tracker
                gestures.start();
                gestures.on('processKeyPoints', ({ left, top }) => {
                    const now = Date.now();
                    if (document.getElementById("calib_cursor").style.display == "none") {
                        document.getElementById("cursor").style.display = "none";
                        console.log('Event from processKeyPoints:', left, top);

                        //Scroll
                        if (top < edgeThreshold) {
                            // Near top → scroll up
                            window.scrollBy({ top: -scrollSpeed, behavior: 'smooth' });
                        } else if (top > (screenHeight - edgeThreshold)) {
                            // Near bottom → scroll down
                            window.scrollBy({ top: scrollSpeed, behavior: 'smooth' });
                        }

                        //not looking

                        if (left < 0) {
                            if (gazeOverThresholdStart === null) {
                                gazeOverThresholdStart = now;
                            } else if (now - gazeOverThresholdStart >= closedEyesThreshold) {
                                if (!overlayActive) {
                                    overlay.classList.add('active');
                                    overlayActive = true;
                                    gazeOverThresholdStart = null; // Reset so it doesn't keep triggering
                                }
                                else {
                                    alert('Turning off');
                                }
                            }
                        }
                        else {
                            gazeOverThresholdStart = null; // Reset so it doesn't keep triggering
                        }
                    }
                });
            })
            .catch(function (error) {
                console.error("Conversion error: ", error);
            });
    };
    // Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(event.target.files[0]);
    document.querySelector('.upload-button').classList.add('hidden');
});