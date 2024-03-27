const bgimg = document.getElementsByClassName('main-photo')[0]
const content = document.getElementsByClassName('main-container')[0]
content.style.marginTop = `${bgimg.height}px`

window.onscroll = (ev) => {
    var winY = window.scrollY;
    bgimg.style.opacity = 1 - (winY / bgimg.height)
}