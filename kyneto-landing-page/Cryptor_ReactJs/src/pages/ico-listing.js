import React from "react";
import { Link } from "react-router-dom";

import logoIcon from '../assets/images/icon-gradient.png'
import Navbar from "../components/navbar";
import Charts from "../components/chart";
import Footer from "../components/footer";

import { clientReview, listingData } from "../data/data";

import {FiArrowRight, MdOutlineStar, MdStarHalf, MdOutlineStarBorder, BiSolidQuoteRight} from "../assets/icons/vander"

import TinySlider from "tiny-slider-react";
import 'tiny-slider/dist/tiny-slider.css';

export default function IcoListing(){

    let settings = {
        container: '.tiny-three-item',
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
                items: 3
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
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right" navDark={true}/>
        <section className="bg-half-170 bg-light d-table w-100">
            <div className="container position-relative" style={{zIndex:'1'}}>
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title fw-medium mb-4">Kyneto ICO Listing</h4>
                            <p className="text-muted para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="position-absolute top-50 start-50 translate-middle">
                <img src={logoIcon} className="img-fluid opacity-2" style={{maxHeight:'400px'}} alt=""/>
            </div>
        </section>
        <section className="section">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="section-title mb-4">
                            <h4>All ICO Listing</h4>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="table-responsive bg-white shadow rounded">
                            <table className="table mb-0 table-center">
                                <thead>
                                    <tr>
                                        <th scope="col" className="fw-normal text-muted py-4 px-3" style={{minWidth: "250px"}}>Name</th>
                                        <th scope="col" className="fw-normal text-center text-muted py-4 px-3" style={{width: "200px", minWidth: "150px"}}>Status</th>
                                        <th scope="col" className="fw-normal text-center text-muted py-4 px-3" style={{width: "200px", minWidth: "150px"}}>Rating</th>
                                        <th scope="col" className="fw-normal text-center text-muted py-4 px-3" style={{width: "250px", minWidth: "150px"}}>Funding</th>
                                        <th scope="col" className="fw-normal text-end text-muted py-4 px-3" style={{width: "150px", minWidth: "150px"}}>Listing Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {listingData.map((item,index) =>{
                                        return(
                                            <tr key={index}>
                                                <th className="p-3">
                                                    <Link to="#!" className="align-items-center">
                                                        <img src={item.image} className="me-3" height="32" alt=""/>
                                                        <p className="mb-0 d-inline text-dark fw-normal h6">{item.name} <span className="text-muted">{item.tag}</span> </p>
                                                    </Link>
                                                </th>
                                                <td className="text-center">
                                                    {item.status === 'Active' ? <span className="badge rounded-md bg-soft-success">Active</span> : ''}
                                                    {item.status === 'Ended' ? <span className="badge rounded-md bg-soft-danger">Ended</span> : ''}
                                                    {item.status === 'Upcoming' ? <span className="badge rounded-md bg-soft-info">Upcoming</span> : ''}
                                                    
                                                </td>
                                                <td className="text-center">
                                                    {item.rate === '4.5' ? 
                                                        <ul className="list-unstyled text-warning mb-0">
                                                                <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                                <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                                <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                                <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                                <li className="list-inline-item mb-0"><MdStarHalf/></li>
                                                                <li className="list-inline-item mb-0 text-muted small">4.5</li> 
                                                        </ul> : ''
                                                    }
                                                     {item.rate === '4.0' ? 
                                                        <ul className="list-unstyled text-warning mb-0">
                                                            <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                            <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                            <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                            <li className="list-inline-item mb-0"><MdOutlineStar/></li>
                                                            <li className="list-inline-item mb-0"><MdOutlineStarBorder/></li>
                                                            <li className="list-inline-item mb-0 text-muted small">4.0</li>
                                                        </ul> : ''
                                                    }
                                                     {item.rate === 'No rating' ? 
                                                        <small className="text-muted">No rating</small> : ''
                                                    }
                                                </td>
                                                <td className="text-center">
                                                    <div className="progress-box px-3">
                                                        <small className="title text-muted mb-0">{item.fund}</small>

                                                        <div className="progress rounded-md mt-2">
                                                            <div className="progress-bar position-relative bg-gradient-primary rounded-md" style={{width:item.progress}}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-muted text-end px-3">{item.date}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-12 mt-4 pt-2">
                        <div className="d-md-flex align-items-center text-center justify-content-between">
                            <span className="text-muted me-3">Showing 1 - 15 out of 452</span>
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
            </div>

            <div className="container mt-100 mt-60">
                <div className="row">
                    <div className="col-12">
                        <div className="section-title mb-4">
                            <h4>Top Movers</h4>
                        </div>
                    </div>
                </div>

                <Charts/>
                <div className="col-12 mt-4 pt-2 d-none d-md-block">
                    <div className="text-center">
                        <Link to="/market-price" className="text-primary">View marketplace <FiArrowRight /></Link>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
                <div className="row justify-content-center">
                    <div className="col-12">
                        <div className="section-title mb-4 pb-2 text-center">
                            <h2 className="title mb-4">Used by thousands of traders like you</h2>
                            <p className="text-muted para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 mt-4 pt-2">
                        <div className="tiny-three-item">
                            <TinySlider settings={settings}>
                                {clientReview.slice(0,3).map((item,index) =>{
                                    return(
                                        <div className="tiny-slide" key={index}>
                                            <div className="card border-0 customer-testi p-4 shadow rounded-md m-2 overflow-hidden">
                                                <p className="text-muted fst-italic">{item.desc}</p>
                                                <div className="d-flex align-items-center mt-3">
                                                    <img src={item.image} className="img-fluid avatar avatar-small rounded-circle shadow" alt=""/>
                                                    <div className="flex-1 ms-3">
                                                        <h6 className="text-primary mb-0">{item.name}</h6>
                                                        <small className="text-muted">{item.title}</small>
                                                    </div>
                                                </div>
                                                <div className="quote">
                                                    <BiSolidQuoteRight className="icon"/>
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