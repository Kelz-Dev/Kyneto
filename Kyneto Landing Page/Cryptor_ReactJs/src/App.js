import React from "react";
import '../node_modules/bootstrap/scss/bootstrap.scss'
import './assets/scss/style-dark.scss'
import './assets/css/materialdesignicons.min.css'

import { Routes, Route } from "react-router-dom";
import Index from "./pages";
import IndexTwo from "./pages/index-two";
import IndexThree from "./pages/index-three";
import IndexFour from "./pages/index-four";
import IndexFive from "./pages/index-five";
import IndexSix from "./pages/index-six";
import MarketPrice from "./pages/market-price";
import Token from "./pages/token";
import IcoListing from "./pages/ico-listing";
import CryptoWallets from "./pages/crypto-wallets";
import AboutUs from "./pages/aboutus";
import Features from "./pages/features";
import Team from "./pages/team";
import RoadMaps from "./pages/roadmap";
import Mission from "./pages/mission";
import Career from "./pages/career";
import CareerDetail from "./pages/career-detail";
import CareerApplyForm from "./pages/career-apply-form";
import Whitepaper from "./pages/whitepaper";
import HelpFaqs from "./pages/help-faqs";
import HelpOverview from "./pages/help-overview";
import HelpSupport from "./pages/help-support"
import HelpGuides from "./pages/help-guides";
import Blog from "./pages/blog";
import BlogDetail from "./pages/blog-detail";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ResetPassword from "./pages/reset-password";
import Comingsoon from "./pages/comingsoon";
import Error from "./pages/error";
import Contact from "./pages/contact";
import IndexNft from "./nftPages/index-nft";
import IndexNftTwo from "./nftPages/index-nft-two";
import IndexNftThree from "./nftPages/index-nft-three";
import IndexNftFour from "./nftPages/index-nft-four";
import IndexNftFive from "./nftPages/index-nft-five";
import NftFaqs from "./nftPages/nft-faqs";
import NftCreatore from "./nftPages/nft-creators";
import NftCreatorProfile from "./nftPages/nft-creator-profile";
import NftCreatorSetting from "./nftPages/nft-creator-setting";
import NftBecomeCreator from "./nftPages/nft-become-creator";
import NftExplore from "./nftPages/nft-explore";
import NftCollection from "./nftPages/nft-collection";
import NftItemDetails from "./nftPages/nft-item-detail";
import NftUploadWork from "./nftPages/nft-upload-work";
import NftUplodDetail from "./nftPages/nft-upload-detail";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />}/>
        <Route path="/index" element={<Index />}/>
        <Route path="/index-two" element={<IndexTwo />}/>
        <Route path="/index-three" element={<IndexThree />}/>
        <Route path="/index-four" element={<IndexFour />}/>
        <Route path="/index-five" element={<IndexFive />}/>
        <Route path="/index-six" element={<IndexSix />}/>
        <Route path="/market-price" element={<MarketPrice/>}/>
        <Route path="/token" element={<Token/>}/>
        <Route path="/ico-listing" element={<IcoListing/>}/>
        <Route path="/crypto-wallets" element={<CryptoWallets/>}/>
        <Route path="/aboutus" element={<AboutUs/>}/>
        <Route path="/features" element={<Features/>}/>
        <Route path="/team" element={<Team/>}/>
        <Route path="/roadmap" element={<RoadMaps/>}/> 
        <Route path="/mission" element={<Mission/>}/> 
        <Route path="/career" element={<Career/>}/> 
        <Route path="/career-detail" element={<CareerDetail/>}/> 
        <Route path="/career-detail/:id" element={<CareerDetail/>}/> 
        <Route path="/career-apply-form" element={<CareerApplyForm/>}/> 
        <Route path="/whitepaper" element={<Whitepaper/>}/> 
        <Route path="/help-faqs" element={<HelpFaqs/>}/> 
        <Route path="/help-overview" element={<HelpOverview/>}/> 
        <Route path="/help-guides" element={<HelpGuides/>}/> 
        <Route path="/help-support" element={<HelpSupport/>}/> 
        <Route path="/blog" element={<Blog/>}/> 
        <Route path="/blog-detail" element={<BlogDetail/>}/> 
        <Route path="/blog-detail/:id" element={<BlogDetail/>}/> 
        <Route path="/login" element={<Login/>}/> 
        <Route path="/signup" element={<Signup/>}/> 
        <Route path="/reset-password" element={<ResetPassword/>}/> 
        <Route path="/comingsoon" element={<Comingsoon/>}/> 
        <Route path="/error" element={<Error/>}/> 
        <Route path="*" element={<Error/>}/> 
        <Route path="/contact" element={<Contact/>}/> 

        <Route path="/index-nft" element={<IndexNft/>}/> 
        <Route path="/index-nft-two" element={<IndexNftTwo/>}/> 
        <Route path="/index-nft-three" element={<IndexNftThree/>}/> 
        <Route path="/index-nft-four" element={<IndexNftFour/>}/> 
        <Route path="/index-nft-five" element={<IndexNftFive/>}/> 
        <Route path="/nft-faqs" element={<NftFaqs/>}/> 
        <Route path="/nft-creators" element={<NftCreatore/>}/> 
        <Route path="/nft-creator-profile" element={<NftCreatorProfile/>}/> 
        <Route path="/nft-creator-profile/:id" element={<NftCreatorProfile/>}/> 
        <Route path="/nft-creator-setting" element={<NftCreatorSetting/>}/> 
        <Route path="/nft-become-creator" element={<NftBecomeCreator/>}/> 
        <Route path="/nft-explore" element={<NftExplore/>}/> 
        <Route path="/nft-collection" element={<NftCollection/>}/> 
        <Route path="/nft-item-detail" element={<NftItemDetails/>}/> 
        <Route path="/nft-item-detail/:id" element={<NftItemDetails/>}/> 
        <Route path="/nft-upload-work" element={<NftUploadWork/>}/> 
        <Route path="/nft-upload-detail" element={<NftUplodDetail/>}/> 
      </Routes>
    </div>
  );
}

export default App;
