import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import cta from '../assets/images/bg/cta.png'

import Navbar from "../components/navbar";
import LinkTabTwo from "../components/linkTabTwo";
import Footer from "../components/footer"

import { careerValue, counterData, jobData } from "../data/data";

import { FiArrowRight } from '../assets/icons/vander'

import CountUp from 'react-countup';

export default function Career() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Careers</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <LinkTabTwo />

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">Our Values</h4>
                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="row justify-content-center">
                                {careerValue.map((item, index) => {
                                    return (
                                        <div className="col-md-6 mt-4 pt-2" key={index}>
                                            <div className="feature feature-primary position-relative p-4 pe-5 shadow rounded overflow-hidden">
                                                <div className="me-md-5">
                                                    <Link to="#" className="title h5 text-dark">{item.title}</Link>
                                                    <p className="text-muted mb-3 mt-4">{item.desc}</p>
                                                    <Link to="#" className="link">Read more <FiArrowRight /></Link>
                                                </div>
                                                <div className="position-absolute top-50 start-100 translate-middle">
                                                    <img src={item.image} className="avatar avatar-large opacity-2" alt="" />
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

            <section className="section" style={{ backgroundImage: `url(${cta})`, backgroundPosition: 'top' }}>
                <div className="bg-overlay bg-light opacity-7"></div>
                <div className="container">
                    <div className="row justify-content-center">
                        {counterData.map((item, index) => {
                            return (
                                <div className="col-lg-3 col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0" key={index}>
                                    <div className="text-center">
                                        <h6 className="text-muted mb-0">{item.title}</h6>
                                        <h2 className="mb-0 display-6 mt-3 fw-bold text-primary"><CountUp start={0} end={item.target} />{item.value}</h2>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">Current Openings</h4>
                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {jobData.map((item, index) => {
                            let Icon = item.icon
                            return (
                                <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2" key={index}>
                                    <div className="d-flex feature key-feature feature-primary align-items-center rounded shadow py-2 px-3">
                                        <div className="icon text-center rounded fs-5 me-3">
                                            <Icon />
                                        </div>
                                        <Link to={`/career-detail/${item.id}`} className="title h6 text-dark mb-0">{item.title}</Link>
                                    </div>
                                </div>
                            )
                        })}

                        <div className="col-12 text-center mt-4 pt-2">
                            <div className="alert alert-light alert-pills" role="alert">
                                <span className="badge bg-success rounded-pill"> Jobs </span>
                                <span className="alert-content ms-2"> We Are Hiring <Link to="#" className="text-primary">Send your Resume</Link></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="container-fluid px-0 bg-footer">
                <div className="py-5">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-md-8">
                                <div className="section-title text-center">
                                    <h4 className="title mb-4 text-white title-dark">Exchange the World With Us</h4>
                                    <Link to="#" className="btn btn-primary">Apply Now</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}