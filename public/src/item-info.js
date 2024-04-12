const bgimg = document.getElementsByClassName('main-photo')[0]
const content = document.getElementsByClassName('main-container')[0]
const wrapCaller = document.getElementsByClassName('wrapCaller')[0]
const closeBtn = document.getElementsByClassName('closeBtn')[0]
const callBtn = document.getElementsByClassName('callBtn')[0]
const commenter = document.getElementsByClassName('commenter')[0]

try {
    content.style.marginTop = `${bgimg.height}px`
} catch {
    console.log("bgimg not found")
    content.style.marginTop = `0px`
}

try {
    wrapCaller.style.display = 'none'
} catch {}

window.onscroll = (ev) => {
        try {
            var winY = window.scrollY;
            bgimg.style.opacity = 1 - (winY / bgimg.height)
        } catch {}
    }
    //연락 on/off
try {
    closeBtn.onclick = () => {
        wrapCaller.style.display = 'none'
    }

    callBtn.onclick = () => {
        wrapCaller.style.display = 'flex'
    }
} catch {}

const comments = document.getElementsByClassName('comment')
const replyKeyInput = document.getElementById('reply-key')
const replyDisplay = document.getElementsByClassName('reply-name')[0]
const inputComment = document.getElementsByClassName('input-long')[0]
for (var i = 0; i < comments.length; i++) {
    comments[i].replyBtn = comments[i].getElementsByClassName('comment-reply')[0]
    comments[i].name = comments[i].getElementsByClassName('comment-name')[0].innerHTML
    comments[i].key = comments[i].getElementsByClassName('comment-key')[0].innerHTML
    comments[i].replyBtn.num = i
    comments[i].replyBtn.onclick = (event) => {
        var num = event.target.num
        const _comment = comments[num]
        if (Number(replyKeyInput.value) == Number(_comment.key)) {
            replyKeyInput.value = ''
            replyDisplay.innerHTML = ``
            return
        }
        inputComment.focus()
        replyKeyInput.value = Number(_comment.key)
        replyDisplay.innerHTML = `<span class="bold">${_comment.name}</span>에게 답하기`
    }
}