import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/bg02.png'
import cta from '../assets/images/bg/cta.png'
import profitSvg from '../assets/images/illustration/profit.svg'
import mobile from '../assets/images/app/hand-with-mobile.png'
import Navbar from "../components/navbar";

import { FaApple, PiGooglePlayLogo, FiArrowRight, MdOutlineCheckCircle } from '../assets/icons/vander'
import Charts from "../components/chart";
import About from "../components/about";
import { coinImg, counterData } from "../data/data";

import CountUp from 'react-countup';
import FooterTopTwo from "../components/footerTopTwo";
import Footer from "../components/footer";

export default function IndexTwo() {
    return (
        <>
            <div className="tagline bg-light shadow">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="text-slider">
                                <ul className="list-inline mb-0 move-text">
                                    <li className="list-inline-item small px-2 mb-0">EOG $ 55.88 <span className="text-success">+$ 4.62 ( +9.01% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">CHKP $ 120.03 <span className="text-danger">-$ 14.07 ( -10.49% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">FANG $ 63.58 <span className="text-success">+$ 5.17 ( +8.84% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">M $ 14.75 <span className="text-success">+$ 1.05 ( +7.66% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">PKI $ 139.72 <span className="text-danger">-$ 11.41 ( -7.55% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">ABMD $ 326.23 <span className="text-danger">-$ 21.61 ( -6.21% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">BITCOIN $ 37,471.47 <span className="text-danger">+$ 492.60 ( +1.33% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">XRP <span> $ 0.39</span><span className="text-muted"> UNCH</span></li>
                                    <li className="list-inline-item small px-2 mb-0">LITECOIN <span> $ 148.67</span><span className="text-danger">-$ 5.58 ( -3.62% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">BITCOIN CASH <span> $ 427.37</span><span className="text-danger">-$ 15.98 ( -3.60% )</span></li>
                                    <li className="list-inline-item small px-2 mb-0">ETHEREUM $ 1,647.87 <span className="text-danger">+$ 14.51 ( +0.89% )</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Navbar headClass="defaultscroll sticky tagline-height" navClass="navigation-menu nav-right nav-light" />

            <section className="bg-home bg-black d-flex align-items-center" >
                <div style={{ position: 'absolute', top: '0', left: '0' }}>
                    <img src={bg1} alt="" />
                </div>
                <div className="container">
                    <div className="row mt-5 align-items-center">
                        <div className="col-lg-6 col-md-6 col-12">
                            <div className="title-heading">
                                <span className="badge bg-soft-success rounded-md">Calculator</span>
                                <h4 className="display-5 text-white title-dark fw-medium mt-3 mb-4">100% Free Digital Asset Exchange Platform</h4>
                                <p className="text-white-50 para-desc mx-auto mb-0">With Kyneto Trade, you can be sure your trading skills are matched with excellent service.</p>

                                <div className="mt-4 pt-2">
                                    <Link to="#" className="btn btn-primary m-1 d-inline-flex align-items-center"><FaApple className="me-1" /> App Store</Link>
                                    <Link to="#" className="btn btn-outline-primary m-1 d-inline-flex align-items-center"><PiGooglePlayLogo className="me-1" /> Play Store</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 offset-lg-1 col-md-6 col-12">
                            <div className="card border-0 bg-light shadow rounded p-4 overflow-hidden">
                                <img src={profitSvg} className="img-fluid" alt="" />

                                <div className="mt-4 pt-2">
                                    <h5 className="text-center text-dark mb-0">Live Cryptocurrency Calculator</h5>

                                    <form>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label"></label>
                                                    <div className="form-icon position-relative">
                                                        <input name="name" id="name" type="number" className="form-control" placeholder="Enter Amount" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label"></label>
                                                    <div className="form-icon position-relative">
                                                        <select className="form-control form-select">
                                                            <option value="BTC">Bitcoin (BTC)</option>
                                                            <option value="LTC"> Litecoin (LTC)</option>
                                                            <option value="CNY">Coinye (CNY)</option>
                                                            <option value="PTC">Potcoin (PTC)</option>
                                                            <option value="XPM">Prime coin (XPM)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label"></label>
                                                    <div className="form-icon position-relative">
                                                        <input name="name2" id="name2" type="number" className="form-control" placeholder="Enter Amount" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label"></label>
                                                    <div className="form-icon position-relative">
                                                        <select className="form-control form-select">
                                                            <option value="USD">US Dollar (USD)</option>
                                                            <option value="Indian Rupee">Indian Rupee</option>
                                                            <option value="CAD">Canadian Dollar (CAD)</option>
                                                            <option value="SEK">Swedish Krona (SEK)</option>
                                                            <option value="AUD">Australian Dollar (AUD)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section pb-0">
                <div className="container">
                    <div className="row align-items-end mb-4 pb-2">
                        <div className="col-md-8">
                            <div className="section-title">
                                <h4 className="title mb-3">Track the market</h4>
                                <p className="text-muted para-desc mb-0">Make better investment decisions with real-time data at your fingertips</p>
                            </div>
                        </div>

                        <div className="col-md-4 d-none d-md-block">
                            <div className="text-end">
                                <Link to="market-price" className="text-primary">See Marketplace <FiArrowRight /></Link>
                            </div>
                        </div>
                    </div>

                    <Charts />
                </div>

                <div className="container mt-100 mt-60">
                    <About />
                </div>

                <div className="container mt-100 mt-60">
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
                </div>

                <div className="container mt-100 mt-60">
                    <div className="row align-items-lg-center align-items-end">
                        <div className="col-md-6">
                            <div className="section-title mb-4 pb-2">
                                <h4 className="title mb-4">Free your money and <br /> invest with confidence</h4>
                                <p className="text-muted para-desc mb-0">With Cryptor Trade, you can be sure your trading skills are matched with excellent service.</p>

                                <ul className="list-unstyled mb-0">
                                    <li className="d-flex mt-4">
                                        <MdOutlineCheckCircle className="h4 text-primary" />
                                        <div className="flex-1 ms-3">
                                            <h6 className="mb-0">Buy, sell, and trade on the go</h6>
                                            <p className="text-muted mt-2 mb-0">Manage your holdings from your mobile device</p>
                                        </div>
                                    </li>

                                    <li className="d-flex mt-4">
                                        <MdOutlineCheckCircle className="h4 text-primary" />
                                        <div className="flex-1 ms-3">
                                            <h6 className="mb-0">Take control of your wealth</h6>
                                            <p className="text-muted mt-2 mb-0">Rest assured you (and only you) have access to your funds</p>
                                        </div>
                                    </li>
                                </ul>

                                <div className="mt-4">
                                    <Link to="/crypto-wallets" className="btn btn-primary">Download Wallet</Link>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="">
                                <img src={mobile} className="img-fluid" alt="" />
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
                                        <h2 className="mb-0 display-6 mt-3 fw-bold text-primary"><CountUp className="counter-value" start={0} end={item.target} />{item.value}</h2>
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