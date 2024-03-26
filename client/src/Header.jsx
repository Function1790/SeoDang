import { setState } from 'react'

function Tool(props) {
    return (
        <div class="tool page-not-selected">
            <img class="nav-icon" src={props.src} />
        </div>
    )
}

function Header() {
    return (
        <div class="header">
            <div class="topbar-header">
                <div>미적분</div>
            </div>
            <div class="topbar-container">
                <div class="topbar-logo"></div>
            </div>
            <div class="topbar-footer">
                <Tool src="./img/search.png"></Tool>
                <Tool src="./img/alert.png"></Tool>
            </div>
        </div>
    )
}

export default Header    