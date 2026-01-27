import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/bg05.png'
import cryptoCell from '../assets/images/crypto-cell.png'
import Navbar from "../components/navbar";
import Trade from "../components/trade";
import About from "../components/about";

import { FiArrowRight } from '../assets/icons/vander'
import RoadMap from "../components/roadMap";

import CountUp from 'react-countup';
import Client from "../components/client";
import FooterTop from "../components/footerTop";
import Footer from "../components/footer";

export default function IndexFive(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>
        <section className="bg-home d-flex align-items-center w-100" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'center'}}>
            <div className="bg-overlay opacity-8"></div>
            <div className="container">
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="title-heading">
                            <h4 className="display-6 text-white fw-medium title-dark mb-4">Cryptocurrency and Their <br/> Regulation Features</h4>
                            <p className="text-white-50 para-desc">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>

                            <div className="mt-4 mb-1">
                                <Link to="" className="btn btn-success">Get Started Treading</Link>
                            </div>
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
                            <h4 className="title mb-3">The most trusted cryptocurrency platform</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                        </div>
                    </div>
                </div>

                <About/>
            </div>

            <div className="container mt-100 mt-60">
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
                            <Trade/>

                            <div className="text-center mt-4 d-none d-md-block">
                                <Link to="/market-price" className="text-primary small">View more cryptocurrencies <FiArrowRight /></Link>
                            </div>
                        </div>
                    </div>	
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

                <RoadMap/>
            </div>
        </section>

        <section className="section">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <div className="me-lg-5">
                            <img src={cryptoCell} className="img-fluid" alt=""/>
                        </div>
                    </div>

                    <div className="col-md-6 mt-4 pt-2">
                        <div className="section-title mb-4 pb-2">
                            <h6 className="text-primary mb-0">Crypto Earn</h6>
                            <h4 className="title mb-4 mt-2">Deposit crypto, <br/> earn interest</h4>
                            <p className="text-muted mb-0">Choose from 30+ cryptocurrencies and stablecoins.</p>
                            <Link to="#" className="btn btn-soft-primary mt-4">Calculate Earning</Link>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mt-4 pt-2">
                                <h5 className="text-muted">Up to</h5>
                                <h2 className="mb-0 display-4 fw-bold text-primary"><CountUp  className="counter-value"start={0} end={5.8}/>%</h2>
                                <h4>p.a. on cryptos</h4>
                            </div>

                            <div className="col-md-6 mt-4 pt-2">
                                <h5 className="text-muted">Up to</h5>
                                <h2 className="mb-0 display-4 fw-bold text-primary"><CountUp  className="counter-value"start={0} end={12}/>%</h2>
                                <h4>p.a. on stablecoins</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <Client/>
        <FooterTop/>
        <Footer/>
        </>
    )
}