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