const searchBtn = document.getElementById('searchBtn')
const searcherWrap = document.getElementById('searcherWrap')
const formSearch = document.getElementById('formSearch')
const searchInput = document.getElementsByClassName('searchInput')[0]
const searcherBack = document.getElementsByClassName('searcherBack')[0]
const searchGo = document.getElementsByClassName('searchGo')[0]

function setDisplay(display) {
    searcherWrap.style.display = display
    formSearch.style.display = display
    if(display=='flex'){
        searchInput.focus()
    }
}

setDisplay('none')

searchBtn.onclick = () => setDisplay('flex')
searcherBack.onclick = () => setDisplay('none')

searchGo.onclick = () => {
    if (searchInput.value) {
        formSearch.submit()
    }
}