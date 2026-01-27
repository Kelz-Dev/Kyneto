import React from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'
import image1 from '../assets/images/nft/800/1.jpg'
import image2 from '../assets/images/nft/800/2.jpg'

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

export default function NftUploadWork(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">Upload Your Item</h4>
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
                <div className="row justify-content-center">
                    <div className="col-lg-9">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card border-0 rounded shadow position-relative overflow-hidden text-center">
                                    <img src={image1} className="img-fluid" alt=""/>

                                    <div className="card-body">
                                        <h5 className="mb-4 text-dark">Single Item</h5>
                                        <Link to="/nft-upload-detail" className="btn btn-outline-primary">Upload</Link>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-6 mt-4 pt-2 mt-sm-0 pt-sm-0">
                                <div className="card border-0 rounded shadow position-relative overflow-hidden text-center">
                                    <img src={image2} className="img-fluid" alt=""/>

                                    <div className="card-body">
                                        <h5 className="mb-4 text-dark">Multiple Items</h5>
                                        <Link to="/nft-upload-detail" className="btn btn-outline-primary">Upload</Link>
                                    </div>
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