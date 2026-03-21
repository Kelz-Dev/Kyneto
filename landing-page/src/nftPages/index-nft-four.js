import React, { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

import { aboutData, workData } from "../data/nftdata";

import {FiArrowRight} from '../assets/icons/vander'

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

export default function IndexNftFour(){
    let [ selectedCategory, setSelectedCategory ] = useState(null);
    let filteredData = selectedCategory ? workData.filter((item) =>item.category === selectedCategory) : workData
    let settings = {
        container: '.tiny-six-item',
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
            1025: {
                items: 6
            },

            992: {
                items: 5
            },

            767: {
                items: 4
            },

            575: {
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
        <section className="section">
            <div className="container-fluid mt-5">
                <div className="row">
                    <div className="col-12">
                        <div className="tiny-six-item">
                            <TinySlider settings={settings}>
                                {workData.map((item,index) =>{
                                    return(
                                        <div className="tiny-slide" key={index}>
                                            <div className="nft-items nft-item-primary mx-2">
                                                <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                                    <img src={item.image3} className="img-fluid" alt=""/>
                                                    <div className="pop-icon">
                                                        <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                                    </div>
                                                </div>
                    
                                                <div className="content pt-3">
                                                    <Link to={`/nft-item-detail/${item.id}`} className="title h6 mb-1 text-dark d-block">{item.title}</Link>
                                                    <small className="gradient-text d-block">{item.value}</small>
                    
                                                    <ul className="pt-3 mt-2 border-top d-flex justify-content-between align-items-center list-unstyled">
                                                        <li className="d-flex author align-items-center">
                                                            <div className="position-relative">
                                                                <img src={item.clientImg} className="avatar avatar-sm-sm rounded-pill shadow" alt=""/>
                                                                <div className="position-absolute top-0 start-0 translate-middle pt-2 ps-2">
                                                                    <i className="mdi mdi-check-circle mdi-18px text-success"></i>
                                                                </div>
                                                            </div>
                                                            <Link to={`/nft-creator-profile/${item.id}`} className="ps-2 text-dark name">{item.name}</Link>
                                                        </li>
                    
                                                        <li>
                                                            <span>{item.like} <Link to="#" className="like"><i className="mdi mdi-heart align-middle"></i></Link></span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </TinySlider>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-100">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center mb-4 pb-2">
                            <h4 className="title mb-3">The most trusted NFT marketplace platform</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    {aboutData.map((item,index) =>{
                        let Icon = item.icon
                        return(
                            <div className="col-lg-4 col-md-6 mt-4 pt-2" key={index}>
                                <div className="feature feature-primary feature-clean text-center rounded p-4">
                                    <div className="icons text-center">
                                        <Icon className="icon d-block mx-auto rounded h3 mb-0"/>
                                    </div>
                                    <div className="content mt-4">
                                        <Link to="#" className="text-dark h5 title">{item.title}</Link>
                                        <p className="text-muted mt-3 mb-0">{item.desc}</p>
                                        <div className="mt-2">
                                            <Link to="#" className="link">Read More</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="container mt-100">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="filters-group-wrap">
                            <div className="filters-group">
                                <ul className="container-filter mb-0 categories-filter list-unstyled filter-options">
                                    <li className="list-inline-item categories position-relative active" data-group="all" onClick={() =>setSelectedCategory(null)}>All</li>
                                    <li className="list-inline-item categories position-relative" data-group="recents" onClick={() =>setSelectedCategory('recents')}>Recents Items</li>
                                    <li className="list-inline-item categories position-relative" data-group="free" onClick={() =>setSelectedCategory('free')}>Free Items</li>
                                    <li className="list-inline-item categories position-relative" data-group="top" onClick={() =>setSelectedCategory('top')}>Top Items</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 text-end d-none d-md-block">
                        <Link to="/nft-explore" className="btn btn-primary">See More Items <FiArrowRight/></Link>
                    </div>
                </div>

                <div id="grid" className="row row-cols-lg-5 row-cols-md-3">
                    {filteredData.map((item, index) =>{
                        return(
                            <div className="col picture-item mt-4 pt-2" data-groups='["recents"]' key={index}>
                                <div className="nft-items nft-item-primary">
                                    <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                        <img src={item.image3} className="img-fluid" alt=""/>
                                        <div className="pop-icon">
                                            <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                        </div>
                                    </div>

                                    <div className="content pt-3">
                                        <Link to={`/nft-item-detail/${item.id}`} className="title h6 mb-1 text-dark d-block">{item.title}</Link>
                                        <small className="gradient-text d-block">{item.value}</small>

                                        <ul className="pt-3 mt-2 border-top d-flex justify-content-between align-items-center list-unstyled">
                                            <li className="d-flex author align-items-center">
                                                <div className="position-relative">
                                                    <img src={item.clientImg} className="avatar avatar-sm-sm rounded-pill shadow" alt=""/>
                                                    <div className="position-absolute top-0 start-0 translate-middle pt-2 ps-2">
                                                        <i className="mdi mdi-check-circle mdi-18px text-success"></i>
                                                    </div>
                                                </div>
                                                <Link to={`/nft-creator-profile/${item.id}`} className="ps-2 text-dark name">{item.name}</Link>
                                            </li>

                                            <li>
                                                <span>{item.like}<Link to="#" className="like"><i className="mdi mdi-heart align-middle ms-1"></i></Link></span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 d-md-none d-block text-center mt-4 pt-2">
                        <Link to="/nft-explore" className="btn btn-primary">See More Items <FiArrowRight/></Link>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}