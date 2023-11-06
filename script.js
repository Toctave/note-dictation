window.AudioContext = window.AudioContext || window.webkitAudioContext;

var context = undefined;

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

const modes = [
  {name: 'majeur', intervals: [2, 2, 1, 2, 2, 2, 1]},
  {name: 'mineur', intervals: [2, 1, 2, 2, 1, 2, 2]},
];

var melody = [
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

const note_sequence = document.getElementById('note_sequence');

// ---- UTILITY FUNCTIONS ----

function mod(n, m) {
  return ((n % m) + m) % m;
}

function div(n, m) {
  return Math.floor(n / m);
}

function midi_to_frequency(note) {
  const a4_frequency = 440;
  const a4_note = 69;

  return Math.pow(2, (note - a4_note) / 12) * a4_frequency;
}

function midi_to_octave_and_semitones(midi_note) {
  const c4 = 60;

  const n = Math.floor((midi_note - c4) / 12);
  const base_note = mod(midi_note - c4, 12);
  const octave = 4 + n;

  return {octave: octave, semitones: base_note};
}

function octave_and_semitones_to_midi(a) {
  return (a.octave + 1) * 12 + a.semitones;
}

function random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function random_element(arr) {
  return arr[random_int(0, arr.length)];
}

// ----------------

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

function midi_pitch_to_base_note(midi_pitch) {
  const result = mod(midi_pitch, 12);
  console.assert(result >= 0 && result < 12);

  return result;
}

function get_next_note_choices(base, max_interval, scale_semitones) {
  const choices = [base];

  for (const direction of [-1, 1]) {
    var interval = 0;
    var current = {degree: base.degree, octave: base.octave};

    while (Math.abs(interval) <= max_interval) {
      const prev_pos = current.degree;
      const prev_octave = current.octave;

      current.degree += direction;
      current.octave += div(current.degree, scale_semitones.length);
      current.degree = mod(current.degree, scale_semitones.length);

      interval += (scale_semitones[current.degree] - scale_semitones[prev_pos]) + 12 * (current.octave - prev_octave);

      if (Math.abs(interval) <= max_interval) {
        choices.push({degree: current.degree, octave: current.octave});
      }
    }
  }

  return choices;
}

function generate_melody(length, max_interval, scale_semitones, first_degree) {
  const melody = [{octave: 0, degree: first_degree}];

  for (var i = 1; i < length; i++) {
    const prev = melody[melody.length - 1];

    melody.push(random_element(get_next_note_choices(prev, max_interval, scale_semitones)));
  }

  return melody;
}

function regen_melody() {
  const melody_length = parseInt(document.getElementById('melody_length').value);
  const max_interval = parseInt(document.getElementById('max_interval').value);

  const key_value = document.getElementById('key').value;
  var mode_index;
  var key_index;
  
  if (key_value === 'random') {
    mode_index = random_int(0, modes.length);
    key_index = random_int(0, 12);
  } else {
    console.log('key_value = ', key_value);
    [mode_index, key_index] = JSON.parse(key_value);
  }

  console.log(mode_index);
  console.log(key_index);

  const scale_intervals = modes[mode_index].intervals;
  const scale_semitones = [0];
  for (const i of scale_intervals) {
    scale_semitones.push(scale_semitones[scale_semitones.length - 1] + i)
  }
  
  const last = scale_semitones.pop(); // remove last element
  console.assert(last === 12);
  console.assert(scale_semitones.length === 7);

  var first;
  if (document.getElementById('tonic').checked) {
    first = 0;
  } else {
    first = random_int(0, scale_intervals.length);
  }

  const midi_base = 60 + key_index;
  melody = generate_melody(melody_length, max_interval, scale_semitones, first).map((x) => {
    const pitch = midi_base + x.octave * 12 + scale_semitones[x.degree];

    return {pitch: pitch, beats: 1};
  });
}

function refresh_melody() {
  note_sequence.replaceChildren();

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

  var txt = '';
  for (var i = 0; i < melody.length; i++) {
    txt += note_names[midi_pitch_to_base_note(melody[i].pitch)];
    txt += ', ';
  }

  /* document.getElementById('debug_text').innerText = txt; */
}

function play_melody() {
  if (context === undefined) {
    context = new AudioContext();
  }

  const bpm = parseInt(document.getElementById('bpm').value);

  let t = context.currentTime;
  for (const note of melody) {
    const duration = 60 * (note.beats / bpm);
    play_note(note.pitch, .5, t, duration);
    t += duration;
  }
}

function midi_note_to_name(midi_note) {
  const a = midi_to_octave_and_semitones(midi_note);

  return note_names[a.semitones] + a.octave.toString();
}

// ---- Code that runs on first page load ----

{
  refresh_melody();

  const regen_button = document.getElementById('regen_button');
  regen_button.addEventListener('click', () => {
    regen_melody();
    refresh_melody();
    play_melody();
  });

  const play_button = document.getElementById('play_button');
  play_button.addEventListener('click', () => {
    play_melody();
  });

  const validate_button = document.getElementById('validate_button');
  validate_button.addEventListener('click', () => {
    for (var i = 0; i < melody.length; i++) {
      const pitch_box = note_sequence.children[i];
      const chosen_value = parseInt(pitch_box.value);

      if (midi_pitch_to_base_note(melody[i].pitch) == chosen_value) {
        pitch_box.classList.remove('invalid');
        pitch_box.classList.add('valid');
      } else {
        pitch_box.classList.remove('valid');
        pitch_box.classList.add('invalid');
      }
    }
  });

  const key_select = document.getElementById('key');

  const opt = document.createElement('option');
  opt.value = 'random';
  opt.text = 'Aléatoire';
  key_select.appendChild(opt);

  for (var mode_index = 0; mode_index < modes.length; mode_index++) {
    const mode = modes[mode_index];
    for (var note = 0; note < note_names.length; note++) {
      const opt = document.createElement('option');
      opt.value = JSON.stringify([mode_index, note]);
      opt.text = note_names[note] + ' ' + mode.name;
      key_select.appendChild(opt);
    }
  }
  key_select.value = JSON.stringify([0, 0]);
}
