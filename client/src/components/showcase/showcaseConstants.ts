export interface ShowcaseOptionGroup {
  category: string;
  items: string[];
}

export const DEFAULT_SHOWCASE_OPTIONS: ShowcaseOptionGroup[] = [
  {
    category: 'Comfort & Interieur',
    items: [
      'Automatische Climate Control (Airconditioning)',
      'Multifunctioneel stuurwiel met stuurwielbediening',
      'Elektrisch bedienbare ramen voor en achter',
      'Middenarmsteun voor en bekerhouders',
      'In hoogte verstelbare bestuurdersstoel',
      'Achterbank in delen neerklapbaar met ISOFIX',
    ],
  },
  {
    category: 'Veiligheid & Rijassistentie',
    items: [
      'Cruise Control met snelheidsbegrenzer',
      'Parkeersensoren / Achteruitrijhulp',
      'ABS, Electronic Stability Program (ESP) en Traction Control',
      'Airbags rondom (inclusief zij- en gordijnairbags)',
      'Centrale deurvergrendeling met afstandsbediening',
    ],
  },
  {
    category: 'Multimedia & Exterieur',
    items: [
      'Full-color touchscreen multimedia & audiosysteem',
      'Bluetooth handsfree telefonie en audiostreaming',
      'Lichtmetalen velgen met goede kwaliteitsbanden',
      'Elektrisch verstelbare en verwarmbare buitenspiegels',
      'LED-dagrijverlichting en mistlampen',
    ],
  },
];

export const SUGGESTED_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  'Comfort & Interieur': [
    'Stoelverwarming voor',
    'Stoelverwarming achter',
    'Stuurwielverwarming',
    'Keyless Entry & Go',
    'Panoramadak / Schuifdak',
    'Lederen / Halflederen bekleding',
    'Elektrisch verstelbare stoelen (met memory)',
    'Automatisch dimmende binnenspiegel',
    'Gescheiden klimaatregeling (dual-zone)',
    'Head-up Display',
    'Zonneschermen achterportieren',
  ],
  'Veiligheid & Rijassistentie': [
    'Achteruitrijcamera',
    '360° Rondomzicht Camera',
    'Dodehoekdetectie (Blind Spot)',
    'Lane Departure Warning / Lane Assist',
    'Adaptieve Cruise Control (ACC)',
    'Verkeersbordherkenning',
    'Noodremassistent (Front Assist / AEB)',
    'Vermoeidheidsherkenning',
    'Grootlichtassistent',
    'Bandenspanningscontrolesysteem (TPMS)',
  ],
  'Multimedia & Exterieur': [
    'Apple CarPlay & Android Auto',
    'Draadloze smartphonelader (Qi)',
    'DAB+ Digitale Radio',
    'Geïntegreerd Full-map Navigatiesysteem',
    'Premium Audiosysteem (Harman/JBL/Bose)',
    'Privacy Glass (extra getinte ruiten)',
    'Trekhaak (afneembaar)',
    'Trekhaak (vast)',
    'Elektrische achterklep',
    'LED Koplampen & achterlichten',
    'Matrix LED verlichting',
    'Dakrails',
  ],
};
