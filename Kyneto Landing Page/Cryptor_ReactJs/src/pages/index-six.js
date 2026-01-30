import React, { useState } from "react";
import { Link } from "react-router-dom";

import hero from '../assets/images/hero/02.png'
import revenue from '../assets/images/illustration/revenue.svg'
import profitSvg from '../assets/images/illustration/profit.svg'

import Navbar from "../components/navbar";
import Charts from "../components/chart";
import Trade from "../components/trade";
import FooterTop from "../components/footerTop";
import Footer from "../components/footer";

import { accordionData, companyPartner, teamData } from "../data/data";
import { FiArrowRight, MdOutlineCheckCircle, LuWallet, FiMail } from '../assets/icons/vander'

export default function IndexSix() {
    let [activeIndex, setActiveIndex] = useState(1)
    return (
        <>
            <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right" navDark={true} />
            <section className="bg-home d-flex align-items-center bg-rounded" id="home">
                <div className="bg-overlay bg-gradient-primary-2 opacity-1 bg-rounded"></div>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="title-heading">
                                <h4 className="heading fw-medium text-dark title-dark mb-3">Bitcoin in Accounting <br /> Information Systems</h4>
                                <p className="para-desc text-muted">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                                <div className="mt-4">
                                    <Link to="#" className="btn btn-primary me-2"> Start Treading</Link>
                                    <Link to="#" className="btn btn-outline-primary"> Go Back</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <img src={hero} className="img-fluid " alt="" />
                        </div>
                    </div>

                    <Charts />
                </div>
            </section>

            <section className="py-5">
                <div className="container">
                    <div className="row justify-content-center">
                        {companyPartner.map((item, index) => {
                            return (
                                <div className="col-lg-2 col-md-2 col-6 text-center py-3 py-md-4" key={index}>
                                    <img src={item} className="avatar avatar-ex-sm" alt="" />
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="position-relative me-lg-5">
                                <img src={revenue} className="img-fluid" alt="" />
                            </div>
                        </div>

                        <div className="col-md-6 mt-4 mt-sm-0 pt-2 pt-sm-0">
                            <div className="section-title">
                                <h4 className="title mb-3">Build the future of technology</h4>
                                <p className="text-muted">What's the secret to Cryptor's success? The answer is obvious: Our people. We are proud to have one of the most talented, hardworking and passionate teams the world has to offer. Interested in joining our team?</p>

                                <ul className="list-unstyled text-muted mb-0">
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Wallet.</span>  Your Keys, Your Crypto.</li>
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Earn.</span>  No lock-up period and stable returns.</li>
                                    <li className="mb-0 ms-0"><span className="text-primary h5 me-2"><MdOutlineCheckCircle className="align-middle" /></span><span className="fw-medium">Cryptor Swap.</span>  Swap Cryptor coins and earn Triple Yield.</li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="#" className="btn btn-soft-primary"><LuWallet /> Go to wallet</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-end mb-4 pb-2">
                        <div className="col-md-8">
                            <div className="section-title">
                                <h4 className="title mb-3">Buy crypto at true cost</h4>
                                <p className="text-muted para-desc mb-0">Buy and sell 100+ cryptocurrencies with 20+ fiat currencies using bank transfers or your credit/debit card.</p>
                            </div>
                        </div>

                        <div className="col-md-4 d-none d-md-block">
                            <div className="text-end">
                                <Link to="/market-price" className="text-primary">See Marketplace <FiArrowRight /></Link>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-12 mt-4 pt-2">
                            <div className="table-responsive bg-white">
                                <Trade />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section bg-light">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="section-title text-center mb-4 pb-2">
                                <h4 className="title mb-3">Our Team</h4>
                                <p className="text-muted para-desc mx-auto mb-0">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        {teamData.slice(0, 4).map((item, index) => {
                            return (
                                <div className="col-lg-3 col-md-6 col-12 mt-4" key={index}>
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

                        <div className="col-md-3 text-center col-12 mt-4">
                            <Link to="/team" className="btn btn-outline-primary mb-2 mt-4">Viwe More</Link>
                        </div>
                    </div>
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="me-lg-4">
                                <img src={profitSvg} className="img-fluid" alt="" />
                            </div>
                        </div>

                        <div className="col-md-6">
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
            <FooterTop />
            <Footer />
        </>
    )
}