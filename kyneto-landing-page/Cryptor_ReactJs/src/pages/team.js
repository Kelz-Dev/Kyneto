import React, { useState } from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import profit from '../assets/images/illustration/profit.svg'

import Navbar from "../components/navbar";
import FooterTopTwo from "../components/footerTopTwo";
import Footer from "../components/footer";

import { accordionData, teamData } from "../data/data";
import { FiMail } from '../assets/icons/vander'

export default function Team() {
    let [activeIndex, setActiveIndex] = useState(1)
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Team Member</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="section">
                <div className="container">
                    <div className="row">
                        {teamData.map((item, index) => {
                            return (
                                <div className="col-lg-3 col-md-6 col-12 mt-4 pt-2" key={index}>
                                    <div className="card text-center team border-0 shadow rounded overflow-hidden">
                                        <img src={item.image} className="img-fluid" alt="" />
                                        <div className="card-body py-3 content">
                                            <h5 className="mb-0 text-dark">{item.name}</h5>
                                            <h6 className="text-muted mb-0">{item.title}</h6>
                                        </div>
                                        <ul className="list-unstyled team-social mb-0">
                                            <li><Link to="mailto:contact@example.com" className="btn btn-icon btn-pills btn-soft-primary"><FiMail className="icons" /></Link></li>
                                        </ul>
                                    </div>
                                </div>
                            )
                        })}

                        <div className="col-12 text-center mt-4 pt-2">
                            <div className="alert alert-light alert-pills" role="alert">
                                <span className="badge bg-soft-success rounded-pill me-1">Jobs</span>
                                <span className="content fw-normal">We Are Hiring <Link to="/career" className="text-primary"> Send your CV / Resume</Link></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="me-lg-4">
                                <img src={profit} className="img-fluid" alt="" />
                            </div>
                        </div>

                        <div className="col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="section-title mb-4 pb-2">
                                <h4 className="title mb-4">Frequently Asked Questions</h4>
                                <p className="text-muted para-desc mb-0">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                            </div>

                            <div className="accordion mt-4 pt-2">
                                {accordionData.map((item, index) => {
                                    return (
                                        <div className="accordion-item rounded border-0 shadow mt-3" key={index}>
                                            <h2 className="accordion-header">
                                                <button className={`${activeIndex === item.id ? '' : 'collapsed'} accordion-button border-0 bg-white`} type="button" onClick={() => setActiveIndex(item.id)}>
                                                    {item.title}
                                                </button>
                                            </h2>
                                            <div className={`${activeIndex === item.id ? 'show' : ''} accordion-collapse border-0 collapse`}>
                                                <div className="accordion-body text-muted bg-white">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <FooterTopTwo />
            <Footer />
        </>
    )
}