window.AudioContext = window.AudioContext || window.webkitAudioContext;

const bpm = 120;

var context = undefined;

function midi_to_frequency(note) {
  const a4_frequency = 440;
  const a4_note = 69;

  return Math.pow(2, (note - a4_note) / 12) * a4_frequency;
}

function play_note(note, volume, time, duration) {
  const osc = new OscillatorNode(context, {frequency: midi_to_frequency(note), type: 'triangle'});
  const gain_node = new GainNode(context, {});

  const attack = .01;
  const decay = .05;
  const release = .05;

  const sustain = duration - attack - decay - release;
  const sustain_rate = .8;
  
  gain_node.gain.setValueAtTime(0, time);
  gain_node.gain.linearRampToValueAtTime(volume, time + attack);
  gain_node.gain.linearRampToValueAtTime(volume * sustain_rate, time + attack + decay);
  
  gain_node.gain.setValueAtTime(volume * sustain_rate, time + attack + decay + sustain);
  gain_node.gain.linearRampToValueAtTime(0, time + attack + decay + sustain + release);

  osc.connect(gain_node).connect(context.destination);

  osc.start(time);
  osc.stop(time + duration);
}

const notes = [
  {note: 60, beats: 1},
  {note: 60, beats: 1},
  {note: 60, beats: 1},
  {note: 62, beats: 1},
  
  {note: 64, beats: 2},
  {note: 62, beats: 2},

  {note: 60, beats: 1},
  {note: 64, beats: 1},
  {note: 62, beats: 1},
  {note: 62, beats: 1},
  
  {note: 60, beats: 2},
];

const note_input = document.getElementById('freq_range');
const play_button = document.getElementById('play');

play_button.onclick = () => {
  if (context === undefined) {
    context = new AudioContext();
  }

  let t = context.currentTime;
  for (const note of notes) {
    const duration = 60 * (note.beats / bpm);
    play_note(note.note, .5, t, duration);
    t += duration;
  }
};
