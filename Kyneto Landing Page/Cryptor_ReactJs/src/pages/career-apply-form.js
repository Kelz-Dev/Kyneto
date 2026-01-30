import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import { FiMapPin } from '../assets/icons/vander'
import Navbar from "../components/navbar";
import LinkTabTwo from "../components/linkTabTwo";
import Footer from "../components/footer";

export default function CareerApplyForm(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-half-170 d-table w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'bottom'}}>
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row justify-content-center mt-5">
                    <div className="col-12">
                        <div className="section-title text-center">
                            <h4 className="title text-white fw-medium title-dark mb-4">Business Development</h4>
                            <ul className="list-unstyled">
                                <li className="list-inline-item text-muted small me-3"><FiMapPin className="text-white title-dark h6 me-1 mb-0"/> Bothell, WA, USA - Full Time</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div> 
        </section>
        <LinkTabTwo/>

        <section className="section">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10 col-md-7">
                        <form className="rounded shadow p-4">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Your Name :<span className="text-danger">*</span></label>
                                        <input name="name" id="name" type="text" className="form-control" placeholder="First Name :"/>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Your Email :<span className="text-danger">*</span></label>
                                        <input name="email" id="email" type="email" className="form-control" placeholder="Your email :"/>
                                    </div> 
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Your Phone no. :<span className="text-danger">*</span></label>
                                        <input name="number" id="number" type="number" className="form-control" placeholder="Your phone no. :"/>
                                    </div> 
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Job Title :</label>
                                        <input name="subject" id="subject" className="form-control" placeholder="Title :"/>
                                    </div>                                                                               
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Types of jobs :</label>
                                        <select className="form-control custom-select" id="Sortbylist-Shop">
                                            <option>All Jobs</option>
                                            <option>Full Time</option>
                                            <option>Half Time</option>
                                            <option>Remote</option>
                                            <option>In Office</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <label className="form-label">Description :</label>
                                        <textarea name="comments" id="comments" rows="4" className="form-control" placeholder="Describe the job :"></textarea>
                                    </div>
                                </div>                                    
                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <label htmlFor="formFile" className="form-label">Upload Your Cv / Resume :</label>
                                        <input className="form-control" type="file" id="formFile"/>
                                    </div>                                                                               
                                </div>
                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault2"/>
                                            <label className="form-check-label text-muted" htmlFor="flexCheckDefault2">I Accept <Link to="#" className="text-primary">Terms And Condition</Link></label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-12">
                                    <input type="submit" id="submit" name="send" className="submitBnt btn btn-primary" value="Apply Now"/>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        <Footer/>
        </>
    )
}