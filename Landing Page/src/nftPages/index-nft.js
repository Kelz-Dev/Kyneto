import React,{useState} from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/home-shape.png'
import profit from '../assets/images/illustration/profit.svg'

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

import { accordianData, creatorData, workData } from "../data/nftdata";

import { FiArrowRight, RiCheckboxCircleFill } from '../assets/icons/vander'

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

export default function IndexNft(){
    let [selectedCategory, setSelectedCategory] = useState(null);
    let [ activeIndex, setActiveIndex] = useState(1);

    const matchCategory = (category) => {
        setSelectedCategory(category);
    };

    const filteredData = selectedCategory
        ? workData.filter((item) => item.category === selectedCategory)
        : workData;

    let settings = {
        container: '.tiny-four-item-nav-arrow',
        controls: true,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        controlsText: ['<i class="mdi mdi-chevron-left "></i>', '<i class="mdi mdi-chevron-right"></i>'],
        nav: false,
        speed: 400,
        gutter: 12,
        responsive: {
            992: {
                items: 4
            },

            767: {
                items: 2
            },

            320: {
                items: 1
            },
        },
        };

    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 d-table w-100 pb-0">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="rounded-lg px-4 py-5 bg-light shadow position-relative overflow-hidden" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'top'}}>
                    <div className="row justify-content-center my-5">
                        <div className="col-12">
                            <div className="title-heading text-center">
                                <h4 className="display-6 fw-medium mb-3">The way to Find <br/> any <span className="gradient-text">Digital</span> Content</h4>
                                <p className="text-muted mb-0">Discover limited-edition digital arts. Create, Sell and Buy now.</p>
                            </div>

                            <div className="subcribe-form mt-5">
                                <form>
                                    <div className="mb-0">
                                        <input type="text" id="search" name="name" className="border bg-light rounded-pill" required="" placeholder="Search anything..."/>
                                        <button type="submit" className="btn btn-pills btn-primary">Search</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col">
                        <div className="section-title text-center">
                            <h4 className="title mb-3">Latest Works</h4>
                            <p className="text-muted mx-auto para-desc mb-0">Buy and sell 100+ cryptocurrencies with 20+ fiat currencies using bank transfers or your credit/debit card.</p>
                            <div className="filters-group-wrap mt-5">
                                <div className="filters-group">
                                    <ul className="container-filter mb-0 categories-filter list-unstyled filter-options">
                                        <li className={`${selectedCategory === null ? 'active' : ''} list-inline-item categories position-relative`} onClick={() => matchCategory(null)}>All</li>
                                        <li className={`${selectedCategory === 'recents' ? 'active' : ''} list-inline-item categories position-relative`} onClick={() => matchCategory('recents')}>Recents Items</li>
                                        <li className={`${selectedCategory === 'free' ? 'active' : ''} list-inline-item categories position-relative`} onClick={() => matchCategory('free')}>Free Items</li>
                                        <li className={`${selectedCategory === 'top' ? 'active' : ''} list-inline-item categories position-relative`} onClick={() => matchCategory('top')}>Top Items</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="grid" className="row">
                    {filteredData.slice(0,6).map((item, index) =>{
                        return(
                            <div className="col-lg-4 col-md-6 picture-item mt-4 py-1" data-groups='["recents"]' key={index}>
                                <div className="card nft-items nft-item-primary rounded-md border-0 shadow overflow-hidden">
                                    <div className="row g-0">
                                        <div className="col-md-6">
                                            <div className="nft-image position-relative overflow-hidden">
                                                <img src={item.image} style={{height:'178px', width:'178px'}} alt=""/>
                                                <div className="pop-icon">
                                                    <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                                </div>
                                                <div className="position-absolute top-0 end-0 mt-2 me-2">
                                                    <Link to="#" className="like"><i className="mdi mdi-heart align-middle"></i></Link>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="card-body p-md-3 content d-flex h-100 flex-column">
                                                <div>
                                                    <Link to={`/nft-item-detail/${item.id}`} className="title h6 mb-1 text-dark d-block">{item.title}</Link>
                                                    <small className="badge bg-soft-primary">{item.value}</small>
                                                </div>

                                                <div className="d-flex author align-items-center mt-md-auto mb-0 mt-4 mt-sm-0">
                                                    <div className="position-relative">
                                                        <img src={item.clientImg} className="avatar avatar-sm-sm rounded-pill shadow" alt=""/>
                                                        <div className="position-absolute top-0 start-0 translate-middle pt-2 ps-2">
                                                            <RiCheckboxCircleFill className="mdi-18px text-success"/>
                                                        </div>
                                                    </div>
                                                    <Link to="/nft-creator-profile" className="ps-2 text-dark name">{item.name}</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div> 
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 text-center mt-4 pt-2">
                        <Link to="/nft-explore" className="btn btn-primary">See More Items <FiArrowRight/></Link>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="section-title">
                            <h4 className="title mb-0">Featured Artists</h4>
                        </div>
                    </div>

                    <div className="col-md-4 text-end d-none d-md-block">
                        <Link to="nft-cretors" className="btn btn-primary">See More <FiArrowRight/></Link>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mt-4 pt-2">
                        <div className="tiny-four-item-nav-arrow">
                            <TinySlider settings={settings}>
                                {creatorData.map((item, index) =>{
                                    return(
                                        <div className="tiny-slide" key={index}>
                                            <div className="card nft-creator nft-creator-primary border-0 rounded-md shadow m-1">
                                                <div className="position-relative">
                                                    <img src={item.image} className="img-fluid rounded-md" alt=""/>
                    
                                                    <div className="position-absolute top-100 start-50 translate-middle">
                                                        <img src={item.client} className="avatar avatar-small d-block mx-auto rounded-pill" alt=""/>
                                                    </div>
                                                </div>
                    
                                                <div className="content text-center mt-4">
                                                    <div className="card-body author">
                                                        <Link to={`/nft-creator-profile/${item.id}`} className="text-dark h6 name text-capitalize">{item.name}</Link>
                                                        <small className="d-block text-muted text-lowercase">{item.tag}</small>
                    
                                                        <div className="d-flex text-start align-items-end justify-content-between mt-4">
                                                            <div>
                                                                <span className="text-muted d-block">Followers:</span>
                                                                <span className="d-block text-dark">{item.followers}</span>
                                                            </div>
                    
                                                            <Link to="#" className="btn btn-sm">Follow</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </TinySlider>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 d-md-none d-block text-center mt-4 pt-2">
                        <Link to="nft-cretors" className="btn btn-primary">See More <FiArrowRight/></Link>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <div className="me-lg-4">
                            <img src={profit} className="img-fluid" alt=""/>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="section-title mb-4 pb-2">
                            <h4 className="title mb-4">Frequently Asked Questions</h4>
                            <p className="text-muted para-desc mb-0">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                        </div>

                        <div className="accordion mt-4 pt-2">
                            {accordianData.map((item,index) =>{
                                return(
                                    <div className="accordion-item rounded border-0 shadow mt-3" key={index}>
                                        <h2 className="accordion-header">
                                            <button className={`${activeIndex === item.id ? '' : 'collapsed' } accordion-button border-0 bg-white`} type="button" onClick={() =>setActiveIndex(item.id)}>
                                                {item.title}
                                            </button>
                                        </h2>
                                        <div className={`${activeIndex === item.id ? 'show' : '' } accordion-collapse border-0 collapse`}>
                                            <div className="accordion-body text-muted bg-white">
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}