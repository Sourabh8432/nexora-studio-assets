/* Nexora AI - Gemini Integration & Content Intelligence */
(function initNexoraAI() {
  var $ = function(selector) { return document.querySelector(selector); };
  var $$ = function(selector) { return document.querySelectorAll(selector); };

  function getGeminiApiKey() {
    const layoutKeyEl = document.getElementById('nexoraGeminiApiKey');
    const layoutKey = layoutKeyEl ? (layoutKeyEl.textContent || '').trim() : '';
    const themeKey = (getComputedStyle(document.documentElement).getPropertyValue('--nexora-gemini-key') || '').trim().replace(/^['"]|['"]$/g, '');
    const rawKey = layoutKey && !/paste your gemini api key here/i.test(layoutKey) ? layoutKey : themeKey;
    const match = rawKey.match(/AIza[0-9A-Za-z_-]+/);
    return match ? match[0] : '';
  }

  function getTextFromCandidate(candidate) {
    const parts = candidate && candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
    return parts.map(part => part && part.text ? part.text : '').join('\n').trim();
  }

  function normalizeGroundingSources(candidate) {
    const metadata = candidate && candidate.groundingMetadata ? candidate.groundingMetadata : null;
    const chunks = metadata && Array.isArray(metadata.groundingChunks) ? metadata.groundingChunks : [];
    const unique = [];
    const seen = {};

    chunks.forEach(function(chunk) {
      const web = chunk && chunk.web ? chunk.web : null;
      if (!web || !web.uri || seen[web.uri]) return;
      seen[web.uri] = true;
      unique.push({
        title: web.title || web.uri,
        url: web.uri
      });
    });

    return unique.slice(0, 4);
  }

  async function fetchGeminiAI(key, title, content, assistant) {
    try {
      const fallback = buildLocalInsights(title, content);
      const prompt = `Analyze this article using grounded web knowledge where useful and return strict JSON with keys: summary, quickTake, highlights, nextSteps, keywords, tone, difficulty, readTime. summary should be 2 concise sentences, quickTake should be one practical insight, highlights should have 3 factual bullets, nextSteps should have 3 short action steps, keywords should have 5 SEO-style hashtags. Article Title: ${title} Content: ${content}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }]
        })
      });
      const data = await response.json();
      const candidate = data && data.candidates && data.candidates[0] ? data.candidates[0] : null;
      const aiText = getTextFromCandidate(candidate);
      if (!aiText) throw new Error('Empty AI response');
      const result = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      updateAssistantUI({
        summary: result.summary || fallback.summary,
        quickTake: result.quickTake || result.summary || fallback.quickTake,
        highlights: Array.isArray(result.highlights) && result.highlights.length ? result.highlights : fallback.highlights,
        nextSteps: Array.isArray(result.nextSteps) && result.nextSteps.length ? result.nextSteps : fallback.nextSteps,
        keywords: Array.isArray(result.keywords) && result.keywords.length ? result.keywords : fallback.keywords,
        tone: result.tone || fallback.tone,
        difficulty: result.difficulty || fallback.difficulty,
        readTime: result.readTime || fallback.readTime,
        sources: normalizeGroundingSources(candidate)
      });
      initAIVoiceReader(title + '. ' + content);
    } catch (err) { runLocalAI(title, content, assistant); } finally { assistant.classList.remove('is-thinking'); }
  }

  function updateAssistantUI(data) {
    const summaryEl = document.getElementById('aiSummary');
    const quickTakeEl = document.getElementById('aiQuickTake');
    const kpEl = document.getElementById('aiKeyPoints');
    const nextStepsEl = document.getElementById('aiNextSteps');
    const difficultyEl = document.getElementById('aiDifficulty');
    const toneEl = document.getElementById('aiTone');
    const readTimeEl = document.getElementById('aiReadTime');
    const keywordsWrapper = document.getElementById('aiKeywordsWrapper');
    const keywordsEl = document.getElementById('aiKeywords');
    const sourcesWrapper = document.getElementById('aiSourcesWrapper');
    const sourcesEl = document.getElementById('aiSources');

    console.log('Nexora AI: Updating UI with data...', data);

    if (summaryEl) summaryEl.textContent = data.summary || 'Post summary analysis complete.';
    
    if (quickTakeEl) {
      quickTakeEl.textContent = data.quickTake || (data.summary ? `Key Takeaway: ${data.summary.split('.')[0]}.` : 'Deep insight analysis complete.');
    }

    if (kpEl) {
      const highlights = Array.isArray(data.highlights) && data.highlights.length ? data.highlights : ['Key highlights extracted from content.'];
      kpEl.innerHTML = highlights.map(p => `<li>${p}</li>`).join('');
    }

    if (nextStepsEl) {
      const steps = Array.isArray(data.nextSteps) && data.nextSteps.length ? data.nextSteps : ['Read the full article for more details.', 'Explore related research links.', 'Share this insight with your network.'];
      nextStepsEl.innerHTML = steps.map(step => `<li>${step}</li>`).join('');
    }

    if (difficultyEl) difficultyEl.textContent = data.difficulty || 'Standard';
    if (toneEl) toneEl.textContent = data.tone || 'Informative';
    if (readTimeEl && data.readTime) readTimeEl.textContent = data.readTime;

    if (keywordsEl && data.keywords && data.keywords.length) {
      keywordsEl.innerHTML = data.keywords.map(tag => `<span class="ai-tag">${tag}</span>`).join('');
      if (keywordsWrapper) keywordsWrapper.style.display = 'block';
    }

    if (sourcesEl && data.sources && data.sources.length) {
      sourcesEl.innerHTML = data.sources.map((source, index) => `<a href="${source.url}" target="_blank" rel="noopener noreferrer">${index + 1}. ${source.title}</a>`).join('');
      if (sourcesWrapper) sourcesWrapper.style.display = 'block';
    }
  }

  function buildLocalInsights(title, text) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    const words = clean.split(/\s+/).filter(Boolean);
    
    // Improved sentence filtering for meaningful highlights
    const meaningfulSentences = sentences
      .map(s => s.trim())
      .filter(s => s.length > 50 && s.length < 250)
      .filter(s => !/^(about|author|copyright|published|updated)/i.test(s))
      .filter(s => s.toLowerCase() !== String(title || '').trim().toLowerCase());

    const highlights = meaningfulSentences.slice(0, 3);
    const summary = meaningfulSentences.slice(0, 2).join(' ') || (sentences[0] ? sentences[0] : title);
    const quickTake = meaningfulSentences[0] ? `Key Insight: ${meaningfulSentences[0]}` : `This article provides deep insights into ${title}.`;

    const keywords = Array.from(new Set(words
      .filter(word => word.length > 5)
      .map(word => word.replace(/[^a-z0-9]/gi, '').toLowerCase())
      .filter(word => word.length > 4))).slice(0, 5);

    // Create "Search Results" links even without API
    const sources = keywords.slice(0, 3).map(kw => ({
      title: `Research: ${kw.charAt(0).toUpperCase() + kw.slice(1)}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(kw + ' ' + title)}`
    }));

    const nextSteps = [
      `Deep dive into the core concepts of ${title} mentioned above.`,
      'Examine the specific examples and case studies in the text.',
      'Check the recommended research links to explore related topics.',
      'Apply the primary takeaway to your current workflow.'
    ].slice(0, 3);

    return {
      summary: summary,
      quickTake: quickTake,
      highlights: highlights.length ? highlights : [`${title} offers a comprehensive look at this topic with detailed explanations.`],
      nextSteps: nextSteps,
      keywords: keywords.map(kw => '#' + kw),
      sources: sources,
      tone: 'Informative',
      difficulty: words.length > 1200 ? 'Advanced' : (words.length > 600 ? 'Standard' : 'Easy'),
      readTime: Math.max(1, Math.ceil(words.length / 200)) + ' MIN READ'
    };
  }

  function runLocalAI(title, text, assistant) {
    updateAssistantUI(buildLocalInsights(title, text));
    assistant.classList.remove('is-thinking');
    initAIVoiceReader(title + '. ' + text);
  }

  function initAIVoiceReader(fullText) {
    const btn = document.getElementById('aiVoiceBtn');
    if (!btn || !window.speechSynthesis) return;
    let isPlaying = false;
    btn.addEventListener('click', () => {
      if (!isPlaying) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fullText.slice(0, 3000));
        utterance.onend = () => { isPlaying = false; btn.classList.remove('is-playing'); };
        window.speechSynthesis.speak(utterance);
        isPlaying = true; btn.classList.add('is-playing');
      } else { window.speechSynthesis.cancel(); isPlaying = false; btn.classList.remove('is-playing'); }
    });
  }

  function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    const rtEl = document.getElementById('readingTime');
    if (rtEl) rtEl.textContent = `${time} MIN READ`;
  }

  function runWhenReady() {
    const assistant = document.getElementById('aiAssistant');
    const body = document.querySelector('.single-body');
    if (body) {
      calculateReadingTime(body.innerText);
    }
    if (!assistant) return;
    assistant.style.display = '';
    const key = getGeminiApiKey();
    if (body) {
      assistant.classList.add('is-thinking');
      const articleText = body.innerText.slice(0, 4000);
      updateAssistantUI(buildLocalInsights(document.title, articleText));
      if (key) fetchGeminiAI(key, document.title, articleText, assistant);
      else runLocalAI(document.title, articleText, assistant);
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") runWhenReady();
  else document.addEventListener("DOMContentLoaded", runWhenReady);
})();
