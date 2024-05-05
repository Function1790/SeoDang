const searchBtn = document.getElementById('searchBtn')
const searcherWrap = document.getElementById('searcherWrap')
const formSearch = document.getElementById('search')
const searchInput = document.getElementsByClassName('searchInput')[0]
const searcherBack = document.getElementsByClassName('searcherBack')[0]
const searchGo = document.getElementsByClassName('searchGo')[0]

searchGo.onclick = () => {
    if (searchInput.value) {
        formSearch.submit()
    }
}