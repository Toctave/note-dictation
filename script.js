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
  /* osc.stop(time + duration); */
}

const melody = [
  {pitch: 60, beats: 1},
  {pitch: 60, beats: 1},
  {pitch: 60, beats: 1},
  {pitch: 62, beats: 1},
  
  {pitch: 64, beats: 2},
  {pitch: 62, beats: 2},

  {pitch: 60, beats: 1},
  {pitch: 64, beats: 1},
  {pitch: 62, beats: 1},
  {pitch: 62, beats: 1},
  
  {pitch: 60, beats: 2},
];

const note_names = [
  'Do',
  'Do# / Réb',
  'Ré',
  'Ré# / Mib',
  'Mi',
  'Fa',
  'Fa# / Solb',
  'Sol',
  'Sol# / Lab',
  'La',
  'La# / Sib',
  'Si',
];

const note_sequence = document.getElementById('note_sequence');

function midi_pitch_to_base_note(midi_pitch) {
  return (midi_pitch % 12 + 12) % 12;
}

for (var i = 0; i < melody.length; i++) {
  const note = melody[i];
  
  const pitch_box = document.createElement('select');

  const opt = document.createElement('option');
  opt.value = undefined;
  opt.text = 'Choisir une note...';
  pitch_box.appendChild(opt);
  
  for (var j = 0; j < note_names.length; j++) {
    const opt = document.createElement('option');
    opt.value = j;
    opt.text = note_names[j];
    pitch_box.appendChild(opt);
  }
  pitch_box.classList.add('pitch_box');

  if (i == 0) {
    pitch_box.disabled = true;
    pitch_box.classList.add('valid');
    pitch_box.value = midi_pitch_to_base_note(melody[i].pitch);
    pitch_box.text = note_names[pitch_box.value];
  }
  
  note_sequence.appendChild(pitch_box);
}

const play_button = document.getElementById('play_button');
play_button.addEventListener('click', () => {
  if (context === undefined) {
    context = new AudioContext();
  }

  let t = context.currentTime;
  for (const note of melody) {
    const duration = 60 * (note.beats / bpm);
    play_note(note.pitch, .5, t, duration);
    t += duration;
  }
});

const validate_button = document.getElementById('validate_button');
validate_button.addEventListener('click', () => {
  for (var i = 0; i < melody.length; i++) {
    const pitch_box = note_sequence.children[i];
    if (midi_pitch_to_base_note(melody[i].pitch) == pitch_box.value) {
      pitch_box.classList.remove('invalid');
      pitch_box.classList.add('valid');
    } else {
      pitch_box.classList.remove('valid');
      pitch_box.classList.add('invalid');
    }
  }
});
