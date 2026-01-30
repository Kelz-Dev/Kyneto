import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/wallet.png'
import app from '../assets/images/app/01.png'
import app2 from '../assets/images/app/02.png'
import app3 from '../assets/images/app/03.png'

import Navbar from "../components/navbar";
import Client from "../components/client";
import FooterTop from "../components/footerTop";
import Footer from "../components/footer";

import { FiArrowRight, FaApple, PiGooglePlayLogo, LuShovel, LuFolderOpen } from '../assets/icons/vander'
import { coinImg } from "../data/data";

export default function CryptoWallets() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right" navDark={true} />

            <section className="bg-home d-flex align-items-center bg-light" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'center' }}>
                <div className="container">
                    <div className="row align-items-center mt-5">
                        <div className="col-lg-6 col-md-6">
                            <div className="title-heading">
                                <h4 className="display-6 fw-medium mb-4">The secure app to store crypto yourself</h4>
                                <p className="text-muted para-desc mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>

                                <ul className="list-unstyled mb-0 mt-4">
                                    <li className="d-flex text-muted mt-2 ms-0 align-items-center"><FiArrowRight className="h5 mb-0 text-primary me-1" /> Store all your crypto and NFTs in one place</li>
                                    <li className="d-flex text-muted mt-2 ms-0 align-items-center"><FiArrowRight className="h5 mb-0 text-primary me-1" /> Trade 500+ assets on DEXes and earn interest</li>
                                    <li className="d-flex text-muted mt-2 ms-0 align-items-center"><FiArrowRight className="h5 mb-0 text-primary me-1" /> No Coinbase account required</li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="#" className="btn btn-primary m-1 d-inline-flex align-items-center"><FaApple className="me-1" /> App Store</Link>
                                    <Link to="#" className="btn btn-outline-primary m-1 d-inline-flex align-items-center"><PiGooglePlayLogo className="me-1" /> Play Store</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6 col-md-6 mt-4 pt-2 mt-sm-0 pt-sm-0">
                            <div className="ms-lg-4">
                                <img src={app} className="img-fluid" alt="" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">All your crypto and NFTs in one place</h4>
                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-12">
                            <ul className="list-unstyled text-center">
                                {coinImg.map((item, index) => {
                                    return (
                                        <li className="list-inline-item m-md-4 my-4 mx-2" key={index}>
                                            <img src={item} className="avatar avatar-wallet p-lg-3 p-2 rounded-pill shadow-md" alt="" />
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <div className="row">
                                <div className="col-md-6 mt-4 pt-2">
                                    <div className="feature feature-primary feature-clean text-center rounded p-4">
                                        <div className="icons text-center">
                                            <LuShovel className="icon d-block mx-auto rounded h3 mb-0" />
                                        </div>
                                        <div className="content mt-4">
                                            <Link to="/features" className="text-dark h5 title">Support for 500+ tokens</Link>
                                            <p className="text-muted mt-3 mb-0">BTC, ETH, USDT, UNI, LINK, BCH, USDC, LTC, and hundreds more</p>
                                            <div className="mt-2">
                                                <Link to="/features" className="link">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6 mt-4 pt-2">
                                    <div className="feature feature-primary feature-clean text-center rounded p-4">
                                        <div className="icons text-center">
                                            <LuFolderOpen className="icon d-block mx-auto rounded h3 mb-0" />
                                        </div>
                                        <div className="content mt-4">
                                            <Link to="/features" className="text-dark h5 title">Secure storage</Link>
                                            <p className="text-muted mt-3 mb-0">Your keys are protected with Secure Enclave, biometric authentication</p>
                                            <div className="mt-2">
                                                <Link to="/features" className="link">Read More</Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="row align-items-center">
                                <div className="col-md-5 order-2 order-md-1 mt-4 pt-2 mt-sm-0 pt-sm-0">
                                    <div className="me-lg-5">
                                        <img src={app2} className="img-fluid" alt="" />
                                    </div>
                                </div>

                                <div className="col-md-7 order-1 order-md-2">
                                    <div className="section-title">
                                        <h4 className="title mb-4">Move money freely</h4>
                                        <p className="text-muted para-desc mb-0">Send and receive cryptocurrencies anytime, anywhere - no questions asked. Take advantage of fully-customizable fees for sending. Create unlimited wallets to support your privacy.</p>

                                        <div className="mt-4">
                                            <Link to="#" className="btn btn-primary">Invest Now</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-lg-10">
                            <div className="row align-items-center">
                                <div className="col-md-7">
                                    <div className="section-title">
                                        <h4 className="title mb-4">Track the markets</h4>
                                        <p className="text-muted para-desc mb-0">Stay informed with real-time market data displayed on your home screen. Get in-app access to the news that matters. Receive notifications when the market is moving.</p>

                                        <div className="mt-4">
                                            <Link to="#" className="btn btn-primary">Track your invest</Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-5 mt-4 pt-2 mt-sm-0 pt-sm-0">
                                    <div className="ms-lg-5">
                                        <img src={app3} className="img-fluid" alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Client />
            <FooterTop />
            <Footer />
        </>
    )
}