import React, { useState } from "react";
import { Link } from "react-router-dom";

import logoicon from '../assets/images/icon-gradient.png'

import Navbar from "../nftComponents/navbar";
import Footer from "../nftComponents/footer";

import { faqData, workData } from "../data/nftdata";
import { FiArrowRight } from '../assets/icons/vander' 

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

export default function NftFaqs(){
    let [ activeTab, setActiveTab ] = useState(1);
    let [ activeIndex, setActiveIndex ] = useState(1);
    let settings = {
        container: '.tiny-five-item',
        controls: false,
        mouseDrag: true,
        loop: true,
        rewind: true,
        autoplay: true,
        autoplayButtonOutput: false,
        autoplayTimeout: 3000,
        navPosition: "bottom",
        speed: 400,
        gutter: 12,
        responsive: {
            992: {
                items: 5
            },

            767: {
                items: 3
            },

            320: {
                items: 1
            },
        },
      };
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right"/>

        <section className="bg-half-100 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">Frequently asked questions</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Cryptor NFT Marketplace, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div> 

            <div className="position-absolute top-50 start-50 mt-4 translate-middle">
                <img src={logoicon} className="img-fluid opacity-2" style={{maxHeight:'300px'}} alt=""/>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row">
                    <div className="col-lg-4 col-md-5 col-12">
                        <div className="card section-title bg-white p-4 shadow rounded border-0">
                            <ul className="nav nav-pills nav-justified flex-column bg-transparent mb-0">
                                <li className="nav-item">
                                    <Link to="#" className={`${activeTab === 1 ? 'active' : ''} nav-link rounded shadow`} onClick={()=>setActiveTab(1)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">About Marketplace</h6>
                                        </div>
                                    </Link>
                                </li>
                                
                                <li className="nav-item mt-3">
                                    <Link to="#" className={`${activeTab === 2 ? 'active' : ''} nav-link rounded shadow`} onClick={()=>setActiveTab(2)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">Support</h6>
                                        </div>
                                    </Link>
                                </li>
                                
                                <li className="nav-item mt-3">
                                    <Link to="#" className={`${activeTab === 3 ? 'active' : ''} nav-link rounded shadow`} onClick={()=>setActiveTab(3)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">Hosting</h6>
                                        </div>
                                    </Link>
                                </li>

                                <li className="nav-item mt-3">
                                    <Link to="#" className={`${activeTab === 4 ? 'active' : ''} nav-link rounded shadow`} onClick={()=>setActiveTab(4)}>
                                        <div className="text-start py-1 px-3">
                                            <h6 className="mb-0">Product</h6>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="col-lg-8 col-md-7 col-12 mt-4 pt-2 mt-sm-0 pt-sm-0">
                        <div className="tab-content">
                            {activeTab === 1 ?
                                <div className="tab-pane fade show active">
                                    <div className="section-title">
                                        <h5>About Marketplace</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2" id="buyingquestion">
                                        {faqData.slice(0,4).map((item,index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header" id="headingTwo">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed' } accordion-button border-0 bg-white`} onClick={()=>setActiveIndex(item.id)}>
                                                            {item.title}
                                                        </button>
                                                    </h2>
                                                    <div id="collapseTwo" className={`${activeIndex === item.id ? 'show' : ''} accordion-collapse border-0 collapse`}>
                                                        <div className="accordion-body text-muted bg-white">
                                                            {item.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div> : ''
                            }
                            {activeTab === 2 ?
                                <div className="tab-pane fade show active">
                                    <div className="section-title" id="general">
                                        <h5>Support</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2" id="generalquestion">
                                        {faqData.slice(4,8).map((item,index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header" id="headingTwo">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed' } accordion-button border-0 bg-white`} onClick={()=>setActiveIndex(item.id)}>
                                                            {item.title}
                                                        </button>
                                                    </h2>
                                                    <div id="collapseTwo" className={`${activeIndex === item.id ? 'show' : ''} accordion-collapse border-0 collapse`}>
                                                        <div className="accordion-body text-muted bg-white">
                                                            {item.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div> : ''
                            }
                            {activeTab === 3 ?
                                <div className="tab-pane fade show active">
                                    <div className="section-title" id="payment">
                                        <h5>Hosting</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2" id="paymentquestion">
                                        {faqData.slice(8,12).map((item,index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header" id="headingTwo">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed' } accordion-button border-0 bg-white`} onClick={()=>setActiveIndex(item.id)}>
                                                            {item.title}
                                                        </button>
                                                    </h2>
                                                    <div id="collapseTwo" className={`${activeIndex === item.id ? 'show' : ''} accordion-collapse border-0 collapse`}>
                                                        <div className="accordion-body text-muted bg-white">
                                                            {item.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div> : ''
                            }
                            {activeTab === 4 ? 
                                <div className="tab-pane fade show active">
                                    <div className="section-title" id="support">
                                        <h5>Product</h5>
                                    </div>
            
                                    <div className="accordion mt-4 pt-2" id="supportquestion">
                                        {faqData.slice(12,16).map((item,index) =>{
                                            return(
                                                <div className="accordion-item rounded border-0 shadow mb-3" key={index}>
                                                    <h2 className="accordion-header" id="headingTwo">
                                                        <button className={`${activeIndex === item.id ? '' : 'collapsed' } accordion-button border-0 bg-white`} onClick={()=>setActiveIndex(item.id)}>
                                                            {item.title}
                                                        </button>
                                                    </h2>
                                                    <div id="collapseTwo" className={`${activeIndex === item.id ? 'show' : ''} accordion-collapse border-0 collapse`}>
                                                        <div className="accordion-body text-muted bg-white">
                                                            {item.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div> : ''
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <div className="section-title">
                            <h4 className="title mb-0">Popular Items</h4>
                        </div>
                    </div>

                    <div className="col-md-4 text-end d-none d-md-block">
                        <Link to="/nft-explore" className="btn btn-primary">See More <FiArrowRight /></Link>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mt-4 pt-2">
                        <div className="tiny-five-item">
                            <TinySlider settings={settings}>
                                {workData.map((item,index) =>{
                                    return(
                                        <div className="tiny-slide" key={index}>
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
        </section>
        <Footer/>
        </>
    )
}