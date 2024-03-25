import './style.css'
import Footer from './Footer'
import Header from './Header';

function App() {
  return (
    <div class="root">
      <Header></Header>
      <div class="container">
        <div class="item">
          <div class="item-header">
            <div class="item-imgWrap"></div>
          </div>
          <div class="item-container">
            <div class="item-title">쎈 미적분</div>
            <div class="item-description"></div>
            <div class="item-price"></div>
          </div>

        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default App;
