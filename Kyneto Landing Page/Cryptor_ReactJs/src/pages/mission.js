import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import bitcoin from '../assets/images/illustration/bitcoin_miner.svg'
import isometric from '../assets/images/illustration/isometric_btc.svg'

import Navbar from "../components/navbar";
import LinkTabOne from "../components/linkTabOne";
import Footer from "../components/footer";

import { MdOutlineCheckCircle, LuWallet, MdTrendingUp } from '../assets/icons/vander'

export default function Mission() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />
            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Our Mission</h4>
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
                        <div className="col-lg-7 col-md-6 order-2 order-md-1">
                            <div className="section-title me-lg-5">
                                <h4 className="title mb-3">Our Mission</h4>
                                <p className="text-muted">What's the secret to Cryptor's success? The answer is obvious: Our people. We are proud to have one of the most talented, hardworking and passionate teams the world has to offer. Interested in joining our team?</p>

                                <ul className="list-unstyled text-muted mb-0">
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Wallet.</span>  Your Keys, Your Crypto.</li>
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Earn.</span>  No lock-up period and stable returns.</li>
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Swap.</span>  Swap Cryptor coins and earn Triple Yield.</li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="/crypto-wallets" className="btn btn-soft-primary d-inline-flex align-items-center"><LuWallet className="me-1" />Go to wallet</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 col-md-6 order-1 order-md-2 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <img src={bitcoin} className="img-fluid" alt="" />
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-lg-7 col-md-6 order-1 order-md-2">
                            <div className="section-title ms-lg-5">
                                <h4 className="title mb-3">Our Vision</h4>
                                <p className="text-muted mb-0">Cryptor has a strategic partnership with Ledger, integrating its institutional-grade custody solution, Ledger Vault. We also leverage hardware security modules (HSM) and multi-signature technologies. Cryptor has secured a total of USD 360M in cold storage insurance against physical damage or destruction, and third-party theft.</p>

                                <div className="mt-4">
                                    <Link to="#" className="btn btn-soft-primary d-inline-flex align-items-center"><MdTrendingUp className="me-1" /> See Positions</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 col-md-6 order-2 order-md-1 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <img src={isometric} className="img-fluid" alt="" />
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}