import React, { useState } from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/nft/bg/bg01.jpg'
import Navbar from "../nftComponents/navbar";
import Creators from "../nftComponents/creators";
import Footer from "../nftComponents/footer";

import { collectionData, workData } from "../data/nftdata";

import { FiArrowRight } from '../assets/icons/vander'

export default function IndexNftThree(){
    let [selectedCategory, setSelectedCategory] = useState(null)

    let filteredData = selectedCategory ? workData.filter((item) =>item.category === selectedCategory) : workData
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'right'}}>
            <div className="container">
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="title-heading">
                            <h5 className="text-white-50 fw-normal">Buy And Sell Digital Art Products</h5>
                            <h4 className="heading fw-bold text-white title-dark mb-4">One Stop <span className="gradient-text">NFT Marketplace</span></h4>

                            <p className="text-white-50 para-desc">Discover limited-edition digital arts. <br/> Create, Sell and Buy now.</p>

                            <div className="mt-4">
                                <Link to="/nft-explore" className="btn btn-primary">Upload your work</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="filters-group-wrap">
                            <div className="filters-group">
                                <ul className="container-filter mb-0 categories-filter list-unstyled filter-options">
                                    <li className={`${selectedCategory === null ? 'active' : ''} list-inline-item categories position-relative`} onClick={() =>setSelectedCategory(null)}>All</li>
                                    <li className={`${selectedCategory === 'recents' ? 'active' : ''} list-inline-item categories position-relative`} onClick={() =>setSelectedCategory('recents')}>Recents Items</li>
                                    <li className={`${selectedCategory === 'free' ? 'active' : ''} list-inline-item categories position-relative`} onClick={() =>setSelectedCategory('free')}>Free Items</li>
                                    <li className={`${selectedCategory === 'top' ? 'active' : ''} list-inline-item categories position-relative`} onClick={() =>setSelectedCategory('top')}>Top Items</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 text-end d-none d-md-block">
                        <Link to="/nft-explore" className="btn btn-primary">See More Items <FiArrowRight /></Link>
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
                                        <small className="gradient-text d-block">0.75ETH</small>

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
                                                <span>23 <Link to="#" className="like"><i className="mdi mdi-heart align-middle"></i></Link></span>
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
                        <Link to="/nft-explore" className="btn btn-primary">See More Items <FiArrowRight /></Link>
                    </div>
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
                        <Link to="/nft-creators" className="btn btn-primary">See More <FiArrowRight /></Link>
                    </div>
                </div>

               <Creators/>

                <div className="row justify-content-center">
                    <div className="col-12 d-md-none d-block text-center mt-4 pt-2">
                        <Link to="/nft-creators" className="btn btn-primary">See More <FiArrowRight /></Link>
                    </div>
                </div>
            </div>
        </section>

        <section className="section bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title text-center mb-4 pb-2">
                            <h4 className="title mb-3">Top Collections</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Buy and sell 100+ cryptocurrencies with 20+ fiat currencies using bank transfers or your credit/debit card.</p>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {collectionData.slice(0,3).map((item, index) =>{
                        return(
                            <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2" key={index}>
                                <div className="nft-collection nft-col-primary p-3 bg-white rounded-md shadow">
                                    <img src={item.image} className="img-fluid rounded-md shadow mb-2" alt=""/>
        
                                    <div className="row g-2">
                                        <div className="col-4">
                                            <img src={item.image2} className="img-fluid rounded-md shadow" alt=""/>
                                        </div>
                                        <div className="col-4">
                                            <img src={item.image3} className="img-fluid rounded-md shadow" alt=""/>
                                        </div>
                                        <div className="col-4">
                                            <img src={item.image4} className="img-fluid rounded-md shadow" alt=""/>
                                        </div>
                                    </div>
        
                                    <div className="content mt-3">
                                        <Link to="/nft-collection" className="title text-dark h5">{item.title}</Link>
        
                                        <ul className="pt-3 d-flex justify-content-between align-items-center list-unstyled mb-0">
                                            <li className="d-flex author align-items-center">
                                                <img src={item.client} className="avatar avatar-sm-sm rounded-pill shadow" alt=""/>
                                                <span className="text-muted ps-2">by</span>
                                                <Link to={`/nft-creator-profile/${item.id}`} className="ps-1 text-dark h6 mb-0 name">{item.name}</Link>
                                            </li>
        
                                            <li>
                                                <span className="badge bg-soft">{item.item} Items</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}