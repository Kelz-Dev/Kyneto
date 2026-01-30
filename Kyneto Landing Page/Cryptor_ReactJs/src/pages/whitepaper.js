import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/market.png'
import bills from '../assets/images/illustration/bills.svg'

import Navbar from "../components/navbar";

import { FiArrowRight } from '../assets/icons/vander'
import Footer from "../components/footer";

export default function Whitepaper() {
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-half-170 d-table w-100" style={{ backgroundImage: `url(${bg1})`, backgroundPosition: 'bottom' }}>
                <div className="bg-overlay bg-gradient-primary opacity-9"></div>
                <div className="container">
                    <div className="row justify-content-center mt-5">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title text-white title-dark fw-medium mb-4">Whitepaper for Cryptocurrency</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-7 col-md-6">
                            <div className="section-title">
                                <h4 className="mb-4">What Is a White Paper?</h4>
                                <ul className="list-unstyled mb-5">
                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" /><span>Whitepapers explain the purpose and technology behind a project.</span></li>

                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{ width: '24px' }} /><span>They usually provide statistics, diagrams and facts to convince interested investors to purchase the cryptocurrency.</span></li>

                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{ width: '38px' }} />Producing a whitepaper is key a step required for a crypto startup to be considered legitimate and professional, as it helps investors understand how a business is different from rivals in the space.</li>

                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" />Whitepapers differ from litepapers, which tend to be shorter, less technical and easier to understand.</li>

                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{ width: '34px' }} />One of the most famous cryptocurrency whitepapers is undoubtedly Bitcoin: A Peer-to-Peer Electronic Cash System, which was published by Satoshi Nakamoto in 2008.</li>
                                </ul>


                                <h5 className="mb-4">The Bitcoin whitepaper proposed the following:</h5>

                                <ul className="list-unstyled mb-0">
                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" />A peer-to-peer (P2P) system for payments across an online network</li>
                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" />Removing third parties and replacing them with verification (decentralization)</li>
                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" />Transactions would be irreversible</li>
                                    <li className="d-flex text-muted mt-2 ms-0"><FiArrowRight className="text-primary h5 mb-0 me-2" style={{ width: '24px' }} />A P2P distributed timestamp server. This would generate mathematical proof of an order of different transactions.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="col-lg-4 offset-lg-1 col-md-6 mt-4 pt-2 mt-sm-0 pt-sm-0">
                            <div className="p-4 shadow rounded">
                                <img src={bills} className="img-fluid" alt="" />
                                <h4 className="mb-3 mt-4 pt-2">Terms & Conditions</h4>
                                <p className="text-muted mb-0">A document released by a crypto project that gives investors technical information about its concept, and a roadmap for how it plans to grow and succeed.</p>
                            </div>

                            <div className="tagcloud mt-4">
                                <h5 className="mb-4">Related Terms & Conditions</h5>

                                <Link to="#" className="rounded">Circulating Supply</Link>
                                <Link to="#" className="rounded">Currency</Link>
                                <Link to="#" className="rounded">Digital Art</Link>
                                <Link to="#" className="rounded">All-Time-High (ATH)</Link>
                                <Link to="#" className="rounded">Immutable</Link>
                                <Link to="#" className="rounded">Futures</Link>
                                <Link to="#" className="rounded">Contract Account</Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container mt-100 mt-60">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center">
                                <h4 className="title mb-4">Be the first to know about Crypto news everyday</h4>
                                <p className="para-desc mx-auto text-muted mb-0">Get crypto analysis, news and updates right to your inbox! Sign up here so you don't miss a single newsletter.</p>

                                <div className="subcribe-form mt-5">
                                    <form>
                                        <div className="mb-0">
                                            <input type="email" id="email" name="email" className="bg-light rounded" required placeholder="Enter your email address" />
                                            <button type="submit" className="btn btn-primary">Notify me</button>
                                        </div>
                                    </form>
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