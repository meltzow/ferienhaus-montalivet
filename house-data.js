window.HOUSE_DATA = {
  houseName: "Ferienhaus Montalivet",

  // Bei jeder inhaltlichen Änderung Version und Datum aktualisieren.
  siteVersion: "2.1",
  lastUpdated: "14.08.2026",

  // PHASE 1: Hier die WhatsApp-Nummer des Hauseigentümers eintragen.
  // Format: Ländervorwahl + Nummer OHNE +, Leerzeichen oder führende 0.
  // Beispiel für Deutschland: "491701234567"
  ownerWhatsApp: "",

  // Offiziell geprüfter Müllplan. Bei Jahreswechsel bitte neu prüfen.
  wasteScheduleYear: 2026,

  topics: [
    {
      id: "basics",
      icon: "🏠",
      title: "Gut zu wissen",
      teaser: "Bettwäsche, Handtücher, Fahrräder & Kühlschrank",
      eyebrow: "Im Haus",
      updatedAt: "08/26",
      items: [
        "Bettlaken liegen in den Schränken der jeweiligen Zimmer.",
        "Bettwäsche sowie zusätzliche Kissen und Decken liegen in den Schränken bei der Garderobe.",
        "Handtücher sind in den Bädern.",
        "Im Schuppen stehen Fahrräder, die gerne genutzt werden dürfen. Fahrradtasche und Schloss sind ebenfalls vorhanden.",
        "Der große Kühlschrank im Schuppen darf ebenfalls genutzt werden.",
        "Im Raum hinter dem Schuppen gibt es einen Wäschetrockner.",
        "In Vendays gibt es mehrere Bäcker, eine Apotheke, einen Supermarkt, eine Tankstelle, einen Geldautomaten und eine Post."
      ]
    },
    {
      id: "laundry",
      icon: "🧺",
      title: "Wäsche",
      teaser: "Waschmaschine, Trockner, Leine & Bügeleisen",
      eyebrow: "Waschen",
      updatedAt: "08/26",
      items: [
        "Die Waschmaschine steht im Bad; die Programmbeschreibung befindet sich dort.",
        "Die Wäscheleine ist hinter dem kleinen Schuppen.",
        "Trockner und Wäscheständer befinden sich an der Rückseite des großen Schuppens.",
        "Das Bügeleisen steht in der Kammer im Flur."
      ]
    },
    {
      id: "waste",
      icon: "🗑️",
      title: "Müll",
      teaser: "Offizieller Müllplan 2026 für Montalivet",
      eyebrow: "Entsorgung",
      updatedAt: "08/26",
      callout: "2026: Mittwochmorgen Verpackungen/Papier (gelb) + Bioabfall (grün). Restmüll (schwarz) Donnerstagmorgen. In Montalivet im Juli und August: jeden Donnerstag. Außerhalb Juli/August: laut offiziellem Plan in ungeraden Kalenderwochen.",
      items: [
        "Die Tonnen für die morgendliche Abholung am Vorabend an den Straßenrand stellen; der Griff soll zur Straße zeigen.",
        "Gelbe Tonne: Verpackungen und Papier – Mittwochmorgen.",
        "Grüne Tonne: Bio-/Lebensmittelabfälle – Mittwochmorgen.",
        "Schwarze Tonne: Restmüll – Donnerstagmorgen.",
        "Sonderregel Montalivet im Juli und August: Restmüll jeden Donnerstag.",
        "Außerhalb Juli/August: Restmüll laut offiziellem 2026-Plan in ungeraden Kalenderwochen.",
        "Glas wird über Sammelcontainer entsorgt."
      ],
      sourceLabel: "Offizielle Quelle: Mairie Vendays-Montalivet / Smicotom – Müllplan 2026",
      sourceUrl: "https://www.vendays-montalivet.fr/collecte-de-dechets/",
      sourceImage: "assets/source/IMG_20260809_210452.jpg"
    },
    {
      id: "heating",
      icon: "🔥",
      title: "Heizung & Öfen",
      teaser: "Therme und Pelletöfen",
      eyebrow: "Warm machen",
      updatedAt: "08/26",
      items: [
        "An der Therme die Klappe am Display aufklappen.",
        "Die mittlere Taste drücken und das Heizsymbol auswählen.",
        "Die Heizkörper in den Zimmern aufdrehen.",
        "In beiden Wintergärten gibt es Pelletöfen.",
        "Pellets liegen beim Trockner."
      ]
    },
    {
      id: "pool",
      icon: "🏊",
      title: "Pool",
      teaser: "Die wenigen Dinge, die ihr selbst machen müsst",
      eyebrow: "Poolpflege",
      updatedAt: "08/26",
      items: [
        "Blätter aus dem Pool herauskeschern.",
        "Den Poolroboter laufen lassen und anschließend den Schmutzbehälter leeren.",
        "Gegebenenfalls Wasser nachfüllen.",
        "Alles andere läuft automatisiert.",
        "Trotzdem gelegentlich ins Technikhäuschen schauen und bei Fehlermeldungen Bescheid geben."
      ],
      troubleshooting: [
        {
          title: "Pool nach Unwetter grün oder Filterdruck hoch",
          trigger: "Nur für einen Störfall: Das Wasser ist grün oder trüb, Algen sind sichtbar oder das Manometer zeigt deutlich mehr als den sauberen Ausgangsdruck.",
          steps: [
            "Nicht baden, solange das Wasser grün oder stark trüb ist oder der Boden nicht sicher erkennbar ist.",
            "pH-Wert prüfen und auf etwa 7,0–7,4 einstellen lassen. Bei sichtbaren Algen Schockchlor nur nach Dosieranleitung für 45 m³ verwenden. Vor einer weiteren Chlorzugabe zuerst den freien Chlorwert messen.",
            "Pumpe ausschalten. Das 6-Wege-Ventil niemals bei laufender Pumpe umstellen.",
            "Ventil auf LAVAGE stellen, Pumpe einschalten und etwa 2–3 Minuten rückspülen, bis das Wasser im Schauglas wieder klar ist. Danach Pumpe ausschalten.",
            "Ventil auf RINÇAGE stellen, Pumpe für 20–30 Sekunden einschalten und danach wieder ausschalten.",
            "Ventil zurück auf FILTRATION stellen und die Pumpe wieder einschalten.",
            "Manometer kontrollieren: Nach einer erfolgreichen Rückspülung liegt der saubere Ausgangsdruck bei dieser Anlage ungefähr bei 50 kPa. Steigt er wieder deutlich an – etwa auf 80–100 kPa – erneut rück- und nachspülen. Nicht bis zum roten Bereich um 150 kPa warten.",
            "Wasser mit sauberem Leitungswasser bis etwa zur Mitte bis zu zwei Dritteln der Skimmeröffnung auffüllen. Zieht der Skimmer Luft, Pumpe vorher ausschalten.",
            "Wände und Boden abbürsten. Losen Algenschlamm vorsichtig aufwirbeln und die Filterpumpe 12–24 Stunden durchlaufen lassen.",
            "Poolroboter in kurzen Durchgängen einsetzen und seinen Filter nach jedem Lauf gründlich reinigen. Wird feiner Staub wieder herausgeblasen, den Roboter stoppen und über den Sandfilter weiterfiltern.",
            "Bleibt das Wasser trotz passendem pH-Wert, ausreichendem freien Chlor und sauberem Filter grün oder trüb, den Hauseigentümern Bescheid geben. Flockmittel nur passend zum Sandfilter und exakt nach Produktanleitung verwenden."
          ],
          warning: "Poolchemikalien niemals miteinander mischen. Insbesondere Chlor und pH-Minus nicht direkt oder konzentriert zusammengeben."
        }
      ]
    },
    {
      id: "tips",
      icon: "📍",
      title: "Vor Ort",
      teaser: "Versorgung und offizielle Anlaufstellen",
      eyebrow: "Montalivet & Vendays",
      updatedAt: "08/26",
      items: [
        "Die Postagentur in Montalivet befindet sich am Place du Marché.",
        "Laut Mairie gelten im Juli und August für die Postagentur Montalivet: Montag bis Freitag 8:45–14:30 Uhr, Samstag 8:45–12:30 Uhr.",
        "Weitere aktuelle Informationen zu Geschäften, Dienstleistungen und Freizeitangeboten stehen im offiziellen Guide der Gemeinde."
      ],
      sourceLabel: "Offizielle Quelle: Mairie Vendays-Montalivet",
      sourceUrl: "https://www.vendays-montalivet.fr/pratique/guide-pratique/"
    }
  ],

  departureUpdatedAt: "08/26",
  departureChecklist: [
    "Bettzeug und Laken abziehen und vor die Waschmaschine legen.",
    "Optional: Eine Waschmaschine bereits füllen und auf 60 °C anstellen.",
    "Geschirr wegräumen.",
    "Mülleimer ausleeren.",
    "Geld für die Putzfee auf die Kücheninsel legen.",
    "Fenster schließen.",
    "Türen – auch die Schuppentüren – abschließen.",
    "Schlüssel wieder in den Schlüsseltresor legen.",
    "Falls etwas fehlt oder kaputt ist, den Hauseigentümern Bescheid geben."
  ],

  sourceImages: [
    "assets/source/IMG_20260809_210434.jpg",
    "assets/source/IMG_20260809_210445.jpg",
    "assets/source/IMG_20260809_210452.jpg",
    "assets/source/IMG_20260809_210502.jpg",
    "assets/source/IMG_20260809_210515.jpg",
    "assets/source/IMG_20260809_210541.jpg",
    "assets/source/IMG_20260809_210612.jpg"
  ]
};
