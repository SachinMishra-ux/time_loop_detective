/* ================================================================
   TIME LOOP DETECTIVE: THE TRILOGY — Full Game Engine
   ================================================================ */

const GAME_SPEED = 2;
const FAST_FORWARD_SPEED = 20;
let currentSpeed = GAME_SPEED;

// ==================== CASE DATA ====================

const CASES = [
  // ─────────────── CASE 1: The Mansion Murder ───────────────
  {
    id: 'mansion',
    title: 'Case 1: The Mansion Murder',
    description: 'A lavish mansion party turns deadly. Find the killer before time runs out.',
    difficulty: '⭐',
    badge: { icon: '🔍', name: 'Junior Detective', desc: 'Solved your first case!' },
    rooms: {
      bedroom:    { name: 'Upstairs Bedroom' },
      study:      { name: 'Study' },
      living_room:{ name: 'Living Room' },
      kitchen:    { name: 'Kitchen' },
      garden:     { name: 'Garden' }
    },
    roomLayout: {
      bedroom:     { top:'5%',  left:'10%', width:'35%', height:'35%' },
      study:       { top:'5%',  left:'55%', width:'35%', height:'35%' },
      living_room: { top:'50%', left:'10%', width:'45%', height:'40%' },
      kitchen:     { top:'50%', left:'60%', width:'30%', height:'25%' },
      garden:      { top:'80%', left:'60%', width:'30%', height:'15%' }
    },
    roomCoords: {
      bedroom:     {x:27.5, y:22.5},
      study:       {x:72.5, y:22.5},
      living_room: {x:32.5, y:70},
      kitchen:     {x:75,   y:62.5},
      garden:      {x:75,   y:87.5}
    },
    connections: [['bedroom','living_room'],['study','living_room'],['living_room','kitchen'],['living_room','garden'],['kitchen','garden']],
    startRoom: 'living_room',
    characters: {
      host: {
        name:'The Host', color:'#4d79ff',
        desc:'The wealthy owner of the mansion.',
        schedule:[
          {t:0,room:'living_room',state:'Greeting guests.'},
          {t:120,room:'study',state:'Arguing with Guest A.'},
          {t:180,room:'garden',state:'Pacing nervously.'},
          {t:300,room:'dead',state:'Murdered.'}
        ]
      },
      butler: {
        name:'The Butler', color:'#999',
        desc:'Loyal and discreet.',
        schedule:[
          {t:0,room:'kitchen',state:'Preparing drinks.'},
          {t:60,room:'living_room',state:'Cleaning up.'},
          {t:120,room:'kitchen',state:'Washing dishes.'},
          {t:270,room:'living_room',state:'Waiting for instructions.'}
        ]
      },
      guestA: {
        name:'Guest A', color:'#ff4d4d',
        desc:'Suspicious. Looking around too much.',
        schedule:[
          {t:0,room:'bedroom',state:'Rummaging through drawers.'},
          {t:60,room:'study',state:'Looking for a document.'},
          {t:120,room:'study',state:'Arguing with Host.'},
          {t:180,room:'bedroom',state:'Waiting quietly.'},
          {t:240,room:'garden',state:'Sneaking through the bushes.'},
          {t:300,room:'escaped',state:'Escaped after the crime.'}
        ]
      },
      guestB: {
        name:'Guest B', color:'#b366ff',
        desc:'Quiet observer, lingers near valuables.',
        schedule:[
          {t:0,room:'living_room',state:'Sipping wine alone.'},
          {t:60,room:'kitchen',state:'Asking for ice.'},
          {t:120,room:'living_room',state:'Watching the stairs.'},
          {t:180,room:'study',state:'Stealing the ledger!'},
          {t:240,room:'bedroom',state:'Hiding evidence.'},
          {t:300,room:'escaped',state:'Escaped with stolen goods.'}
        ]
      }
    },
    items: [
      {id:'rusty_key', name:'Rusty Key', room:'kitchen'},
      {id:'ledger',    name:'Secret Ledger', room:'study'}
    ],
    clues: {
      guestA_study:  'At 1:00, Guest A was secretly searching the Study.',
      host_argument: 'At 2:00, the Host and Guest A had a fierce argument.',
      guestA_garden: 'At 4:00, Guest A sneaks into the Garden.',
      murder:        'At 5:00, Guest A murders the Host in the Garden!',
      guestB_thief:  'At 3:00, Guest B sneaks into the Study to steal documents.'
    },
    // Returns object: { clueId, found } or null
    getObservationClue(charId, state, time, currentRoom) {
      if (charId==='guestA' && state.room==='study' && time>=60 && time<120) return 'guestA_study';
      if (currentRoom==='study' && time>=120 && time<180 && (charId==='host'||charId==='guestA')) return 'host_argument';
      if (charId==='guestA' && state.room==='garden' && time>=240) return 'guestA_garden';
      if (charId==='guestB' && state.room==='study' && time>=180 && time<240) return 'guestB_thief';
      return null;
    },
    getInterventions(currentRoom, time, clues, inventory, flags) {
      const actions = [];
      if (currentRoom==='bedroom' && time>=180 && time<240 && clues.includes(this.clues.guestA_garden) && !flags.doorLocked && inventory.includes('rusty_key')) {
        actions.push({ label:'Lock Door with Rusty Key', danger:true, action:() => { flags.doorLocked=true; return 'You locked the door. Guest A is trapped inside.'; }});
      }
      if (currentRoom==='garden' && time>=240 && time<300 && clues.includes(this.clues.murder) && !flags.hostWarned) {
        actions.push({ label:'Warn Host', danger:true, action:() => { flags.hostWarned=true; return 'The Host looks shocked and hurries inside.'; }});
      }
      return actions;
    },
    applyFlags(charId, time, flags) {
      if (charId==='guestA' && flags.doorLocked && time>=180) return {t:180,room:'bedroom',state:'Trapped inside the locked room!'};
      if (charId==='host' && flags.hostWarned && time>=240) return {t:240,room:'living_room',state:'Staying safely indoors.'};
      return null;
    },
    checkWin(flags, inventory, clues) {
      const murderStopped = flags.doorLocked || flags.hostWarned;
      const theftStopped = inventory.includes('ledger');
      if (murderStopped && theftStopped) return { result:'perfect', msg:'You prevented the murder AND secured the stolen ledger! The loop is finally broken.' };
      if (murderStopped) return { result:'partial', msg:'You prevented the murder... but Guest B escaped with the secret ledger! The timeline is unstable.' };
      return { result:'fail', msg:'At 5:00, something terrible happened in the Garden. Time collapses. The loop resets...' };
    },
    defaultFlags: () => ({ doorLocked:false, hostWarned:false })
  },

  // ─────────────── CASE 2: The Midnight Express ───────────────
  {
    id: 'train',
    title: 'Case 2: The Midnight Express',
    description: 'A priceless diamond vanishes on a luxury train. 6 rooms, 5 suspects.',
    difficulty: '⭐⭐',
    badge: { icon: '🕵️', name: 'Senior Inspector', desc: 'Cracked the train heist!' },
    rooms: {
      locomotive:  { name: 'Locomotive' },
      dining_car:  { name: 'Dining Car' },
      sleeper_a:   { name: 'Sleeper Car A' },
      sleeper_b:   { name: 'Sleeper Car B' },
      lounge:      { name: 'Lounge Car' },
      cargo:       { name: 'Cargo Hold' }
    },
    roomLayout: {
      locomotive: { top:'5%',  left:'5%',  width:'25%', height:'25%' },
      dining_car: { top:'5%',  left:'37%', width:'25%', height:'25%' },
      sleeper_a:  { top:'5%',  left:'68%', width:'25%', height:'25%' },
      sleeper_b:  { top:'40%', left:'5%',  width:'25%', height:'25%' },
      lounge:     { top:'40%', left:'37%', width:'25%', height:'25%' },
      cargo:      { top:'40%', left:'68%', width:'25%', height:'25%' }
    },
    roomCoords: {
      locomotive: {x:17.5, y:17.5},
      dining_car: {x:49.5, y:17.5},
      sleeper_a:  {x:80.5, y:17.5},
      sleeper_b:  {x:17.5, y:52.5},
      lounge:     {x:49.5, y:52.5},
      cargo:      {x:80.5, y:52.5}
    },
    connections: [['locomotive','dining_car'],['dining_car','sleeper_a'],['dining_car','lounge'],['sleeper_b','lounge'],['lounge','cargo']],
    startRoom: 'lounge',
    characters: {
      conductor: {
        name:'The Conductor', color:'#4dff88',
        desc:'Stern, follows the rules. Or does he?',
        schedule:[
          {t:0,room:'locomotive',state:'Driving the train.'},
          {t:90,room:'dining_car',state:'Checking tickets.'},
          {t:180,room:'lounge',state:'Taking a break.'},
          {t:240,room:'locomotive',state:'Back at the controls.'}
        ]
      },
      heiress: {
        name:'The Heiress', color:'#ff66b2',
        desc:'Owner of the Starfall Diamond. Very dramatic.',
        schedule:[
          {t:0,room:'sleeper_a',state:'Admiring her diamond.'},
          {t:60,room:'dining_car',state:'Having champagne.'},
          {t:150,room:'sleeper_a',state:'Napping.'},
          {t:210,room:'dining_car',state:'Screaming — the diamond is gone!'},
          {t:300,room:'dining_car',state:'Sobbing uncontrollably.'}
        ]
      },
      valet: {
        name:'The Valet', color:'#ff9933',
        desc:'The Heiress\'s personal servant. Nervous.',
        schedule:[
          {t:0,room:'sleeper_a',state:'Tidying sleeper A.'},
          {t:60,room:'lounge',state:'Reading a newspaper.'},
          {t:120,room:'sleeper_a',state:'Secretly copying the safe combination.'},
          {t:180,room:'cargo',state:'Hiding a bag in the cargo hold.'},
          {t:240,room:'lounge',state:'Acting casual.'},
          {t:300,room:'lounge',state:'Whistling nervously.'}
        ]
      },
      journalist: {
        name:'The Journalist', color:'#66ccff',
        desc:'Scribbling notes about everyone. Nosy.',
        schedule:[
          {t:0,room:'lounge',state:'Observing passengers.'},
          {t:60,room:'dining_car',state:'Eavesdropping on the Heiress.'},
          {t:120,room:'sleeper_b',state:'Writing frantically.'},
          {t:200,room:'cargo',state:'Snooping around crates.'},
          {t:270,room:'lounge',state:'Organizing her notes.'}
        ]
      },
      stranger: {
        name:'The Stranger', color:'#ff4d4d',
        desc:'No ticket. How did he get on?',
        schedule:[
          {t:0,room:'cargo',state:'Hiding behind crates.'},
          {t:100,room:'sleeper_b',state:'Picking a lock.'},
          {t:160,room:'sleeper_a',state:'Stealing the diamond from the safe!'},
          {t:200,room:'cargo',state:'Stashing the diamond.'},
          {t:260,room:'cargo',state:'Preparing to jump off the train.'},
          {t:300,room:'escaped',state:'Jumped off with the diamond!'}
        ]
      }
    },
    items: [
      {id:'master_key', name:'Master Key', room:'locomotive'},
      {id:'diamond', name:'Starfall Diamond', room:'cargo'},
      {id:'journal_page', name:'Journalist\'s Notes', room:'sleeper_b'}
    ],
    clues: {
      valet_copy:      'At 2:00, the Valet was copying the safe combination in Sleeper A.',
      stranger_hiding: 'At 0:00, a Stranger was hiding in the Cargo Hold. He has no ticket!',
      stranger_steal:  'At 2:40, the Stranger broke into Sleeper A and stole the diamond!',
      valet_cargo:     'At 3:00, the Valet hid a suspicious bag in the Cargo Hold.',
      journalist_snoop:'At 3:20, the Journalist was snooping in the Cargo Hold.',
      diamond_gone:    'At 3:30, the Heiress discovered the Starfall Diamond is missing!'
    },
    getObservationClue(charId, state, time, currentRoom) {
      if (charId==='valet' && state.room==='sleeper_a' && time>=120 && time<180) return 'valet_copy';
      if (charId==='stranger' && state.room==='cargo' && time<100) return 'stranger_hiding';
      if (charId==='stranger' && state.room==='sleeper_a' && time>=160 && time<200) return 'stranger_steal';
      if (charId==='valet' && state.room==='cargo' && time>=180 && time<240) return 'valet_cargo';
      if (charId==='journalist' && state.room==='cargo' && time>=200 && time<270) return 'journalist_snoop';
      if (charId==='heiress' && state.room==='dining_car' && time>=210) return 'diamond_gone';
      return null;
    },
    getInterventions(currentRoom, time, clues, inventory, flags) {
      const actions = [];
      // Lock cargo to trap the stranger
      if (currentRoom==='cargo' && time>=200 && time<260 && clues.includes(this.clues.stranger_steal) && !flags.cargoLocked && inventory.includes('master_key')) {
        actions.push({ label:'Lock Cargo Hold Door', danger:true, action:() => { flags.cargoLocked=true; return 'You locked the Cargo Hold. The Stranger is trapped!'; }});
      }
      // Confront the Valet
      if (currentRoom==='lounge' && time>=240 && clues.includes(this.clues.valet_cargo) && !flags.valetConfronted) {
        actions.push({ label:'Confront the Valet', danger:true, action:() => { flags.valetConfronted=true; return 'The Valet breaks down and confesses he was an accomplice!'; }});
      }
      return actions;
    },
    applyFlags(charId, time, flags) {
      if (charId==='stranger' && flags.cargoLocked && time>=200) return {t:200,room:'cargo',state:'Banging on the locked door!'};
      return null;
    },
    checkWin(flags, inventory, clues) {
      const strangerCaught = flags.cargoLocked;
      const valetExposed = flags.valetConfronted;
      const diamondRecovered = inventory.includes('diamond');
      if (strangerCaught && valetExposed && diamondRecovered) return { result:'perfect', msg:'The Stranger is trapped, the Valet confessed, and the diamond is recovered! Perfect deduction!' };
      if (strangerCaught && diamondRecovered) return { result:'partial', msg:'You recovered the diamond and caught the Stranger... but the Valet, the inside man, got away!' };
      if (strangerCaught) return { result:'partial', msg:'You caught the Stranger, but the diamond is still missing somewhere in the cargo hold!' };
      return { result:'fail', msg:'At 5:00, the Stranger jumps off the train with the diamond. The loop resets...' };
    },
    defaultFlags: () => ({ cargoLocked:false, valetConfronted:false })
  },

  // ─────────────── CASE 3: Sector 7 Sabotage ───────────────
  {
    id: 'station',
    title: 'Case 3: Sector 7 Sabotage',
    description: 'A space station is minutes from catastrophic failure. 8 rooms, 6 crew members.',
    difficulty: '⭐⭐⭐',
    badge: { icon: '🏆', name: 'Master Detective', desc: 'Saved an entire space station!' },
    rooms: {
      bridge:      { name: 'Bridge' },
      medbay:      { name: 'MedBay' },
      engineering: { name: 'Engineering' },
      lab:         { name: 'Science Lab' },
      quarters_a:  { name: 'Quarters A' },
      quarters_b:  { name: 'Quarters B' },
      airlock:     { name: 'Airlock' },
      cargo_bay:   { name: 'Cargo Bay' }
    },
    roomLayout: {
      bridge:      { top:'5%',  left:'35%', width:'30%', height:'20%' },
      medbay:      { top:'5%',  left:'70%', width:'25%', height:'20%' },
      lab:         { top:'5%',  left:'5%',  width:'25%', height:'20%' },
      quarters_a:  { top:'32%', left:'5%',  width:'20%', height:'25%' },
      engineering: { top:'32%', left:'30%', width:'40%', height:'25%' },
      quarters_b:  { top:'32%', left:'75%', width:'20%', height:'25%' },
      airlock:     { top:'65%', left:'10%', width:'30%', height:'25%' },
      cargo_bay:   { top:'65%', left:'50%', width:'40%', height:'25%' }
    },
    roomCoords: {
      bridge:      {x:50, y:15},
      medbay:      {x:82.5, y:15},
      lab:         {x:17.5, y:15},
      quarters_a:  {x:15, y:44.5},
      engineering: {x:50, y:44.5},
      quarters_b:  {x:85, y:44.5},
      airlock:     {x:25, y:77.5},
      cargo_bay:   {x:70, y:77.5}
    },
    connections: [['bridge','engineering'],['bridge','medbay'],['bridge','lab'],['lab','quarters_a'],['medbay','quarters_b'],['engineering','airlock'],['engineering','cargo_bay'],['quarters_a','airlock'],['quarters_b','cargo_bay']],
    startRoom: 'bridge',
    characters: {
      captain: {
        name:'Captain Voss', color:'#4d79ff',
        desc:'Calm under pressure. Trusted by all.',
        schedule:[
          {t:0,room:'bridge',state:'Monitoring systems.'},
          {t:120,room:'engineering',state:'Checking the reactor.'},
          {t:200,room:'bridge',state:'Receiving distress signals.'},
          {t:300,room:'bridge',state:'Unable to prevent the meltdown.'}
        ]
      },
      engineer: {
        name:'Chief Engineer Rho', color:'#ff9933',
        desc:'Brilliant but overworked.',
        schedule:[
          {t:0,room:'engineering',state:'Running diagnostics.'},
          {t:90,room:'cargo_bay',state:'Retrieving spare parts.'},
          {t:150,room:'engineering',state:'Repairing coolant pipes.'},
          {t:240,room:'engineering',state:'Panicking — the reactor is destabilizing!'},
          {t:300,room:'engineering',state:'Overwhelmed by the meltdown.'}
        ]
      },
      doctor: {
        name:'Dr. Lyra', color:'#66ffcc',
        desc:'The station medic. Knows everyone\'s health secrets.',
        schedule:[
          {t:0,room:'medbay',state:'Treating a headache.'},
          {t:60,room:'quarters_b',state:'Checking on a crewmate.'},
          {t:150,room:'medbay',state:'Reviewing medical logs.'},
          {t:220,room:'lab',state:'Running blood tests.'},
          {t:280,room:'medbay',state:'Preparing emergency kits.'}
        ]
      },
      scientist: {
        name:'Dr. Null', color:'#ff4d4d',
        desc:'The lead scientist. Strangely calm about everything.',
        schedule:[
          {t:0,room:'lab',state:'Working on an experiment.'},
          {t:80,room:'quarters_a',state:'Retrieving a hidden drive.'},
          {t:140,room:'engineering',state:'Planting a virus in the reactor controls!'},
          {t:200,room:'lab',state:'Erasing evidence from terminals.'},
          {t:260,room:'airlock',state:'Preparing escape pod.'},
          {t:300,room:'escaped',state:'Escaped in the pod.'}
        ]
      },
      security: {
        name:'Officer Knox', color:'#cccccc',
        desc:'Head of security. Very by-the-book.',
        schedule:[
          {t:0,room:'cargo_bay',state:'Patrolling.'},
          {t:60,room:'airlock',state:'Checking seals.'},
          {t:120,room:'bridge',state:'Filing a report.'},
          {t:180,room:'quarters_a',state:'Investigating noise.'},
          {t:240,room:'cargo_bay',state:'Locking down the bay.'}
        ]
      },
      intern: {
        name:'Intern Kai', color:'#ffff66',
        desc:'Young, clumsy, but observant.',
        schedule:[
          {t:0,room:'lab',state:'Assisting Dr. Null.'},
          {t:60,room:'engineering',state:'Delivering samples.'},
          {t:120,room:'medbay',state:'Getting a bandage.'},
          {t:180,room:'lab',state:'Cleaning up spilled chemicals.'},
          {t:240,room:'bridge',state:'Reporting something suspicious.'}
        ]
      }
    },
    items: [
      {id:'access_card', name:'Security Access Card', room:'cargo_bay'},
      {id:'data_drive',  name:'Encrypted Data Drive', room:'quarters_a'},
      {id:'antivirus',   name:'Antivirus Module', room:'medbay'}
    ],
    clues: {
      null_quarters:  'At 1:20, Dr. Null was rummaging in Quarters A for a hidden drive.',
      null_virus:     'At 2:20, Dr. Null planted a virus in the reactor controls in Engineering!',
      null_erasing:   'At 3:20, Dr. Null was erasing evidence from lab terminals.',
      null_escape:    'At 4:20, Dr. Null headed to the Airlock to prepare an escape pod!',
      intern_report:  'At 4:00, Intern Kai reported seeing suspicious activity.',
      meltdown:       'At 5:00, the reactor melts down. The station is destroyed.'
    },
    getObservationClue(charId, state, time, currentRoom) {
      if (charId==='scientist' && state.room==='quarters_a' && time>=80 && time<140) return 'null_quarters';
      if (charId==='scientist' && state.room==='engineering' && time>=140 && time<200) return 'null_virus';
      if (charId==='scientist' && state.room==='lab' && time>=200 && time<260) return 'null_erasing';
      if (charId==='scientist' && state.room==='airlock' && time>=260) return 'null_escape';
      if (charId==='intern' && state.room==='bridge' && time>=240) return 'intern_report';
      return null;
    },
    getInterventions(currentRoom, time, clues, inventory, flags) {
      const actions = [];
      // Use antivirus module in engineering
      if (currentRoom==='engineering' && time>=140 && clues.includes(this.clues.null_virus) && !flags.virusRemoved && inventory.includes('antivirus')) {
        actions.push({ label:'Deploy Antivirus Module', danger:true, action:() => { flags.virusRemoved=true; return 'You purged the virus from the reactor controls! The meltdown is averted!'; }});
      }
      // Lock the airlock to prevent escape
      if (currentRoom==='airlock' && time>=200 && clues.includes(this.clues.null_escape) && !flags.airlockSealed && inventory.includes('access_card')) {
        actions.push({ label:'Seal Airlock with Access Card', danger:true, action:() => { flags.airlockSealed=true; return 'You sealed the Airlock. Dr. Null cannot escape!'; }});
      }
      return actions;
    },
    applyFlags(charId, time, flags) {
      if (charId==='scientist' && flags.airlockSealed && time>=260) return {t:260,room:'airlock',state:'Trapped! Banging on the sealed airlock door!'};
      return null;
    },
    checkWin(flags, inventory, clues) {
      const meltdownStopped = flags.virusRemoved;
      const nullCaught = flags.airlockSealed;
      const dataSecured = inventory.includes('data_drive');
      if (meltdownStopped && nullCaught && dataSecured) return { result:'perfect', msg:'The reactor is stable, Dr. Null is apprehended, and you secured the encrypted data drive as evidence! Flawless deduction, Master Detective!' };
      if (meltdownStopped && nullCaught) return { result:'partial', msg:'You stopped the meltdown and caught Dr. Null, but without the data drive, proving their motive will be difficult!' };
      if (meltdownStopped) return { result:'partial', msg:'You stopped the meltdown! But Dr. Null escaped in the pod and remains at large...' };
      return { result:'fail', msg:'At 5:00, the reactor goes critical. The station is destroyed. The loop resets...' };
    },
    defaultFlags: () => ({ virusRemoved:false, airlockSealed:false })
  }
];

// ==================== STATE ====================

const STATE = {
  currentCaseIndex: 0,
  loopCount: 1,
  time: 0,
  maxTime: 300,
  currentRoom: '',
  timerInterval: null,
  clues: [],
  inventory: [],
  flags: {},
  soundEnabled: true,
  completedCases: [] // Array of case IDs
};

// ==================== LOCAL STORAGE ====================

function loadSave() {
  const saved = localStorage.getItem('timeLoopTrilogySave');
  if (saved) {
    const data = JSON.parse(saved);
    STATE.completedCases = data.completedCases || [];
    STATE.clues = data.clues || [];
    STATE.loopCount = data.loopCount || 1;
    STATE.currentCaseIndex = data.currentCaseIndex || 0;
  }
}

function saveGame() {
  localStorage.setItem('timeLoopTrilogySave', JSON.stringify({
    completedCases: STATE.completedCases,
    clues: STATE.clues,
    loopCount: STATE.loopCount,
    currentCaseIndex: STATE.currentCaseIndex
  }));
}

function wipeSave() {
  localStorage.removeItem('timeLoopTrilogySave');
  STATE.completedCases = [];
  STATE.clues = [];
  STATE.loopCount = 1;
  STATE.currentCaseIndex = 0;
}

function currentCase() { return CASES[STATE.currentCaseIndex]; }

// ==================== AUDIO ENGINE ====================

let audioCtx, droneOsc, droneGain, isAudioInitialized = false;

function initAudio() {
  if (isAudioInitialized) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    droneOsc = audioCtx.createOscillator(); droneOsc.type='sine'; droneOsc.frequency.value=55;
    droneGain = audioCtx.createGain(); droneGain.gain.value=0;
    droneOsc.connect(droneGain); droneGain.connect(audioCtx.destination); droneOsc.start();
    isAudioInitialized = true;
  } catch(e) { console.error('Audio init failed', e); }
}

function updateDroneVolume() {
  if (!isAudioInitialized || !STATE.soundEnabled) { if(droneGain) droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1); return; }
  const p = STATE.time / STATE.maxTime;
  droneGain.gain.setTargetAtTime(0.05 + 0.35*Math.pow(p,2), audioCtx.currentTime, 0.5);
  droneOsc.frequency.setTargetAtTime(55 + p*20, audioCtx.currentTime, 0.5);
}

function playTick() {
  if(!isAudioInitialized||!STATE.soundEnabled) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='triangle'; o.frequency.value=800; o.connect(g); g.connect(audioCtx.destination);
  o.start(audioCtx.currentTime); g.gain.setValueAtTime(0.1,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.05); o.stop(audioCtx.currentTime+0.1);
}

function playClueSound() {
  if(!isAudioInitialized||!STATE.soundEnabled) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='sine'; o.frequency.setValueCurveAtTime([440,880,1760],audioCtx.currentTime,0.3);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(audioCtx.currentTime); g.gain.setValueAtTime(0.2,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.5); o.stop(audioCtx.currentTime+0.5);
}

function playGlitchSound() {
  if(!isAudioInitialized||!STATE.soundEnabled) return;
  const bs=audioCtx.sampleRate*1.5, buf=audioCtx.createBuffer(1,bs,audioCtx.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<bs;i++) d[i]=Math.random()*2-1;
  const n=audioCtx.createBufferSource(); n.buffer=buf;
  const f=audioCtx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1000;
  const g=audioCtx.createGain(); g.gain.setValueAtTime(0.5,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+1.4);
  n.connect(f); f.connect(g); g.connect(audioCtx.destination); n.start();
}

function playVictorySound() {
  if(!isAudioInitialized||!STATE.soundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.value=freq;
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime + i*0.15;
    o.start(t); g.gain.setValueAtTime(0.2,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.5); o.stop(t+0.6);
  });
}

// ==================== HELPERS ====================

function getCharRoom(charId, time) {
  const c = currentCase();
  const override = c.applyFlags(charId, time, STATE.flags);
  if (override) return override;
  const schedule = c.characters[charId].schedule;
  let cur = schedule[0];
  for (let i=0; i<schedule.length; i++) { if (time >= schedule[i].t) cur = schedule[i]; else break; }
  return cur;
}

function formatTime(s) { return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; }

function logEvent(msg, important=false) {
  const el = document.createElement('div');
  el.className = `log-entry ${important?'important':''}`;
  el.textContent = `[${formatTime(STATE.time)}] ${msg}`;
  document.getElementById('event-log').prepend(el);
}

function addClue(clueId) {
  const c = currentCase();
  const text = c.clues[clueId];
  if (text && !STATE.clues.includes(text)) {
    STATE.clues.push(text); saveGame();
    logEvent('NEW CLUE DISCOVERED!', true);
    updateNotebook(); showModal('New Clue Discovered', text); playClueSound();
  }
}

// ==================== HUB / LEVEL SELECT ====================

function renderHub() {
  // Badges
  const badgesCon = document.getElementById('badges-container');
  badgesCon.innerHTML = '';
  CASES.forEach(c => {
    const div = document.createElement('div');
    div.className = 'badge-item';
    if (STATE.completedCases.includes(c.id)) {
      div.innerHTML = `${c.badge.icon}<span>${c.badge.name}</span>`;
    } else {
      div.style.opacity = '0.2'; div.style.filter = 'grayscale(1)';
      div.innerHTML = `❓<span>Locked</span>`;
    }
    badgesCon.appendChild(div);
  });

  // Case Cards
  const casesCon = document.getElementById('cases-container');
  casesCon.innerHTML = '';
  CASES.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'case-card';
    const unlocked = (i === 0) || STATE.completedCases.includes(CASES[i-1].id);
    if (!unlocked) card.classList.add('locked');

    card.innerHTML = `
      <div class="case-title">${c.title}</div>
      <div class="case-desc">${c.description}</div>
      <div class="case-stats">
        Difficulty: ${c.difficulty}<br>
        Rooms: ${Object.keys(c.rooms).length} | Suspects: ${Object.keys(c.characters).length}<br>
        ${STATE.completedCases.includes(c.id) ? '✅ Completed' : (unlocked ? '🔓 Unlocked' : '🔒 Locked')}
      </div>`;

    if (unlocked) {
      card.addEventListener('click', () => {
        STATE.currentCaseIndex = i;
        STATE.clues = [];
        STATE.loopCount = 1;
        saveGame();
        startGame();
      });
    }
    casesCon.appendChild(card);
  });
}

// ==================== MAP RENDERING ====================

function buildMap() {
  const c = currentCase();
  const floorplan = document.getElementById('floorplan');
  floorplan.innerHTML = '';
  for (const [key, layout] of Object.entries(c.roomLayout)) {
    const div = document.createElement('div');
    div.className = 'room-box';
    div.id = `rb-${key}`;
    div.dataset.room = key;
    div.textContent = c.rooms[key].name;
    div.style.top = layout.top; div.style.left = layout.left;
    div.style.width = layout.width; div.style.height = layout.height;
    div.addEventListener('click', () => moveRoom(key));
    floorplan.appendChild(div);
  }

  // Suspects list
  const suspList = document.getElementById('suspects-list');
  suspList.innerHTML = '';
  for (const [id, ch] of Object.entries(c.characters)) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="color-dot" style="background:${ch.color};color:${ch.color};"></span> ${ch.name}`;
    suspList.appendChild(li);
  }
}

function drawMapConnections() {
  const c = currentCase();
  const canvas = document.getElementById('map-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.setLineDash([5,5]);
  const rw = canvas.width/100, rh = canvas.height/100;
  c.connections.forEach(([r1, r2]) => {
    ctx.beginPath();
    ctx.moveTo(c.roomCoords[r1].x*rw, c.roomCoords[r1].y*rh);
    ctx.lineTo(c.roomCoords[r2].x*rw, c.roomCoords[r2].y*rh);
    ctx.stroke();
  });
}

function updateMapTokens() {
  const c = currentCase();
  const layer = document.getElementById('tokens-layer');
  if(!layer) return;
  layer.innerHTML = '';
  for (const [id, char] of Object.entries(c.characters)) {
    const state = getCharRoom(id, STATE.time);
    if (state.room==='dead' || state.room==='escaped') continue;
    const coords = c.roomCoords[state.room];
    if(!coords) continue;
    const token = document.createElement('div');
    token.className = 'token';
    token.style.left = `${coords.x}%`; token.style.top = `${coords.y}%`;
    token.style.color = char.color; token.style.backgroundColor = char.color;
    layer.appendChild(token);
  }
}

// ==================== SCENE RENDERING ====================

function updateUI() {
  document.getElementById('clock').textContent = formatTime(STATE.time);
  document.getElementById('loop-counter').textContent = `Loop: ${STATE.loopCount}`;
  document.querySelectorAll('.room-box').forEach(el => {
    el.classList.remove('current');
    if (el.dataset.room === STATE.currentRoom) el.classList.add('current');
  });
  const c = currentCase();
  document.getElementById('current-room-name').textContent = c.rooms[STATE.currentRoom]?.name || '?';
  renderScene();
  updateMapTokens();
}

function renderScene() {
  const c = currentCase();
  const actionsList = document.getElementById('action-buttons');
  actionsList.innerHTML = '';
  let charsInRoom = 0;

  for (const [id, char] of Object.entries(c.characters)) {
    const state = getCharRoom(id, STATE.time);
    if (state.room === STATE.currentRoom) {
      charsInRoom++;
      const btn = document.createElement('button');
      btn.className = 'entity-btn'; btn.style.borderColor = char.color;
      btn.textContent = `Observe ${char.name}`;
      btn.onclick = () => observeCharacter(id, state);
      actionsList.appendChild(btn);
    }
  }

  // Items
  c.items.forEach(item => {
    if (item.room === STATE.currentRoom && !STATE.inventory.includes(item.id)) {
      const btn = document.createElement('button');
      btn.className = 'entity-btn';
      btn.textContent = `Pick up ${item.name}`;
      btn.onclick = () => {
        STATE.inventory.push(item.id);
        logEvent(`Picked up ${item.name}.`);
        renderInventory(); renderScene();
      };
      actionsList.appendChild(btn);
    }
  });

  // Interventions
  const interventions = c.getInterventions(STATE.currentRoom, STATE.time, STATE.clues, STATE.inventory, STATE.flags);
  interventions.forEach(iv => {
    const btn = document.createElement('button');
    btn.className = iv.danger ? 'btn-danger' : 'entity-btn';
    btn.textContent = iv.label;
    btn.onclick = () => {
      const msg = iv.action();
      logEvent(msg, true);
      showModal('Action Taken', msg);
      renderScene();
    };
    actionsList.appendChild(btn);
  });

  if (charsInRoom === 0 && actionsList.children.length === 0) {
    const span = document.createElement('span');
    span.style.color = '#777'; span.textContent = 'Room is empty. Nothing to interact with.';
    actionsList.appendChild(span);
  }
}

function observeCharacter(charId, state) {
  const c = currentCase();
  const clueId = c.getObservationClue(charId, state, STATE.time, STATE.currentRoom);
  if (clueId) {
    addClue(clueId);
  } else {
    showModal(`Observing ${c.characters[charId].name}`, `${c.characters[charId].name}: ${state.state}`);
    logEvent(`Observed ${c.characters[charId].name}.`);
  }
}

function renderInventory() {
  const c = currentCase();
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';
  if (STATE.inventory.length === 0) {
    list.innerHTML = '<li class="empty-msg">Empty hands.</li>';
  } else {
    STATE.inventory.forEach(id => {
      const item = c.items.find(i => i.id === id);
      if (item) { const li = document.createElement('li'); li.textContent = item.name; list.appendChild(li); }
    });
  }
}

function updateNotebook() {
  const list = document.getElementById('clues-list');
  list.innerHTML = '';
  if (STATE.clues.length === 0) {
    list.innerHTML = '<li class="empty-msg">No clues discovered yet.</li>';
  } else {
    STATE.clues.forEach(c => { const li = document.createElement('li'); li.textContent = c; list.appendChild(li); });
  }
}

function moveRoom(roomKey) {
  if (STATE.currentRoom !== roomKey) {
    const c = currentCase();
    STATE.currentRoom = roomKey;
    logEvent(`Moved to ${c.rooms[roomKey].name}`);
    updateUI();
  }
}

// ==================== GAME FLOW ====================

function checkEvents() { if (STATE.time >= STATE.maxTime) handleLoopEnd(); }

function handleLoopEnd() {
  clearInterval(STATE.timerInterval);
  if (droneGain && isAudioInitialized) droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
  
  const c = currentCase();
  const outcome = c.checkWin(STATE.flags, STATE.inventory, STATE.clues);

  if (outcome.result === 'perfect') {
    playVictorySound();
    if (!STATE.completedCases.includes(c.id)) STATE.completedCases.push(c.id);
    saveGame();

    document.getElementById('end-title').textContent = 'Case Closed';
    document.getElementById('end-desc').textContent = outcome.msg;
    document.getElementById('stat-loops').textContent = STATE.loopCount;

    // Show badge
    const notif = document.getElementById('new-badge-notification');
    notif.classList.add('active');
    document.getElementById('earned-badge').textContent = c.badge.icon;
    document.getElementById('earned-badge-name').textContent = `${c.badge.name} — ${c.badge.desc}`;
    switchScreen('end-screen');
  } else if (outcome.result === 'partial') {
    playGlitchSound();
    showModal('Partial Success', outcome.msg + ' The loop resets...');
    document.getElementById('btn-close-modal').onclick = () => {
      document.getElementById('modal-overlay').classList.add('hidden'); startLoop();
    };
  } else {
    playGlitchSound();
    // Add the fail clue (e.g., murder, meltdown)
    const failClueKeys = Object.keys(c.clues);
    const lastClueKey = failClueKeys[failClueKeys.length - 1];
    addClue(lastClueKey);

    // After adding the clue, show the fail modal
    setTimeout(() => {
      showModal('Loop Ended', outcome.msg);
      document.getElementById('btn-close-modal').onclick = () => {
        document.getElementById('modal-overlay').classList.add('hidden'); startLoop();
      };
    }, 600);
  }
}

function startLoop() {
  initAudio();
  if (isAudioInitialized && STATE.soundEnabled && audioCtx.state==='suspended') audioCtx.resume();

  const c = currentCase();
  STATE.time = 0;
  STATE.loopCount++;
  STATE.currentRoom = c.startRoom;
  STATE.flags = c.defaultFlags();
  STATE.inventory = [];
  currentSpeed = GAME_SPEED;

  document.getElementById('event-log').innerHTML = '';
  logEvent('The timeline has reset.');
  renderInventory();
  updateUI();
  saveGame();

  clearInterval(STATE.timerInterval);
  STATE.timerInterval = setInterval(() => {
    STATE.time += 1;
    updateDroneVolume();
    if (STATE.time % 10 === 0) playTick();
    updateUI();
    checkEvents();
  }, 1000 / currentSpeed);
}

function startGame() {
  loadSave();
  updateNotebook();
  STATE.loopCount = Math.max(1, STATE.loopCount);
  STATE.loopCount--;
  buildMap();
  switchScreen('game-screen');
  window.addEventListener('resize', drawMapConnections);
  setTimeout(drawMapConnections, 100);
  startLoop();
}

function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-content').textContent = content;
  document.getElementById('modal-overlay').classList.remove('hidden');
  const oldSpeed = currentSpeed;
  currentSpeed = 0;
  clearInterval(STATE.timerInterval);
  document.getElementById('btn-close-modal').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    if (STATE.time < STATE.maxTime) {
      currentSpeed = oldSpeed || GAME_SPEED;
      clearInterval(STATE.timerInterval);
      STATE.timerInterval = setInterval(() => {
        STATE.time += 1; updateDroneVolume();
        if(STATE.time%10===0) playTick();
        updateUI(); checkEvents();
      }, 1000 / currentSpeed);
    }
  };
}

// ==================== EVENT LISTENERS ====================

document.getElementById('btn-enter-hub').addEventListener('click', () => { loadSave(); renderHub(); switchScreen('hub-screen'); });
document.getElementById('btn-hub-back').addEventListener('click', () => switchScreen('start-screen'));
document.getElementById('btn-wipe').addEventListener('click', () => { wipeSave(); alert('All memories wiped!'); });

document.getElementById('btn-sound').addEventListener('click', (e) => {
  STATE.soundEnabled = !STATE.soundEnabled;
  e.target.textContent = STATE.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
  if(!STATE.soundEnabled && droneGain) droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
});

document.getElementById('btn-fast-forward').addEventListener('mousedown', () => {
  currentSpeed = FAST_FORWARD_SPEED;
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = setInterval(() => { STATE.time+=1; updateDroneVolume(); updateUI(); checkEvents(); }, 1000/currentSpeed);
});
const stopFF = () => {
  if (STATE.time >= STATE.maxTime) return;
  currentSpeed = GAME_SPEED;
  clearInterval(STATE.timerInterval);
  STATE.timerInterval = setInterval(() => { STATE.time+=1; updateDroneVolume(); updateUI(); checkEvents(); }, 1000/currentSpeed);
};
document.getElementById('btn-fast-forward').addEventListener('mouseup', stopFF);
document.getElementById('btn-fast-forward').addEventListener('mouseleave', stopFF);

document.getElementById('btn-restart-loop').addEventListener('click', startLoop);
document.getElementById('btn-exit-case').addEventListener('click', () => {
  clearInterval(STATE.timerInterval);
  if(droneGain && isAudioInitialized) droneGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
  loadSave(); renderHub(); switchScreen('hub-screen');
});
document.getElementById('btn-play-again').addEventListener('click', () => {
  document.getElementById('new-badge-notification').classList.remove('active');
  loadSave(); renderHub(); switchScreen('hub-screen');
});

loadSave();
