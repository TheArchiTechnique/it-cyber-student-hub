(function (root) {
  'use strict';
  const photos = {
  "utp": {
    "file": "assets/inspection/01.webp",
    "source": "https://commons.wikimedia.org/wiki/File:UTP_cable.jpg",
    "author": "Baran Ivo",
    "license": "Public domain",
    "licenseURL": "",
    "changes": "Encoded as WebP; uncropped",
    "width": 700,
    "height": 571,
    "alt": "Four exposed color-coded pairs of insulated wires emerging from a jacket, with no visible metallic shield."
  },
  "stp": {
    "file": "assets/inspection/02.webp",
    "source": "https://commons.wikimedia.org/wiki/File:Cross_section_of_a_shielded_Cat6_patch_cable.jpg",
    "author": "TubeTimeUS",
    "license": "CC BY-SA 4.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/4.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "Cut end of a four-pair copper cable showing metallic shielding around the conductors; millimeter ruler beneath."
  },
  "coax": {
    "file": "assets/inspection/03.webp",
    "source": "https://commons.wikimedia.org/wiki/File:Cross_section_of_an_LMR-195_coaxial_cable.jpg",
    "author": "TubeTimeUS",
    "license": "CC BY-SA 4.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/4.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "Cable cross section showing one central conductor, surrounding dielectric, circular conducting shield, and outer jacket."
  },
  "dac": {
    "file": "assets/inspection/04.webp",
    "source": "https://commons.wikimedia.org/wiki/File:Twinax-CAB-10GSFP-P8M.jpg",
    "author": "Labsy",
    "license": "CC BY-SA 4.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/4.0",
    "changes": "Encoded as WebP; uncropped",
    "width": 800,
    "height": 800,
    "alt": "Black cable assembly with two captive metal pluggable equipment ends."
  },
  "rj11": {
    "file": "assets/inspection/05.webp",
    "source": "https://commons.wikimedia.org/wiki/File:6P2C_RJ-11.jpg",
    "author": "Aeroid",
    "license": "CC BY-SA 4.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/4.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 913,
    "alt": "Narrow transparent six-position modular telephone plug with two central metal contacts."
  },
  "rj45": {
    "file": "assets/inspection/06.webp",
    "source": "https://commons.wikimedia.org/wiki/File:Patch_cable_with_RJ45_connector.jpg",
    "author": "www.heimnetzwerke.net",
    "license": "CC BY 4.0",
    "licenseURL": "https://creativecommons.org/licenses/by/4.0",
    "changes": "Cropped to connector area; encoded as WebP",
    "width": 800,
    "height": 1400,
    "alt": "Close view of a shielded eight-position modular plug, showing eight gold contacts, transparent housing, and strain-relief boot."
  },
  "f": {
    "file": "assets/inspection/07.webp",
    "source": "https://commons.wikimedia.org/wiki/File:F-Stecker_und_Kabel.jpg",
    "author": "Peter Trieb",
    "license": "Public domain",
    "licenseURL": "",
    "changes": "Encoded as WebP; uncropped",
    "width": 448,
    "height": 320,
    "alt": "Coaxial cable end with a threaded coupling nut and central conductor."
  },
  "bnc": {
    "file": "assets/inspection/08.webp",
    "source": "https://commons.wikimedia.org/wiki/File:BNC_connector_(male).jpg",
    "author": "Krzysztof Burghardt",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0/",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "Round metal coaxial plug with a bayonet coupling and central electrical contact."
  },
  "lc": {
    "file": "assets/inspection/09.webp",
    "source": "https://commons.wikimedia.org/wiki/File:LC-optical-fiber-connector-hdr-0a.jpg",
    "author": "Adamantios",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "A pair of small optical plugs with plastic retaining latches and projecting optical ferrules."
  },
  "sc": {
    "file": "assets/inspection/10.webp",
    "source": "https://commons.wikimedia.org/wiki/File:SC-optical-fiber-connector-hdr-0a.jpg",
    "author": "Adamantios",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "A pair of square optical plugs with push-pull housings and projecting optical ferrules."
  },
  "st": {
    "file": "assets/inspection/11.webp",
    "source": "https://commons.wikimedia.org/wiki/File:ST-optical-fiber-connector-hdr-0a.jpg",
    "author": "Adamantios",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 898,
    "height": 1400,
    "alt": "Two round optical plugs with bayonet couplings and projecting optical ferrules."
  },
  "mpo": {
    "file": "assets/inspection/12.webp",
    "source": "https://commons.wikimedia.org/wiki/File:MPO_Stecker_HR.jpg",
    "author": "Reichle & De-Massari",
    "license": "CC BY-SA 3.0 de",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1113,
    "alt": "Front view of a rectangular optical connector with multiple fiber positions in a shared ferrule."
  },
  "sfp": {
    "file": "assets/inspection/13.webp",
    "source": "https://commons.wikimedia.org/wiki/File:SFP-side.jpg",
    "author": "Adamantios",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0/",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "Side view of a compact metal pluggable transceiver with a matchstick for scale."
  },
  "qsfp": {
    "file": "assets/inspection/14.webp",
    "source": "https://commons.wikimedia.org/wiki/File:QSFP-40G-SR4_Transceiver.jpg",
    "author": "Jesseschulman; background/levels edit by Nosachevd",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0",
    "changes": "Encoded as WebP; uncropped",
    "width": 403,
    "height": 247,
    "alt": "A wider metal pluggable optical transceiver with a single rectangular optical interface."
  },
  "tester": {
    "file": "assets/inspection/15.webp",
    "source": "https://commons.wikimedia.org/wiki/File:Network_cable_tester.jpg",
    "author": "George Shuklin",
    "license": "Public domain",
    "licenseURL": "",
    "changes": "Encoded as WebP; uncropped",
    "width": 1119,
    "height": 900,
    "alt": "Copper cable wire-map tester with numbered conductor indicators and a separate remote unit."
  },
  "toner": {
    "file": "assets/inspection/16.webp",
    "source": "https://commons.wikimedia.org/wiki/File:FLUKE_networks_IntelliTone_Pro_200.JPG",
    "author": "Dmitry G",
    "license": "CC BY-SA 3.0",
    "licenseURL": "https://creativecommons.org/licenses/by-sa/3.0",
    "changes": "Resized and encoded as WebP; uncropped",
    "width": 1400,
    "height": 1050,
    "alt": "A signal-generating unit and handheld tracing probe with test leads."
  }
};
  if (typeof module !== 'undefined') module.exports = photos;
  root.CablingPhotos = photos;
})(typeof window === 'undefined' ? globalThis : window);
