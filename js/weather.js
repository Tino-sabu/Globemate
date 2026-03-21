/* ========================================
   GlobeMate — Weather & Climate Module
   ======================================== */

(function() {
  'use strict';

  const WeatherExplorer = {
    destination: null,
    formPrefill: null,
    liveRefreshTimer: null,
    latestSnapshot: null,

    init() {
      this.cleanup();
      this.destination = this.readDestination();
      this.formPrefill = this.readFormPrefill();
      this.render();
    },

    readDestination() {
      try {
        return JSON.parse(localStorage.getItem('globemate_trip_destination') || 'null');
      } catch (_e) {
        return null;
      }
    },

    readFormPrefill() {
      try {
        return JSON.parse(localStorage.getItem('globemate_trip_form_prefill') || 'null');
      } catch (_e) {
        return null;
      }
    },

    async render() {
      const root = document.getElementById('weatherInfoRoot');
      if (!root) return;

      if (!this.destination?.name) {
        this.latestSnapshot = null;
        return;
      }

      root.innerHTML = `
        <div class="weather-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Fetching live weather and climate intelligence...</span>
        </div>
      `;

      try {
        const geo = await this.resolveCoordinates();
        const [forecast, climate, airQuality] = await Promise.all([
          this.fetchForecast(geo.latitude, geo.longitude),
          this.fetchClimate(geo.latitude, geo.longitude).catch((error) => {
            console.warn('Climate API unavailable:', error);
            return null;
          }),
          this.fetchAirQuality(geo.latitude, geo.longitude).catch((error) => {
            console.warn('Air quality API unavailable:', error);
            return null;
          })
        ]);

        this.latestSnapshot = { geo, forecast, climate, airQuality };

        root.innerHTML = this.buildDashboard(geo, forecast, climate, airQuality);
        this.bindActions();
        this.scheduleLiveRefresh();
      } catch (error) {
        this.latestSnapshot = null;
        console.error('Weather page error:', error);
        root.innerHTML = `
          <div class="weather-error">
            <h3 style="margin:0 0 10px;">Weather data unavailable</h3>
            <p style="margin:0 0 18px; color:#7f1d1d;">We couldn't load weather insights right now. Please try again or continue to trip planning.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <button class="btn btn-outline" data-tab="country-info"><i class="fas fa-arrow-left"></i> Back to Countries</button>
              <button class="btn btn-primary" id="weatherContinueBtn"><i class="fas fa-plane"></i> Continue to Trip Planner</button>
            </div>
          </div>
        `;
        this.bindActions();
      }
    },

    scheduleLiveRefresh() {
      if (this.liveRefreshTimer) clearInterval(this.liveRefreshTimer);
      this.liveRefreshTimer = setInterval(() => {
        this.render().catch((error) => {
          console.warn('Live weather refresh failed:', error);
        });
      }, 5 * 60 * 1000);
    },

    getTomorrowApiKey() {
      return (window.TOMORROW_IO_API_KEY || '').trim();
    },

    async tomorrowRequest(path, query = {}) {
      const apiKey = this.getTomorrowApiKey();
      if (!apiKey) throw new Error('Tomorrow.io API key missing');
      const params = new URLSearchParams({ ...query, apikey: apiKey });
      const response = await fetch(`https://api.tomorrow.io/v4/${path}?${params.toString()}`);
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Tomorrow.io ${path} failed: ${response.status} ${body}`);
      }
      return response.json();
    },

    toLegacyWeatherCode(tomorrowCode) {
      const map = {
        1000: 0,
        1100: 1,
        1101: 2,
        1102: 3,
        1001: 3,
        2000: 45,
        2100: 48,
        4000: 61,
        4001: 63,
        4200: 80,
        4201: 82,
        5000: 71,
        5001: 73,
        5100: 71,
        5101: 75,
        6000: 80,
        6200: 82,
        7000: 95,
        7101: 95,
        7102: 95,
        8000: 95
      };
      return map[tomorrowCode] ?? 3;
    },

    groupHistoryByMonth(intervals = []) {
      if (!intervals.length) return null;
      const grouped = new Map();

      intervals.forEach((interval) => {
        const values = interval?.values || {};
        const time = interval?.startTime;
        if (!time) return;
        const date = new Date(time);
        if (Number.isNaN(date.getTime())) return;
        const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;

        if (!grouped.has(monthKey)) {
          grouped.set(monthKey, { tempSum: 0, tempCount: 0, rainSum: 0, windSum: 0, windCount: 0 });
        }

        const bucket = grouped.get(monthKey);
        if (values.temperature !== undefined && values.temperature !== null) {
          bucket.tempSum += values.temperature;
          bucket.tempCount += 1;
        }
        if (values.windSpeed !== undefined && values.windSpeed !== null) {
          bucket.windSum += values.windSpeed;
          bucket.windCount += 1;
        }
        if (values.precipitationIntensity !== undefined && values.precipitationIntensity !== null) {
          bucket.rainSum += Math.max(values.precipitationIntensity, 0) * 24;
        }
      });

      const times = Array.from(grouped.keys()).sort();
      return {
        monthly: {
          time: times,
          temperature_2m_mean: times.map((time) => {
            const row = grouped.get(time);
            return row.tempCount ? row.tempSum / row.tempCount : null;
          }),
          precipitation_sum: times.map((time) => {
            const row = grouped.get(time);
            return row.rainSum;
          }),
          wind_speed_10m_mean: times.map((time) => {
            const row = grouped.get(time);
            return row.windCount ? row.windSum / row.windCount : null;
          })
        }
      };
    },

    async resolveCoordinates() {
      const searchName = this.formPrefill?.currentCity || this.destination.capital || this.destination.name;
      const params = new URLSearchParams({
        name: searchName,
        count: '10',
        language: 'en',
        format: 'json'
      });

      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];
      if (!results.length) throw new Error('No geocoding results');

      const preferred = results.find(item => {
        const countryMatch = item.country && item.country.toLowerCase() === this.destination.name.toLowerCase();
        return countryMatch;
      }) || results[0];

      return {
        latitude: preferred.latitude,
        longitude: preferred.longitude,
        city: preferred.name || this.formPrefill?.currentCity || this.destination.capital || this.destination.name,
        country: preferred.country || this.destination.name,
        admin: preferred.admin1 || this.destination.region || '',
        timezone: preferred.timezone || 'auto'
      };
    },

    async fetchForecast(latitude, longitude) {
      const location = `${latitude},${longitude}`;
      const [realtimeData, forecastData] = await Promise.all([
        this.tomorrowRequest('weather/realtime', {
          location,
          units: 'metric'
        }),
        this.tomorrowRequest('weather/forecast', {
          location,
          units: 'metric',
          timesteps: '1d',
          timezone: 'auto'
        })
      ]);

      const realtime = realtimeData?.data?.values || {};
      const intervals = forecastData?.timelines?.daily || [];

      return {
        current: {
          temperature_2m: realtime.temperature,
          apparent_temperature: realtime.temperatureApparent,
          relative_humidity_2m: realtime.humidity,
          wind_speed_10m: realtime.windSpeed,
          weather_code: this.toLegacyWeatherCode(realtime.weatherCode)
        },
        daily: {
          time: intervals.map((item) => item.time),
          weather_code: intervals.map((item) => this.toLegacyWeatherCode(item.values?.weatherCode)),
          temperature_2m_max: intervals.map((item) => item.values?.temperatureMax),
          temperature_2m_min: intervals.map((item) => item.values?.temperatureMin),
          precipitation_probability_max: intervals.map((item) => item.values?.precipitationProbability),
          wind_speed_10m_max: intervals.map((item) => item.values?.windSpeedMax),
          sunrise: intervals.map((item) => item.values?.sunriseTime),
          sunset: intervals.map((item) => item.values?.sunsetTime),
          uv_index_max: intervals.map((item) => item.values?.uvIndexMax)
        }
      };
    },

    async fetchClimate(latitude, longitude) {
      const location = `${latitude},${longitude}`;
      const now = new Date();
      const start = new Date(now);
      start.setUTCDate(start.getUTCDate() - 365);

      const historyData = await this.tomorrowRequest('weather/history/recent', {
        location,
        units: 'metric',
        timesteps: '1d',
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        timezone: 'UTC'
      });

      const intervals = historyData?.timelines?.daily || [];
      return this.groupHistoryByMonth(intervals);
    },

    async fetchAirQuality(latitude, longitude) {
      const location = `${latitude},${longitude}`;
      const realtimeData = await this.tomorrowRequest('weather/realtime', {
        location,
        units: 'metric'
      });
      const values = realtimeData?.data?.values || {};

      return {
        current: {
          us_aqi: values.epaHealthConcern ?? values.epaIndex,
          pm2_5: values.particulateMatter25
        }
      };
    },

    weatherLabel(code) {
      const map = {
        0: 'Clear sky',
        1: 'Mostly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Freezing fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Light rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        80: 'Rain showers',
        81: 'Scattered showers',
        82: 'Heavy showers',
        95: 'Thunderstorm',
        96: 'Storm risk'
      };
      return map[code] || 'Variable weather';
    },

    monthName(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
    },

    fmtTime(value) {
      return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
    },

    fmtTemp(value) {
      return value === undefined || value === null ? '—' : `${Math.round(value)}°C`;
    },

    fmtPercent(value) {
      return value === undefined || value === null ? '—' : `${Math.round(value)}%`;
    },

    escapeHtml(text) {
      return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    getAiQuickQuestions() {
      return [
        'Best month to visit?',
        'Will it rain this week?',
        'What should I pack?',
        'Give me a quick summary'
      ];
    },

    getAiProviderConfig() {
      return {
        groqKey: (window.GROQ_API_KEY || '').trim()
      };
    },

    parseChatCompletionsText(data) {
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) return content.trim();
      return null;
    },

    isWeatherQuestion(text = '') {
      const q = text.toLowerCase();
      return [
        'weather', 'forecast', 'rain', 'umbrella', 'aqi', 'pollution', 'pack', 'temperature', 'humidity', 'wind', 'uv', 'sunrise', 'sunset', 'month', 'best time', 'visit'
      ].some((token) => q.includes(token));
    },

    buildContextBrief() {
      const snapshot = this.latestSnapshot || {};
      const geo = snapshot.geo || {};
      const forecast = snapshot.forecast || {};
      const climate = snapshot.climate || {};
      const current = forecast.current || {};
      const daily = forecast.daily || {};
      const bestMonths = this.deriveBestMonths(climate);

      return {
        destination: this.destination?.name || geo.country || 'Unknown destination',
        city: geo.city || 'Unknown city',
        country: geo.country || this.destination?.name || 'Unknown country',
        now: {
          condition: this.weatherLabel(current.weather_code),
          temperatureC: current.temperature_2m,
          feelsLikeC: current.apparent_temperature,
          humidityPct: current.relative_humidity_2m,
          windKmh: current.wind_speed_10m
        },
        next5Days: (daily.time || []).slice(0, 5).map((time, idx) => ({
          day: new Date(time).toLocaleDateString('en-US', { weekday: 'short' }),
          highC: daily.temperature_2m_max?.[idx],
          lowC: daily.temperature_2m_min?.[idx],
          rainChancePct: daily.precipitation_probability_max?.[idx],
          windKmh: daily.wind_speed_10m_max?.[idx]
        })),
        bestMonths
      };
    },

    async askGroq(question) {
      const { groqKey } = this.getAiProviderConfig();
      if (!groqKey) return null;

      const context = this.buildContextBrief();
      const systemPrompt = [
        'You are GlobeMate AI weather assistant.',
        'Use the provided destination and weather context when relevant.',
        'For general travel questions, answer clearly and practically.',
        'If uncertain, say what is unknown rather than inventing facts.',
        'Keep responses under 120 words.'
      ].join(' ');

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context JSON: ${JSON.stringify(context)}` },
        { role: 'user', content: question }
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.4,
          max_tokens: 260
        })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Groq request failed: ${response.status} ${detail}`);
      }

      const data = await response.json();
      const parsed = this.parseChatCompletionsText(data);
      if (parsed) return parsed;
      throw new Error('Groq response had no text output.');
    },

    buildWeatherAiWidget() {
      const destination = this.destination?.name || 'this destination';
      const chips = this.getAiQuickQuestions().map((question) => (
        `<button class="weather-ai-chip" data-ai-question="${this.escapeHtml(question)}">${this.escapeHtml(question)}</button>`
      )).join('');

      return `
        <button id="weatherAiFab" class="weather-ai-fab" aria-label="Open GlobeMate AI for weather questions">
          <i class="fas fa-globe-americas"></i>
        </button>
        <div id="weatherAiPanel" class="weather-ai-panel" aria-hidden="true">
          <div class="weather-ai-head">
            <div class="weather-ai-title-wrap">
              <div class="weather-ai-avatar"><i class="fas fa-globe-americas"></i></div>
              <div>
                <strong>GlobeMate AI</strong>
                <span>Weather assistant for ${this.escapeHtml(destination)}</span>
              </div>
            </div>
            <button id="weatherAiClose" class="weather-ai-close" aria-label="Close weather assistant">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div id="weatherAiMessages" class="weather-ai-messages"></div>
          <div class="weather-ai-hint">You can ask weather and general travel questions here.</div>
          <div class="weather-ai-chips">${chips}</div>
          <form id="weatherAiForm" class="weather-ai-input-row">
            <input id="weatherAiInput" type="text" maxlength="280" placeholder="Ask about weather, rain, packing, or best time..." />
            <button type="submit" aria-label="Send question"><i class="fas fa-paper-plane"></i></button>
          </form>
        </div>
      `;
    },

    appendAiMessage(role, text) {
      const container = document.getElementById('weatherAiMessages');
      if (!container) return;
      const bubble = document.createElement('div');
      bubble.className = `weather-ai-msg ${role === 'user' ? 'weather-ai-msg-user' : 'weather-ai-msg-ai'}`;
      bubble.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
    },

    appendTyping() {
      const container = document.getElementById('weatherAiMessages');
      if (!container) return null;
      const node = document.createElement('div');
      node.className = 'weather-ai-msg weather-ai-msg-ai';
      node.innerHTML = '<p>Thinking...</p>';
      container.appendChild(node);
      container.scrollTop = container.scrollHeight;
      return node;
    },

    summarizeForecastWindow(days = 3) {
      const daily = this.latestSnapshot?.forecast?.daily || {};
      const times = daily.time || [];
      const highs = daily.temperature_2m_max || [];
      const lows = daily.temperature_2m_min || [];
      const rain = daily.precipitation_probability_max || [];
      const wind = daily.wind_speed_10m_max || [];
      const usable = Math.min(days, times.length);
      if (!usable) return 'Forecast details are limited right now.';

      const labels = times.slice(0, usable).map((time) => new Date(time).toLocaleDateString('en-US', { weekday: 'short' }));
      const highestRain = Math.max(...rain.slice(0, usable).map((value) => Number(value || 0)));
      const hottest = Math.max(...highs.slice(0, usable).map((value) => Number(value || -100)));
      const coolest = Math.min(...lows.slice(0, usable).map((value) => Number(value || 100)));
      const strongestWind = Math.max(...wind.slice(0, usable).map((value) => Number(value || 0)));

      return `For ${labels.join(', ')}, temperatures are around ${Math.round(coolest)}°C to ${Math.round(hottest)}°C, rain chance peaks near ${Math.round(highestRain)}%, and winds can reach about ${Math.round(strongestWind)} km/h.`;
    },

    generateWeatherAiReply(userText) {
      const text = (userText || '').toLowerCase();
      const snapshot = this.latestSnapshot || {};
      const geo = snapshot.geo || {};
      const forecast = snapshot.forecast || {};
      const climate = snapshot.climate || {};
      const air = snapshot.airQuality?.current || {};
      const current = forecast.current || {};
      const daily = forecast.daily || {};
      const destination = this.destination?.name || geo.country || 'your selected destination';
      const todayRain = Number(daily.precipitation_probability_max?.[0] || 0);
      const todayWind = Number(daily.wind_speed_10m_max?.[0] || current.wind_speed_10m || 0);
      const todayHigh = Number(daily.temperature_2m_max?.[0] || current.temperature_2m || 0);
      const humidity = current.relative_humidity_2m;

      if (text.includes('best') && (text.includes('month') || text.includes('time') || text.includes('visit'))) {
        const bestMonths = this.deriveBestMonths(climate);
        return bestMonths.length
          ? `Best months for ${destination} based on historical Tomorrow.io trends are ${bestMonths.join(', ')}. They generally offer stronger comfort scores for sightseeing.`
          : `Historical month-level data is limited right now, but in the short-term forecast ${this.summarizeForecastWindow(5)}`;
      }

      if (text.includes('rain') || text.includes('umbrella') || text.includes('wet')) {
        const advice = todayRain >= 55
          ? 'Rain looks likely today, so keep an umbrella or rain shell handy.'
          : todayRain >= 30
            ? 'There is a moderate rain chance, so a compact umbrella is a safe backup.'
            : 'Rain risk is currently low for today.';
        return `${advice} ${this.summarizeForecastWindow(3)}`;
      }

      if (text.includes('pack') || text.includes('wear') || text.includes('clothes')) {
        const layerAdvice = todayHigh >= 30
          ? 'Pack breathable clothes, sunscreen, and hydration essentials.'
          : todayHigh <= 12
            ? 'Carry warm layers and a light jacket, especially for mornings/evenings.'
            : 'Light layers and comfortable walking shoes should work well.';
        const windAdvice = todayWind >= 25 ? 'It can get windy, so keep a light shell.' : 'Wind looks manageable for regular sightseeing.';
        return `${layerAdvice} ${windAdvice}`;
      }

      if (text.includes('air') || text.includes('aqi') || text.includes('pollution')) {
        const aqi = air.us_aqi;
        return aqi !== undefined && aqi !== null
          ? `Current air quality in ${destination} is around AQI ${Math.round(aqi)} (${this.aqiLabel(aqi)}). ${this.explainAqi(aqi)}`
          : 'Air quality feed is currently unavailable, but temperature, rain, and wind forecasts are active.';
      }

      if (text.includes('summary') || text.includes('forecast') || text.includes('week') || text.includes('today')) {
        const weatherNow = `${this.weatherLabel(current.weather_code).toLowerCase()} at ${this.fmtTemp(current.temperature_2m)}`;
        const humidityText = humidity !== undefined && humidity !== null ? `${Math.round(humidity)}% humidity` : 'humidity data limited';
        return `For ${destination}, current conditions are ${weatherNow} with ${humidityText}. ${this.summarizeForecastWindow(5)}`;
      }

      return `I can help with weather doubts for ${destination}. Ask about best months, rain risk, packing, air quality, or a weekly summary. Right now, ${this.summarizeForecastWindow(4)}`;
    },

    async getAssistantReply(userText) {
      const weatherReply = this.generateWeatherAiReply(userText);
      if (this.isWeatherQuestion(userText)) {
        return weatherReply;
      }

      try {
        const groqReply = await this.askGroq(userText);
        if (groqReply) return groqReply;
      } catch (error) {
        console.warn('Groq reply failed, using weather assistant fallback:', error);
        return `I could not reach Groq right now (${error.message || 'request failed'}). ${weatherReply}`;
      }

      return `${weatherReply} I will continue helping with available weather intelligence for your selected destination.`;
    },

    bindWeatherAi() {
      const fab = document.getElementById('weatherAiFab');
      const panel = document.getElementById('weatherAiPanel');
      const closeBtn = document.getElementById('weatherAiClose');
      const form = document.getElementById('weatherAiForm');
      const input = document.getElementById('weatherAiInput');
      if (!fab || !panel) return;

      const openPanel = () => {
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        fab.classList.add('hidden');
        if (input) input.focus();
      };

      const closePanel = () => {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        fab.classList.remove('hidden');
      };

      fab.addEventListener('click', openPanel);
      closeBtn?.addEventListener('click', closePanel);

      const submitQuestion = async (question) => {
        const cleaned = (question || '').trim();
        if (!cleaned) return;
        this.appendAiMessage('user', cleaned);
        const typingNode = this.appendTyping();
        const answer = await this.getAssistantReply(cleaned);
        if (typingNode) typingNode.remove();
        this.appendAiMessage('ai', answer);
      };

      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await submitQuestion(input?.value || '');
        if (input) input.value = '';
      });

      panel.querySelectorAll('[data-ai-question]').forEach((chip) => {
        chip.addEventListener('click', async () => {
          openPanel();
          await submitQuestion(chip.getAttribute('data-ai-question') || '');
        });
      });

      this.appendAiMessage('ai', `Hello! I am GlobeMate AI. Ask me anything about ${this.destination?.name || 'this destination'} weather from Tomorrow.io data.`);
    },

    aqiLabel(aqi) {
      if (aqi === undefined || aqi === null) return 'Unavailable';
      if (aqi <= 50) return 'Good';
      if (aqi <= 100) return 'Moderate';
      if (aqi <= 150) return 'Unhealthy for sensitive groups';
      if (aqi <= 200) return 'Unhealthy';
      return 'Very unhealthy';
    },

    explainAqi(aqi) {
      if (aqi === undefined || aqi === null) return 'Air quality data is not available right now.';
      if (aqi <= 50) return 'Air feels clean for most travelers and outdoor activity is generally comfortable.';
      if (aqi <= 100) return 'Air quality is acceptable, but very sensitive travelers may notice mild discomfort.';
      if (aqi <= 150) return 'Sensitive travelers may prefer lighter outdoor schedules and indoor breaks.';
      if (aqi <= 200) return 'Outdoor comfort can drop noticeably, especially for long walks and active sightseeing.';
      return 'Air quality is poor enough that outdoor time should be reduced where possible.';
    },

    humidityNote(humidity) {
      if (humidity === undefined || humidity === null) return 'Humidity data is unavailable.';
      if (humidity >= 75) return 'The air may feel sticky or heavier than the temperature alone suggests.';
      if (humidity <= 35) return 'The air may feel dry, so hydration and lip/skin care become more important.';
      return 'Humidity is in a fairly comfortable range for most travelers.';
    },

    windNote(wind) {
      if (wind === undefined || wind === null) return 'Wind data is unavailable.';
      if (wind >= 30) return 'Expect strong wind effects on viewpoints, waterfronts and open transport routes.';
      if (wind >= 18) return 'A moderate breeze is likely, especially in exposed outdoor areas.';
      return 'Wind should not strongly affect regular sightseeing plans.';
    },

    weatherIcon(code) {
      if (code === 0 || code === 1) return 'sun';
      if (code === 2 || code === 3) return 'cloud-sun';
      if (code === 45 || code === 48) return 'smog';
      if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) return 'cloud-rain';
      if (code >= 71 && code <= 75) return 'snowflake';
      if (code >= 95) return 'bolt';
      return 'cloud';
    },

    metricLabel(title, tip) {
      return `
        <div class="weather-label-row">
          <span class="weather-card-label">${title}</span>
          <span class="weather-info-tip" tabindex="0" data-tip="${tip.replace(/"/g, '&quot;')}"><i class="fas fa-info"></i></span>
        </div>
      `;
    },

    computeTravelScore({ todayMax, todayWind, todayRain, humidity, aqi }) {
      let score = 100;
      score -= Math.abs((todayMax ?? 24) - 24) * 1.6;
      score -= (todayRain ?? 0) * 0.18;
      score -= Math.max((todayWind ?? 0) - 12, 0) * 1.1;
      if (humidity !== undefined && humidity !== null && humidity > 75) score -= (humidity - 75) * 0.35;
      if (aqi !== undefined && aqi !== null) score -= Math.max(aqi - 50, 0) * 0.18;
      score = Math.max(25, Math.min(96, Math.round(score)));

      let label = 'Very good';
      if (score < 50) label = 'Challenging';
      else if (score < 65) label = 'Manageable';
      else if (score < 80) label = 'Good';

      return { score, label };
    },

    buildHeatmap(climate) {
      const months = climate?.monthly?.time || [];
      const temps = climate?.monthly?.temperature_2m_mean || [];
      const rain = climate?.monthly?.precipitation_sum || [];
      const wind = climate?.monthly?.wind_speed_10m_mean || [];
      if (!months.length) return '';

      const cells = months.slice(0, 12).map((month, index) => {
        const temp = temps[index] ?? 0;
        const precip = rain[index] ?? 0;
        const windSpeed = wind[index] ?? 0;
        const comfort = 100 - Math.abs(temp - 24) * 3 - precip * 0.12 - windSpeed * 1.4;
        const cls = comfort >= 72 ? 'weather-heat-good' : comfort >= 56 ? 'weather-heat-mid' : 'weather-heat-low';
        return `
          <div class="weather-heat-cell ${cls}">
            <strong>${this.monthName(month)}</strong>
            <span>${Math.round(Math.max(0, comfort))}/100</span>
          </div>
        `;
      }).join('');

      return `<div class="weather-heatmap">${cells}</div>`;
    },

    seasonSignal(climate) {
      const rain = climate?.monthly?.precipitation_sum || [];
      if (!rain.length) {
        return {
          label: 'Seasonal data limited',
          description: 'Short-term forecast is available, but long-range seasonal rainfall patterns are limited right now.'
        };
      }

      const wettest = Math.max(...rain);
      const driest = Math.min(...rain);
      if (wettest >= 180) {
        return {
          label: 'Distinct wet and dry seasons',
          description: 'This destination shows a noticeable rainy season, so month selection can make a big difference in outdoor comfort.'
        };
      }
      if (driest <= 20 && wettest < 100) {
        return {
          label: 'Mostly dry climate',
          description: 'Rainfall stays relatively limited through the year, making planning easier for sightseeing-focused trips.'
        };
      }
      return {
        label: 'Balanced seasonal variation',
        description: 'Seasonal changes are present, but there is no extreme monsoon-style shift for most months.'
      };
    },

    buildPackingSuggestions(forecast, climate) {
      const current = forecast?.current || {};
      const daily = forecast?.daily || {};
      const todayMax = daily.temperature_2m_max?.[0] || current.temperature_2m || 0;
      const rainChance = daily.precipitation_probability_max?.[0] || 0;
      const wind = daily.wind_speed_10m_max?.[0] || current.wind_speed_10m || 0;
      const season = this.seasonSignal(climate);
      const items = [];

      if (todayMax >= 30) {
        items.push({ title: 'Heat-ready essentials', text: 'Pack breathable cotton clothing, sunglasses, sunscreen and a refillable water bottle for daytime comfort.', icon: 'sun' });
      } else if (todayMax <= 12) {
        items.push({ title: 'Cold-weather layers', text: 'Bring a warm outer layer, full sleeves and comfortable closed shoes, especially for morning and evening outings.', icon: 'snowflake' });
      } else {
        items.push({ title: 'Comfort layers', text: 'Light layers or a simple jacket should be enough for most sightseeing days and indoor/outdoor transitions.', icon: 'shirt' });
      }

      if (rainChance >= 45 || season.label.includes('wet')) {
        items.push({ title: 'Rain cover', text: 'Carry a compact umbrella or light waterproof layer, especially if your trip includes walking tours or public transport.', icon: 'umbrella' });
      }

      if (wind >= 25) {
        items.push({ title: 'Wind-friendly gear', text: 'Secure hats, keep a light shell handy and plan exposed viewpoints with extra caution on windy afternoons.', icon: 'wind' });
      }

      items.push({ title: 'Smart timing', text: season.description, icon: 'clock' });

      return items.slice(0, 4).map(item => `
        <div class="weather-pack-item">
          <i class="fas fa-${item.icon}"></i>
          <div>
            <strong>${item.title}</strong>
            <span>${item.text}</span>
          </div>
        </div>
      `).join('');
    },

    buildForecastChart(daily) {
      const maxTemps = daily?.temperature_2m_max || [];
      const minTemps = daily?.temperature_2m_min || [];
      const labels = (daily?.time || []).slice(0, 7).map((item) => new Date(item).toLocaleDateString('en-US', { weekday: 'short' }));
      if (!labels.length) return '';

      const values = [...maxTemps.slice(0, 7), ...minTemps.slice(0, 7)].filter(v => v !== undefined && v !== null);
      const minValue = Math.min(...values) - 2;
      const maxValue = Math.max(...values) + 2;
      const width = 640;
      const height = 220;
      const paddingX = 34;
      const paddingY = 24;
      const usableWidth = width - paddingX * 2;
      const usableHeight = height - paddingY * 2;

      const pointX = (index) => paddingX + (usableWidth / Math.max(labels.length - 1, 1)) * index;
      const pointY = (value) => paddingY + ((maxValue - value) / Math.max(maxValue - minValue, 1)) * usableHeight;

      const toPath = (arr) => arr.slice(0, 7).map((value, index) => `${index === 0 ? 'M' : 'L'} ${pointX(index)} ${pointY(value)}`).join(' ');
      const highPath = toPath(maxTemps);
      const lowPath = toPath(minTemps);

      const gridLines = Array.from({ length: 4 }).map((_, idx) => {
        const y = paddingY + (usableHeight / 3) * idx;
        return `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="rgba(148,163,184,.28)" stroke-dasharray="4 6" />`;
      }).join('');

      const labelsMarkup = labels.map((label, index) => `<text x="${pointX(index)}" y="${height - 6}" text-anchor="middle" font-size="12" fill="#64748b">${label}</text>`).join('');
      const highDots = maxTemps.slice(0, 7).map((value, index) => `<circle cx="${pointX(index)}" cy="${pointY(value)}" r="4.5" fill="#2563eb" />`).join('');
      const lowDots = minTemps.slice(0, 7).map((value, index) => `<circle cx="${pointX(index)}" cy="${pointY(value)}" r="4.5" fill="#8b5cf6" />`).join('');

      return `
        <div class="weather-chart-wrap">
          <svg viewBox="0 0 ${width} ${height}" class="weather-chart-svg" role="img" aria-label="Seven day temperature chart">
            ${gridLines}
            <path d="${highPath}" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            <path d="${lowPath}" fill="none" stroke="#8b5cf6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            ${highDots}
            ${lowDots}
            ${labelsMarkup}
          </svg>
          <div class="weather-chart-legend">
            <span><i class="weather-dot" style="background:#2563eb"></i> Highs</span>
            <span><i class="weather-dot" style="background:#8b5cf6"></i> Lows</span>
          </div>
        </div>
      `;
    },

    buildReferenceList() {
      return `
        <div class="weather-reference-list">
          <div class="weather-reference-item">
            <strong>Tomorrow.io Realtime API</strong>
            <span>Used for live conditions including temperature, humidity, apparent temperature, wind and current weather code.</span><br>
            <a href="https://docs.tomorrow.io/reference/realtime" target="_blank" rel="noopener noreferrer">Realtime docs</a>
          </div>
          <div class="weather-reference-item">
            <strong>Tomorrow.io Forecast API</strong>
            <span>Used for daily future predictions including highs/lows, rain probability, wind peaks, UV, sunrise and sunset.</span><br>
            <a href="https://docs.tomorrow.io/reference/forecast" target="_blank" rel="noopener noreferrer">Forecast docs</a>
          </div>
          <div class="weather-reference-item">
            <strong>Tomorrow.io History API</strong>
            <span>Used for historical daily weather aggregation into month-level travel climate trends.</span><br>
            <a href="https://docs.tomorrow.io/reference/weather-history" target="_blank" rel="noopener noreferrer">History docs</a>
          </div>
          <div class="weather-reference-item">
            <strong>Open-Meteo Geocoding API</strong>
            <span>Used to resolve the selected destination into coordinates for weather lookup.</span><br>
            <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noopener noreferrer">Geocoding docs</a>
          </div>
        </div>
      `;
    },

    deriveBestMonths(climate) {
      const months = climate?.monthly?.time || [];
      const temps = climate?.monthly?.temperature_2m_mean || [];
      const rain = climate?.monthly?.precipitation_sum || [];
      const wind = climate?.monthly?.wind_speed_10m_mean || [];

      const scored = months.map((month, index) => {
        const temp = temps[index] ?? 0;
        const precip = rain[index] ?? 0;
        const windSpeed = wind[index] ?? 0;
        const comfort = 100 - Math.abs(temp - 24) * 3 - precip * 0.12 - windSpeed * 1.4;
        return { month, comfort };
      }).sort((a, b) => b.comfort - a.comfort);

      return scored.slice(0, 3).map(item => this.monthName(item.month));
    },

    deriveBestMonthsDetailed(climate) {
      const months = climate?.monthly?.time || [];
      const temps = climate?.monthly?.temperature_2m_mean || [];
      const rain = climate?.monthly?.precipitation_sum || [];
      const wind = climate?.monthly?.wind_speed_10m_mean || [];
      if (!months.length) return [];

      return months.map((month, index) => {
        const temp = temps[index] ?? 0;
        const precip = rain[index] ?? 0;
        const windSpeed = wind[index] ?? 0;
        const comfort = 100 - Math.abs(temp - 24) * 3 - precip * 0.12 - windSpeed * 1.4;
        return {
          month,
          monthName: this.monthName(month),
          temp,
          precip,
          windSpeed,
          comfort: Math.round(Math.max(0, comfort))
        };
      }).sort((a, b) => b.comfort - a.comfort);
    },

    deriveClimateSummary(climate) {
      const temps = climate?.monthly?.temperature_2m_mean || [];
      const rain = climate?.monthly?.precipitation_sum || [];
      const wind = climate?.monthly?.wind_speed_10m_mean || [];
      if (!temps.length) {
        return 'Climate normals are unavailable right now, but live forecast signals are available for trip planning.';
      }

      const avgTemp = temps.reduce((sum, value) => sum + value, 0) / temps.length;
      const wettest = Math.max(...rain);
      const windiest = Math.max(...wind);

      let summary = avgTemp > 26 ? 'Mostly warm to hot across the year.' : avgTemp < 12 ? 'Generally cool across much of the year.' : 'Balanced temperatures with moderate seasonal variation.';
      if (wettest > 180) summary += ' Expect a pronounced rainy season during some months.';
      else if (wettest < 60) summary += ' Rainfall is relatively limited for most of the year.';
      if (windiest > 22) summary += ' Some months can be noticeably windy.';
      return summary;
    },

    buildTravelInsights({ climate, todayWind, aqi, pm25, humidity, forecast }) {
      const detailed = this.deriveBestMonthsDetailed(climate);
      const months = climate?.monthly?.time || [];
      const temps = climate?.monthly?.temperature_2m_mean || [];
      const rain = climate?.monthly?.precipitation_sum || [];
      const wind = climate?.monthly?.wind_speed_10m_mean || [];

      const hottestIndex = temps.length ? temps.indexOf(Math.max(...temps)) : -1;
      const coolestIndex = temps.length ? temps.indexOf(Math.min(...temps)) : -1;
      const wettestIndex = rain.length ? rain.indexOf(Math.max(...rain)) : -1;
      const windiestIndex = wind.length ? wind.indexOf(Math.max(...wind)) : -1;
      const avgTemp = temps.length ? (temps.reduce((sum, value) => sum + value, 0) / temps.length) : null;
      const avgWind = wind.length ? (wind.reduce((sum, value) => sum + value, 0) / wind.length) : null;
      const top = detailed.slice(0, 3);
      const todayRain = forecast?.daily?.precipitation_probability_max?.[0] || 0;

      const bestTimeText = top.length
        ? `${top.map(item => item.monthName).join(', ')} stand out most, with comfort scores between ${top[top.length - 1].comfort} and ${top[0].comfort}/100. These months combine temperatures around ${Math.round(top[0].temp)}°C, lower rainfall pressure, and manageable wind.`
        : `Long-range monthly climate normals are not available right now, so a precise best-season recommendation can't be calculated yet from historical data.`;

      const climateText = months.length
        ? `Average yearly temperature is about ${Math.round(avgTemp)}°C. ${hottestIndex >= 0 ? `${this.monthName(months[hottestIndex])} is typically the warmest month at ${Math.round(temps[hottestIndex])}°C.` : ''} ${coolestIndex >= 0 ? `${this.monthName(months[coolestIndex])} is usually the coolest at ${Math.round(temps[coolestIndex])}°C.` : ''} ${wettestIndex >= 0 ? `${this.monthName(months[wettestIndex])} is the wettest, averaging ${Math.round(rain[wettestIndex])} mm of rainfall.` : ''}`
        : `Historical monthly climate data is not available for this location at the moment, so the page is relying on live forecast signals instead of long-range averages.`;

      const windText = months.length
        ? `Current peak wind is around ${Math.round(todayWind || 0)} km/h. Across the year, average wind runs near ${Math.round(avgWind || 0)} km/h, with ${windiestIndex >= 0 ? `${this.monthName(months[windiestIndex])} usually being the windiest month at about ${Math.round(wind[windiestIndex])} km/h.` : 'some seasonal fluctuation.'} ${Math.round(todayWind || 0) > Math.round((avgWind || 0) + 6) ? 'Today is windier than the usual monthly average.' : 'Today is close to normal for this destination.'}`
        : `Current peak wind is around ${Math.round(todayWind || 0)} km/h. Based on today's forecast alone, wind should ${Math.round(todayWind || 0) > 25 ? 'noticeably affect open-air comfort in exposed places.' : 'stay manageable for regular sightseeing.'}`;

      const airText = aqi !== undefined && aqi !== null
        ? `Current air quality is ${this.aqiLabel(aqi).toLowerCase()} at AQI ${Math.round(aqi)}${pm25 ? `, with PM2.5 near ${Math.round(pm25)} µg/m³` : ''}. ${humidity !== undefined && humidity !== null ? `Humidity is ${Math.round(humidity)}%, so the air may feel ${humidity > 75 ? 'heavier and more humid' : humidity < 35 ? 'drier than average' : 'fairly balanced'} during outdoor activity.` : ''} ${todayRain > 55 ? 'Rain chances may temporarily improve air freshness later in the day.' : ''}`
        : `Air-quality monitoring is not available right now, so this card is limited to humidity and short-term comfort context.`;

      return [
        { title: 'Best time to visit', icon: 'calendar-check', text: bestTimeText, meta: top.length ? `${top[0].monthName} rated highest` : 'Climate history limited' },
        { title: 'Climate pattern', icon: 'chart-simple', text: climateText, meta: avgTemp !== null ? `Year avg ${Math.round(avgTemp)}°C` : 'Forecast-based view' },
        { title: 'Wind & outdoor comfort', icon: 'wind', text: windText, meta: `${Math.round(todayWind || 0)} km/h today` },
        { title: 'Air quality & comfort', icon: 'lungs', text: airText, meta: aqi !== undefined && aqi !== null ? `${Math.round(aqi)} AQI` : 'No live AQI feed' }
      ];
    },

    buildMonthCards(climate) {
      const months = climate?.monthly?.time || [];
      const temps = climate?.monthly?.temperature_2m_mean || [];
      const rain = climate?.monthly?.precipitation_sum || [];
      const wind = climate?.monthly?.wind_speed_10m_mean || [];

      if (!months.length) {
        return `
          <div class="weather-month-card" style="grid-column:1/-1;">
            <span class="weather-month-label">Climate data</span>
            <h4>Monthly climate normals unavailable</h4>
            <p>Live weather, wind, sunrise and short-term conditions are still available above. You can continue to Trip Planner normally.</p>
          </div>
        `;
      }

      return months.slice(0, 12).map((month, index) => {
        const temp = temps[index] ?? 0;
        const precip = rain[index] ?? 0;
        const windSpeed = wind[index] ?? 0;
        const comfort = 100 - Math.abs(temp - 24) * 3 - precip * 0.12 - windSpeed * 1.4;
        const accent = comfort >= 72
          ? 'linear-gradient(90deg, #22c55e, #38bdf8)'
          : comfort >= 56
            ? 'linear-gradient(90deg, #f59e0b, #fb7185)'
            : 'linear-gradient(90deg, #f43f5e, #8b5cf6)';

        return `
        <div class="weather-month-card" style="--month-accent:${accent};">
          <span class="weather-month-label">${this.monthName(month)}</span>
          <h4>${this.fmtTemp(temps[index])} avg</h4>
          <div class="weather-month-stats">
            <div class="weather-stat-row"><span>Rainfall</span><strong>${Math.round(rain[index] || 0)} mm</strong></div>
            <div class="weather-stat-row"><span>Wind</span><strong>${Math.round(wind[index] || 0)} km/h</strong></div>
          </div>
        </div>
      `;
      }).join('');
    },

    getCountryBannerImage() {
      const code = (this.destination?.cca3 || '').toUpperCase();
      const banners = {
        FRA: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&h=520&fit=crop',
        DEU: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1400&h=520&fit=crop',
        ARE: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&h=520&fit=crop',
        DNK: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1400&h=520&fit=crop',
        IND: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&h=520&fit=crop',
        JPN: 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=1400&h=520&fit=crop',
        USA: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1400&h=520&fit=crop',
        CAN: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1400&h=520&fit=crop',
        AUS: 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=1400&h=520&fit=crop',
        SGP: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1400&h=520&fit=crop',
        THA: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1400&h=520&fit=crop'
      };
      return banners[code] || `https://source.unsplash.com/1400x520/?${encodeURIComponent(this.destination?.name || 'travel destination')},landmark`;
    },

    buildDashboard(geo, forecast, climate, airQuality) {
      const current = forecast.current || {};
      const daily = forecast.daily || {};
      const air = airQuality?.current || {};
      const bestMonths = this.deriveBestMonths(climate);
      const summary = this.deriveClimateSummary(climate);
      const season = this.seasonSignal(climate);
      const todaySunrise = daily.sunrise?.[0];
      const todaySunset = daily.sunset?.[0];
      const todayMax = daily.temperature_2m_max?.[0];
      const todayMin = daily.temperature_2m_min?.[0];
      const todayWind = daily.wind_speed_10m_max?.[0];
      const todayRain = daily.precipitation_probability_max?.[0];
      const todayUv = daily.uv_index_max?.[0];
      const humidity = current.relative_humidity_2m;
      const aqi = air.us_aqi;
      const pm25 = air.pm2_5;
      const travelScore = this.computeTravelScore({ todayMax, todayWind, todayRain, humidity, aqi });
      const travelInsights = this.buildTravelInsights({ climate, todayWind, aqi, pm25, humidity, forecast });
      const planningSummary = (todayRain || 0) > 55
        ? 'This looks like a destination where rain planning matters today, so lighter schedules and indoor options help.'
        : (todayMax || 0) > 31
          ? 'Heat management matters here today, so early starts and slower afternoon plans are smarter.'
          : Math.round(todayWind || 0) > 28
            ? 'Wind is the main comfort factor today, especially in exposed areas.'
            : 'Conditions look fairly manageable for standard sightseeing and local movement.';

      return `
        <div class="weather-dashboard">
          <div class="weather-hero" style="background-image:url('${this.getCountryBannerImage()}')">
            <div class="weather-hero-badges">
              <span class="weather-chip"><i class="fas fa-location-dot"></i> ${geo.city}, ${geo.country}</span>
              <span class="weather-chip"><i class="fas fa-temperature-half"></i> ${this.fmtTemp(current.temperature_2m)}</span>
              <span class="weather-chip"><i class="fas fa-wind"></i> ${Math.round(current.wind_speed_10m || 0)} km/h</span>
              <span class="weather-chip"><i class="fas fa-calendar-check"></i> Best months: ${bestMonths.length ? bestMonths.join(', ') : 'Year-round'}</span>
            </div>
            <h3>${this.destination.name}: weather before you plan</h3>
            <p>${this.weatherLabel(current.weather_code)} right now. ${summary}</p>
            <div class="weather-hero-meta">
              <div class="weather-meta-card">
                <span>Humidity</span>
                <strong>${this.fmtPercent(humidity)}</strong>
              </div>
              <div class="weather-meta-card">
                <span>Air quality</span>
                <strong>${aqi !== undefined && aqi !== null ? `${Math.round(aqi)} AQI · ${this.aqiLabel(aqi)}` : 'Unavailable'}</strong>
              </div>
              <div class="weather-meta-card">
                <span>Season signal</span>
                <strong>${season.label}</strong>
              </div>
              <div class="weather-score-card">
                <span>Traveler weather score</span>
                <strong>${travelScore.score}/100</strong>
                <small>${travelScore.label} for sightseeing comfort today.</small>
              </div>
            </div>
          </div>

          <div class="weather-callout">
            <h4><i class="fas fa-circle-info"></i> Easy summary</h4>
            <p><strong>${this.destination.name}</strong> currently has ${this.weatherLabel(current.weather_code).toLowerCase()} conditions, around <strong>${this.fmtTemp(current.temperature_2m)}</strong>, with wind near <strong>${Math.round(current.wind_speed_10m || 0)} km/h</strong>. ${planningSummary}</p>
          </div>

          <div>
            <div class="weather-section-title"><i class="fas fa-bolt"></i> Current & daily essentials</div>
            <div class="weather-current-grid">
              <div class="weather-card">
                <div class="weather-condition-icon"><i class="fas fa-${this.weatherIcon(current.weather_code)}"></i></div>
                <div class="weather-card-icon"><i class="fas fa-temperature-half"></i></div>
                ${this.metricLabel('Current Temperature', 'Shows the actual air temperature right now. Compare it with feels-like temperature to judge real comfort.')}
                <div class="weather-card-value">${this.fmtTemp(current.temperature_2m)}</div>
                <div class="weather-card-sub">Feels like ${this.fmtTemp(current.apparent_temperature)}</div>
              </div>
              <div class="weather-card">
                <div class="weather-card-icon"><i class="fas fa-wind"></i></div>
                ${this.metricLabel('Wind Speed', 'Higher wind speeds can make viewpoints, waterfronts and open transport routes feel harsher than expected.')}
                <div class="weather-card-value">${Math.round(current.wind_speed_10m || 0)} km/h</div>
                <div class="weather-card-sub">Peak today ${Math.round(todayWind || 0)} km/h</div>
              </div>
              <div class="weather-card">
                <div class="weather-card-icon"><i class="fas fa-sun"></i></div>
                ${this.metricLabel('Sunrise / Sunset', 'Useful for planning early sightseeing, photography windows, and how long you can stay outdoors.')}
                <div class="weather-card-value" style="font-size:1.25rem;">${this.fmtTime(todaySunrise)}</div>
                <div class="weather-card-sub">Sunset ${this.fmtTime(todaySunset)}</div>
              </div>
              <div class="weather-card">
                <div class="weather-card-icon"><i class="fas fa-cloud-rain"></i></div>
                ${this.metricLabel('Today Outlook', 'A quick summary of the expected temperature range, rain chance and UV level for the day ahead.')}
                <div class="weather-card-value" style="font-size:1.2rem;">${this.fmtTemp(todayMin)} – ${this.fmtTemp(todayMax)}</div>
                <div class="weather-card-sub">Rain ${todayRain || 0}% · UV ${Math.round(todayUv || 0)}</div>
              </div>
            </div>
          </div>

          <div class="weather-spotlight-grid">
            <div class="weather-chart-card">
              <div class="weather-section-title"><i class="fas fa-chart-line"></i> 7-day temperature trend</div>
              <p style="margin:0;color:#64748b;line-height:1.6;">A quick visual forecast of daytime highs and nighttime lows for the next week.</p>
              ${this.buildForecastChart(daily)}
            </div>

            <div class="weather-packing-card">
              <div class="weather-section-title"><i class="fas fa-suitcase-rolling"></i> Smart packing cues</div>
              <p style="margin:0;color:#64748b;line-height:1.6;">Suggested essentials based on temperature, rain probability, wind and seasonal signal.</p>
              <div class="weather-season-badge"><i class="fas fa-seedling"></i> ${season.label}</div>
              <div class="weather-packing-list">
                ${this.buildPackingSuggestions(forecast, climate)}
              </div>
            </div>
          </div>

          <div>
            <div class="weather-section-title"><i class="fas fa-book-open"></i> What this means for your trip</div>
            <div class="weather-explain-grid">
              <div class="weather-callout">
                <h4><i class="fas fa-droplet"></i> Humidity</h4>
                <p><strong>${this.fmtPercent(humidity)}</strong>. ${this.humidityNote(humidity)}</p>
              </div>
              <div class="weather-callout">
                <h4><i class="fas fa-wind"></i> Wind comfort</h4>
                <p><strong>${Math.round(todayWind || 0)} km/h peak today</strong>. ${this.windNote(todayWind)}</p>
              </div>
              <div class="weather-callout">
                <h4><i class="fas fa-lungs"></i> Air quality</h4>
                <p><strong>${aqi !== undefined && aqi !== null ? `${Math.round(aqi)} AQI · ${this.aqiLabel(aqi)}` : 'Unavailable'}</strong>. ${this.explainAqi(aqi)}</p>
              </div>
            </div>
          </div>

          <div>
            <div class="weather-section-title"><i class="fas fa-lightbulb"></i> Travel insights</div>
            <div class="weather-insight-grid">
              ${travelInsights.map((item) => `
                <div class="weather-insight-card">
                  <div class="weather-insight-icon"><i class="fas fa-${item.icon}"></i></div>
                  <h4>${item.title}</h4>
                  <p>${item.text}</p>
                  <div class="weather-insight-meta"><i class="fas fa-sparkles"></i> ${item.meta}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <div class="weather-section-title"><i class="fas fa-calendar-days"></i> 12-month climate view</div>
            <div class="weather-month-grid">
              ${this.buildMonthCards(climate)}
            </div>
            ${this.buildHeatmap(climate)}
          </div>

          <div class="weather-reference-card">
            <div class="weather-section-title"><i class="fas fa-link"></i> References & data sources</div>
            <p style="margin:0;color:#64748b;line-height:1.7;">The summaries above are generated from live and historical weather datasets. This section shows where each data layer comes from so the page is transparent and easy to trust.</p>
            ${this.buildReferenceList()}
          </div>

          <div class="weather-cta">
            <div>
              <h3>Ready to plan ${this.destination.name}?</h3>
              <p>You have the weather context now — continue to Trip Planner to choose dates, departure city, transport and save your trip details.</p>
            </div>
            <div class="weather-cta-actions">
              <button class="btn btn-outline" data-tab="country-info"><i class="fas fa-arrow-left"></i> Back to Countries</button>
              <button class="btn btn-primary" id="weatherContinueBtn"><i class="fas fa-plane"></i> Continue to Trip Planner</button>
            </div>
          </div>
        </div>
        ${this.buildWeatherAiWidget()}
      `;
    },

    bindActions() {
      document.getElementById('weatherContinueBtn')?.addEventListener('click', () => {
        if (typeof PageLoader !== 'undefined') {
          PageLoader.loadPage('trip-planner');
        }
      });

      this.bindWeatherAi();
    },

    cleanup() {
      if (this.liveRefreshTimer) {
        clearInterval(this.liveRefreshTimer);
        this.liveRefreshTimer = null;
      }
    }
  };

  window.WeatherExplorer = WeatherExplorer;

  if (typeof PageLoader !== 'undefined') {
    PageLoader.registerModule('weather-info', WeatherExplorer);
  }
})();
