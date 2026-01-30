import React, { useState } from "react";
import { Link } from "react-router-dom";

import logoIcon  from '../assets/images/icon-gradient.png'

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

import { workData } from "../data/nftdata";

import { FiArrowRight } from '../assets/icons/vander'

export default function NftExplore(){
    let [ selectedCategory, setSelectedCategory ] = useState(null);
    
    let filteredData = selectedCategory ? workData.filter((item) =>item.category === selectedCategory) : workData

    
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">Explore Works</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="position-absolute top-50 start-50 mt-4 translate-middle">
                <img src={logoIcon} className="img-fluid opacity-2" style={{maxHeight:'300px'}} alt=""/>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row align-items-center justify-content-between">
                    <div className="col-md-4">
                        <div style={{maxWidth:'400px'}}>
                            <div className="widget">
                                <div id="search2" className="widget-search mb-0">
                                    <form role="search" method="get" id="searchform" className="searchform">
                                        <div>
                                            <input type="text" className="border rounded" name="s" id="s" placeholder="Search Keywords..."/>
                                            <input type="submit" id="searchsubmit" value="Search"/>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-8 mt-4 mt-sm-0">
                        <div className="filters-group-wrap">
                            <div className="filters-group">
                                <ul className="container-filter mb-0 categories-filter list-unstyled filter-options text-center text-md-end">
                                    <li className={`${selectedCategory === null ? 'active' : ''} list-inline-item categories position-relative`} onClick={()=>setSelectedCategory(null)}>All</li>
                                    <li className={`${selectedCategory === 'recents' ? 'active' : ''} list-inline-item categories position-relative`} onClick={()=>setSelectedCategory('recents')}>Recents Items</li>
                                    <li className={`${selectedCategory === 'free' ? 'active' : ''} list-inline-item categories position-relative`} onClick={()=>setSelectedCategory('free')}>Free Items</li>
                                    <li className={`${selectedCategory === 'top' ? 'active' : ''} list-inline-item categories position-relative`} onClick={()=>setSelectedCategory('top')}>Top Items</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div id="grid" className="row row-cols-lg-4 row-cols-md-2">
                    {filteredData.map((item, index) =>{
                        return(
                            <div className="col picture-item mt-4 pt-2" data-groups='["recents"]' key={index}>
                                <div className="nft-items nft-item-primary">
                                    <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                        <img src={item.image} className="img-fluid" alt=""/>
                                        <div className="pop-icon">
                                            <Link to={`/nft-item-detail/${item.id}`} className="btn bg-white btn-pills btn-icon shadow"><FiArrowRight className="text-dark"/></Link>
                                        </div>
                                    </div>
        
                                    <div className="content pt-3">
                                        <Link to="nft-item-detail.html" className="title h6 mb-1 text-dark d-block">{item.title}</Link>
                                        <small className="gradient-text d-block">{item.value}</small>
        
                                        <ul className="pt-3 mt-2 border-top d-flex justify-content-between align-items-center list-unstyled">
                                            <li className="d-flex author align-items-center">
                                                <div className="position-relative">
                                                    <img src={item.clientImg} className="avatar avatar-sm-sm rounded-pill shadow" alt=""/>
                                                    <div className="position-absolute top-0 start-0 translate-middle pt-2 ps-2">
                                                        <i className="mdi mdi-check-circle mdi-18px text-success"></i>
                                                    </div>
                                                </div>
                                                <Link to={`/nft-item-detail/${item.id}`} className="ps-2 text-dark name">{item.name}</Link>
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
            </div>
        </section>
        <Footer/>
        </>
    )
}
