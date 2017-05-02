import Slider from 'bootstrap-slider';
import {
  clearCanvas,
  filterFixations,
  filterSaccades,
  filterFixationsFromPanel,
  drwawStimulusImg,
  drawGazePlot,
  drawFixationsForAll,
  findMinMaxDuration,
} from './helpers';

let mySlider;
let participantID = 0;

const stimulusFilterBtnListener = async(fixations, saccades, environment, _) => {
  const sliderValues = mySlider.bootstrapSlider('getValue');
  clearCanvas();
  const filteredFixations = filterFixations(fixations, sliderValues[0], sliderValues[1]);
  const filteredSaccades = filterSaccades(saccades, filteredFixations);
  await drwawStimulusImg();
  await drawGazePlot(filteredFixations);
  environment.fixations[participantID] = filteredFixations;
  environment.saccades[participantID] = filteredSaccades;
  await drawFixationsForAll(environment);
}

export const setupGUI = async(environment, init=true) => {
  if (!environment.fixations[participantID].length) {
    mySlider.bootstrapSlider('setAttribute', 'max', 0);
    mySlider.bootstrapSlider('setAttribute', 'value', [0,0]);
    mySlider.bootstrapSlider('refresh');
  } else {
    const fixations = environment.fixations[participantID];
    const saccades = environment.saccades[participantID];

    const lastFixation = fixations[fixations.length - 1];
    const maxTimeStamp  = Math.ceil(lastFixation.timeStamp / 1000);

    if (!init) {
      mySlider.bootstrapSlider('setAttribute', 'max', maxTimeStamp);
      mySlider.bootstrapSlider('setAttribute', 'value', [0,maxTimeStamp]);
      mySlider.bootstrapSlider('refresh');
    }

    $('#timeEnd').text(` ${maxTimeStamp}s`);
    $('#stimulusFilterBtn').click(stimulusFilterBtnListener.bind(this, fixations, saccades, environment));

    if (init) {
      mySlider = $("#timeSlider").bootstrapSlider({
    	   min: 0,
         max: maxTimeStamp,
         step: 1,
         value: [0,maxTimeStamp],
         tooltip_position: 'bottom',
      });

      $('#showStimulus').click(() => {
        $("#panel").animate({width:'toggle'},1000);
        $('#showStimulusText').text((i, text) => {
            return text === "Show stimulus" ? "Hide stimulus" : "Show stimulus";
        })
      });

      $('#panelFilterBtn').click(() => {
        const userID = $('#userSelect').val();
        const minDuration = $('#duarationSpinner').spinner('value');

        let shouldFilterSelected = false;
        for (var key in environment.fixations) {
           if (environment.fixations.hasOwnProperty(key)) {
             if (environment.selectedFixations[key]) {
               shouldFilterSelected = true;
             }
           }
        }

        for (var key in environment.fixations) {
           if (environment.fixations.hasOwnProperty(key)) {
             const color = $(`#color${key}`).spectrum('get').toHexString();
             environment.colors[key] = color;
             environment.fixations[key] = filterFixationsFromPanel(environment.fixations[key], minDuration, environment.selectedFixations[key], shouldFilterSelected);
           }
        }

        environment.mapping.color = $('#mappingSelectColor').val();
        environment.mapping.size = $('#mappingSelectSize').val();

        participantID = userID;
        $("#stimulusFilterBtn").off('click');
        environment.selectedFixations = {};
        setupGUI(environment, false);
        fillDialog(environment);
        drwawStimulusImg();
        drawGazePlot(environment.fixations[userID]);
        drawFixationsForAll(environment);
      });

      $('#panelFilterResetBtn').click(() => {
        window.location.reload();
      });

      $('#overallInfo').click(() => {
        $( "#dialog" ).dialog('open');
      });

      const spinner = $("#duarationSpinner").spinner({
        min: 0,
      });

      for (var key in environment.fixations) {
         if (environment.fixations.hasOwnProperty(key)) {
            const name = environment.fixations[key][0].name;
            const [minFixation, maxFixation] = findMinMaxDuration(environment.fixations[key]);
            $('#userSelect').append(`<option value="${key}">${name}</option>`);
            $('#userColors').append(`<div class='colorNameLabel'><label>${name}: </label><input type='text' id='color${key}' /></div>`);
            $(`#color${key}`).spectrum({
                color: environment.colors[key],
                preferredFormat: "hex",
            });
            $( "#dialog" ).append(`
              <div class="overallInfoItem">
      					<div class="overallInfoTitle">${name}</div>
      					<div>Number of fixations: <span class="overallInfoLabel">${environment.fixations[key] ? environment.fixations[key].length : 0}</span></div>
      					<div>Longest fixation: <span class="overallInfoLabel">${maxFixation}</span></div>
      					<div>Shortest fixation: <span class="overallInfoLabel">${minFixation}</span></div>
      				</div>
            `);
         }
      }
    }
  }

  $( "#dialog" ).dialog({
    autoOpen: false,
  });
}

const fillDialog = (environment) => {
  $( "#dialog" ).empty();
  for (var key in environment.fixations) {
     if (environment.fixations.hasOwnProperty(key) && environment.fixations[key].length) {
        const name = environment.fixations[key][0].name;
        const [minFixation, maxFixation] = findMinMaxDuration(environment.fixations[key]);
        $( "#dialog" ).append(`
          <div class="overallInfoItem">
            <div class="overallInfoTitle">${name}</div>
            <div>Number of fixations: <span class="overallInfoLabel">${environment.fixations[key] ? environment.fixations[key].length : 0}</span></div>
            <div>Longest fixation: <span class="overallInfoLabel">${maxFixation}</span></div>
            <div>Shortest fixation: <span class="overallInfoLabel">${minFixation}</span></div>
          </div>
        `);
     }
  }
}

export const displayInfo = (data) => {
  const info = $('#infoBox');
  const infoWarning = $('#infoWarning');
  if (!data) {
    info.hide();
    infoWarning.show();
  } else {
    infoWarning.hide();
    info.show();
    $('#infoName').text(data.name);
    $('#infoID').text(data.id);
    $('#infoDuration').text(data.length);
    $('#infoTimestamp').text(data.timestamp);
    $('#infoPosition').text(data.position);
  }
}
