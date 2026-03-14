// ============ SAFETY MODULE ============
(function() {
  'use strict';

  const LEGAL_PROFILES = {
    SGP: {
      risk: 'High enforcement: strict fines and custodial penalties are common for vandalism, drug offences and public-order violations.',
      rules: [
        'Drug offences are severely punished; do not carry unknown substances for anyone.',
        'Respect no-smoking and restricted-zone laws; fines are actively enforced.',
        'Do not litter, vandalize, or bring prohibited chewing-gum products into restricted contexts.'
      ],
      punishments: [
        'Drug trafficking can carry life imprisonment or capital punishment.',
        'Vandalism and public-order offences may involve heavy fines and custodial sentences.',
        'Immigration overstays can trigger fines, detention, and deportation.'
      ]
    },
    ARE: {
      risk: 'High enforcement: public conduct, cybercrime, and narcotics laws are strict and actively enforced.',
      rules: [
        'Follow local decency and public-behaviour laws; avoid confrontational gestures.',
        'Do not carry medicines that are restricted without proper prescription documentation.',
        'Respect alcohol licensing rules and never drive after drinking.'
      ],
      punishments: [
        'Drug offences can lead to imprisonment and deportation.',
        'Public disorder and cybercrime violations can result in criminal prosecution.',
        'Traffic offences (especially DUI) can trigger jail time, fines, and license bans.'
      ]
    },
    THA: {
      risk: 'Moderate-to-high enforcement: drug and lese-majeste laws are strict, with meaningful criminal penalties.',
      rules: [
        'Do not possess or carry illegal narcotics under any circumstance.',
        'Show respect at religious sites and to national symbols and institutions.',
        'Use licensed transport and keep passport/visa status valid.'
      ],
      punishments: [
        'Drug offences can result in long imprisonment terms.',
        'Defamation/insult offences against protected institutions can lead to severe penalties.',
        'Visa overstay penalties include fines, detention, and re-entry bans.'
      ]
    },
    JPN: {
      risk: 'High compliance expectation: low tolerance for drug offences and public disturbance.',
      rules: [
        'Never bring controlled medicines without checking import approval requirements.',
        'Follow local queueing, transport, and noise rules in public spaces.',
        'Carry identity documentation as required by local law for foreign visitors.'
      ],
      punishments: [
        'Drug offences can lead to prison terms and deportation.',
        'Public disorder offences can trigger arrest and prosecution.',
        'Immigration or documentation violations may lead to detention/deportation.'
      ]
    }
  };

  const EMERGENCY_NUMBERS = {
    USA: { ambulance: '911', fire: '911', police: '911' },
    CAN: { ambulance: '911', fire: '911', police: '911' },
    GBR: { ambulance: '999 / 112', fire: '999 / 112', police: '999 / 112' },
    IND: { ambulance: '108 / 102', fire: '101', police: '100 / 112' },
    AUS: { ambulance: '000', fire: '000', police: '000' },
    FRA: { ambulance: '15', fire: '18', police: '17' },
    DEU: { ambulance: '112', fire: '112', police: '110' },
    ITA: { ambulance: '118 / 112', fire: '115', police: '112' },
    ESP: { ambulance: '112', fire: '112', police: '112 / 091' },
    SGP: { ambulance: '995', fire: '995', police: '999' },
    ARE: { ambulance: '998', fire: '997', police: '999' },
    THA: { ambulance: '1669', fire: '199', police: '191' },
    JPN: { ambulance: '119', fire: '119', police: '110' }
  };

  const WB_INDICATORS = {
    homicide: 'VC.IHR.PSRC.P5',
    stability: 'PV.EST',
    ruleOfLaw: 'RL.EST',
    corruption: 'CC.EST'
  };

  const SafetyCenter = {
    init() {
      this.bindEvents();
    },

    bindEvents() {
      const searchBtn = document.getElementById('safetySearchBtn');
      const searchInput = document.getElementById('safetySearch');

      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          this.checkSafety();
        });
      }

      if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.checkSafety();
          }
        });
      }
    },

    async checkSafety() {
      const countryInput = document.getElementById('safetySearch')?.value.trim();

      if (!countryInput) {
        if (typeof showToast === 'function') showToast('Please enter a country name.', 'warning');
        return;
      }

      const result = document.getElementById('safetyResult');
      if (result) result.classList.remove('hidden');

      this.setLoadingState(true);

      try {
        const countryMeta = await this.fetchCountryMeta(countryInput);
        const [homicide, stability, ruleOfLaw, corruption, geo, advisory] = await Promise.all([
          this.fetchWorldBankIndicator(countryMeta.cca3, WB_INDICATORS.homicide),
          this.fetchWorldBankIndicator(countryMeta.cca3, WB_INDICATORS.stability),
          this.fetchWorldBankIndicator(countryMeta.cca3, WB_INDICATORS.ruleOfLaw),
          this.fetchWorldBankIndicator(countryMeta.cca3, WB_INDICATORS.corruption),
          this.fetchCountryCoordinates(countryMeta),
          this.fetchTravelAdvisory(countryMeta)
        ]);

        const [hazards, quakes, airQuality] = await Promise.all([
          this.fetchClimateHazards(geo.lat, geo.lng),
          this.fetchEarthquakeActivity(geo.lat, geo.lng),
          this.fetchAirQuality(geo.lat, geo.lng)
        ]);

        const legal = this.getLegalProfile(countryMeta);
        const emergency = this.getEmergencyNumbers(countryMeta);
        const score = this.computeSafetyScore({
          homicideRate: homicide.value,
          stability: stability.value,
          ruleOfLaw: ruleOfLaw.value,
          corruption: corruption.value,
          hazards,
          quakes,
          airQuality,
          advisoryScore: advisory.score
        });

        this.displaySafetyInfo({
          countryMeta,
          score,
          homicide,
          stability,
          ruleOfLaw,
          corruption,
          hazards,
          quakes,
          airQuality,
          advisory,
          legal,
          emergency
        });
      } catch (error) {
        console.error('Safety fetch error:', error);
        if (typeof showToast === 'function') showToast('Could not load safety data for that country.', 'error');
      } finally {
        this.setLoadingState(false);
      }
    },

    setLoadingState(isLoading) {
      const btn = document.getElementById('safetySearchBtn');
      if (!btn) return;

      if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-shield-alt"></i> Check Safety';
      }
    },

    async fetchCountryMeta(countryInput) {
      const fields = 'name,cca2,cca3,region,subregion,capital,population,idd,car';
      const fullTextUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryInput)}?fullText=true&fields=${fields}`;
      const looseUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryInput)}?fields=${fields}`;

      let response = await fetch(fullTextUrl);
      if (!response.ok) response = await fetch(looseUrl);
      if (!response.ok) throw new Error('Country lookup failed');

      const data = await response.json();
      if (!Array.isArray(data) || !data.length) throw new Error('Country not found');

      return data[0];
    },

    async fetchWorldBankIndicator(iso3, indicator) {
      const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${indicator}?format=json&per_page=70`;
      const response = await fetch(url);
      if (!response.ok) return { value: null, year: null };

      const data = await response.json();
      const records = Array.isArray(data?.[1]) ? data[1] : [];
      const latest = records.find(item => item && item.value !== null && item.value !== undefined);

      return latest ? { value: latest.value, year: latest.date } : { value: null, year: null };
    },

    async fetchTravelAdvisory(countryMeta) {
      try {
        const iso2 = countryMeta?.cca2;
        if (!iso2) return { score: null, source: null, message: null, updated: null };

        const url = `https://www.travel-advisory.info/api?countrycode=${encodeURIComponent(iso2)}`;
        const response = await fetch(url);
        if (!response.ok) return { score: null, source: null, message: null, updated: null };

        const data = await response.json();
        const advisoryData = data?.data?.[iso2];
        const advisory = advisoryData?.advisory;
        if (!advisory) return { score: null, source: null, message: null, updated: null };

        const parsedScore = advisory.score !== null && advisory.score !== undefined ? Number(advisory.score) : null;
        return {
          score: Number.isFinite(parsedScore) ? parsedScore : null,
          source: advisory.source || null,
          message: advisory.message || null,
          updated: advisory.updated || null
        };
      } catch (error) {
        return { score: null, source: null, message: null, updated: null };
      }
    },

    async fetchCountryCoordinates(countryMeta) {
      const capital = countryMeta.capital?.[0] || countryMeta.name?.common;
      const countryName = countryMeta.name?.common || '';
      const params = new URLSearchParams({
        name: `${capital}`,
        count: '8',
        language: 'en',
        format: 'json'
      });

      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];

      const preferred = results.find(r => r.country && r.country.toLowerCase() === countryName.toLowerCase()) || results[0];
      if (!preferred) throw new Error('Coordinates not found');

      return { lat: preferred.latitude, lng: preferred.longitude };
    },

    async fetchClimateHazards(lat, lng) {
      const end = new Date();
      const start = new Date();
      start.setFullYear(end.getFullYear() - 5);

      const fmt = (d) => d.toISOString().slice(0, 10);
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        start_date: fmt(start),
        end_date: fmt(end),
        daily: 'temperature_2m_max,precipitation_sum',
        timezone: 'auto'
      });

      const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
      if (!response.ok) return { heatDaysPerYear: null, heavyRainDaysPerYear: null };

      const data = await response.json();
      const tmax = data?.daily?.temperature_2m_max || [];
      const rain = data?.daily?.precipitation_sum || [];

      const totalDays = Math.max(tmax.length, 1);
      const years = 5;
      const heatDays = tmax.filter(v => v >= 35).length;
      const heavyRainDays = rain.filter(v => v >= 30).length;

      return {
        heatDaysPerYear: +(heatDays / years).toFixed(1),
        heavyRainDaysPerYear: +(heavyRainDays / years).toFixed(1),
        heatProbability: +((heatDays / totalDays) * 100).toFixed(1),
        heavyRainProbability: +((heavyRainDays / totalDays) * 100).toFixed(1)
      };
    },

    async fetchEarthquakeActivity(lat, lng) {
      const end = new Date();
      const start = new Date();
      start.setFullYear(end.getFullYear() - 10);

      const fmt = (d) => d.toISOString().slice(0, 10);
      const params = new URLSearchParams({
        format: 'geojson',
        starttime: fmt(start),
        endtime: fmt(end),
        latitude: String(lat),
        longitude: String(lng),
        maxradiuskm: '500',
        minmagnitude: '4'
      });

      const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`);
      if (!response.ok) return { eventsPerYear: null, totalEvents: null };

      const data = await response.json();
      const count = Array.isArray(data.features) ? data.features.length : 0;
      return {
        totalEvents: count,
        eventsPerYear: +(count / 10).toFixed(1)
      };
    },

    async fetchAirQuality(lat, lng) {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lng),
        hourly: 'us_aqi,pm2_5',
        forecast_days: '1',
        timezone: 'auto'
      });

      const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
      if (!response.ok) return { usAqi: null, pm25: null, time: null };

      const data = await response.json();
      const aqiSeries = Array.isArray(data?.hourly?.us_aqi) ? data.hourly.us_aqi : [];
      const pm25Series = Array.isArray(data?.hourly?.pm2_5) ? data.hourly.pm2_5 : [];
      const timeSeries = Array.isArray(data?.hourly?.time) ? data.hourly.time : [];

      let lastIndex = -1;
      for (let index = aqiSeries.length - 1; index >= 0; index -= 1) {
        if (aqiSeries[index] !== null && aqiSeries[index] !== undefined) {
          lastIndex = index;
          break;
        }
      }

      if (lastIndex < 0) return { usAqi: null, pm25: null, time: null };

      return {
        usAqi: Number(aqiSeries[lastIndex]),
        pm25: pm25Series[lastIndex] !== null && pm25Series[lastIndex] !== undefined ? Number(pm25Series[lastIndex]) : null,
        time: timeSeries[lastIndex] || null
      };
    },

    getEmergencyNumbers(countryMeta) {
      const byCode = EMERGENCY_NUMBERS[countryMeta.cca3];
      if (byCode) return byCode;

      return {
        ambulance: '112',
        fire: '112',
        police: '112'
      };
    },

    getLegalProfile(countryMeta) {
      const exact = LEGAL_PROFILES[countryMeta.cca3];
      if (exact) return exact;

      const side = countryMeta?.car?.side || 'right';
      const region = countryMeta?.region || 'the destination country';

      return {
        risk: `Moderate enforcement: visitor laws are actively applied and penalties vary by offence severity in ${countryMeta.name?.common}.`,
        rules: [
          `Obey local road rules strictly; traffic moves on the ${side} side in this destination.`,
          'Carry valid ID/passport copies and follow visa conditions throughout your stay.',
          'Respect public-order, religious/cultural-site, and photography restrictions where posted.'
        ],
        punishments: [
          'Drug possession/trafficking penalties are severe in many countries and can include long imprisonment.',
          'Immigration offences (overstay/unauthorized work) can lead to fines, detention, and deportation.',
          `Public-order offences in ${region} destinations often carry immediate fines or prosecution.`
        ]
      };
    },

    computeSafetyScore({ homicideRate, stability, ruleOfLaw, corruption, hazards, quakes, airQuality, advisoryScore }) {
      let score = 100;

      if (homicideRate !== null && homicideRate !== undefined) {
        score -= Math.min(35, homicideRate * 2.2);
      }

      if (stability !== null && stability !== undefined) {
        score += stability * 6;
      }

      if (ruleOfLaw !== null && ruleOfLaw !== undefined) {
        score += ruleOfLaw * 4;
      }

      if (corruption !== null && corruption !== undefined) {
        score += corruption * 3;
      }

      if (hazards?.heatProbability !== null && hazards?.heatProbability !== undefined) {
        score -= Math.min(10, hazards.heatProbability * 0.08);
      }

      if (hazards?.heavyRainProbability !== null && hazards?.heavyRainProbability !== undefined) {
        score -= Math.min(10, hazards.heavyRainProbability * 0.1);
      }

      if (quakes?.eventsPerYear !== null && quakes?.eventsPerYear !== undefined) {
        score -= Math.min(10, quakes.eventsPerYear * 1.6);
      }

      if (airQuality?.usAqi !== null && airQuality?.usAqi !== undefined) {
        score -= Math.min(8, Math.max(0, (airQuality.usAqi - 50) * 0.08));
      }

      if (advisoryScore !== null && advisoryScore !== undefined) {
        score -= Math.min(18, Math.max(0, advisoryScore) * 3.6);
      }

      return Math.max(25, Math.min(95, Math.round(score)));
    },

    getSafetyLevel(score) {
      if (score >= 80) return { text: 'Very Safe', color: '#10b981' };
      if (score >= 70) return { text: 'Generally Safe', color: '#3b82f6' };
      if (score >= 60) return { text: 'Moderate Risk', color: '#f59e0b' };
      return { text: 'Elevated Caution Needed', color: '#ef4444' };
    },

    setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    },

    setList(id, items) {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = items.map(item => `<li><i class="fas fa-check-circle"></i> ${item}</li>`).join('');
    },

    displaySafetyInfo(data) {
      const level = this.getSafetyLevel(data.score);

      this.setText('safetyScore', data.score);
      const gaugeElement = document.getElementById('safetyGauge');
      if (gaugeElement) {
        gaugeElement.style.setProperty('--score', `${data.score}%`);
        gaugeElement.style.setProperty('--score-color', level.color);
      }

      const levelElement = document.getElementById('safetyLevel');
      if (levelElement) {
        levelElement.textContent = level.text;
        levelElement.style.color = level.color;
      }

      this.setText('emergencyAmbulance', data.emergency.ambulance);
      this.setText('emergencyFire', data.emergency.fire);
      this.setText('emergencyPolice', data.emergency.police);

      this.setText('crimeHomicide', data.homicide.value !== null ? `${Number(data.homicide.value).toFixed(2)} / 100k` : 'Unavailable');
      this.setText('crimeHomicideYear', data.homicide.year || 'N/A');
      this.setText('crimeStability', data.stability.value !== null ? `${Number(data.stability.value).toFixed(2)} (−2.5 to +2.5)` : 'Unavailable');
      this.setText('crimeRuleLaw', data.ruleOfLaw.value !== null ? `${Number(data.ruleOfLaw.value).toFixed(2)} (−2.5 to +2.5)` : 'Unavailable');
      this.setText('crimeCorruption', data.corruption.value !== null ? `${Number(data.corruption.value).toFixed(2)} (−2.5 to +2.5)` : 'Unavailable');
      this.setText('crimeSource', 'Source: World Bank indicators VC.IHR.PSRC.P5, PV.EST, RL.EST, and CC.EST (latest available years).');

      this.setText('hazardHeat', data.hazards.heatDaysPerYear !== null ? `${data.hazards.heatDaysPerYear} days/yr (>35°C)` : 'Unavailable');
      this.setText('hazardRain', data.hazards.heavyRainDaysPerYear !== null ? `${data.hazards.heavyRainDaysPerYear} days/yr (≥30mm)` : 'Unavailable');
      this.setText('hazardQuake', data.quakes.eventsPerYear !== null ? `${data.quakes.eventsPerYear} events/yr` : 'Unavailable');
      this.setText('hazardQuakeDetail', data.quakes.eventsPerYear !== null ? `${data.quakes.eventsPerYear} events/yr` : 'Unavailable');
      this.setText('hazardAqi', data.airQuality.usAqi !== null ? `${Math.round(data.airQuality.usAqi)}` : 'Unavailable');
      this.setText('hazardAqiDetail', data.airQuality.usAqi !== null
        ? `US AQI ${Math.round(data.airQuality.usAqi)}${data.airQuality.pm25 !== null ? ` | PM2.5 ${data.airQuality.pm25.toFixed(1)} µg/m³` : ''}`
        : 'Unavailable');
      this.setText('hazardSource', 'Sources: Open-Meteo Archive + Open-Meteo Air Quality API and USGS Earthquake API.');

      this.setText('advisoryScore', data.advisory?.score !== null && data.advisory?.score !== undefined
        ? `${Number(data.advisory.score).toFixed(1)} / 5`
        : 'Unavailable');

      this.setList('countryRules', data.legal.rules);
      this.setList('countryPunishments', [data.legal.risk, ...data.legal.punishments]);
      const advisoryNote = data.advisory?.score !== null && data.advisory?.score !== undefined
        ? ` Travel advisory level: ${Number(data.advisory.score).toFixed(1)} / 5${data.advisory.updated ? ` (updated ${data.advisory.updated}).` : '.'}`
        : ' Travel advisory feed unavailable for this query.';
      this.setText('lawSource', `Legal notes are based on destination-specific strict-law profiles and standard traveler compliance requirements.${advisoryNote} Always confirm with official government advisories before travel.`);

      const practicalTips = [
        `Save emergency contacts for ${data.countryMeta.name.common} before arrival.`,
        'Keep digital and physical copies of passport, visa, and insurance.',
        'Use licensed transport and avoid isolated areas at late hours.',
        data.homicide.value !== null && data.homicide.value > 6
          ? 'Use extra caution in nightlife and high-theft zones; prefer trusted transport at night.'
          : 'Continue normal urban safety practices: secure valuables and stay alert in crowds.',
        data.hazards.heavyRainProbability !== null && data.hazards.heavyRainProbability > 8
          ? 'Plan backup indoor options during heavy-rain periods and monitor local weather alerts.'
          : 'Weather disruption risk appears moderate; still monitor local alerts each day.',
        data.airQuality?.usAqi !== null && data.airQuality?.usAqi > 100
          ? 'Air quality may be unhealthy for sensitive groups; carry a mask and limit long outdoor exposure.'
          : 'Air quality signal appears acceptable; still check local updates during rush and wildfire seasons.',
        data.advisory?.score !== null && data.advisory?.score >= 3.5
          ? 'Current travel-advisory risk is elevated; avoid non-essential travel to high-risk districts and monitor local alerts daily.'
          : 'Check official travel-advisory updates before departure and again 24 hours before local transit.'
      ];
      this.setList('safetyTips', practicalTips);

      const refs = document.getElementById('safetyReferences');
      if (refs) {
        refs.innerHTML = `
          <a href="https://api.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank Open Data (crime & governance indicators)</a>
          <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener noreferrer">Open-Meteo Historical Weather API (hazard climatology)</a>
          <a href="https://open-meteo.com/en/docs/air-quality-api" target="_blank" rel="noopener noreferrer">Open-Meteo Air Quality API (US AQI, PM2.5)</a>
          <a href="https://earthquake.usgs.gov/fdsnws/event/1/" target="_blank" rel="noopener noreferrer">USGS Earthquake API (seismic activity history)</a>
          <a href="https://www.travel-advisory.info/" target="_blank" rel="noopener noreferrer">Travel-Advisory.info API (country travel risk advisories)</a>
          <a href="https://restcountries.com/" target="_blank" rel="noopener noreferrer">REST Countries API (country metadata)</a>
        `;
      }

      const result = document.getElementById('safetyResult');
      if (result) result.classList.remove('hidden');
    },

    cleanup() {}
  };

  window.SafetyCenter = SafetyCenter;

  if (typeof PageLoader !== 'undefined') {
    PageLoader.registerModule('safety', SafetyCenter);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => SafetyCenter.init());
    } else {
      SafetyCenter.init();
    }
  }
})();
