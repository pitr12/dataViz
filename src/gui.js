import $ from 'jquery';

export const setupGUI = () => {
  $('#showStimulus').click(() => {
    $("#panel").animate({width:'toggle'},1000);
    $('#showStimulusText').text((i, text) => {
        return text === "Show stimulus" ? "Hide stimulus" : "Show stimulus";
    })
  });
}
