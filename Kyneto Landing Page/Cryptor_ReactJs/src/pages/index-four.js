import React from "react";
import { Link } from "react-router-dom";

import hero from '../assets/images/hero/one.png'
import crypto from '../assets/images/crypto.png'
import cryptoCell from '../assets/images/crypto-cell.png'
import cryptoIcon from '../assets/images/icon-gradient.png'

import Navbar from "../components/navbar";
import Trade from "../components/trade";
import RoadMap from "../components/roadMap";
import FooterTopTwo from '../components/footerTopTwo'
import Footer from '../components/footer'

import { FiArrowRight } from '../assets/icons/vander'
import { appLink, counterData } from "../data/data";

import CountUp from 'react-countup';

export default function IndexFour() {
    return (

        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />
            <section className="bg-home d-flex align-items-center">
                <div className="bg-overlay bg-gradient-primary"></div>
                <div className="container">
                    <div className="row align-items-center mt-5">
                        <div className="col-lg-5 col-md-6">
                            <div className="title-heading">
                                <h4 className="display-4 fw-bold text-white title-dark mb-4">Buy & Sell <br />Crypto in Minutes</h4>
                                <p className="text-white-50 para-desc">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>

                                <div className="mt-4 mb-1">
                                    <Link to="/signup" className="btn btn-success">Open an account</Link>
                                </div>
                                <small className="text-white-50"><span className="text-danger">*</span>No credit card required</small>
                            </div>
                        </div>

                        <div className="col-lg-7 col-md-6">
                            <img src={hero} className="img-fluid mover" alt="" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">Buy crypto at true cost</h4>
                                <p className="text-muted para-desc mx-auto mb-0">Buy and sell 100+ cryptocurrencies with 20+ fiat currencies using bank transfers or your credit/debit card.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-12 mt-4 pt-2">
                            <div className="table-responsive bg-white">
                                <Trade />
                            </div>

                            <div className="text-center mt-4 d-none d-md-block">
                                <Link to="/market-price" className="text-primary small">View more cryptocurrencies <FiArrowRight /></Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row">
                        <div className="col-12">
                            <img src={crypto} className="img-fluid d-block mx-auto" alt="" />
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {appLink.map((item, index) => {
                            let Icon = item.icon
                            return (
                                <div className="col-lg-2 col-md-3 col-6 mt-4 pt-2" key={index}>
                                    <Link to="#" className="apps-links bg-light mx-auto d-block text-center rounded py-3">
                                        <Icon className="icon text-dark h4" />
                                        <h6 className="fw-normal mb-0 app-name text-muted mt-2">{item.title}</h6>
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="section bg-light" id="roadmap">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-4">Success Roadmap</h4>
                                <p className="text-muted mx-auto para-desc mb-0">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                            </div>
                        </div>
                    </div>
                    <RoadMap />
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="me-lg-5">
                                <img src={cryptoCell} className="img-fluid" alt="" />
                            </div>
                        </div>

                        <div className="col-md-6 mt-4 pt-2">
                            <div className="section-title mb-4 pb-2">
                                <h6 className="text-primary mb-0">Crypto Earn</h6>
                                <h4 className="title mb-4 mt-2">Deposit crypto, <br /> earn interest</h4>
                                <p className="text-muted mb-0">Choose from 30+ cryptocurrencies and stablecoins.</p>
                                <Link to="#" className="btn btn-soft-primary mt-4">Calculate Earning</Link>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mt-4 pt-2">
                                    <h5 className="text-muted">Up to</h5>
                                    <h2 className="mb-0 display-4 fw-bold text-primary"><CountUp className="counter-value" start={0} end={5.8} />%</h2>
                                    <h4>p.a. on cryptos</h4>
                                </div>

                                <div className="col-md-6 mt-4 pt-2">
                                    <h5 className="text-muted">Up to</h5>
                                    <h2 className="mb-0 display-4 fw-bold text-primary"><CountUp className="counter-value" start={0} end={12} />%</h2>
                                    <h4>p.a. on stablecoins</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h6 className="text-primary">Our Vision</h6>
                                <h4 className="title mb-3 mt-2">Cryptocurrency in Every Wallet</h4>

                                <p className="text-muted para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center my-4 py-2">
                        <div className="col-md-6">
                            <img src={cryptoIcon} className="img-fluid" alt="" />
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