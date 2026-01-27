import React from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'
import Navbar from "../nftComponents/navbar";
import { collectionData } from "../data/nftdata";
import Footer from "../nftComponents/footer";

export default function NftCollection(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">All Collections</h4>
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
                <div className="row">
                    {collectionData.map((item, index) =>{
                        return(
                            <div className="col-lg-4 col-md-6 col-12 mb-4 pb-2" key={index}>
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