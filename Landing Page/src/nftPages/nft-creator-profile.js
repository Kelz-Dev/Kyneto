import React from "react";
import { Link, useParams } from "react-router-dom";

import bg1 from '../assets/images/nft/bg/bg02.jpg'
import client from '../assets/images/client/01.jpg'
import Navbar from "../nftComponents/navbar";

import { FiSettings, FiArrowRight } from '../assets/icons/vander'
import { creatorData, workData } from "../data/nftdata";
import Footer from "../nftComponents/footer";

export default function NftCreatorProfile(){
    let params= useParams();
    let id = params.id

    let data = creatorData.find((creator)=>creator.id === parseInt(id))

    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-half-100 d-table w-100" style={{background:`url(${bg1})`, backgroundPosition:'center'}}>
            <div className="container">
                <div className="row mt-5 mb-4 justify-content-center">
                    <div className="col-12">
                        <div className="text-center">
                            <h4 className="text-white title-dark mb-1 fw-medium">{ data?.name ? data.name :'Jordan Joo' }</h4>
                            <h6 className="text-white-50 mb-4">{ data?.tag ? data.tag : '@jordan_joo' }</h6>

                            <p className="text-white-50 mx-auto para-desc">Due to its widespread use as filler text for layouts, non-readability is of great importance: human perception is tuned to recognize.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="features-absolute text-center">
                            <div className="position-relative d-inline-block">
                                <img src={ data?.client ? data.client : client } className="avatar avatar-large rounded-pill img-thumbnail shadow-md" alt=""/>

                                <div className="position-absolute top-100 start-100 translate-middle pb-5 pe-5">
                                    <Link to="/nft-creator-setting" className="btn btn-icon btn-pills btn-primary"><FiSettings /><i className="uil uil-setting"></i></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 my-4 py-2">
                        <div className="section-title text-center">
                            <h4 className="mb-3">Recent Works</h4>
                            <p className="text-muted mx-auto para-desc mb-0">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                        </div>
                    </div>
                </div>

                <div className="row row-cols-lg-5 row-cols-md-3 row-cols-1">
                    {workData.map((item,index) =>{
                        return(
                            <div className="col picture-item mt-4 pt-2" key={index}>
                                <div className="nft-items nft-item-primary">
                                    <div className="nft-image position-relative overflow-hidden rounded-md shadow-md">
                                        <img src={item.image2} className="img-fluid" alt=""/>
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

                <div className="row">
                    <div className="col-12 mt-4 pt-2">
                        <ul className="pagination justify-content-center mb-0 mt-3 mt-sm-0">
                            <li className="page-item ms-0"><Link className="page-link" to="#" aria-label="Previous">Prev</Link></li>
                            <li className="page-item ms-0 active"><Link className="page-link" to="#">1</Link></li>
                            <li className="page-item ms-0"><Link className="page-link" to="#">2</Link></li>
                            <li className="page-item ms-0"><Link className="page-link" to="#">3</Link></li>
                            <li className="page-item ms-0"><Link className="page-link" to="#" aria-label="Next">Next</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}