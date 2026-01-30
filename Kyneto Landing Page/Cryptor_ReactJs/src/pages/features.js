import React from "react";
import { Link } from "react-router-dom";

import bg1 from "../assets/images/bg/market.png"
import logoIcom from '../assets/images/icon-gradient.png'

import Navbar from "../components/navbar";
import LinkTabOne from "../components/linkTabOne";
import FooterTopTwo from "../components/footerTopTwo";
import Footer from "../components/footer";

import { counterData, services, tradeProccess } from "../data/data";
import { FiArrowRight } from '../assets/icons/vander'

import CountUp from 'react-countup';

export default function Features() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Features & Services</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <LinkTabOne />

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">Become a crypto trader in seconds</h4>
                                <p className="text-muted para-desc mx-auto mb-0">We've got everything you need to start trading.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="row justify-content-center">
                                {tradeProccess.map((item, index) => {
                                    return (
                                        <div className="col-md-6 mt-4 pt-2" key={index}>
                                            <div className="feature feature-primary position-relative p-4 pe-5 shadow rounded overflow-hidden">
                                                <div className="me-md-5">
                                                    <Link to="#" className="title h5 text-dark">{item.name}</Link>
                                                    <p className="text-muted mb-3 mt-4">{item.desc}</p>
                                                    <Link to="#" className="link d-inline-flex align-items-center">{item.title}<FiArrowRight className="ms-1" /></Link>
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

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">Services</h4>
                                <p className="text-muted para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {services.map((item, index) => {
                            let Icon = item.icon
                            return (
                                <div className="col-lg-4 col-md-6 col-12 mt-4 pt-2" key={index}>
                                    <div className={`${item.bg === true ? 'bg-light' : ''} feature feature-primary feature-clean rounded p-4`}>
                                        <div className="icons text-center">
                                            <Icon className="icon d-block rounded h3 mb-0" />
                                        </div>
                                        <div className="content mt-4">
                                            <Link to="/features" className="text-dark h5 title">{item.title}</Link>
                                            <p className="text-muted mt-3 mb-0">{item.desc}</p>
                                            <div className="mt-2">
                                                <Link to="/features" className="link">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h6 className="text-primary">Our Vision</h6>
                                <h4 className="title mb-3 mt-2">Cryptocurrency in Every Wallet</h4>

                                <p className="text-muted para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center my-4 py-2">
                        <div className="col-md-6">
                            <img src={logoIcom} className="img-fluid" alt="" />
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {counterData.map((item, index) => {
                            return (
                                <div className="col-lg-3 col-md-6 mt-4 pt-2" key={index}>
                                    <div className="text-center">
                                        <h5 className="text-muted mb-0">{item.title}</h5>
                                        <h2 className="mb-0 display-5 mt-4 fw-bold text-primary"><CountUp className="counter-value" start={0} end={item.target} />{item.value}</h2>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>
            <FooterTopTwo />
            <Footer />
        </>
    )
}