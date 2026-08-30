function goBack() {
  window.location.href = '/home';
}

const chatBox = document.getElementById('chatBox');
const inputField = document.getElementById('inputField');
const chatForm = document.getElementById('chatForm');
let currentUsername = null;

async function loadCurrentUser() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    currentUsername = data.loggedIn && data.user ? data.user.username : null;
  } catch (err) {
    console.error('세션 조회 실패:', err);
    currentUsername = null;
  }
}

function updateKeyboardOffset() {
  const viewport = window.visualViewport;
  if (!viewport) {
    document.documentElement.style.setProperty('--keyboard-offset', '0px');
    return;
  }

  const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
  document.documentElement.style.setProperty('--keyboard-offset', offset + 'px');
}

function renderMessage(message) {
  const isMine = !!currentUsername && message.sender === currentUsername;
  const messageWrap = document.createElement('div');
  messageWrap.className = 'message ' + (isMine ? 'me' : '');

  const sender = document.createElement('div');
  sender.className = 'sender';
  sender.textContent = isMine ? 'you' : message.sender;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = message.text;

  messageWrap.appendChild(sender);
  messageWrap.appendChild(bubble);
  chatBox.appendChild(messageWrap);
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

function loadMessages() {
  fetch('/api/messages')
    .then(function (res) {
      return res.json();
    })
    .then(function (messages) {
      const previousCount = chatBox.children.length;
      const currentCount = messages.length;
      const shouldScrollToBottom = previousCount !== currentCount || (currentCount > 0 && chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 30);

      chatBox.innerHTML = '';
      messages.forEach(function (message) {
        renderMessage(message);
      });

      if (shouldScrollToBottom) {
        scrollToBottom();
      }
    })
    .catch(function (err) {
      console.error('메시지 불러오기 실패:', err);
    });
}

function submitMessage() {
  const text = inputField.value.trim();
  if (!text) return;

  fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'user', text })
  })
    .then(function (res) {
      if (!res.ok) throw new Error('저장 실패');
      inputField.value = '';
      inputField.focus();
      setTimeout(function () {
        scrollToBottom();
      }, 50);
      loadMessages();
    })
    .catch(function (err) {
      console.error('메시지 전송 실패:', err);
    });
}

chatForm.addEventListener('submit', function (event) {
  event.preventDefault();
  submitMessage();
});

inputField.addEventListener('focus', function () {
  setTimeout(function () {
    if (window.visualViewport) {
      window.visualViewport.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    updateKeyboardOffset();
  }, 150);
});

window.addEventListener('resize', updateKeyboardOffset);
window.visualViewport && window.visualViewport.addEventListener('resize', updateKeyboardOffset);
window.visualViewport && window.visualViewport.addEventListener('scroll', updateKeyboardOffset);
window.addEventListener('pageshow', function () {
  inputField.value = '';
});

inputField.value = '';
updateKeyboardOffset();
loadCurrentUser().then(function () {
  loadMessages();
});
setInterval(function () {
  loadCurrentUser();
  loadMessages();
}, 1200);
