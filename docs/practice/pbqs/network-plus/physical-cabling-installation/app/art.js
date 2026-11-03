(function (root) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (view, title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="${esc(title)}">${body}</svg>`;
  function desk(x, y) {
    return `<g transform="translate(${x} ${y})"><rect width="72" height="37" rx="5" fill="#d8c4a6" stroke="#967a59"/><rect x="21" y="5" width="30" height="19" rx="2" fill="#233e52"/><path d="M36 24v6m-10 0h20" stroke="#fff" stroke-width="2"/><rect x="22" y="44" width="28" height="19" rx="8" fill="#c4ced7" stroke="#8197a8"/></g>`;
  }
  function miniRack(x, y) {
    return `<g transform="translate(${x} ${y})"><rect width="50" height="60" rx="3" fill="#243d50"/><rect x="6" y="6" width="38" height="11" fill="#dce7eb"/><rect x="6" y="22" width="38" height="11" fill="#7998a9"/><rect x="6" y="38" width="38" height="11" fill="#dce7eb"/><path d="M12 10h25m-25 16h25m-25 16h25" stroke="#264c60" stroke-width="3"/></g>`;
  }
  function building(annotated = false) {
    let body = `<defs><pattern id="${annotated ? 'lesson' : 'activity'}-hatch" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12 12 0" stroke="#dfbd68" stroke-width="2"/></pattern></defs><rect width="1100" height="790" fill="#eaf0f3"/><path d="M43 28h1005l18 14H25z" fill="#496576"/><rect x="43" y="42" width="1005" height="705" fill="#fff" stroke="#6e8797" stroke-width="5"/><rect x="322" y="55" width="78" height="672" fill="#dfe9ec"/><text x="361" y="760" text-anchor="middle" font-size="15" fill="#3f5c70">Vertical pathway</text>`;
    const names = ['Third floor · Offices', 'Second floor · Offices and workshop', 'First floor · Reception and offices'];
    [3, 2, 1].forEach((floor, i) => {
      const y = 55 + i * 225, room = floor + '01';
      body += `<g font-family="system-ui,sans-serif" fill="#29495e"><text x="64" y="${y + 23}" font-size="18" font-weight="700">${names[i]}</text><rect x="64" y="${y + 38}" width="235" height="166" rx="3" fill="#e8f1f5" stroke="#819cab" stroke-width="2"/><text x="78" y="${y + 61}" font-size="16">Room ${room}</text>${miniRack(82, y + 90)}<path d="M299 ${y + 155}v28m0-28a28 28 0 0 1-28 28" stroke="#819cab" fill="none"/><rect x="420" y="${y + 38}" width="605" height="166" fill="#f8fafb" stroke="#b1c0ca" stroke-width="2"/><path d="M620 ${y + 38}v166m200-166v166" stroke="#b1c0ca" stroke-width="2"/><rect x="420" y="${y + 177}" width="605" height="27" fill="#e8eef1"/><text x="441" y="${y + 61}" font-size="14">${floor === 1 ? 'Reception' : 'Office ' + floor + '02'}</text><text x="642" y="${y + 61}" font-size="14">${floor === 2 ? 'Workshop' : 'Office ' + floor + '03'}</text><text x="842" y="${y + 61}" font-size="14">Office ${floor}04</text>${desk(465, y + 85)}${desk(663, y + 85)}${desk(866, y + 85)}<path d="M570 ${y + 204}v-28a28 28 0 0 0-28 28m228 0v-28a28 28 0 0 0-28 28m228 0v-28a28 28 0 0 0-28 28" fill="none" stroke="#819cab"/>`;
      if (floor === 2) body += `<rect x="420" y="${y + 145}" width="605" height="29" fill="url(#${annotated ? 'lesson' : 'activity'}-hatch)"/><path d="M1000 ${y + 155}H1034V${y + 215}H1000" fill="none" stroke="#9b7428"/><text x="995" y="${y + 223}" text-anchor="end" font-size="13">Environmental-air return pathway</text>`;
      body += `<path data-route-line="h${floor}" d="M300 ${y + 111}H414V${y + 190}H940V${y + 148}" stroke="#168a87" stroke-width="5" fill="none" stroke-linejoin="round"/><circle cx="940" cy="${y + 148}" r="7" fill="#fff" stroke="#168a87" stroke-width="3"/><text x="956" y="${y + 151}" font-size="12">Jack</text><rect x="432" y="${y + 178}" width="96" height="23" rx="4" fill="#fff"/><text x="442" y="${y + 195}" font-size="14" font-weight="700">H${floor} · ${[0,62,70,78][floor]} m</text></g>`;
      if (annotated) body += `<rect x="144" y="${y + 94}" width="130" height="57" rx="6" fill="#173d53"/><text x="209" y="${y + 129}" text-anchor="middle" font-size="24" fill="#fff" font-family="system-ui">${floor === 1 ? 'MDF' : 'IDF'}</text>`;
    });
    body += `<path data-route-line="b1" d="M299 622H345V397H299" fill="none" stroke="#ab6c29" stroke-width="5" stroke-linejoin="round"/><path data-route-line="b2" d="M299 634H377V172H299" fill="none" stroke="#6e59a3" stroke-width="5" stroke-linejoin="round"/><g font-family="system-ui,sans-serif" font-size="14" font-weight="700"><rect x="316" y="456" width="89" height="28" rx="4" fill="#fff"/><text x="324" y="475" fill="#87521e">B1 · 55 m</text><rect x="316" y="233" width="89" height="28" rx="4" fill="#fff"/><text x="324" y="252" fill="#5d468c">B2 · 95 m</text><path d="M4 697H62" stroke="#496576" stroke-width="5"/><text x="64" y="718" fill="#3f5c70" font-weight="400">Provider entrance</text></g>`;
    return svg('0 0 1100 790', annotated ? 'Structured cabling example: first-floor MDF serves its floor and two upper-floor IDFs, with separate backbone links and horizontal runs to work areas.' : 'Three-story office: Rooms 101, 201, and 301 beside a vertical pathway. B1 joins 101 to 201; B2 joins 101 to 301. H1, H2, H3 serve each floor. H2 crosses an air-return pathway.', body);
  }
  function unit(type) {
    let body = '<rect x="15" y="12" width="490" height="89" rx="5" fill="#294455" stroke="#152e3d" stroke-width="3"/><path d="M28 35v45m465-45v45" stroke="#c6d5df" stroke-width="4"/>';
    if (type === 'copper' || type === 'switch') {
      for (let i = 0; i < 12; i++) {
        const x = 60 + i * 29;
        body += `<path d="M${x} 43h19v21h-4v5h-11v-5h-4z" fill="#101f29" stroke="#bed0dc"/><path d="M${x + 4} 47h11" stroke="#d1b772" stroke-width="3"/>`;
        if (type === 'switch') body += `<circle cx="${x + 9}" cy="33" r="3" fill="#72cb85"/>`;
        else body += `<text x="${x + 9}" y="87" text-anchor="middle" fill="#d1dfe5" font-size="10">${i + 1}</text>`;
      }
      if (type === 'switch') body += '<circle cx="42" cy="34" r="4" fill="#72cb85"/><text x="34" y="88" font-size="9" fill="#fff">PWR</text><rect x="420" y="39" width="27" height="16" fill="#111f28" stroke="#ccc"/><rect x="453" y="39" width="27" height="16" fill="#111f28" stroke="#ccc"/><text x="446" y="83" font-size="10" fill="#e2edf3" text-anchor="middle">SFP+</text>';
    } else {
      body += '<rect x="49" y="25" width="410" height="62" rx="3" fill="#c7d8df"/>';
      for (let i = 0; i < 8; i++) {
        const x = 61 + i * 46;
        body += `<rect x="${x}" y="43" width="34" height="18" rx="2" fill="#6cb7bb" stroke="#25515a"/><path d="M${x + 8} 46v12m10-12v12m-2-12v12" stroke="#183c4b" stroke-width="3"/><text x="${x + 16}" y="78" text-anchor="middle" font-size="9" fill="#294455">${i + 1}</text>`;
      }
    }
    return svg('0 0 520 112', type === 'switch' ? 'Rack unit with RJ45 ports, link LEDs, power indicator, and SFP+ cages.' : type === 'copper' ? 'Rack unit with twelve numbered RJ45 sockets and no status LEDs.' : 'Rack unit with eight paired small optical adapters in a protected enclosure.', body);
  }
  function cable(id) {
    const fiber = ['om3', 'os2', 'fiberPatch'].includes(id), dac = id === 'dac';
    const color = id === 'os2' ? '#b99525' : fiber ? '#268c99' : dac ? '#33495a' : '#3c78ba';
    let body = `<path d="M22 36C22 10 104 9 104 32S33 62 40 34S92 24 91 48" stroke="${color}" stroke-width="${dac ? 7 : 5}" fill="none"/>`;
    body += `<circle cx="22" cy="36" r="5" fill="${color}"/><circle cx="91" cy="48" r="5" fill="${color}"/>`;
    return svg('0 0 120 72', 'Schematic cable illustration; use the label and work order for its specification.', body);
  }
  function wiring(standard) {
    const colors = root.CablingInspection.wiring[standard];
    let body = `<defs>${['green','orange','blue','brown'].map(c => `<pattern id="stripe-${standard}-${c}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="white"/><path d="M-3 3 3-3M0 10 10 0M7 13 13 7" stroke="${{green:'#16834d',orange:'#d17b13',blue:'#206ac2',brown:'#88532d'}[c]}" stroke-width="4"/></pattern>`).join('')}</defs><rect width="520" height="300" rx="8" fill="#f0f5f7"/><g font-family="system-ui,sans-serif" fill="#203e53"><text x="22" y="30" font-size="22" font-weight="700">T568${standard}</text><text x="260" y="57" font-size="14" text-anchor="middle">Mating nose ↑</text><rect x="36" y="72" width="448" height="170" rx="8" fill="#dce8ed" stroke="#7993a3" stroke-width="2"/>`;
    colors.forEach((name,i) => {
      const x = 57+i*51, color = name.split('/').at(-1).toLowerCase(), striped = name.startsWith('White/');
      const fill = striped ? `url(#stripe-${standard}-${color})` : {green:'#16834d',orange:'#d17b13',blue:'#206ac2',brown:'#88532d'}[color];
      body += `<rect x="${x}" y="89" width="31" height="56" fill="#d8b14b" stroke="#897133"/><rect data-pin="${i+1}" x="${x}" y="136" width="31" height="92" fill="${fill}" stroke="#536d7f"/><text x="${x+15.5}" y="263" text-anchor="middle" font-size="18">${i+1}</text>`;
    });
    body += '<text x="260" y="290" text-anchor="middle" font-size="14">Cable enters from below · latch underneath</text></g>';
    return svg('0 0 520 300', `T568${standard}, contact-side view, nose up, latch underneath. Pins 1 through 8, left to right: ${colors.join(', ')}.`, body);
  }
  function vfl() {
    return svg('0 0 520 225','Original schematic of a visible-light fiber fault locator and visible light leaking at a damaged section of fiber.', '<rect width="520" height="225" rx="8" fill="#eff4f7"/><g font-family="system-ui,sans-serif" fill="#29495e"><rect x="25" y="74" width="170" height="49" rx="9" fill="#426579"/><rect x="164" y="86" width="48" height="25" rx="3" fill="#a8bdc8"/><circle cx="65" cy="98" r="10" fill="#d4e3e8"/><text x="110" y="60" text-anchor="middle" font-size="17">Visible-light source</text><path d="M211 99H320Q347 99 349 133L351 156Q354 185 405 185H476" fill="none" stroke="#9f7754" stroke-width="9"/><path d="M211 99H320Q347 99 349 133L351 156Q354 185 405 185H476" fill="none" stroke="#cc3829" stroke-width="3"/><path d="M345 139l-19-12m23 12 15-18m-13 22 22 7" stroke="#cf3a26" stroke-width="4"/><text x="282" y="82" font-size="16">Fiber</text><text x="365" y="122" font-size="15">Accessible fault</text><text x="26" y="207" font-size="13">Illustration · visible continuity is not an optical loss measurement</text></g>');
  }
  root.CablingArt = { esc, building, unit, cable, wiring, vfl };
})(typeof window === 'undefined' ? globalThis : window);
