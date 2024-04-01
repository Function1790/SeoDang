const user_id_HTML = document.getElementById('user-uid')
const user_id = user_id_HTML.innerText
const to_id_HTML = document.getElementById('to-uid')
const to_id = to_id_HTML.innerText

var socket = io();

socket.on('connect', function () {
    socket.emit('newUserConnect', {
        uid: user_id,
        
    });
});

var chatWindow = document.getElementById('chatWindow');
//Listen
socket.on('updateMessage', function (data) {
    if (data.name === 'SERVER') {
        var info = document.getElementById('info');
        info.innerHTML = data.message;

        setTimeout(() => {
            info.innerText = '';
        }, 1000);

    } else {
        var chatMessageEl = drawChatMessage(data);
        chatWindow.appendChild(chatMessageEl);
    }
});

function drawChatMessage(data) {
    var wrap = document.createElement('p');
    var message = document.createElement('span');
    var name = document.createElement('span');

    wrap.innerHTML = `
        <span class="output__user__name">${data.name}</span>
        <span class="output__user__message">${data.message}</span>
    `

    wrap.classList.add('output__user');
    wrap.dataset.id = socket.id;

    return wrap;
}

var sendButton = document.getElementById('chatMessageSendBtn');
var chatInput = document.getElementById('chatInput');
//send
sendButton.addEventListener('click', function () {
    var message = chatInput.value;

    if (!message) return false;

    socket.emit('sendMessage', {
        message
    });

    chatInput.value = '';
});