import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import Navbar from "../components/navbar";
import LinkTabThree from "../components/linkTabThree";
import { FiArrowRight } from '../assets/icons/vander'
import Footer from "../components/footer";

export default function HelpGuides(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>

        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'bottom'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title text-white title-dark fw-medium mb-4">Guides / Support</h4>
                            <p className="text-muted para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <LinkTabThree/>

        <section className="section">
            <div className="container">
                <div className="row">
                    <div className="col-lg-4 col-md-6 col-12">
                        <h5>Your account</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Your profile</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Account security</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Identification & verifications</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Reviews</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Superhost status</Link></li>
                        </ul>
                    </div>

                    <div className="col-lg-4 col-md-6 col-12">
                        <h5>Getting started</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Deciding to purchase</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>List your space</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Landing an experience or adventure</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Top uses questions</Link></li>
                        </ul>
                    </div>
                    
                    <div className="col-lg-4 col-md-6 col-12 mt-4 mt-sm-0 pt-2 pt-sm-0">
                        <h5>Your calendar</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Pricing & availability</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Booking settings</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Responding to enquiries & requests</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Snoozing or deactivating your listing</Link></li>
                        </ul>
                    </div>
                    
                    <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2">
                        <h5>Your listings</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Updating your listing</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Neighbourhoods</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Listing photos & photography</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Kyneto Plus</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>API-connected software</Link></li>
                        </ul>
                    </div>
                    
                    <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2">
                        <h5>How payouts work</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Getting paid</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Adding payout info</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Your payout status</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Donations</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Taxes</Link></li>
                        </ul>
                    </div>
                    
                    <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2">
                        <h5>Your reservations</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Kyneto safely</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Kyneto Experiences and Adventures</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Changing a reservation</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Cancelling a reservation</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Long-term reservations</Link></li>
                        </ul>
                    </div>
                    
                    <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2">
                        <h5>Reservation help</h5>
                        <ul className="list-unstyled mt-4 mb-0">
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Help with a reservation or guest</Link></li>
                            <li className="mt-2 ms-0"><Link to="#" className="text-muted"><FiArrowRight className="text-primary me-2"/>Guest cancellations</Link></li>
                        </ul>
                    </div>
                    
                    
                </div>
            </div>
        </section>
        <Footer/>
        </>
    )
}