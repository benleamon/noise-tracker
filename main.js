// Create the data log
const data = [];

// set the reference sound pressure level or power level used for calibration (in dB SPL or dBm)
const referenceLevel = 94; // example: 94 dB SPL

// calculate the adjustment factor based on the reference level
const adjustmentFactor = Math.pow(10, (referenceLevel - 94) / 20);

// define global variables for the media stream and script processor
let mediaStream = null;
let scriptProcessor = null;

// define an asynchronous function to start the audio stream and analyze the data
async function startAudioAnalysis() {
  // get the audio input from the built-in microphone
  const audioContext = new AudioContext();
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(mediaStream);

  // create a script processor to analyze the audio data
  scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
  scriptProcessor.onaudioprocess = function(event) {
    // get the audio data from the input buffer
    const inputBuffer = event.inputBuffer.getChannelData(0);

    // calculate the RMS amplitude of the audio data
    let rms = 0;
    for (let i = 0; i < inputBuffer.length; i++) {
      rms += inputBuffer[i] * inputBuffer[i];
    }
    rms = Math.sqrt(rms / inputBuffer.length);

    // calculate the decibel level relative to the reference level
    const decibels = 20 * Math.log10(rms / adjustmentFactor);

    // format the raw data
    let formattedDecibels = decibels.toFixed(1);

    // display the decibel level
    console.log("Decibel level: " + formattedDecibels + " dB");
    
    //display raw data on the page 
    updateDb(formattedDecibels);

    // log the data 
    logData(formattedDecibels);
  };

  // connect the audio source to the script processor and start the audio stream
  source.connect(scriptProcessor);
  scriptProcessor.connect(audioContext.destination);
}

// Update the text showing the current decibel level on the web page
function updateDb(rawdb){
  document.getElementById("db-label").innerHTML = rawdb;
}

// Save current decibel value to data
function logData(rawdb){
  data.push(rawdb);
}

// Export the data to a new page
function exportData(data){
  var list = data;
  var listContents ="";
  for (var i = 0; i < list.length; i++){
    listContents += list[i] + "\n";
  }
  var newWindow = window.open();
  newWindow.document.write("<pre>" + listContents + "</pre>");
}

// Stop the function 
function stopAudioAnalysis() {
  if (scriptProcessor) {
    scriptProcessor.onaudioprocess = null; // remove the onaudioprocess callback
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
}

//Reset Data
function resetData() {
  data.length = 0;
  document.getElementById("db-label").innerHTML = "0"
}

//Buttons
document.getElementById("export-button").addEventListener("click", function() {
  exportData(data);
});

document.getElementById("start-button").addEventListener("click", function() {
  startAudioAnalysis();
});

document.getElementById("stop-button").addEventListener("click", function() {
  stopAudioAnalysis();
});

document.getElementById("data-reset-button").addEventListener("click", function() {
  resetData();
});