// EduMate AI Platform Interactivity Logic

// Initialize Lucide Icons on load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  // Setup default state
  initQuiz();
});

// ==========================================
// API INTEGRATION
// ==========================================
const API_BASE_URL = "http://localhost:5000/api/ai";

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
// 1. VIEW & NAVIGATION MANAGEMENT
// ==========================================

function switchToStudentView(initialTab = 'home') {
  document.getElementById('landingView').classList.remove('active');
  document.getElementById('studentView').classList.add('active');
  switchTab(initialTab);
}

function switchToLandingView() {
  document.getElementById('studentView').classList.remove('active');
  document.getElementById('landingView').classList.add('active');
}

function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.dashboard-tab');
  tabs.forEach(t => t.classList.remove('active'));
  
  // Deactivate all sidebar links
  const menuItems = document.querySelectorAll('.sidebar-item');
  menuItems.forEach(item => item.classList.remove('active'));

  // Show active tab
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Activate sidebar item
  const activeMenuItem = document.getElementById(`side-${tabName}`);
  if (activeMenuItem) {
    activeMenuItem.classList.add('active');
  }

  // Update header title
  const titleMap = {
    'home': 'Home Dashboard',
    'chat': 'AI Chat Tutor',
    'story': 'Illustrated Story Mode',
    'voice': 'Voice Copilot Session',
    'homework': 'Homework Scanner & Helper',
    'quiz': 'AI Quiz Generator',
    'progress': 'Detailed Learning Progress'
  };
  document.getElementById('header-tab-title').textContent = titleMap[tabName] || 'Dashboard';
}


// ==========================================
// 2. WATCH DEMO MODAL
// ==========================================

function playMockDemo() {
  document.getElementById('demoModal').style.display = 'flex';
  document.getElementById('demoStatusText').innerHTML = 'Click Play to see EduMate AI in Action';
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

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  if (sender === 'ai') {
    avatar.innerHTML = `<div class="bot-avatar" style="width: 32px; height: 32px; font-size: 1rem;">E</div>`;
  } else {
    avatar.innerHTML = `<div class="profile-avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">A</div>`;
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

  msg.appendChild(avatar);
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
    <div class="msg-avatar"><div class="bot-avatar" style="width: 32px; height: 32px; font-size: 1rem;">E</div></div>
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

  const promptText = `Write an engaging, illustrated-style short story explaining "${inputVal}" for a Grade 6 student.
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
// 5. VOICE LEARNING (Waveform animations)
// ==========================================

let isVoiceActive = false;
let voiceTimer = null;
let recognitionInstance = null;
let currentUtterance = null;

function toggleVoiceSession() {
  const startBtn = document.getElementById('voiceStartBtn');
  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  isVoiceActive = !isVoiceActive;

  if (isVoiceActive) {
    startBtn.innerHTML = `<i data-lucide="square"></i> Stop Session`;
    startBtn.className = "btn-3d btn-3d-orange";
    
    // Waveform visual bars animation
    const bars = waveform.querySelectorAll('span');
    voiceTimer = setInterval(() => {
      bars.forEach(bar => {
        bar.style.height = `${Math.floor(Math.random() * 45) + 8}px`;
      });
    }, 100);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    startListeningCycle();
  } else {
    // Reset to idle
    startBtn.innerHTML = `<i data-lucide="play"></i> Start Speaking`;
    startBtn.className = "btn-3d btn-3d-sky";
    statusTitle.textContent = "Ready to talk!";
    statusSub.textContent = "Ask your questions aloud, and hear explanations naturally.";
    waveform.classList.remove('listening', 'speaking');
    avatar.textContent = '🤖';
    avatar.classList.remove('speaking');
    subtitle.innerHTML = "Session ended. Click 'Start Speaking' to begin again.";
    
    clearInterval(voiceTimer);
    const bars = waveform.querySelectorAll('span');
    bars.forEach(bar => bar.style.height = '8px');

    if (recognitionInstance) {
      recognitionInstance.abort();
      recognitionInstance = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function startListeningCycle() {
  if (!isVoiceActive) return;

  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  statusTitle.textContent = "EduMate is listening...";
  statusSub.textContent = "Speak into your microphone.";
  waveform.classList.add('listening');
  waveform.classList.remove('speaking');
  avatar.textContent = '👂';
  avatar.classList.remove('speaking');
  subtitle.innerHTML = "<em>(Listening for your voice input...)</em>";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    if (recognitionInstance) {
      recognitionInstance.abort();
    }
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    let gotResult = false;

    recognitionInstance.onresult = async (event) => {
      gotResult = true;
      const spokenText = event.results[0][0].transcript;
      subtitle.innerHTML = `<strong>You:</strong> ${spokenText}`;
      recognitionInstance.stop();
      await processVoiceQuestion(spokenText);
    };

    recognitionInstance.onerror = (err) => {
      console.warn("Speech recognition error:", err);
      if (!gotResult) {
        fallbackVoiceSimulation();
      }
    };

    recognitionInstance.onend = () => {
      if (!gotResult && isVoiceActive) {
        fallbackVoiceSimulation();
      }
    };

    try {
      recognitionInstance.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      fallbackVoiceSimulation();
    }
  } else {
    fallbackVoiceSimulation();
  }
}

function fallbackVoiceSimulation() {
  if (!isVoiceActive) return;
  const subtitle = document.getElementById('voiceSubtitleContainer');
  subtitle.innerHTML = "<em>(Mic inactive. Simulating question: 'Explain photosynthesis, please.')</em>";
  
  setTimeout(async () => {
    if (isVoiceActive) {
      subtitle.innerHTML = "<strong>You:</strong> Explain photosynthesis, please.";
      await processVoiceQuestion("Explain photosynthesis in simple terms for a student");
    }
  }, 2000);
}

async function processVoiceQuestion(questionText) {
  if (!isVoiceActive) return;

  const statusTitle = document.getElementById('voiceStatusTitle');
  const statusSub = document.getElementById('voiceStatusSub');
  const waveform = document.getElementById('voiceWaveform');
  const avatar = document.getElementById('voiceAvatar');
  const subtitle = document.getElementById('voiceSubtitleContainer');

  statusTitle.textContent = "EduMate is thinking...";
  statusSub.textContent = "Fetching explanation from AI.";
  waveform.classList.remove('listening');
  
  const aiResponse = await callAiApi(`Keep your answer short, clear and conversational (under 3 sentences) suitable for reading aloud to a Grade 6 student. Question: ${questionText}`);
  
  if (!isVoiceActive) return;

  const cleanSpeechText = aiResponse.replace(/[*#_\`\[\]()]/g, '');

  subtitle.innerHTML = `<strong>You:</strong> ${questionText}<br><strong>AI:</strong> ${aiResponse}`;
  
  statusTitle.textContent = "EduMate is speaking...";
  statusSub.textContent = "Playing explanation audio.";
  waveform.classList.add('speaking');
  avatar.textContent = '🤖';
  avatar.classList.add('speaking');

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = new SpeechSynthesisUtterance(cleanSpeechText);
    
    currentUtterance.onend = () => {
      if (isVoiceActive) {
        setTimeout(() => {
          startListeningCycle();
        }, 1000);
      }
    };
    
    currentUtterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      if (isVoiceActive) {
        setTimeout(() => {
          startListeningCycle();
        }, 1000);
      }
    };

    window.speechSynthesis.speak(currentUtterance);
  } else {
    setTimeout(() => {
      if (isVoiceActive) {
        startListeningCycle();
      }
    }, 5000);
  }
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
