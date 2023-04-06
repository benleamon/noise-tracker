// Create the data log
const data = [];

// Set thresholds for sound levels
const thresholds = {
  duration: 60,
  low: -30.0,
  medium: -18.0,
  lives:0,
  minutes:0,
  update: function(threshold, value) {
    this[threshold] = parseInt(value, 10)
  }
}

// Code to log all properties of an object
function logObjectProperties(obj) {
  for (let prop in obj) {
    console.log(prop + ': ' + obj[prop]);
  }
}

//Add event listeners to update the thresholds on user input
// Get an array of all input elements
const inputElements = Array.from(document.querySelectorAll("input"));
// Add an event listener to each
inputElements.forEach(input => {
  input.addEventListener("input", event => {
    // Get the name of the input
    const inputName = event.target.name || event.target.id;

    // Get the value of the new input
    const newValue = event.target.value;

    // Update the corresponding property in thresholds
    thresholds.update(inputName, newValue);

    logObjectProperties(thresholds)

  });
});


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
    //console.log("Decibel level: " + formattedDecibels + " dB");
    
    //display raw data on the page 
    updateDb(formattedDecibels);

    // log the data 
    logData(formattedDecibels);

    //Find average for the last n secods
    const average = averageSound(thresholds.duration);

    //Update average db label
    updateAverageDb(average)

    // update the main picture based on sound levels
    setLevelImage(formattedDecibels, thresholds);

    // Remove a life if it gets too loud
    removeLives(formattedDecibels, thresholds)
  };

  // connect the audio source to the script processor and start the audio stream
  source.connect(scriptProcessor);
  scriptProcessor.connect(audioContext.destination);
}

// Update the text showing the current decibel level on the web page
function updateDb(rawdb){
  document.getElementById("db-label").innerHTML = rawdb;
}

// Update the text showing the current average decibel level on the web page
function updateAverageDb(average){
  document.getElementById("average-label").innerHTML = average.toFixed(1);
}

// Save current decibel value to data
function logData(rawdb){
  data.push(rawdb).toFixed(1);
}

// Export the data to a new page
function exportData(data){
  let list = data;
  let listContents ="";
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

//Get the average sound for a duration
function averageSound(duration){
  const numRecords = duration * 20;
  let relevantRecords = data.slice(-numRecords)
  const formattedRecords = relevantRecords.map(Number)
  const sum = formattedRecords.reduce((accumulator, currentValue) => accumulator + currentValue);
  const average = sum / formattedRecords.length;
  console.log(average);
  return average;
}

function setLevelImage(sound, thresholds){
  if (sound < thresholds.low){
    document.getElementById("level-image").src = "image/1.png"
  } else if ( sound > thresholds.low && sound < thresholds.medium) {
    document.getElementById("level-image").src = "image/2.png"
  } else if (sound > thresholds.medium) {
    document.getElementById("level-image").src = "image/3.png"
  }
}

//Remove All lives
function deleteAllLives(){
  const elements = document.querySelectorAll('.life');
  elements.forEach((i) => {
  i.remove();
})
}

//Update number of lives on screen: 
function drawLives(thresholds) {
  console.log("Draw Lives")
  deleteAllLives()
  const div = document.getElementById("lives-container");
  for (let i =1; i <= thresholds.lives; i++) {
    const img = document.createElement("img");
    img.src = "image/life.png";
    img.className = "life"
    div.appendChild(img);
  }
}

//Remove Lives if it's too loud
function removeLives (sound, levels) {
  if (sound > levels.medium) {
    console.log("life removed")
    const oldLives = levels.lives;
    let newLives = oldLives - 1
    if (newLives < 0) {
      newLives = 0;
    }
    thresholds.update("lives", newLives);
    drawLives(thresholds);
  }
}

// Draw initial lives
drawLives(thresholds)

//Event listener to update number of lives on screen when settings are chagned 
const livesInput = document.getElementById("lives");
livesInput.addEventListener("input", function(){
  console.log("fired")
  drawLives(thresholds)
})

//Add Lives button 
document.getElementById("add-lives-button").addEventListener("click", function() {
  console.log("life added")
  const currentLives = thresholds.lives;
  thresholds.update("lives", thresholds.lives += 1)
  console.log("You now have: " + thresholds.lives)
  drawLives(thresholds)
});

//Remove lives button 
document.getElementById("minus-lives-button").addEventListener("click", function(){
  console.log("Life removed")
  const currentLives = thresholds.lives;
  if (currentLives > 0){
    thresholds.update("lives", thresholds.lives -= 1)
    console.log("You now have: " + thresholds.lives)
    drawLives(thresholds)
  } else {
    console.log("No lives to take!")
  }
  
});


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

//Settings Pannel conrols 
document.getElementById("open-settings").addEventListener("click", function(){
  document.getElementById("settings").classList.toggle("hidden")
})
document.getElementById("close-settings").addEventListener("click", function(){
  document.getElementById("settings").classList.toggle("hidden")
})