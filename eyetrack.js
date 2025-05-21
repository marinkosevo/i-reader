// CONFIG
const scrollSpeed = 5; // px per frame
const edgeThreshold = 110; // px from top/bottom edge that triggers scrolling
const overlay = document.getElementById('popupOverlay');
let gazeOverThresholdStart = null;
let focunButtonOverThreshold = null;
let summaryButtonOverThreshold = null;
let summarizeClicked = false;

let overlayActive = false
// Simulated function to be called with eye tracker data
function onEyeData(GazeData) {
    const closedEyesThreshold = 3000;
    const turnOffThreshold = 3000;
    const buttonPressThreshold = 1000;
    const focusBtnThreshold = -100;
    const summaryBtnThreshold = 800;
    const now = Date.now();
    let eyeY = GazeData.GazeY;
    const screenHeight = window.innerHeight;
    if (GazeData.state == 1) {
        //console.log(GazeData
        if (!overlayActive) {
            if (eyeY < edgeThreshold) {
                // Near top → scroll up
                window.scrollBy({ top: -scrollSpeed, behavior: 'smooth' });
            } else if (eyeY > (screenHeight - edgeThreshold)) {
                // Near bottom → scroll down
                window.scrollBy({ top: scrollSpeed, behavior: 'smooth' });
            }
        }
        else {
            console.log(GazeData);

            if (GazeData.GazeX < focusBtnThreshold) {
                console.log("focus button");
                if (focunButtonOverThreshold === null) {
                    focunButtonOverThreshold = now;
                } else if (now - focunButtonOverThreshold >= buttonPressThreshold) {
                    //alert('focus button pressed');
                    document.getElementById("focusBtn").click();

                    focunButtonOverThreshold = null; // Reset so it doesn't keep triggering
                }
            }
            else {
                focunButtonOverThreshold = null; // Reset so it doesn't keep triggering
            }

            //Summary btn
            if (GazeData.GazeX > summaryBtnThreshold) {
                console.log("summary button");
                if (summaryButtonOverThreshold === null) {
                    summaryButtonOverThreshold = now;
                } else if (now - summaryButtonOverThreshold >= buttonPressThreshold) {
                    // alert('summary button pressed');
                    document.getElementById("summarizeBtn").click();

                    summaryButtonOverThreshold = null; // Reset so it doesn't keep triggering
                }
            }
            else {
                summaryButtonOverThreshold = null; // Reset so it doesn't keep triggering
            }


        }
    }
    //overlay
    let turnedOff = false;
    if (GazeData.state == -1) {
        console.log("not looking");
        if (gazeOverThresholdStart === null) {
            gazeOverThresholdStart = now;
        } else if (now - gazeOverThresholdStart >= closedEyesThreshold) {
            if (!overlayActive) {
                overlay.classList.add('active');
                overlayActive = true;
                gazeOverThresholdStart = null; // Reset so it doesn't keep triggering
            }
            else {
                if(!turnedOff){
                    turnedOff = true;
                    alert('Turning off');
                }
            }
        }
    }
    else {
        gazeOverThresholdStart = null; // Reset so it doesn't keep triggering
    }
}

//summarize
document.getElementById("summarizeBtn").onclick = async () => {
    if (!summarizeClicked) {
        summarizeClicked = true;
        document.getElementById('loader').style.display = 'block';
        document.getElementById('buttons').style.display = 'none';
        document.getElementById("summarizeBtn").classList.add('active');
        setTimeout(() => {
            document.getElementById("summarizeBtn").classList.remove('active');
        }, 100); // 1000ms = 1 second
        const inputText = document.getElementById("displayArea").innerHTML;
        const summary = await summarizeText(inputText);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('summaryOutput').textContent = summary;
        console.log("Summary: " + summary);
    }
};

//focus
document.getElementById("focusBtn").addEventListener("click", function () {
    alert('Focus button clicked');
});
const summarizeText = async (inputText) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer "
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant that summarizes text." },
                { role: "user", content: `Summarize this: ${inputText}` }
            ],
            temperature: 0.7
        }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
};

// Simulate receiving eye data from an eye tracker every 100ms
// Replace this with your real eye tracker callback

GazeCloudAPI.OnResult = function (GazeData) {
    onEyeData(GazeData);
}
// Close popup if click outside the popup content
overlay.addEventListener('click', e => {
    if (e.target === overlay) {
        GazeCloudAPI.StartEyeTracking()
        overlay.classList.remove('active');
    }
});
