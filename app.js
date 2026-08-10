// AI Platform Interactivity Logic

// ==========================================
// CENTRALIZED API & BACKEND URL CONFIGURATION
// ==========================================
const BACKEND_BASE_URL = "http://localhost:5000";
const API_BASE_URL = `${BACKEND_BASE_URL}/api/ai`;

// Global Auth State
let authToken = localStorage.getItem('access_token') || localStorage.getItem('authToken') || null;
let currentUser = null;
let isLoggingIn = false;

try {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) currentUser = JSON.parse(savedUser);
} catch (e) {
  currentUser = null;
}

async function callAiApi(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success === false) {
      throw new Error(data.response || "Unable to contact AI server.");
    }
    return data.response;
  } catch (error) {
    console.error("Failed to fetch AI response:", error);
    return "Unable to contact AI server.";
  }
}

// ==========================================
// 1. WATCH DEMO MODAL
// ==========================================


// ==========================================
// 2. WATCH DEMO MODAL
// ==========================================

function playMockDemo() {
  document.getElementById('demoModal').style.display = 'flex';
  document.getElementById('demoStatusText').innerHTML = 'Click Play to see AI in Action';
}

function closeMockDemo() {
  document.getElementById('demoModal').style.display = 'none';
}

function playDemoAnimation() {
  const status = document.getElementById('demoStatusText');
  status.textContent = 'Simulating student interaction...';
  
  setTimeout(() => {
    status.innerHTML = '🤖 <span style="color: var(--color-sky);">AI explains photosynthesis...</span>';
  }, 1000);

  setTimeout(() => {
    status.innerHTML = '🎤 <span style="color: var(--color-orange);">Listening to student voice question...</span>';
  }, 2500);

  setTimeout(() => {
    status.innerHTML = '✨ <span style="color: var(--color-green);">Created customized homework explanation!</span>';
  }, 4000);

  setTimeout(() => {
    status.innerHTML = '🎉 Demo Finished! Click Start Learning to test it yourself.';
  }, 5500);
}


// ==========================================
// 3. AI CHAT INTERFACE & EXPLAIN AGAIN
// ==========================================

let chatAttachment = null;
let isChatMicActive = false;

// Mock AI knowledge database for student questions


function appendChatMessage(sender, content, key = null) {
  const history = document.getElementById('chatHistory');
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;

  if (sender !== 'ai') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = `<div class="profile-avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">A</div>`;
    msg.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  // Wrap explanation text content in its own div to make re-explaining easier
  const contentArea = document.createElement('div');
  contentArea.className = 'chat-explanation-content';
  contentArea.innerHTML = content;
  bubble.appendChild(contentArea);

  // If this is an AI message, always append "Explain Again" actions
  if (sender === 'ai') {
    const actions = document.createElement('div');
    actions.className = 'explain-again-wrapper';
    actions.innerHTML = `
      <div class="explain-again-title">
        <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Don't understand? Explain it differently:
      </div>
      <div class="explain-again-buttons">
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'simpler', this)"><i data-lucide="sparkles"></i> Simpler</button>
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'example', this)"><i data-lucide="lightbulb"></i> With Example</button>
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'story', this)"><i data-lucide="book-open"></i> As Story</button>
        <button class="btn-explain-style" onclick="changeExplanationStyle('${key}', 'tamil', this)">🇮🇳 In Tamil</button>
      </div>
    `;
    bubble.appendChild(actions);
    
    // Render voice player icon inside standard explanation bubbles
    const audioWidget = document.createElement('div');
    audioWidget.className = 'chat-voice-widget';
    audioWidget.innerHTML = `
      <button class="play-btn" onclick="playSpeechBubble(this)"><i data-lucide="volume-2"></i></button>
      <div class="voice-wave-canvas">
        <div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div><div class="voice-wave-bar"></div>
      </div>
      <span style="font-size:0.75rem; color:var(--color-sky-dark); font-weight:700;">Listen Explaining</span>
    `;
    bubble.insertBefore(audioWidget, bubble.firstChild);
  }

  msg.appendChild(bubble);
  history.appendChild(msg);
  history.scrollTop = history.scrollHeight;
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Modify existing bubble text when clicking Explain Simpler / Story / etc.
async function changeExplanationStyle(conceptKey, style, buttonEl) {
  const bubble = buttonEl.closest('.msg-bubble');
  
  // Extract original text content, excluding widgets
  const tempDiv = bubble.cloneNode(true);
  const voice = tempDiv.querySelector('.chat-voice-widget');
  if (voice) voice.remove();
  const actions = tempDiv.querySelector('.explain-again-wrapper');
  if (actions) actions.remove();
  
  const originalText = tempDiv.textContent.trim();
  
  // Disable all buttons while loading
  const buttons = bubble.querySelectorAll('.btn-explain-style');
  buttons.forEach(btn => btn.disabled = true);
  
  let prompt = "";
  if (style === 'simpler') {
    prompt = `Explain the following text in simpler, child-friendly terms for a Grade 6 student. Keep it short and use simple language:\n\n"${originalText}"`;
  } else if (style === 'example') {
    prompt = `Provide a simple, clear, real-world example to illustrate the following concept for a Grade 6 student:\n\n"${originalText}"`;
  } else if (style === 'story') {
    prompt = `Explain the following concept as a very short, engaging story/fable suitable for a Grade 6 student:\n\n"${originalText}"`;
  } else if (style === 'tamil') {
    prompt = `Translate and explain the following concept in clear, simple Tamil (using Tamil script) for a Grade 6 student:\n\n"${originalText}"`;
  }
  
  const contentArea = bubble.querySelector('.chat-explanation-content') || document.createElement('div');
  contentArea.className = 'chat-explanation-content';
  contentArea.innerHTML = "<p><em>Thinking of a new explanation style... ✨</em></p>";
  
  const voiceWidget = bubble.querySelector('.chat-voice-widget');
  const actionsWidget = bubble.querySelector('.explain-again-wrapper');
  
  bubble.innerHTML = '';
  if (voiceWidget) bubble.appendChild(voiceWidget);
  bubble.appendChild(contentArea);
  if (actionsWidget) bubble.appendChild(actionsWidget);
  
  const newText = await callAiApi(prompt);
  
  // Format response to HTML paragraphs if needed
  let formattedResponse = newText;
  if (!newText.trim().startsWith('<')) {
    formattedResponse = newText.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }
  
  contentArea.innerHTML = formattedResponse;
  
  // Re-enable buttons
  const newButtons = bubble.querySelectorAll('.btn-explain-style');
  newButtons.forEach(btn => btn.disabled = false);
  
  // Add micro-animation highlight
  bubble.style.animation = 'none';
  bubble.offsetHeight; /* trigger reflow */
  bubble.style.animation = 'bounceIn 0.4s';
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Play speech bubble mock audio
function playSpeechBubble(button) {
  const waveBars = button.parentElement.querySelectorAll('.voice-wave-bar');
  const playIcon = button.querySelector('i');
  
  // Toggle states
  if (playIcon.getAttribute('data-lucide') === 'volume-2') {
    playIcon.setAttribute('data-lucide', 'pause');
    waveBars.forEach((bar, idx) => {
      bar.classList.add('active');
      bar.style.height = `${Math.floor(Math.random() * 15) + 6}px`;
      bar.style.animation = `wavePulse 1s infinite ease-in-out alternate`;
      bar.style.animationDelay = `${idx * 0.15}s`;
    });
    
    // Stop speaking mock audio after 4 seconds
    setTimeout(() => {
      playIcon.setAttribute('data-lucide', 'volume-2');
      waveBars.forEach(bar => {
        bar.classList.remove('active');
        bar.style.height = '4px';
        bar.style.animation = 'none';
      });
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 4000);
  } else {
    playIcon.setAttribute('data-lucide', 'volume-2');
    waveBars.forEach(bar => {
      bar.classList.remove('active');
      bar.style.height = '4px';
      bar.style.animation = 'none';
    });
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// User types a message
async function sendChatMessage() {
  const input = document.getElementById('chatMessageInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const micBtn = document.getElementById('chatMicBtn');
  const text = input.value.trim();
  
  if (!text && !chatAttachment) return;
  
  let userMessageHTML = '';
  if (chatAttachment) {
    userMessageHTML += `<p><i data-lucide="image" style="vertical-align:middle;margin-right:5px;color:var(--color-orange);"></i> <strong>Uploaded attachment:</strong> ${chatAttachment.name}</p>`;
  }
  if (text) {
    userMessageHTML += `<p>${text}</p>`;
  }

  // Clear input fields and disable them while loading
  input.value = '';
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
  if (micBtn) micBtn.disabled = true;

  const fileDetails = chatAttachment;
  clearChatAttachment();

  // Append user message
  appendChatMessage('student', userMessageHTML);
  
  // Show AI typing simulation
  showAiTypingIndicator();

  // Build the prompt for AI
  let promptText = "";
  if (fileDetails) {
    promptText = `The student uploaded a homework file named "${fileDetails.name}". Help explain the homework or solve the concepts described in it step-by-step for a Grade 6 student. Text query: "${text || 'Explain the worksheet and solve the problem'}"`;
  } else {
    promptText = `You are a friendly AI Teacher Copilot for a Grade 6 student. Answer the following question or explain the concept clearly, step-by-step, in a friendly tone: "${text}"`;
  }

  const aiResponse = await callAiApi(promptText);

  removeAiTypingIndicator();

  // Re-enable inputs
  input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;
  if (micBtn) micBtn.disabled = false;
  input.focus();

  // Format AI response to HTML paragraphs if not already HTML
  let formattedResponse = aiResponse;
  if (!aiResponse.trim().startsWith('<')) {
    formattedResponse = aiResponse.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }

  // Determine a simulated concept key for follow-ups
  const conceptKey = text.toLowerCase().includes('photo') ? 'photosynthesis' : 
                     (text.toLowerCase().includes('evap') ? 'evaporation' : 'general');

  appendChatMessage('ai', formattedResponse, conceptKey);
  
  // Generate context-aware follow-up suggestions
  const lowerResponse = aiResponse.toLowerCase();
  const suggestions = [];
  if (lowerResponse.includes('photosynthesis') || lowerResponse.includes('plant') || lowerResponse.includes('leaf')) {
    suggestions.push('How does carbon dioxide get inside the leaf?', 'Tell me the photosynthesis story again');
  } else if (lowerResponse.includes('evaporation') || lowerResponse.includes('water') || lowerResponse.includes('vapor')) {
    suggestions.push('Explain condensation next', 'What happens when water vapor gets cold?');
  } else if (lowerResponse.includes('fraction') || lowerResponse.includes('divide') || lowerResponse.includes('math')) {
    suggestions.push('Explain dividing fractions with a pizza slice example', 'Show me another fraction question');
  } else {
    suggestions.push('Explain this topic in simpler terms', 'Give me a real-world example of this');
  }
  
  appendFollowUps(suggestions);
}

function showAiTypingIndicator() {
  const history = document.getElementById('chatHistory');
  const indicator = document.createElement('div');
  indicator.className = 'chat-msg ai typing-indicator-msg';
  indicator.id = 'aiTypingIndicator';
  indicator.innerHTML = `
    <div class="msg-bubble" style="padding: 10px 15px; font-style: italic;">
      <span>Thinking...</span>
    </div>
  `;
  history.appendChild(indicator);
  history.scrollTop = history.scrollHeight;
}

function removeAiTypingIndicator() {
  const indicator = document.getElementById('aiTypingIndicator');
  if (indicator) indicator.remove();
}

function appendFollowUps(questions) {
  const history = document.getElementById('chatHistory');
  const wrapper = document.createElement('div');
  wrapper.className = 'follow-up-questions';
  
  questions.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'follow-up-question-btn';
    btn.textContent = `💬 "${q}"`;
    btn.onclick = () => {
      quickStartChat(q);
      wrapper.remove();
    };
    wrapper.appendChild(btn);
  });

  history.appendChild(wrapper);
  history.scrollTop = history.scrollHeight;
}

// Quick trigger chats from suggestions
function quickStartChat(promptText) {
  switchTab('chat');
  document.getElementById('chatMessageInput').value = promptText;
  sendChatMessage();
}

function quickExplanation(topicName) {
  quickStartChat(`Explain ${topicName} in simple terms`);
}

function handleChatKeydown(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

// Mock file attachment attachment previews
function handleChatFileSelect(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    chatAttachment = {
      name: file.name,
      type: file.type
    };

    const previewBar = document.getElementById('chatAttachmentPreview');
    const nameSpan = document.getElementById('chatAttachmentName');
    nameSpan.textContent = file.name;
    previewBar.classList.add('active');
  }
}

function clearChatAttachment() {
  chatAttachment = null;
  document.getElementById('chatAttachmentPreview').classList.remove('active');
  document.getElementById('chatFileInput').value = '';
}

// Mock mic toggle
function toggleChatMic() {
  const micBtn = document.getElementById('chatMicBtn');
  const input = document.getElementById('chatMessageInput');
  
  isChatMicActive = !isChatMicActive;
  if (isChatMicActive) {
    micBtn.classList.add('mic-active');
    input.placeholder = "Listening... Speak your question clearly.";
    
    // Simulate speech-to-text text writing after 3 seconds
    setTimeout(() => {
      if (isChatMicActive) {
        input.value = "Why do plants need water?";
        toggleChatMic(); // Turn off mic
      }
    }, 3000);
  } else {
    micBtn.classList.remove('mic-active');
    input.placeholder = "Ask anything... (e.g. 'Why is the sky blue?')";
  }
}


// ==========================================
// 4. STORY MODE INTERACTIVE GENERATOR
// ==========================================

async function generateStoryFromInput() {
  const inputEl = document.getElementById('storyInput');
  const gradeSelect = document.getElementById('gradeSelect');
  const selectedGrade = gradeSelect ? parseInt(gradeSelect.value) : 6;
  const inputVal = inputEl.value.trim();
  if (!inputVal) return;

  const generateBtn = document.getElementById('storyGenerateBtn');
  const placeholder = document.getElementById('storyPlaceholder');
  const contentBox = document.getElementById('storyContentBox');
  const activeTitle = document.getElementById('activeStoryTitle');
  const textContainer = document.getElementById('storyTextContainer');
  const illustration = document.getElementById('storyIllustration');

  // Disable button and input
  if (generateBtn) generateBtn.disabled = true;
  inputEl.disabled = true;

  placeholder.style.display = 'none';
  contentBox.classList.add('active');
  activeTitle.textContent = `The Story of ${inputVal}`;
  textContainer.innerHTML = 'Writing characters and preparing pages... 📚';
  
  // Set custom illustration depending on keyword
  let iconName = 'book-open';
  if (inputVal.toLowerCase().includes('water') || inputVal.toLowerCase().includes('evap')) iconName = 'droplet';
  else if (inputVal.toLowerCase().includes('plant') || inputVal.toLowerCase().includes('breath')) iconName = 'leaf';
  else if (inputVal.toLowerCase().includes('sun') || inputVal.toLowerCase().includes('solar')) iconName = 'sun';
  else if (inputVal.toLowerCase().includes('gravity')) iconName = 'arrow-down';
  illustration.innerHTML = `<i data-lucide="${iconName}"></i>`;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Determine instruction based on selected grade
  let gradeInstruction = '';
  if (selectedGrade <= 3) {
    gradeInstruction = 'Use very simple vocabulary, short sentences, playful tone, and relatable everyday characters (animals, toys, family). Keep technical terms minimal and use lots of repetition and simple analogies.';
  } else if (selectedGrade <= 6) {
    gradeInstruction = 'Use slightly more descriptive language, introduce basic subject-specific vocabulary with simple definitions, moderate sentence length, and an adventure/curiosity-driven narrative style.';
  } else if (selectedGrade <= 8) {
    gradeInstruction = 'Provide more detailed explanations, include proper scientific or subject terminology with context, longer narrative arcs, and simple cause/effect relationships.';
  } else {
    gradeInstruction = 'Use accurate subject terminology, complex sentence structures, and incorporate real-world applications or deeper insights suitable for higher grades.';
  }
  const promptText = `Write an engaging, illustrated-style short story explaining "${inputVal}" for a Grade ${selectedGrade} student.
${gradeInstruction}
Break the story into exactly 4 short paragraphs. Use characters, adventure, or analogy to explain the concept.
Separate each paragraph with a line containing only "---".
Do not output any introductory or summary text, just the 4 paragraphs separated by "---".`;

  const aiStory = await callAiApi(promptText);

  // Split story into paragraphs
  let paragraphs = aiStory.split('---').map(p => p.trim()).filter(p => p.length > 0);
  if (paragraphs.length < 2) {
    paragraphs = aiStory.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
  }
  
  // Limit to at most 4 paragraphs to keep layout clean
  if (paragraphs.length > 4) {
    paragraphs = paragraphs.slice(0, 4);
  }

  // Re-enable button and input
  if (generateBtn) generateBtn.disabled = false;
  inputEl.disabled = false;

  textContainer.innerHTML = '';
  
  // Write paragraphs sequentially to make it feel "streamed"
  paragraphs.forEach((pText, index) => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = 'story-paragraph';
      p.innerHTML = pText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      textContainer.appendChild(p);
      textContainer.scrollTop = textContainer.scrollHeight;
    }, index * 1500);
  });
}


// ==========================================
// 5. VOICE LEARNING (Web Speech API Integration)
// ==========================================

let isVoiceActive = false;
let voiceTimer = null;
let recognitionInstance = null;
let currentUtterance = null;
let availableVoices = [];
let voiceSettings = {
  voiceIndex: null,
  rate: 1.0,
  pitch: 1.0,
  lang: 'en-IN'
};
let isVoiceMuted = false;
let lastAiVoiceResponse = "";
let isProcessingVoice = false;

function initVoiceVoices() {
  if (!('speechSynthesis' in window)) return;

  const populate = () => {
    availableVoices = window.speechSynthesis.getVoices();
    const select = document.getElementById('voiceSelect');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Default System Voice</option>';
    availableVoices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — Default' : ''}`;
      select.appendChild(option);
    });
    if (currentVal !== "" && currentVal < availableVoices.length) {
      select.value = currentVal;
    }
  };

  populate();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populate;
  }
}

function updateVoiceSettings() {
  const select = document.getElementById('voiceSelect');
  const langSelect = document.getElementById('voiceLang');
  const rateInput = document.getElementById('voiceRate');
  const pitchInput = document.getElementById('voicePitch');
  const rateValSpan = document.getElementById('voiceRateVal');
  const pitchValSpan = document.getElementById('voicePitchVal');

  if (select) voiceSettings.voiceIndex = select.value !== "" ? parseInt(select.value) : null;
  if (langSelect) voiceSettings.lang = langSelect.value || 'en-IN';
  if (rateInput) {
    voiceSettings.rate = parseFloat(rateInput.value) || 1.0;
    if (rateValSpan) rateValSpan.textContent = `${voiceSettings.rate.toFixed(1)}x`;
  }
  if (pitchInput) {
    voiceSettings.pitch = parseFloat(pitchInput.value) || 1.0;
    if (pitchValSpan) pitchValSpan.textContent = voiceSettings.pitch.toFixed(1);
  }
}

function showVoiceError(message) {
  const alertBox = document.getElementById('voiceErrorAlert');
  const msgSpan = document.getElementById('voiceErrorMessage');
  if (alertBox && msgSpan) {
    msgSpan.textContent = message;
    alertBox.style.display = 'flex';
  }
}

function dismissVoiceError() {
  const alertBox = document.getElementById('voiceErrorAlert');
  if (alertBox) {
    alertBox.style.display = 'none';
  }
}

function toggleVoiceSession() {
  dismissVoiceError();
  const startBtn = document.getElementById('voiceStartBtn');
  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  isVoiceActive = !isVoiceActive;

  if (isVoiceActive) {
    if (!SpeechRecognition) {
      showVoiceError("Web Speech Recognition is not supported by your browser. Please use Chrome or Edge.");
      isVoiceActive = false;
      return;
    }

    startBtn.innerHTML = `<i data-lucide="square"></i> Stop Session`;
    startBtn.className = "btn-3d btn-3d-orange";

    // Animated waveform bars
    const bars = waveform.querySelectorAll('span');
    voiceTimer = setInterval(() => {
      if (waveform.classList.contains('listening') || waveform.classList.contains('speaking')) {
        bars.forEach(bar => {
          bar.style.height = `${Math.floor(Math.random() * 45) + 8}px`;
        });
      } else {
        bars.forEach(bar => bar.style.height = '8px');
      }
    }, 100);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    startListeningCycle();
  } else {
    // Reset to idle state
    startBtn.innerHTML = `<i data-lucide="mic"></i> Start Speaking`;
    startBtn.className = "btn-3d btn-3d-sky";
    statusTitle.textContent = "Ready to talk!";
    statusSub.textContent = "Ask your questions aloud, and hear explanations naturally.";
    waveform.classList.remove('listening', 'speaking');
    avatar.textContent = '🤖';
    avatar.classList.remove('speaking');
    subtitle.innerHTML = "Session ended. Click 'Start Speaking' to begin again.";

    clearInterval(voiceTimer);
    voiceTimer = null;
    const bars = waveform.querySelectorAll('span');
    bars.forEach(bar => bar.style.height = '8px');

    if (recognitionInstance) {
      try { recognitionInstance.abort(); } catch (e) {}
      recognitionInstance = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceTTSControlState(false, false, false);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function startListeningCycle() {
  if (!isVoiceActive || isProcessingVoice) return;

  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  statusTitle.textContent = "AI is listening...";
  statusSub.textContent = "Speak clearly into your microphone.";
  waveform.classList.add('listening');
  waveform.classList.remove('speaking');
  avatar.textContent = '👂';
  avatar.classList.remove('speaking');
  subtitle.innerHTML = "<em>(Listening for your speech...)</em>";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  if (recognitionInstance) {
    try { recognitionInstance.abort(); } catch (e) {}
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.continuous = false;
  recognitionInstance.interimResults = true;
  recognitionInstance.lang = voiceSettings.lang || 'en-US';

  let finalTranscript = '';

  recognitionInstance.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    const currentText = finalTranscript || interimTranscript;
    subtitle.innerHTML = `<strong>You:</strong> ${currentText}`;

    if (finalTranscript.trim().length > 0) {
      try { recognitionInstance.stop(); } catch (e) {}
      processVoiceQuestion(finalTranscript.trim());
    }
  };

  recognitionInstance.onerror = (err) => {
    console.warn("Speech recognition error:", err.error);
    if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
      showVoiceError("Microphone access was denied. Please allow microphone permissions in browser settings.");
      if (isVoiceActive) toggleVoiceSession();
    } else if (err.error === 'network') {
      showVoiceError("Network error occurred during speech recognition.");
    }
  };

  recognitionInstance.onend = () => {
    if (isVoiceActive && !isProcessingVoice && !finalTranscript) {
      setTimeout(() => {
        if (isVoiceActive && !isProcessingVoice) {
          startListeningCycle();
        }
      }, 1000);
    }
  };

  try {
    recognitionInstance.start();
  } catch (e) {
    console.error("Failed to start speech recognition:", e);
  }
}

async function processVoiceQuestion(questionText) {
  if (!isVoiceActive || isProcessingVoice) return;
  isProcessingVoice = true;

  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  appendVoiceTranscript('user', questionText);

  statusTitle.textContent = "AI is thinking...";
  statusSub.textContent = "Fetching explanation from AI.";
  waveform.classList.remove('listening');
  avatar.textContent = '🤔';

  let aiResponse = "";
  try {
    const promptText = `You are a friendly AI teacher copilot speaking directly to a student. Keep your answer brief, clear, and natural to read aloud (maximum 2 to 3 sentences). Question: "${questionText}"`;
    aiResponse = await callAiApi(promptText);
  } catch (error) {
    console.error("Error contacting Flask backend / Groq AI:", error);
    showVoiceError("Backend server or Groq AI is unavailable.");
    aiResponse = "I'm sorry, I am currently unable to reach the AI server. Please make sure the backend server is running.";
  }

  isProcessingVoice = false;

  if (!isVoiceActive) return;

  const cleanText = aiResponse.replace(/[*#_\`\[\]()]/g, '').trim();
  lastAiVoiceResponse = cleanText;

  appendVoiceTranscript('ai', aiResponse);
  subtitle.innerHTML = `<strong>You:</strong> ${questionText}<br><strong style="color:var(--color-green-dark)">AI:</strong> ${aiResponse}`;

  speakAiResponse(cleanText);
}

function speakAiResponse(textToSpeak) {
  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');

  statusTitle.textContent = "AI is speaking...";
  statusSub.textContent = "Playing explanation audio.";
  waveform.classList.add('speaking');
  avatar.textContent = '🤖';
  avatar.classList.add('speaking');

  if (!('speechSynthesis' in window)) {
    showVoiceError("Speech Synthesis is not supported by your browser.");
    setVoiceTTSControlState(false, false, true);
    if (isVoiceActive) setTimeout(startListeningCycle, 2000);
    return;
  }

  window.speechSynthesis.cancel();

  if (isVoiceMuted) {
    setVoiceTTSControlState(false, false, true);
    waveform.classList.remove('speaking');
    avatar.classList.remove('speaking');
    if (isVoiceActive) setTimeout(startListeningCycle, 2500);
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
  currentUtterance.rate = voiceSettings.rate || 1.0;
  currentUtterance.pitch = voiceSettings.pitch || 1.0;

  if (voiceSettings.lang) {
    currentUtterance.lang = voiceSettings.lang;
  }

  if (voiceSettings.voiceIndex !== null && availableVoices[voiceSettings.voiceIndex]) {
    currentUtterance.voice = availableVoices[voiceSettings.voiceIndex];
  }

  setVoiceTTSControlState(true, false, true);

  currentUtterance.onend = () => {
    setVoiceTTSControlState(false, false, true);
    waveform.classList.remove('speaking');
    avatar.classList.remove('speaking');
    if (isVoiceActive) {
      setTimeout(() => {
        if (isVoiceActive) startListeningCycle();
      }, 1000);
    }
  };

  currentUtterance.onerror = (e) => {
    console.error("Speech Synthesis Error:", e);
    showVoiceError("Speech Synthesis error occurred.");
    setVoiceTTSControlState(false, false, true);
    waveform.classList.remove('speaking');
    avatar.classList.remove('speaking');
    if (isVoiceActive) {
      setTimeout(() => {
        if (isVoiceActive) startListeningCycle();
      }, 1000);
    }
  };

  window.speechSynthesis.speak(currentUtterance);
}

function appendVoiceTranscript(sender, text) {
  const history = document.getElementById('voiceTranscriptHistory');
  const emptyPlaceholder = document.getElementById('voiceTranscriptEmpty');
  if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';

  if (!history) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `voice-transcript-msg ${sender}`;
  msgDiv.innerHTML = `<strong>${sender === 'user' ? '👤 You' : '🤖 AI Assistant'}:</strong> ${text}`;
  history.appendChild(msgDiv);
  history.scrollTop = history.scrollHeight;
}

function setVoiceTTSControlState(canPause, canResume, canRepeat) {
  const pauseBtn = document.getElementById('voicePauseBtn');
  const resumeBtn = document.getElementById('voiceResumeBtn');
  const repeatBtn = document.getElementById('voiceRepeatBtn');

  if (pauseBtn) pauseBtn.disabled = !canPause;
  if (resumeBtn) resumeBtn.disabled = !canResume;
  if (repeatBtn) repeatBtn.disabled = !canRepeat;
}

function pauseVoiceTTS() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    setVoiceTTSControlState(false, true, true);
    const statusTitle = document.getElementById('voiceStatusTitle');
    if (statusTitle) statusTitle.textContent = "Audio Paused";
  }
}

function resumeVoiceTTS() {
  if (window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setVoiceTTSControlState(true, false, true);
    const statusTitle = document.getElementById('voiceStatusTitle');
    if (statusTitle) statusTitle.textContent = "AI is speaking...";
  }
}

function repeatVoiceResponse() {
  if (lastAiVoiceResponse) {
    speakAiResponse(lastAiVoiceResponse);
  }
}

function toggleMuteTTS() {
  isVoiceMuted = !isVoiceMuted;
  const muteBtn = document.getElementById('voiceMuteBtn');
  if (muteBtn) {
    if (isVoiceMuted) {
      muteBtn.innerHTML = `<i data-lucide="volume-x"></i> Unmute`;
      muteBtn.classList.add('btn-3d-orange');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else {
      muteBtn.innerHTML = `<i data-lucide="volume-2"></i> Mute`;
      muteBtn.classList.remove('btn-3d-orange');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function clearVoiceConversation() {
  const history = document.getElementById('voiceTranscriptHistory');
  if (history) {
    history.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;" id="voiceTranscriptEmpty">No messages in this session yet.</p>';
  }
  const subtitle = document.getElementById('voiceSubtitleContainer');
  if (subtitle) {
    subtitle.innerHTML = "Click 'Start Speaking' to begin the conversation. Say \"Tell me about evaporation.\"";
  }
  lastAiVoiceResponse = "";
  setVoiceTTSControlState(false, false, false);
}


// ==========================================
// 6. HOMEWORK HELPER (OCR Scanner lines)
// ==========================================

function handleHomeworkUpload(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('scanImageSrc').src = e.target.result;
      runHomeworkScan();
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function mockHomeworkScan() {
  // Use mock notebook page image placeholder
  document.getElementById('scanImageSrc').src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FFFDF5' stroke='%23DDD' stroke-width='2'/><line x1='10' y1='10' x2='90' y2='10' stroke='%23DDD'/><line x1='10' y1='25' x2='90' y2='25' stroke='%23DDD'/><text x='15' y='40' font-family='sans-serif' font-size='6' font-weight='bold'>Q5: Solve 3x + 9 = 24</text><line x1='10' y1='55' x2='90' y2='55' stroke='%23DDD'/></svg>";
  runHomeworkScan();
}

async function runHomeworkScan() {
  const placeholder = document.getElementById('scanPlaceholder');
  const results = document.getElementById('scanResults');
  const scanImg = document.getElementById('scanUploadedImage');
  const laser = document.getElementById('scanLaserLine');
  const ocrBlock = document.getElementById('homeworkOcrBlock');
  const explanationBlock = document.getElementById('homeworkExplanationBlock');

  placeholder.style.display = 'none';
  results.style.display = 'none';
  scanImg.style.display = 'block';
  laser.style.display = 'block';

  // Get problem details
  let filename = "";
  const fileInput = document.getElementById('homeworkFileInput');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    filename = fileInput.files[0].name;
  }

  let problemText = "Question 5: Solve the equation 3x + 9 = 24. Show your working steps.";
  let promptText = "";

  if (filename) {
    problemText = `Problem extracted from worksheet: ${filename}`;
    promptText = `A student uploaded a worksheet file named "${filename}". Identify a typical Grade 6 algebra or science homework problem that matches this context. Provide a detailed, step-by-step tutor explanation for it. Return ONLY the HTML contents (paragraphs, steps, code blocks) describing how to solve it. Do not include markdown wraps or styling details.`;
  } else {
    promptText = `Solve the equation "3x + 9 = 24" step-by-step as a friendly AI tutor. Provide clear instruction for each step. Return the response as simple HTML (using <h4> for headers, <p> for paragraphs, <ol> and <li> for steps, and <code> for math formulas). Do not use markdown wraps.`;
  }

  const apiPromise = callAiApi(promptText);
  const timerPromise = new Promise(resolve => setTimeout(resolve, 2500));

  const [aiResponse] = await Promise.all([apiPromise, timerPromise]);

  laser.style.display = 'none';
  results.style.display = 'block';
  results.classList.add('active');

  ocrBlock.textContent = `"${problemText}"`;
  
  let formattedExplanation = aiResponse;
  if (!aiResponse.trim().startsWith('<')) {
    formattedExplanation = `<h4><i data-lucide="sparkles"></i> Teacher Copilot Guidance</h4>` + 
      aiResponse.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  } else {
    if (!aiResponse.includes('Teacher Copilot Guidance') && !aiResponse.includes('<h4>')) {
      formattedExplanation = `<h4><i data-lucide="sparkles"></i> Teacher Copilot Guidance</h4>` + aiResponse;
    }
  }

  const actionButtonsHTML = `
    <div style="margin-top: 15px; display: flex; gap: 10px;">
      <button class="btn-3d btn-3d-sky" style="padding: 6px 12px; font-size: 0.8rem;" onclick="switchTab('chat'); quickStartChat('Explain step 1 of equation 3x+9=24 again in Tamil')">Explain Step 1 in Tamil</button>
      <button class="btn-3d btn-3d-white" style="padding: 6px 12px; font-size: 0.8rem;" onclick="switchTab('chat'); quickStartChat('Give me another similar algebra problem to solve')">Practice Similar Problem</button>
    </div>
  `;
  explanationBlock.innerHTML = formattedExplanation + actionButtonsHTML;

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}


// ==========================================
// 7. AI QUIZ ENGINE
// ==========================================



let currentQuizTopic = '';
let currentQuizDifficulty = '';
let quizIndex = 0;
let quizScore = 0;
let activeQuestions = [];
let quizOptionSelected = null;
let currentQuizQuestionType = '';

function initQuiz() {
  resetQuizView();
}

function resetQuizView() {
  document.getElementById('quizWelcomeScreen').style.display = 'block';
  document.getElementById('quizActiveScreen').style.display = 'none';
  document.getElementById('quizResultsScreen').style.display = 'none';
}

async function startMockQuiz() {
  const subjectInput = document.getElementById('quizSubject');
  const topicInput = document.getElementById('quizTopic');
  const diffSelect = document.getElementById('quizDifficulty');
  const questionTypeSelect = document.getElementById('quizQuestionType');
  const generateBtn = document.getElementById('quizGenerateBtn');
  
  const subjectVal = (subjectInput && subjectInput.value.trim()) ? subjectInput.value.trim() : 'Science';
  const topicVal = (topicInput && topicInput.value.trim()) ? topicInput.value.trim() : 'Water Cycles';
  const diffVal = diffSelect ? diffSelect.value : 'Medium';
  const qTypeVal = questionTypeSelect ? questionTypeSelect.value : 'MCQ';

  currentQuizTopic = `${subjectVal} - ${topicVal}`;
  currentQuizDifficulty = diffVal;
  currentQuizQuestionType = qTypeVal;

  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating AI Quiz... 🧠";
  }

  const typeDesc = qTypeVal === 'Fill in the Blank' 
    ? 'fill-in-the-blank style (where each question has a blank ___ for the answer)' 
    : 'multiple choice';

  const promptText = `Generate a 3-question ${typeDesc} quiz on the subject "${subjectVal}" and topic "${topicVal}" with difficulty "${diffVal}" for a Grade 6 student.
Return the response strictly as a JSON object matching this schema:
{
  "questions": [
    {
      "q": "Question text?",
      "options": ["A) option A", "B) option B", "C) option C", "D) option D"],
      "correct": 0,
      "explain": "Explanation text"
    }
  ]
}
Ensure there are exactly 3 questions. The 'correct' field must be the index (0, 1, 2, or 3) of the correct answer. Return ONLY the JSON object. Do not include markdown formatting, backticks, or extra text.`;

  try {
    const responseText = await callAiApi(promptText);
    if (responseText === "Unable to contact AI server.") {
      throw new Error("Unable to contact AI server.");
    }
    
    let cleanJsonText = responseText.trim();
    if (cleanJsonText.startsWith("```")) {
      cleanJsonText = cleanJsonText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }
    
    const parsedData = JSON.parse(cleanJsonText);
    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
      activeQuestions = parsedData.questions;
    } else {
      throw new Error("Invalid questions array in parsed JSON");
    }

    quizIndex = 0;
    quizScore = 0;

    document.getElementById('quizWelcomeScreen').style.display = 'none';
    document.getElementById('quizActiveScreen').style.display = 'block';
    
    showQuizQuestion();
  } catch (e) {
    console.error("Failed to generate custom AI Quiz:", e);
    alert("Unable to contact AI server.");
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate AI Quiz Now";
    }
  }
}

function showQuizQuestion() {
  const question = activeQuestions[quizIndex];
  
  document.getElementById('quizQuestionNumber').textContent = `Question ${quizIndex + 1} of ${activeQuestions.length}`;
  document.getElementById('quizQuestionCategory').textContent = currentQuizTopic.split(' - ')[0];
  document.getElementById('quizQuestionText').textContent = question.q;
  
  // Set progress bar
  const progressPercent = (quizIndex / activeQuestions.length) * 100;
  document.getElementById('quizProgressBar').style.width = `${progressPercent}%`;

  // Render options list or fill‑in‑the‑blank input based on question type
  const list = document.getElementById('quizOptionsList');
  list.innerHTML = '';
  quizOptionSelected = null;

  if (currentQuizQuestionType === 'Fill in the Blank') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'quizAnswerInput';
    input.className = 'quiz-select-input';
    input.placeholder = 'Your answer';
    list.appendChild(input);
    // Enable the Check Answer button when user types
    const nextBtn = document.getElementById('quizNextBtn');
    input.addEventListener('input', () => {
      nextBtn.disabled = input.value.trim() === '';
    });
  } else {
    // MCQ rendering (existing behavior)
    question.options.forEach((opt, idx) => {
      const btn = document.createElement('div');
      btn.className = 'quiz-option-item';
      btn.innerHTML = `
        <span class="quiz-option-letter">${String.fromCharCode(65 + idx)}</span>
        <span>${opt}</span>
      `;
      btn.onclick = () => selectQuizOption(idx, btn);
      list.appendChild(btn);
    });
  }

  // Hide feedback banner, set next button to check state
  document.getElementById('quizFeedbackBanner').style.display = 'none';
  const nextBtn = document.getElementById('quizNextBtn');
  nextBtn.disabled = true;
  nextBtn.textContent = 'Check Answer';
}

function selectQuizOption(index, element) {
  // Clear previous selected options
  const options = document.querySelectorAll('.quiz-option-item');
  options.forEach(opt => opt.classList.remove('selected'));

  element.classList.add('selected');
  quizOptionSelected = index;
  document.getElementById('quizNextBtn').disabled = false;
}

function nextQuizQuestion() {
  const nextBtn = document.getElementById('quizNextBtn');
  const banner = document.getElementById('quizFeedbackBanner');
  const bannerText = document.getElementById('quizFeedbackText');
  const bannerIcon = document.getElementById('quizFeedbackIcon');
  
  const question = activeQuestions[quizIndex];

  // Stage 1: Checking answer
  if (nextBtn.textContent === 'Check Answer') {
    let isCorrect = false;
    if (currentQuizQuestionType === 'Fill in the Blank') {
      const userAns = (document.getElementById('quizAnswerInput')?.value || '').trim().toLowerCase();
      const correctAnsRaw = question.answer || (question.options && question.options[question.correct]) || '';
      const correctAns = correctAnsRaw.replace(/^\s*\w+\)\s*/, '').trim().toLowerCase(); // strip possible "A) " prefix
      isCorrect = userAns === correctAns;
    } else {
      // MCQ
      isCorrect = (quizOptionSelected === question.correct);
      // Highlight options
      const options = document.querySelectorAll('.quiz-option-item');
      options.forEach((opt, idx) => {
        if (idx === question.correct) {
          opt.classList.add('correct');
        } else if (idx === quizOptionSelected) {
          opt.classList.add('incorrect');
        }
      });
    }

    if (isCorrect) {
      quizScore++;
      banner.className = 'quiz-feedback-banner correct';
      bannerText.textContent = "Superb job! You got it right.";
      bannerIcon.setAttribute('data-lucide', 'check-circle-2');
    } else {
      banner.className = 'quiz-feedback-banner incorrect';
      bannerText.textContent = `Not quite. ${question.explain}`;
      bannerIcon.setAttribute('data-lucide', 'alert-circle');
    }
    
    banner.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Toggle button label
    nextBtn.textContent = (quizIndex + 1 < activeQuestions.length) ? 'Next Question' : 'Finish Quiz';
  } 
  // Stage 2: Advancing index
  else {
    quizIndex++;
    if (quizIndex < activeQuestions.length) {
      showQuizQuestion();
    } else {
      finishQuiz();
    }
  }
}

function finishQuiz() {
  document.getElementById('quizActiveScreen').style.display = 'none';
  document.getElementById('quizResultsScreen').style.display = 'block';

  document.getElementById('quizScoreVal').textContent = `${quizScore} / ${activeQuestions.length}`;
  
  const scorePercent = (quizScore / activeQuestions.length) * 100;
  let summaryTag = '';
  if (scorePercent === 100) summaryTag = 'Excellent work, Aarav! A perfect score! 🏆';
  else if (scorePercent >= 70) summaryTag = 'Great job! You have a solid grasp on this lesson. 🌟';
  else summaryTag = 'Good try! Let\'s revise this lesson to get a higher score next time. 📖';
  
  document.getElementById('quizScoreTag').textContent = summaryTag;
}

function quitQuiz() {
  if (confirm("Are you sure you want to exit the quiz? Your progress won't be saved.")) {
    resetQuizView();
  }
}

// ==========================================
// AUTHENTICATION & ROLE-BASED APPLICATION STATE
// ==========================================

// Global API Fetch helper with JWT header
async function authFetch(endpoint, options = {}) {
  options.headers = options.headers || {};
  if (!(options.body instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (response.status === 401) {
    // Token expired or invalid session
    logout(false);
    throw new Error("Session expired. Please log in again.");
  }
  return response;
}

// On page load, verify session if token exists, or stay on landing page
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  initQuiz();
  initVoiceVoices();

  if (authToken) {
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUser = data.user;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          if (currentUser.role === 'teacher') {
            switchToTeacherView('dashboard');
          } else {
            switchToStudentView('home');
          }
          return;
        }
      }
    } catch (err) {
      console.warn("Stored token is invalid or expired:", err);
      logout(false);
      return;
    }
  }

  // If no valid token, show landing view by default
  switchToLandingView();
});

// View Navigation Management
function hideAllViews() {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
}

function showLoginView() {
  hideAllViews();
  const loginView = document.getElementById('loginView');
  if (loginView) loginView.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function togglePasswordVisibility(inputId, btnElem) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById('togglePasswordIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function fillDemoCredentials(email, password) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  const alertBox = document.getElementById('loginAlert');
  if (alertBox) alertBox.style.display = 'none';
}

function handleLoginSubmit(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value.trim() : '';
  performLogin(email, password);
}

async function performLogin(email, password) {
  if (isLoggingIn) return;
  isLoggingIn = true;

  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const btnText = document.getElementById('loginBtnText');
  const btnIcon = document.getElementById('loginBtnIcon');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');

  if (alertBox) alertBox.style.display = 'none';

  // Set loading state
  if (submitBtn) submitBtn.disabled = true;
  if (emailInput) emailInput.disabled = true;
  if (passInput) passInput.disabled = true;
  if (btnText) btnText.textContent = "Logging in...";
  if (btnIcon) btnIcon.setAttribute('data-lucide', 'loader');
  if (typeof lucide !== 'undefined') lucide.createIcons();

  let res = null;
  let data = null;

  // 1. Network Request Layer
  try {
    res = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    data = await res.json();
  } catch (netErr) {
    console.error("Network connection failure:", netErr);
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      alertBox.textContent = 'Unable to connect to the server. Please check if Flask backend is running on port 5000.';
      alertBox.style.display = 'block';
    }
    isLoggingIn = false;
    if (submitBtn) submitBtn.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    if (btnText) btnText.textContent = "Log In";
    if (btnIcon) btnIcon.setAttribute('data-lucide', 'log-in');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // 2. Response Status Layer
  if (!res.ok || !data || data.success === false) {
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      if (res.status === 401) {
        alertBox.textContent = data.message || 'Invalid email or password.';
      } else if (res.status === 403) {
        alertBox.textContent = 'Access denied. You do not have permission to access this page.';
      } else {
        alertBox.textContent = data.message || `Server error (${res.status}). Please try again later.`;
      }
      alertBox.style.display = 'block';
    }
    isLoggingIn = false;
    if (submitBtn) submitBtn.disabled = false;
    if (emailInput) emailInput.disabled = false;
    if (passInput) passInput.disabled = false;
    if (btnText) btnText.textContent = "Log In";
    if (btnIcon) btnIcon.setAttribute('data-lucide', 'log-in');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  // 3. Login Successful (HTTP 200)
  authToken = data.token || data.access_token;
  currentUser = data.user;
  localStorage.setItem('access_token', authToken);
  localStorage.setItem('authToken', authToken);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  console.log("LOGIN SUBMIT:", email);
  console.log("LOGIN RESPONSE STATUS:", res.status);
  console.log("LOGIN RESPONSE BODY:", data);
  console.log("TOKEN RECEIVED:", authToken);
  console.log("USER ROLE:", currentUser ? currentUser.role : null);

  // Reset loading state controls
  isLoggingIn = false;
  if (submitBtn) submitBtn.disabled = false;
  if (emailInput) emailInput.disabled = false;
  if (passInput) passInput.disabled = false;
  if (btnText) btnText.textContent = "Log In";
  if (btnIcon) btnIcon.setAttribute('data-lucide', 'log-in');

  // 4. View Redirection Layer
  try {
    if (currentUser && currentUser.role === 'teacher') {
      console.log("REDIRECTING TO TEACHER DASHBOARD");
      switchToTeacherView('dashboard');
    } else {
      console.log("REDIRECTING TO STUDENT DASHBOARD");
      switchToStudentView('home');
    }
  } catch (uiErr) {
    console.error("UI navigation error:", uiErr);
  }
}

async function logout(callApi = true) {
  if (callApi && authToken) {
    try {
      await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    } catch (e) {}
  }
  authToken = null;
  currentUser = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  switchToLandingView();
}

function switchToLandingView() {
  hideAllViews();
  const landing = document.getElementById('landingView');
  if (landing) landing.classList.add('active');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchToStudentView(initialTab = 'home') {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'student') {
    switchToTeacherView('dashboard');
    return;
  }
  hideAllViews();
  const sView = document.getElementById('studentView');
  if (sView) sView.classList.add('active');

  const userNameElem = document.getElementById('studentUserName');
  if (userNameElem && currentUser) {
    userNameElem.textContent = currentUser.name;
  }

  switchTab(initialTab);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchToTeacherView(initialTab = 'dashboard') {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'teacher') {
    switchToStudentView('home');
    return;
  }
  hideAllViews();
  const tView = document.getElementById('teacherView');
  if (tView) tView.classList.add('active');

  const tNameElem = document.getElementById('teacherUserName');
  if (tNameElem && currentUser) {
    tNameElem.textContent = currentUser.name;
  }

  switchTeacherTab(initialTab);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchTab(tabName) {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'student') {
    switchToTeacherView('dashboard');
    return;
  }

  const tabs = document.querySelectorAll('#studentView .dashboard-tab');
  tabs.forEach(t => t.classList.remove('active'));

  const menuItems = document.querySelectorAll('#studentView .sidebar-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');

  const activeMenuItem = document.getElementById(`side-${tabName}`);
  if (activeMenuItem) activeMenuItem.classList.add('active');

  const titleMap = {
    'home': 'Home Dashboard',
    'chat': 'AI Chat Tutor',
    'story': 'Illustrated Story Mode',
    'voice': 'Voice Copilot Session',
    'homework': 'Homework Scanner & Helper',
    'quiz': 'AI Quiz Generator',
    'progress': 'Detailed Learning Progress',
    'tasks': 'My Assigned Tasks'
  };
  const titleElem = document.getElementById('header-tab-title');
  if (titleElem) titleElem.textContent = titleMap[tabName] || 'Dashboard';

  if (tabName === 'tasks') {
    loadStudentTasks();
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function switchTeacherTab(tabName) {
  if (!authToken || !currentUser) {
    showLoginView();
    return;
  }
  if (currentUser.role !== 'teacher') {
    switchToStudentView('home');
    return;
  }

  const tabs = document.querySelectorAll('#teacherView .dashboard-tab');
  tabs.forEach(t => t.classList.remove('active'));

  const menuItems = document.querySelectorAll('#teacherView .sidebar-item');
  menuItems.forEach(item => item.classList.remove('active'));

  const activeTab = document.getElementById(`teacher-tab-${tabName}`);
  if (activeTab) activeTab.classList.add('active');

  const activeMenuItem = document.getElementById(`teacher-side-${tabName}`);
  if (activeMenuItem) activeMenuItem.classList.add('active');

  const titleMap = {
    'dashboard': 'Teacher Overview Dashboard',
    'add-students': 'Add New Student',
    'view-students': 'Registered Students & Progress',
    'assign-tasks': 'Assign Homework Task',
    'review-work': 'Review Student Submissions'
  };
  const titleElem = document.getElementById('teacher-header-title');
  if (titleElem) titleElem.textContent = titleMap[tabName] || 'Teacher Dashboard';

  if (tabName === 'dashboard') loadTeacherDashboardStats();
  if (tabName === 'view-students') loadTeacherStudents();
  if (tabName === 'assign-tasks') loadTeacherStudentsForDropdown();
  if (tabName === 'review-work') loadTeacherReviews();

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// STUDENT TASK MODULE FUNCTIONS
// ==========================================
async function loadStudentTasks() {
  const container = document.getElementById('studentTasksList');
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 30px;"><p>Loading tasks...</p></div>';

  try {
    const res = await authFetch('/api/student/tasks');
    const data = await res.json();
    if (!data.success || !data.tasks || data.tasks.length === 0) {
      container.innerHTML = `
        <div class="card-3d" style="text-align: center; padding: 40px;">
          <i data-lucide="check-circle" style="font-size: 3rem; color: var(--color-green); margin-bottom: 10px;"></i>
          <h4>All Caught Up!</h4>
          <p style="color: var(--text-muted);">You have no pending tasks assigned at this moment.</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = data.tasks.map(task => {
      const sub = task.submission;
      let statusBadge = `<span class="badge-status assigned">Assigned</span>`;
      if (task.status === 'submitted' || (sub && sub.status === 'submitted')) {
        statusBadge = `<span class="badge-status submitted">Submitted</span>`;
      } else if (task.status === 'reviewed' || (sub && sub.status === 'reviewed')) {
        statusBadge = `<span class="badge-status reviewed">Reviewed</span>`;
      }

      let submissionArea = '';
      if (!sub || sub.status === 'submitted') {
        submissionArea = `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border-light);">
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 6px;">Your Answer / Solution:</label>
            <textarea id="taskAnswer_${task.id}" rows="3" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid var(--border-thick); font-family: inherit;" placeholder="Write your completed answer here...">${sub ? sub.answer || '' : ''}</textarea>
            <button class="btn-3d btn-3d-green" style="margin-top: 10px; font-size: 0.88rem;" onclick="handleStudentSubmitTask(${task.id})">
              <i data-lucide="send"></i> ${sub ? 'Update & Resubmit Work' : 'Submit Work'}
            </button>
          </div>
        `;
      } else if (sub && sub.status === 'reviewed') {
        submissionArea = `
          <div style="margin-top: 15px; padding: 12px; background-color: var(--color-green-light); border-radius: 8px; border: 1px solid var(--color-green);">
            <h5 style="color: var(--color-green-dark); margin-bottom: 4px;"><i data-lucide="award"></i> Teacher Feedback &amp; Marks</h5>
            <p style="font-size: 0.9rem; margin-bottom: 4px;"><strong>Your Submitted Answer:</strong> "${sub.answer}"</p>
            <p style="font-size: 0.9rem; margin-bottom: 4px;"><strong>Teacher Feedback:</strong> ${sub.teacher_feedback || 'No written feedback provided.'}</p>
            ${sub.marks !== null ? `<p style="font-size: 0.95rem; font-weight: 800; color: var(--color-green-dark); margin: 0;">Grade/Marks: ${sub.marks} / 100</p>` : ''}
          </div>
        `;
      }

      return `
        <div class="task-card-item">
          <div class="task-card-header">
            <div>
              <span class="tag-badge tag-sky" style="margin-bottom: 4px; display: inline-block;">${task.subject || 'General'}</span>
              <h4 class="task-card-title">${task.title}</h4>
            </div>
            ${statusBadge}
          </div>
          <p class="task-card-desc">${task.description || 'No additional instructions provided.'}</p>
          <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 15px;">
            <span><i data-lucide="calendar"></i> Assigned: ${task.created_at ? task.created_at.substring(0, 10) : 'Today'}</span>
            ${task.due_date ? `<span><i data-lucide="clock"></i> Due: ${task.due_date}</span>` : ''}
            <span><i data-lucide="user"></i> Teacher: ${task.teacher_name || 'Demo Teacher'}</span>
          </div>
          ${submissionArea}
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div class="card-3d"><p style="color: red;">Error loading tasks: ${err.message}</p></div>`;
  }
}

async function handleStudentSubmitTask(taskId) {
  const answerElem = document.getElementById(`taskAnswer_${taskId}`);
  if (!answerElem) return;
  const answer = answerElem.value.trim();

  if (!answer) {
    alert("Please enter your answer/solution before submitting.");
    return;
  }

  try {
    const res = await authFetch(`/api/student/tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert("Work submitted successfully!");
      loadStudentTasks();
    } else {
      alert(data.message || "Failed to submit task.");
    }
  } catch (err) {
    alert("Error submitting task: " + err.message);
  }
}

// ==========================================
// TEACHER MODULE FUNCTIONS
// ==========================================
async function loadTeacherDashboardStats() {
  try {
    const [resS, resT, resR] = await Promise.all([
      authFetch('/api/teacher/students'),
      authFetch('/api/teacher/tasks'),
      authFetch('/api/teacher/reviews')
    ]);

    const dataS = await resS.json();
    const dataT = await resT.json();
    const dataR = await resR.json();

    if (dataS.success && dataS.students) {
      document.getElementById('statTotalStudents').textContent = dataS.students.length;
    }
    if (dataT.success && dataT.tasks) {
      document.getElementById('statTotalTasks').textContent = dataT.tasks.length;
    }
    if (dataR.success && dataR.submissions) {
      const pending = dataR.submissions.filter(s => s.status === 'submitted').length;
      document.getElementById('statPendingReviews').textContent = pending;
    }
  } catch (err) {
    console.warn("Failed to load dashboard stats:", err);
  }
}

async function loadTeacherStudents() {
  const tbody = document.getElementById('teacherStudentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading students...</td></tr>';

  try {
    const res = await authFetch('/api/teacher/students');
    const data = await res.json();
    if (!data.success || !data.students || data.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No students registered yet. Click "Add Students" to enroll a student.</td></tr>';
      return;
    }

    tbody.innerHTML = data.students.map(s => `
      <tr>
        <td>#${s.id}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td>${s.total_tasks || 0}</td>
        <td><span class="badge-status reviewed">${s.completed_tasks || 0} Done</span></td>
        <td><span class="badge-status assigned">Student</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: red; padding: 20px;">Error: ${err.message}</td></tr>`;
  }
}

async function loadTeacherStudentsForDropdown() {
  const select = document.getElementById('taskStudentSelect');
  if (!select) return;
  select.innerHTML = '<option value="">Loading students...</option>';

  try {
    const res = await authFetch('/api/teacher/students');
    const data = await res.json();
    if (data.success && data.students && data.students.length > 0) {
      select.innerHTML = '<option value="">-- Select Student --</option>' +
        data.students.map(s => `<option value="${s.id}">${s.name} (${s.email})</option>`).join('');
    } else {
      select.innerHTML = '<option value="">No students available. Create a student first.</option>';
    }
  } catch (err) {
    select.innerHTML = '<option value="">Failed to load students</option>';
  }
}

async function handleCreateStudent(event) {
  event.preventDefault();
  const alertBox = document.getElementById('addStudentAlert');
  if (alertBox) alertBox.style.display = 'none';

  const name = document.getElementById('newStudentName').value.trim();
  const email = document.getElementById('newStudentEmail').value.trim();
  const password = document.getElementById('newStudentPassword').value.trim();

  try {
    const res = await authFetch('/api/teacher/students', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (alertBox) {
        alertBox.className = 'login-alert alert-success';
        alertBox.textContent = `Student "${name}" created successfully!`;
        alertBox.style.display = 'block';
      }
      document.getElementById('addStudentForm').reset();
    } else {
      if (alertBox) {
        alertBox.className = 'login-alert alert-danger';
        alertBox.textContent = data.message || 'Failed to create student account.';
        alertBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      alertBox.textContent = 'Error: ' + err.message;
      alertBox.style.display = 'block';
    }
  }
}

async function handleAssignTask(event) {
  event.preventDefault();
  const alertBox = document.getElementById('assignTaskAlert');
  if (alertBox) alertBox.style.display = 'none';

  const student_id = document.getElementById('taskStudentSelect').value;
  const subject = document.getElementById('taskSubjectInput').value.trim();
  const title = document.getElementById('taskTitleInput').value.trim();
  const description = document.getElementById('taskDescriptionInput').value.trim();
  const due_date = document.getElementById('taskDueDateInput').value;

  if (!student_id) {
    alert("Please select a student.");
    return;
  }

  try {
    const res = await authFetch('/api/teacher/tasks', {
      method: 'POST',
      body: JSON.stringify({ student_id: parseInt(student_id), subject, title, description, due_date })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (alertBox) {
        alertBox.className = 'login-alert alert-success';
        alertBox.textContent = `Task "${title}" assigned successfully!`;
        alertBox.style.display = 'block';
      }
      document.getElementById('assignTaskForm').reset();
    } else {
      if (alertBox) {
        alertBox.className = 'login-alert alert-danger';
        alertBox.textContent = data.message || 'Failed to assign task.';
        alertBox.style.display = 'block';
      }
    }
  } catch (err) {
    if (alertBox) {
      alertBox.className = 'login-alert alert-danger';
      alertBox.textContent = 'Error: ' + err.message;
      alertBox.style.display = 'block';
    }
  }
}

async function loadTeacherReviews() {
  const container = document.getElementById('teacherReviewsList');
  if (!container) return;
  container.innerHTML = '<div style="text-align: center; padding: 30px;"><p>Loading submissions...</p></div>';

  try {
    const res = await authFetch('/api/teacher/reviews');
    const data = await res.json();

    if (!data.success || !data.submissions || data.submissions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px;">
          <p style="color: var(--text-muted);">No student submissions to review at this time.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.submissions.map(sub => {
      const isReviewed = sub.status === 'reviewed';
      return `
        <div class="task-card-item">
          <div class="task-card-header">
            <div>
              <span class="tag-badge tag-sky" style="margin-bottom: 4px; display: inline-block;">${sub.student_name || 'Student'} (${sub.student_email || ''})</span>
              <h4 class="task-card-title">${sub.task_title || 'Homework Assignment'}</h4>
            </div>
            <span class="badge-status ${isReviewed ? 'reviewed' : 'submitted'}">${isReviewed ? 'Reviewed' : 'Needs Review'}</span>
          </div>

          <div style="margin-top: 10px; padding: 12px; background-color: var(--bg-primary); border-radius: 8px;">
            <p style="font-size: 0.88rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main);">Student's Submitted Answer:</p>
            <p style="font-size: 0.92rem; color: var(--text-main); margin: 0; line-height: 1.4;">"${sub.answer || 'No text submitted.'}"</p>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">Submitted at: ${sub.submitted_at || 'Recently'}</p>
          </div>

          <div style="margin-top: 15px;">
            <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 6px;">Teacher Feedback:</label>
            <textarea id="reviewFeedback_${sub.id}" rows="2" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 2px solid var(--border-thick); font-family: inherit;" placeholder="Provide encouraging feedback or notes for revision...">${sub.teacher_feedback || ''}</textarea>

            <div style="display: flex; gap: 15px; align-items: center; margin-top: 10px;">
              <div style="width: 160px;">
                <label style="font-weight: 700; font-size: 0.82rem; display: block; margin-bottom: 4px;">Grade / Marks (0-100):</label>
                <input type="number" id="reviewMarks_${sub.id}" value="${sub.marks !== null ? sub.marks : ''}" placeholder="e.g. 95" style="width: 100%; padding: 8px; border-radius: 6px; border: 2px solid var(--border-thick);">
              </div>
              <button class="btn-3d btn-3d-green" style="margin-top: 18px; font-size: 0.85rem; padding: 8px 16px;" onclick="handleTeacherReviewSubmission(${sub.id})">
                <i data-lucide="check-circle"></i> Save Review &amp; Grade
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div style="color: red; padding: 20px;">Error loading reviews: ${err.message}</div>`;
  }
}

async function handleTeacherReviewSubmission(subId) {
  const feedbackElem = document.getElementById(`reviewFeedback_${subId}`);
  const marksElem = document.getElementById(`reviewMarks_${subId}`);
  const feedback = feedbackElem ? feedbackElem.value.trim() : '';
  const marks = marksElem ? marksElem.value : null;

  try {
    const res = await authFetch(`/api/teacher/reviews/${subId}`, {
      method: 'POST',
      body: JSON.stringify({ feedback, marks: marks ? parseFloat(marks) : null })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      alert("Review and grade saved successfully!");
      loadTeacherReviews();
    } else {
      alert(data.message || "Failed to save review.");
    }
  } catch (err) {
    alert("Error saving review: " + err.message);
  }
}

