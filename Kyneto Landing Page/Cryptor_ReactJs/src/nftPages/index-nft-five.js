import React, { useState } from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'

import Navbar from "../nftComponents/navbar";
import Creators from "../nftComponents/creators";
import Footer from "../nftComponents/footer";

import { accordianTwo, workData } from "../data/nftdata";
import { FiArrowRight } from '../assets/icons/vander'

export default function IndexNftFive(){
    let [ selectedCategory, setSelectedCategory ] = useState(null);
    let [ activeIndex, setActiveIndex ] = useState(1)

    let filteredData = selectedCategory ? workData.filter((item) =>item.category === selectedCategory) : workData
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 pb-0 d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row mt-5 pt-md-5 justify-content-center mt-5">
                    <div className="col-12">
                        <div className="title-heading text-center">
                            <h4 className="display-6 fw-medium mt-3 mb-4">Artwork By NFT</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>
                            <div className="mt-4">
                                <Link to="" className="btn btn-primary text-white rounded-pill">Explore now</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="position-absolute top-50 start-50 mt-4 translate-middle">
                <img src={logoIcon} className="img-fluid opacity-1" style={{maxHeight:'400px'}} alt=""/>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-md-4">
                        <div className="section-title">
                            <h4 className="title mb-0">Discover Arts</h4>
                        </div>
                    </div>

                    <div className="col-md-8 text-md-end">
                        <div className="filters-group-wrap">
                            <div className="filters-group">
                                <ul className="container-filter mb-0 categories-filter list-unstyled filter-options">
                                    <li className={`${selectedCategory === null ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory(null)}>All</li>
                                    <li className={`${selectedCategory === 'recents' ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory('recents')}>Recents Items</li>
                                    <li className={`${selectedCategory === 'free' ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory('free')}>Free Items</li>
                                    <li className={`${selectedCategory === 'top' ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory('top')}>Top Items</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="grid" className="row row-cols-lg-5 row-cols-md-3">
                    {filteredData.map((item, index) =>{
                        return(
                        <div className="col picture-item mt-4 pt-2" data-groups='["recents"]' key={index}>
                            <div className="nft-items nft-item-primary">
                                <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                    <img src={item.image2} className="img-fluid" alt=""/>
                                    <div className="pop-icon">
                                        <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                    </div>

                                    <div className="position-absolute top-0 end-0 mt-2 me-2">
                                        <Link to={`/nft-creator-profile/${item.id}`}><img src={item.clientImg} className="rounded-pill avatar avatar-sm-sm" alt=""/></Link>
                                    </div>

                                    <div className="position-absolute top-0 start-0 mt-2 ms-2">
                                        <span className="badge bg-color">ART</span>
                                    </div>
                                </div>

                                <div className="content pt-3">
                                    <Link to={`/nft-item-detail/${item.id}`} className="title h6 mb-1 text-dark d-block">{item.title}</Link>
                                    <small className="gradient-text d-block">{item.value}</small>
                                </div>
                            </div>
                        </div>
                        )
                    })}
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="section-title">
                            <h4 className="title mb-0">Popular Creators</h4>
                        </div>
                    </div>

                    <div className="col-md-4 text-end d-none d-md-block">
                        <Link to="/nft-creators" className="btn btn-primary">See More <FiArrowRight/></Link>
                    </div>
                </div>

                <Creators/>

                <div className="row justify-content-center">
                    <div className="col-12 d-md-none d-block text-center mt-4 pt-2">
                        <Link to="/nft-creators" className="btn btn-primary">See More <FiArrowRight/></Link>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center mb-4 pb-2">
                            <h4 className="mb-4">Q&A</h4>
                            <p className="para-desc mx-auto text-muted">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-7 col-12 mt-4 pt-2 mt-sm-0 pt-sm-0">
                        <div className="tab-content">
                            <div className="tab-pane fade show active">
                                <div className="accordion mt-4 pt-2">
                                    {accordianTwo.map((item, index) =>{
                                        return(
                                            <div className="accordion-item rounded border-0 shadow mt-3" key={index}>
                                                <h2 className="accordion-header">
                                                    <button className={`${activeIndex === item.id ? '' : 'collapsed'} accordion-button border-0 bg-white`} onClick={() =>setActiveIndex(item.id)}>
                                                        {item.title}
                                                    </button>
                                                </h2>
                                                <div className={`${activeIndex === item.id ? 'show' : ''} accordion-collapse border-0 collapse`}>
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
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}