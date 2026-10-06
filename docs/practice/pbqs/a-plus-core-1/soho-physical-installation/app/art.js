/* Original SVG artwork. Geometry is authored locally, not fetched from a CDN. */
(function(root){
'use strict';
function socket(type,x=0,y=0){let s='';if(type==='rj45'||type==='rj11'){const w=type==='rj45'?28:19,n=type==='rj45'?8:4;s=`<path d="M${-w/2} -11h${w}v18h-6v4h-${w-12}v-4h-6Z" fill="#142733" stroke="#bccbd1" stroke-width="2"/>`+Array.from({length:n},(_,i)=>`<path d="M${-w/2+4+i*(w-8)/(n-1)} -8v7" stroke="#d6b765" stroke-width="1.7"/>`).join('')}else if(type==='f')s='<circle r="13" fill="#a2b3bc" stroke="#dce6ea" stroke-width="2"/><circle r="9" fill="#dbe2dd" stroke="#586d79" stroke-width="3"/><circle r="2.4" fill="#23313a"/><path d="M-12-5h4m-5 6h4m-2 6h4m15-12h4m-4 6h4m-6 6h4" stroke="#526875"/>';else if(type==='sc')s='<rect x="-13" y="-13" width="26" height="26" rx="2" fill="#498478" stroke="#a8c6ba" stroke-width="2"/><rect x="-8" y="-8" width="16" height="16" fill="#122e33"/><circle r="3.5" fill="#869ba2"/>';return `<g transform="translate(${x} ${y})">${s}</g>`}
function connector(type,x=0,flip=false){let s='';if(type==='rj45'||type==='rj11'){const w=type==='rj45'?36:24,n=type==='rj45'?8:4;s=`<path d="M${-w/2} 24v-34h${w}v34Z" fill="#d9e9ec" stroke="#5b7889" stroke-width="2"/><path d="M-7 23V0h14v23" fill="#b7cbd5" stroke="#5b7889"/><path d="M-6 3v-9H6v9" fill="none" stroke="#698896" stroke-width="2"/>`+Array.from({length:n},(_,i)=>`<path d="M${-w/2+4+i*(w-8)/(n-1)} -7v12" stroke="#ae7f32" stroke-width="2"/>`).join('')}else if(type==='f')s='<path d="M-15 24V-3l5-6h20l5 6v27Z" fill="#aebec8" stroke="#557382" stroke-width="2"/><ellipse cy="-9" rx="11" ry="5" fill="#e7eeea" stroke="#547080"/><path d="M-14 0h28m-28 5h28m-28 5h28m-28 5h28" stroke="#6f8895"/><path d="M0-8v-13" stroke="#ad863c" stroke-width="3"/>';else if(type==='sc')s='<rect x="-13" y="-8" width="26" height="34" rx="2" fill="#538c7b" stroke="#345c60" stroke-width="2"/><path d="M-8-8v-8H8v8" fill="#d7e0dc" stroke="#66828c"/><path d="M-5-16v-8H5v8" fill="#f1efde" stroke="#68828b"/><path d="M-8 1h16m-16 7h16m-16 7h16" stroke="#94b3a1"/>';else if(type==='lc')s='<rect x="-8" y="-6" width="16" height="32" rx="2" fill="#76a7b2" stroke="#416576" stroke-width="2"/><path d="M-4-6v-16h8v16" fill="#f0ecdc" stroke="#68818d"/><path d="M8 18l8-16V-9h-5V3L5 12" fill="#b5d0d7" stroke="#557988" stroke-width="2"/>';else s='<rect x="-9" y="-9" width="18" height="35" rx="6" fill="#b5c3ca" stroke="#577180" stroke-width="2"/><ellipse cy="-9" rx="9" ry="4" fill="#e2e8e6" stroke="#577180"/><path d="M-4-10v-14h8v14" fill="#f0eedf" stroke="#68818d"/><path d="M-13 0h6m14 0h6m-21 5h14m-14 5h14" stroke="#526c7b" stroke-width="3"/>';return `<g transform="translate(${x} 38)${flip?' rotate(12)':''}">${s}</g>`}
function cable(type){return `<svg viewBox="0 0 160 110" aria-hidden="true"><path d="M42 62v12c0 28 76 28 76 0V62" fill="none" stroke="#748b9b" stroke-width="7"/><path d="M42 62v12c0 28 76 28 76 0V62" fill="none" stroke="#aebdc6" stroke-width="2"/>${connector(type,42)}${connector(type,118)}</svg>`}
function equipment(sid,id){const d=SOHO.device(sid,id);let body='';if(d.shape==='wall')body='<rect x="86" y="27" width="128" height="119" rx="7" fill="#e5e9e6" stroke="#8da0aa" stroke-width="2"/><circle cx="150" cy="38" r="3" fill="#92a0a5"/><path d="M148 38h4" stroke="#586e7a"/>';
else if(d.shape==='router')body='<path d="M33 87 18 18m249 69 15-69" stroke="#294a5c" stroke-width="9" stroke-linecap="round"/><path d="M25 90 55 55h190l30 35v58H25Z" fill="#436270" stroke="#284754" stroke-width="2"/><path d="M25 90h250" stroke="#89a3ad"/><path d="M74 67h152m-162 8h171" stroke="#283f4e" stroke-width="3"/>';
else if(d.shape==='pc')body='<rect x="42" y="25" width="141" height="87" rx="5" fill="#314e61"/><rect x="49" y="32" width="127" height="70" rx="2" fill="#a9ced0"/><path d="m111 112-8 17H85m18 0h43" fill="none" stroke="#537482" stroke-width="6"/><rect x="198" y="20" width="62" height="126" rx="5" fill="#4e6d7a" stroke="#294a5c" stroke-width="2"/><path d="M210 36h37m-37 8h37m-37 8h37" stroke="#203d4c" stroke-width="3"/><circle cx="229" cy="68" r="4" fill="#bdcfcd"/>';
else if(d.shape==='printer')body='<path d="M86 19h126v61H86Z" fill="#f8faf9" stroke="#a1b3be" stroke-width="2"/><path d="M101 31h97m-97 11h97m-97 11h73" stroke="#b1c3cb" stroke-width="3"/><rect x="50" y="68" width="200" height="77" rx="10" fill="#b1c1ca" stroke="#688591" stroke-width="2"/><path d="M79 96h143v15H79Z" fill="#354f60"/><path d="m86 111-12 25h154l-11-25" fill="#d5dfe3" stroke="#75909b"/><rect x="204" y="78" width="26" height="10" fill="#365b68"/>';
else if(d.shape==='switch')body='<path d="M20 89 43 54h216l21 35v57H20Z" fill="#6f8692" stroke="#3a586b" stroke-width="2"/><path d="M20 89h260" stroke="#b4c6cc"/><path d="M58 65h186m-191 9h197" stroke="#4c6473" stroke-width="3"/>';
else if(d.shape==='ont')body='<rect x="65" y="20" width="170" height="126" rx="12" fill="#e3e9e6" stroke="#859fa9" stroke-width="2"/><path d="M78 37h145m-145 7h145m-145 7h145" stroke="#b0c4c8" stroke-width="3"/><circle cx="88" cy="71" r="3" fill="#507a74"/><text x="99" y="75" font-size="9" fill="#4c6372">PWR · PON · LOS</text>';
else body=`<rect x="${id==='cable'?92:46}" y="${id==='cable'?15:58}" width="${id==='cable'?116:208}" height="${id==='cable'?131:88}" rx="10" fill="#496572" stroke="#274553" stroke-width="2"/><path d="M109 ${id==='cable'?32:64}h82m-82 8h82m-82 8h82" stroke="#294755" stroke-width="3"/><circle cx="116" cy="74" r="3" fill="#91b7aa"/><text x="129" y="78" font-size="8" fill="#d0dedf">POWER</text>`;
const ps=d.ports;const portArt=ps.map((p,i)=>{const x=portX(i,ps.length);return socket(p.type,x,163)+`<text x="${x}" y="136" text-anchor="middle" font-size="9" font-weight="700" fill="#f0f4f5">${p.mark}</text>`}).join('');return `<svg viewBox="0 0 300 190" aria-hidden="true">${body}<rect x="15" y="124" width="270" height="62" rx="6" fill="#274655" stroke="#7d98a5"/>${portArt}</svg>`}
function tool(id){
// Tool silhouettes and hardware details stay legible in the activity's 110px thumbnails.
// Keep all geometry local; these SVGs are also reused by the lesson cards.
let body='';
if(id==='crimper')body=`
 <path d="M66 58 45 105q-3 7 6 8l7-2 24-45 23 44q3 5 10 1l4-4-23-50" fill="#326e86" stroke="#294858" stroke-width="3"/>
 <path d="m62 76-12 28m49-27 14 26" stroke="#91b5c3" stroke-width="3" stroke-linecap="round"/>
 <path d="M53 13h53l9 12-9 29-15 16H70L53 53l-9-27Z" fill="#aebfc8" stroke="#344e5c" stroke-width="3"/>
 <path d="M52 28h27v23H56Zm33 0h19l-4 23H85Z" fill="#203b4a" stroke="#e4ecee" stroke-width="1.5"/>
 <path d="M57 31v7m4-7v7m4-7v7m4-7v7m4-7v7m16-7v7m4-7v7m4-7v7" stroke="#c0d0d7" stroke-width="2"/>
 <path d="M56 46h21m9 0h14M65 18h31" stroke="#657f8c" stroke-width="3"/>
 <circle cx="81" cy="59" r="7" fill="#dae4e8" stroke="#344e5c" stroke-width="2"/><path d="m78 59h6" stroke="#587481" stroke-width="2"/>
 <path d="m75 77 14 5-12 6 16 4" fill="none" stroke="#526977" stroke-width="2"/>`;
else if(id==='stripper')body=`
 <g transform="rotate(-22 80 60)">
 <path d="M43 42h59q16 0 17 17v12H49q-17 0-17-14 0-9 11-15Z" fill="#e4b644" stroke="#785d2c" stroke-width="2.5"/>
 <circle cx="119" cy="59" r="23" fill="#e4b644" stroke="#785d2c" stroke-width="2.5"/>
 <circle cx="119" cy="59" r="13" fill="#edf3f5" stroke="#a17a2c" stroke-width="2"/>
 <path d="M34 42h54v12H32Z" fill="#354f5e" stroke="#263e4c" stroke-width="2"/>
 <path d="M46 42v12m14-12v12m14-12v12" stroke="#c5d2d8" stroke-width="3"/>
 <path d="M51 61h30m-27 5h25" stroke="#b28a32" stroke-width="2"/>
 <circle cx="91" cy="59" r="4" fill="#d6dfe1" stroke="#6a777b"/>
 </g>`;
else if(id==='punchdown')body=`
 <g transform="rotate(34 80 61)">
 <path d="M76 9h8v29h-8Z" fill="#c4d1d7" stroke="#4d6572" stroke-width="2"/>
 <path d="M75 10V5h3v5h4V5h3v9H75Z" fill="#617986" stroke="#354f5d" stroke-width="1.5"/>
 <rect x="71" y="32" width="18" height="12" rx="3" fill="#304c5e"/>
 <path d="M69 42q11-4 22 0l4 17-3 40q-12 10-24 0l-3-40Z" fill="#da9440" stroke="#7c562e" stroke-width="2.5"/>
 <path d="M68 63h24l-2 28q-10 6-20 0Z" fill="#304c5e"/>
 <path d="M72 70h16m-16 7h16m-16 7h16" stroke="#7793a0" stroke-width="2"/>
 <rect x="73" y="47" width="14" height="9" rx="3" fill="#405e6d"/><path d="M80 49v5" stroke="#dfe7e9" stroke-width="2"/>
 <path d="M71 103h18" stroke="#304c5e" stroke-width="5" stroke-linecap="round"/>
 </g>`;
else if(id==='toner')body=`
 <path d="M42 48V30q0-18-17-15M55 48V29q0-11 13-13" fill="none" stroke="#405968" stroke-width="2.5"/>
 <path d="m18 12 12 4-4 10-12-4Z" fill="#c76650" stroke="#783f36" stroke-width="1.5"/><path d="m14 22-3 5 9 2 6-3" fill="#b6c6ce" stroke="#526b79"/>
 <path d="m68 11 10 5-6 11-10-5Z" fill="#304c5e" stroke="#253e4b" stroke-width="1.5"/><path d="m62 22-3 5 8 4 5-4" fill="#b6c6ce" stroke="#526b79"/>
 <rect x="22" y="44" width="57" height="65" rx="9" fill="#477990" stroke="#294b5c" stroke-width="2.5"/>
 <rect x="29" y="53" width="43" height="45" rx="4" fill="#d3e0e5"/>
 <circle cx="38" cy="63" r="3" fill="#398866"/><rect x="49" y="59" width="16" height="7" rx="2" fill="#304c5e"/>
 <path d="M37 77h25m-25 5h25m-25 5h25" stroke="#5d7885" stroke-width="2"/>
 <g transform="rotate(18 116 66)">
 <path d="m113 36 3-26 4 26" fill="#bdcbd3" stroke="#4a6674" stroke-width="2"/>
 <path d="M110 36h13l4 56q-10 16-20 0Z" fill="#e5b65d" stroke="#695739" stroke-width="2.5"/>
 <path d="M112 44h9m-9 4h9m-9 4h9m-9 4h9" stroke="#625d4e" stroke-width="2"/>
 <rect x="112" y="64" width="9" height="15" rx="4" fill="#355567"/>
 <path d="M110 87h14" stroke="#ac803c" stroke-width="2"/>
 </g>`;
else if(id==='tester')body=`
 <rect x="22" y="20" width="66" height="91" rx="9" fill="#477990" stroke="#294b5c" stroke-width="2.5"/>
 <rect x="97" y="33" width="40" height="78" rx="7" fill="#708d9c" stroke="#294b5c" stroke-width="2.5"/>
 <g transform="translate(55 29) scale(.7)">${socket('rj45')}</g>
 <g transform="translate(117 42) scale(.7)">${socket('rj45')}</g>
 <rect x="31" y="42" width="48" height="61" rx="4" fill="#e0e9eb"/><rect x="104" y="55" width="26" height="48" rx="3" fill="#e0e9eb"/>
 ${Array.from({length:8},(_,i)=>`<text x="40" y="${50+i*6.6}" font-size="5.5" font-family="sans-serif" fill="#304d5d">${i+1}</text><circle cx="51" cy="${48+i*6.6}" r="2" fill="#3d8a64"/><text x="109" y="${61+i*5.4}" font-size="5" font-family="sans-serif" fill="#304d5d">${i+1}</text><circle cx="121" cy="${59+i*5.4}" r="1.8" fill="#3d8a64"/>`).join('')}
 <rect x="63" y="53" width="8" height="17" rx="3" fill="#304d5d"/><path d="M64 57h6" stroke="#8ea8b3" stroke-width="2"/>
 <circle cx="67" cy="84" r="4" fill="#dba747"/>`;
else if(id==='loopback')body=`
 <path d="M65 66v22c0 25 49 25 49 0V53c0-21-29-21-29 0v13" fill="none" stroke="#ad6932" stroke-width="6"/>
 <path d="M65 66v22c0 25 49 25 49 0V53c0-21-29-21-29 0v13" fill="none" stroke="#edbb76" stroke-width="2"/>
 <path d="M73 66v17c0 15 30 15 30 0V57c0-13-22-13-22 0v9" fill="none" stroke="#447d95" stroke-width="5"/>
 <path d="M52 18h39l8 9v43H52Z" fill="#d3e3e9" fill-opacity=".92" stroke="#4e7082" stroke-width="2.5"/>
 <path d="M91 18v43l8 9M53 61h38" fill="none" stroke="#92adb9" stroke-width="1.5"/>
 ${Array.from({length:8},(_,i)=>`<path d="M${57+i*4.5} 22v16" stroke="#b78331" stroke-width="2.7"/>`).join('')}
 <path d="M64 62V43h16v19l-3 12H67Z" fill="#eef5f6" fill-opacity=".7" stroke="#688b9d" stroke-width="1.5"/>
 <path d="M68 46h8" stroke="#688b9d" stroke-width="2"/>`;
else if(id==='wifi')body=`
 <rect x="47" y="9" width="66" height="104" rx="10" fill="#304f62" stroke="#233e4e" stroke-width="2.5"/>
 <rect x="53" y="22" width="54" height="77" rx="3" fill="#e0edef"/>
 <path d="M73 16h14" stroke="#8ea8b4" stroke-width="2" stroke-linecap="round"/>
 <path d="M70 35q10-9 20 0m-16 4q6-5 12 0" fill="none" stroke="#37778a" stroke-width="2.5" stroke-linecap="round"/><circle cx="80" cy="43" r="2" fill="#37778a"/>
 <path d="M58 51v29h44M58 60h44m-44 10h44" fill="none" stroke="#a7c0c8" stroke-width="1"/>
 <path d="M59 79q12-47 24 0" fill="#599caf" fill-opacity=".2" stroke="#37778a" stroke-width="2"/>
 <path d="M76 79q12-36 25 0" fill="#d59b4c" fill-opacity=".25" stroke="#b37d33" stroke-width="2"/>
 <path d="M59 88h22m-22 5h15" stroke="#708e9a" stroke-width="2"/><path d="M89 92v-4m5 4v-7m5 7v-10" stroke="#39866e" stroke-width="3"/>
 <path d="M74 106h12" stroke="#91aab6" stroke-width="3" stroke-linecap="round"/>`;
else body=`
 <path d="m17 50 18-22h92l16 22v48H17Z" fill="#708b9a" stroke="#304f62" stroke-width="2.5"/>
 <path d="M17 50h126v48H17Z" fill="#36596c" stroke="#304f62" stroke-width="2"/>
 <path d="M42 36h30m16 0h30" stroke="#c0d0d7" stroke-width="2"/>
 <path d="m69 33 4 3-4 3m22-6-4 3 4 3" fill="none" stroke="#c0d0d7" stroke-width="1.5"/>
 <text x="50" y="62" text-anchor="middle" font-family="sans-serif" font-size="6" fill="#e7f0f2">NETWORK</text>
 <text x="110" y="62" text-anchor="middle" font-family="sans-serif" font-size="6" fill="#e7f0f2">MONITOR</text>
 ${[35,65,95,125].map(x=>`<g transform="translate(${x} 78) scale(.75)">${socket('rj45')}</g>`).join('')}
 <path d="M80 65v23" stroke="#8faab9"/><circle cx="28" cy="92" r="1.8" fill="#92c590"/><circle cx="58" cy="92" r="1.8" fill="#92c590"/>
 <path d="M28 100v4h13v-4m78 0v4h13v-4" fill="#304f62"/>`;
return `<svg viewBox="0 0 160 120" aria-hidden="true"><rect x="3" y="3" width="154" height="114" rx="10" fill="#edf3f5"/>${body}</svg>`;}
function job(id){if(id==='rj45'||id==='rj11')return cable(id);let body='';if(id==='punch')body='<rect x="22" y="34" width="116" height="54" rx="5" fill="#657f8c"/><path d="M32 50h96M32 61h96M32 72h96" stroke="#dbe5e7" stroke-width="3"/><path d="M46 24v21m20-21v21m20-21v21m20-21v21" stroke="#d29b5c" stroke-width="4"/>';else body='<path d="M22 65h42" stroke="#506f7f" stroke-width="16" stroke-linecap="round"/><path d="M64 65h28" stroke="#d7e0c8" stroke-width="10"/><path d="M92 65h42" stroke="#d29b5c" stroke-width="3"/><path d="M92 58h42m-42 14h42" stroke="#85a8bb" stroke-width="3"/>';return `<svg viewBox="0 0 160 110" aria-hidden="true"><rect x="3" y="3" width="154" height="104" rx="10" fill="#edf3f5"/>${body}</svg>`;}
function portX(i,n){return n===1?150:40+i*220/(n-1)}
root.SOHOArt={socket,cable,equipment,tool,job,portX};
})(globalThis);
