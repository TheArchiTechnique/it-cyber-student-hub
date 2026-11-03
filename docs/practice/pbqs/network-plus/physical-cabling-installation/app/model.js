/* Independent decisions keep one placement error from changing unrelated credit. */
(function (root) {
  'use strict';
  const KEY = 'student-hub.network-plus.physical-cabling.v1';
  const roomRoles = { mdf: 'Main distribution frame (MDF)', idf: 'Intermediate distribution frame (IDF)', work: 'Work area', storage: 'Equipment storage' };
  const components = { copper: 'Copper patch panel', fiber: 'Fiber distribution panel', switch: 'Network switch', ups: 'Uninterruptible power supply' };
  const media = {
    cat6: 'Cat6 UTP installation cable', cat6a: 'Cat6A UTP installation cable', shielded: 'Cat6A STP installation cable',
    om3: 'OM3 multimode fiber', os2: 'OS2 single-mode fiber', coax: '75-ohm coaxial cable',
    copperPatch: 'RJ45 copper patch cord', fiberPatch: 'LC duplex OM3 patch cord', dac: '3 m passive SFP+ twinax DAC'
  };
  const ratings = { cm: 'CM (general purpose)', cmr: 'CMR (riser)', cmp: 'CMP (plenum)' };
  const rooms = [
    { id: 'r101', name: 'Room 101', floor: 1, note: 'Provider entrance, building core switch, and first-floor access switch. Serves the first-floor offices.', bays: ['fiber', 'copper', 'switch'] },
    { id: 'r201', name: 'Room 201', floor: 2, note: 'Access switch for second-floor offices and workshop. Dedicated link to Room 101.', bays: ['copper', 'switch', 'fiber'] },
    { id: 'r301', name: 'Room 301', floor: 3, note: 'Access switch for third-floor offices. Dedicated link to Room 101.', bays: ['fiber', 'switch', 'copper'] }
  ];
  const routes = [
    { id: 'b1', name: 'B1 · Room 101 to Room 201', group: 'Backbone', short: 'B1 · 55 m',
      requirement: '55 m total optical channel; 10 Gb/s. Both supplied switch optics are 10GBASE-SR, 850 nm, duplex LC. Approved fiber choices are OM3 or OS2. The enclosed vertical pathway is separate from air handling; supplied fiber jackets are already approved for it.',
      accept: ['om3'], why: 'OM3 multimode fiber matches the supplied SR optics and supports this 55 m, 10 Gb/s channel (10GBASE-SR supports up to 300 m on OM3). OS2 is single-mode and does not match these optics. Copper cables do not connect to their optical LC sockets.' },
    { id: 'b2', name: 'B2 · Room 101 to Room 301', group: 'Backbone', short: 'B2 · 95 m',
      requirement: '95 m total optical channel; 10 Gb/s. Both supplied switch optics are 10GBASE-LR, 1310 nm, duplex LC. Approved fiber choices are OM3 or OS2. Supplied fiber jackets are approved for the enclosed vertical pathway.',
      accept: ['os2'], why: 'OS2 single-mode fiber matches the supplied LR optics. The optics determine the fiber type even at this short distance. OM3 does not match this LR link. A different backbone can legitimately use multimode fiber with compatible optics.' },
    { id: 'h1', name: 'H1 · Room 101 to first-floor offices', group: 'Horizontal', short: 'H1 · 62 m',
      requirement: '1 Gb/s RJ45 endpoints; 62 m permanent link plus 8 m total patch cords. Ordinary office pathway, no significant interference. The installation specification calls for UTP, Cat6 or better. Its jacket has already been approved.',
      accept: ['cat6', 'cat6a'], why: 'Either Cat6 UTP or Cat6A UTP meets this 1 Gb/s, 70 m copper channel. The permanent link is below 90 m and the complete channel is below 100 m. STP is a different construction from the specified UTP. Fiber and DAC do not terminate on the work-area RJ45 jacks.' },
    { id: 'h2', name: 'H2 · Room 201 to second-floor workshop', group: 'Horizontal', short: 'H2 · 70 m',
      requirement: '1 Gb/s RJ45 endpoints; 70 m permanent link plus 6 m patch cords. The approved route passes near motor equipment and through an environmental-air return space. The approved design requires an electrically shielded channel; compatible shielded jacks, panels, patch cords, and an approved bonding system are supplied. Local installation rules require a jacket listed for this environmental-air space. Choose media here and the jacket rating below.',
      accept: ['shielded'], why: 'Cat6A STP meets the specified shielding requirement for this motor-adjacent path. The shielded jacks, patching, and bonding must form an appropriate system. UTP lacks the specified shielding. Fiber resists interference but does not match the installed RJ45 endpoints. Jacket rating is scored separately.' },
    { id: 'h3', name: 'H3 · Room 301 to third-floor offices', group: 'Horizontal', short: 'H3 · 78 m',
      requirement: '10GBASE-T RJ45 endpoints; 78 m permanent link plus 8 m total patch cords. Ordinary office pathway. The specification calls for UTP and guaranteed 10 Gb/s over the full channel; its jacket is already approved.',
      accept: ['cat6a'], why: 'Cat6A UTP supports a 10GBASE-T channel up to 100 m. This channel totals 86 m. Cat6 is not specified for guaranteed 10GBASE-T at this distance (its shorter 10G reach depends on installation conditions). A higher bandwidth optical cable still would not fit these RJ45 endpoints.' }
  ];
  const patches = [
    { id: 'p1', name: 'P1 · Copper panel to access switch', requirement: 'Room 101: a 2 m removable lead connects a front RJ45 patch-panel port to an RJ45 access-switch port. Existing permanent cabling ends at the panel.', accept: ['copperPatch'],
      why: 'A factory-terminated RJ45 copper patch cord connects the passive panel to the active switch. Bulk installation cable is intended for the permanent link and is not a finished removable lead. Fiber and SFP+ DAC ends do not fit RJ45 sockets.' },
    { id: 'p2', name: 'P2 · Fiber panel to SR switch optic', requirement: 'Room 201: a 2 m removable duplex LC lead connects the OM3 backbone adapter pair to the installed 10GBASE-SR optic. This lead is included in B1’s 55 m channel length.', accept: ['fiberPatch'],
      why: 'A duplex LC OM3 patch cord continues the multimode link from its passive distribution panel to the SR optic. Bulk fiber is not a finished patch lead; the RJ45 and DAC choices have the wrong terminations.' },
    { id: 'd1', name: 'D1 · Core switch to first-floor access switch', requirement: 'Room 101: adjacent equipment, 3 m cable path, 10 Gb/s. Both empty SFP+ cages explicitly support the supplied passive twinax DAC assembly. Use a direct-attach copper assembly; no separate optical modules are installed.', accept: ['dac'],
      why: 'The supported 3 m SFP+ twinax DAC is a complete short-distance assembly that plugs into both cages. It is not general-purpose horizontal copper cable. An LC fiber patch cord requires suitable optical transceivers; an RJ45 lead requires RJ45 interfaces.' }
  ];
  const tasks = [];
  const add = (id, name, group, options, accept, why) => tasks.push({ id, name, group, options, accept, why });
  rooms.forEach(room => {
    const role = room.floor === 1 ? 'mdf' : 'idf';
    add(room.id, room.name + ' distribution role', 'Distribution rooms', roomRoles, [role],
      room.floor === 1 ? 'Room 101 is the building’s central distribution point at the provider entrance, so it is the MDF. It also serves first-floor offices; an additional IDF on that floor is unnecessary here.' : room.name + ' distributes connections to its own floor and links back to the building’s central room, so it is an IDF. The provider entrance and central distribution are in Room 101.');
    room.bays.forEach((component, i) => add(room.id + '-' + i, room.name + ' · unit ' + 'ABC'[i], 'Rack components', components, [component], {
      copper: 'The row of numbered RJ45 jacks without powered status indicators is a passive copper patch panel. Permanent horizontal cables terminate at the rear; patch cords connect the front to a switch. It does not forward Ethernet frames.',
      fiber: 'The paired small optical adapters and protected fiber entry identify a passive fiber distribution panel. It organizes and protects fiber terminations. A patch cord links it to a switch transceiver; it does not convert signals or switch traffic.',
      switch: 'The Ethernet ports, SFP+ cages, link indicators, and power/status indicators identify an active network switch. It forwards frames between connected ports; passive panels do not provide this function.'
    }[component]));
  });
  routes.forEach(r => add(r.id, r.name, r.group, media, r.accept, r.why));
  add('h2-rating', 'H2 · Jacket rating', 'Horizontal', ratings, ['cmp'], 'CMP is required by the stated air-return installation conditions. CMR is intended for riser applications and CM for general-purpose spaces; neither satisfies the stated plenum requirement. A cable can be both shielded and plenum-rated: shielding and fire/smoke rating describe different properties. Requirements depend on the environment and applicable code, not simply being above a ceiling.');
  patches.forEach(r => add(r.id, r.name, 'Patching and direct attach', media, r.accept, r.why));
  const byId = Object.fromEntries(tasks.map(t => [t.id, t]));
  function fresh() { return { version: 1, answers: {}, room: 'r101', submitted: false }; }
  function sanitize(raw) {
    const state = fresh();
    if (!raw || raw.version !== 1) return state;
    if (rooms.some(r => r.id === raw.room)) state.room = raw.room;
    for (const t of tasks) {
      const answer = raw.answers?.[t.id];
      if (typeof answer === 'string' && Object.hasOwn(t.options, answer)) state.answers[t.id] = answer;
    }
    state.submitted = raw.submitted === true;
    return state;
  }
  function grade(state) {
    const answers = sanitize(state).answers;
    const decisions = tasks.map(t => ({ ...t, selected: answers[t.id] || '', correct: t.accept.includes(answers[t.id]) }));
    return { score: decisions.filter(d => d.correct).length, total: tasks.length, decisions };
  }
  const api = { KEY, roomRoles, components, media, ratings, rooms, routes, patches, tasks, byId, fresh, sanitize, grade };
  if (typeof module !== 'undefined') module.exports = api;
  root.CablingModel = api;
})(typeof window === 'undefined' ? globalThis : window);
