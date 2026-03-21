import React, { useState } from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'
import nft1 from '../assets/images/nft/625/10.jpg'
import client1 from '../assets/images/client/01.jpg'

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";
import Creators from "../nftComponents/creators";

import { FiArrowRight, FiArrowRightCircle } from '../assets/icons/vander'
import { workData, workTwo } from "../data/nftdata";


export default function IndexNftTwo(){
    let [ selectedCategory, setSelectedCategory ] = useState(null)

    let filteredData = selectedCategory 
    ? workData.filter((item) => item.category === selectedCategory) : workData

    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>
        <section className="bg-half-100 pb-0 d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row mt-5 pt-md-5 justify-content-center mt-5">
                    <div className="col-12">
                        <div className="title-heading text-center">
                            <h5 className="gradient-text fw-medium">NFT MARKETPLACE</h5>
                            <h4 className="display-6 fw-medium mt-3 mb-4">Discover rare artworks by world class artists</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>
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
                    <div className="col-lg-4 col-md-6">
                        <div className="card nft-items nft-item-primary rounded-md border-0 shadow overflow-hidden">
                            <div className="nft-image position-relative overflow-hidden">
                                <img src={nft1} className="img-fluid" alt=""/>
                                <div className="pop-icon">
                                    <Link to="/nft-item-detail" className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                </div>
                                <div className="position-absolute top-0 end-0 mt-3 me-3">
                                    <Link to="#" className="like"><i className="mdi mdi-heart align-middle"></i></Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4 col-md-6">
                        <div className="mx-lg-4">
                            <h4>The future of ETH</h4>
                            <span className="badge rounded-pill bg-soft-primary">0.75ETH</span>

                            <p className="text-muted mt-4">If the distribution of letters and 'words' is random, the reader will not be distracted from making a neutral judgement.</p>

                            <div className="row mt-2">
                                <div className="col-md-8">
                                    <div className="card nft-creator nft-creator-primary border-0 rounded-md shadow">
                                        <div className="card-body p-3">
                                            <div className="pb-3 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge bg-soft rounded-pill">No. #1</span>
            
                                                    <Link to="/nft-collection" className="text-dark h5 mb-0 read-more"><FiArrowRightCircle/></Link>
                                                </div>
                                            </div>
            
                                            <div className="content mt-3">
                                                <div className="position-relative text-center">
                                                    <img src={client1} className="avatar avatar-md-sm rounded-pill shadow" alt=""/>
                                                    
                                                    <div className="author mt-2">
                                                        <Link to="/nft-creator-profile" className="text-dark h6 name">Jordan Joo</Link>
                                                        <small className="d-block fw-medium mt-1 text-dark">0.75<span className="text-muted">ETH</span></small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>                            
                    </div>

                    <div className="col-lg-4 col-md-12 mt-lg-0 mt-4 pt-lg-0 pt-2">
                        <div className="row justify-content-center g-2 row-cols-lg-3 row-cols-md-5 row-cols-2">
                            {workTwo.map((item,index) =>{
                                return(
                                    <div className="col" key={index}>
                                        <div className="card nft-items nft-item-primary rounded-md border-0 shadow overflow-hidden">
                                            <div className="nft-image position-relative overflow-hidden">
                                                <img src={item.image} className="img-fluid" alt=""/>
                                                <div className="pop-icon">
                                                    <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-lg-3 mt-4 pt-lg-0 pt-2 text-center text-lg-start">
                            <h6 className="text-muted">See all work here,</h6>
                            <Link to="/nft-explore" className="btn btn-primary">See More Items <FiArrowRight /></Link>
                        </div>
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
                        <Link to="/nft-creators" className="btn btn-primary">See More <FiArrowRight/></Link>
                    </div>
                </div>

                <Creators/>

                <div className="row justify-content-center">
                    <div className="col-12 d-md-none d-block text-center mt-4 pt-2">
                        <Link to="nft-cretors" className="btn btn-primary">See More <FiArrowRight/></Link>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
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
                                    <li className={`${selectedCategory === null ? 'active' : '' } list-inline-item categories position-relative`} onClick={()=>setSelectedCategory(null)}>All</li>
                                    <li className={`${selectedCategory === 'recents' ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory("recents")}>Recents Items</li>
                                    <li className={`${selectedCategory === 'free' ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory("free")}>Free Items</li>
                                    <li className={`${selectedCategory === 'top' ? 'active' : '' } list-inline-item categories position-relative`} onClick={() =>setSelectedCategory("top")}>Top Items</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="grid" className="row row-cols-lg-5 row-cols-md-3">
                    {filteredData.map((item,index) =>{
                        return(
                            <div className="col picture-item mt-4 pt-2" data-groups='["recents"]' key={index}>
                                <div className="nft-items nft-item-primary">
                                    <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                        <img src={item.image2} className="img-fluid" alt=""/>
                                        <div className="pop-icon">
                                            <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="uil uil-arrow-right text-dark"/></Link>
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
                                        <small className="gradient-text d-block">0.75ETH</small>
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