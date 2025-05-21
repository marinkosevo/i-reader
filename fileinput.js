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
                const edgeThreshold = 200; // px from top/bottom edge that triggers scrolling
                const screenHeight = window.innerHeight;

                function onPoint(point, calibration) {
                    point[0]; // x
                    point[1]; // y
                    true; // true - for calibrated data, false if calibration is ongoing
                };

                const gestures = new EyeGestures('video', onPoint);
                // gestures.invisible(); // to disable blue tracker
                gestures.start();
                gestures.on('processKeyPoints', ({ left, top }) => {
                    console.log('Event from processKeyPoints:', left, top);

                    if (top < edgeThreshold) {
                        // Near top → scroll up
                        window.scrollBy({ top: -scrollSpeed, behavior: 'smooth' });
                    } else if (top > (screenHeight - edgeThreshold)) {
                        // Near bottom → scroll down
                        window.scrollBy({ top: scrollSpeed, behavior: 'smooth' });
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