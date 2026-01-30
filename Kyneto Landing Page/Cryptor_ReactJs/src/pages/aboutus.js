import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import revenue from '../assets/images/illustration/revenue.svg'
import bills from '../assets/images/illustration/bills.svg'
import profit from '../assets/images/illustration/profit.svg'

import Navbar from "../components/navbar";
import LinkTabOne from "../components/linkTabOne";
import Footer from "../components/footer";

import { MdOutlineCheckCircle, LuWallet, FiTrendingUp, LuMailCheck, BiWebcam } from '../assets/icons/vander'

export default function AboutUs() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">About Cryptor</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <LinkTabOne />

            <section className="section">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="position-relative me-lg-5">
                                <img src={revenue} className="img-fluid" alt="" />
                            </div>
                        </div>

                        <div className="col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="section-title">
                                <span className="badge bg-soft-primary rounded">About</span>
                                <h4 className="title mb-3 mt-2">Our Story</h4>

                                <p className="text-muted">We are building the cryptoeconomy – a more fair, accessible, efficient, and transparent financial system enabled by crypto.</p>

                                <p className="text-muted mb-0">We started in 2020 with the radical idea that anyone, anywhere, should be able to easily and securely send and receive Bitcoin. Today, we offer a trusted and easy-to-use platform for accessing the broader cryptoeconomy.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-lg-7 order-2 order-md-1">
                            <div className="section-title me-lg-5">
                                <h4 className="title mb-3">Build the future of technology</h4>
                                <p className="text-muted">What's the secret to Cryptor's success? The answer is obvious: Our people. We are proud to have one of the most talented, hardworking and passionate teams the world has to offer. Interested in joining our team?</p>

                                <ul className="list-unstyled text-muted mb-0">
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Wallet.</span>  Your Keys, Your Crypto.</li>
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Earn.</span>  No lock-up period and stable returns.</li>
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Swap.</span>  Swap Cryptor coins and earn Triple Yield.</li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="/crypto-wallets" className="btn btn-soft-primary d-inline-flex align-items-center"><LuWallet className="me-1" /> Go to wallet</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 order-1 order-md-2">
                            <img src={bills} className="img-fluid" alt="" />
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-lg-7 order-1 order-md-2">
                            <div className="section-title ms-lg-5">
                                <h4 className="title mb-3">Join us</h4>
                                <p className="text-muted mb-0">We’re currently hiring. If our company mission means something to you, you’re invited to join the Bitcoin.com team.</p>

                                <div className="mt-4">
                                    <Link to="#" className="btn btn-soft-primary d-inline-flex align-items-center"><FiTrendingUp className="me-1" /> See Positions</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 order-2 order-md-1">
                            <img src={profit} className="img-fluid" alt="" />
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row">
                        <div className="col-lg-6 col-md-6 col-12">
                            <div className="d-flex align-items-center feature feature-primary feature-clean shadow rounded p-4">
                                <div className="icons text-center">
                                    <LuMailCheck className="icon d-block rounded h3 mb-0" />
                                </div>
                                <div className="flex-1 content ms-4">
                                    <Link to="#" className="text-dark h5 title">Get in Touch !</Link>
                                    <p className="text-muted mb-0">This is required when, for text is not yet available.</p>
                                    <div className="mt-2">
                                        <Link to="#" className="btn btn-sm btn-soft">Submit a Request</Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 col-md-6 col-12 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="d-flex align-items-center feature feature-primary feature-clean shadow rounded p-4">
                                <div className="icons text-primary text-center">
                                    <BiWebcam className="icon d-block rounded h3 mb-0" />
                                </div>
                                <div className="flex-1 content ms-4">
                                    <Link to="#" className="text-dark h5 title">Start a Meeting</Link>
                                    <p className="text-muted mb-0">This is required when, for text is not yet available.</p>
                                    <div className="mt-2">
                                        <Link to="#" className="btn btn-sm btn-soft">Start Video Chat</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}