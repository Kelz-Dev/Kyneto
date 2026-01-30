import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/bg03.png'
import hero from '../assets/images/hero03.png'
import bitcoinSvg from '../assets/images/illustration/bitcoin_miner.svg'

import Navbar from "../components/navbar";
import Charts from "../components/chart";
import Trade from "../components/trade";
import About from "../components/about";
import Footer from "../components/footer";

import { companyPartner } from "../data/data";

import { MdOutlineCheckCircle, FiArrowRight } from '../assets/icons/vander'

export default function IndexThree(){
    return(
        <>
        <Navbar headClass="defaultscroll sticky" navClass="navigation-menu nav-right nav-light"/>

        <section className="bg-home bg-primary d-flex align-items-center" style={{backgroundImage:`url(${bg1})`, height:'auto', backgroundPosition:'center'}} id="home">
            <div className="bg-overlay bg-gradient-primary opacity-9"></div>
            <div className="container">
                <div className="row mt-5 justify-content-center">
                    <div className="col-lg-12 text-center mt-0 mt-md-5 pt-0 pt-md-5">
                        <div className="title-heading margin-top-100">
                            <h4 className="heading fw-medium text-white title-dark mb-3">Jump Start <br/>Your Crypto Portfolio</h4>
                            <p className="para-desc mx-auto text-white-50">Explore and learn more about everything from machine learning and global payments to  scaling your team.</p>
                        </div>

                        <div className="mt-4 mb-1">
                            <Link to="/signup" className="btn btn-success">Open an account</Link>
                        </div>
                        <small className="text-white-50"><span className="text-danger">*</span>No credit card required</small>

                        <div className="row justify-content-center">
                            <div className="col-lg-8 col-md-10">
                                <div className="home-dashboard">
                                    <img src={hero} alt="" className="img-fluid"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <div className="position-relative">
            <div className="shape integration-hero overflow-hidden text-light"></div>
        </div>

        <section className="mt-5 pt-md-5">
            <div className="container">
                <div className="row justify-content-center">
                    {companyPartner.map((item,index) =>{
                        return(
                        <div className="col-lg-2 col-md-2 col-6 text-center py-4 py-sm-0" key={index}>
                            <img src={item} className="avatar avatar-ex-sm" alt=""/>
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
                            <h4 className="title mb-3">Buy quickly and easily</h4>
                            <p className="text-muted para-desc mx-auto mb-0">Use your credit card, payment app, or bank account to buy Bitcoin, Bitcoin Cash, Ethereum, and other select cryptocurrencies</p>
                        </div>
                    </div>
                </div>

                <div className="row align-items-center">                    
                    <div className="col-lg-5 col-md-6 col-12 mt-4 pt-2">
                        <img src={bitcoinSvg} className="img-fluid" alt=""/>
                    </div>

                    <div className="col-lg-6 offset-lg-1 col-md-6 col-12 mt-4 pt-2">
                        <div className="card border-0 shadow rounded p-4 bg-light overflow-hidden me-lg-4">
                            <h5 className="text-center text-dark mb-0">Live Cryptocurrency Calculator</h5>

                            <form>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label"></label>
                                            <div className="form-icon position-relative">
                                                <input name="name" id="name" type="number" className="form-control" placeholder="Enter Amount"/>
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
                                                <input name="name2" id="name2" type="number" className="form-control" placeholder="Enter Amount"/>
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

                        <ul className="list-unstyled mb-0 mt-5">
                            <li className="d-flex mt-4">
                                <MdOutlineCheckCircle className="h4 text-primary"/>

                                <div className="flex-1 ms-3">
                                    <h6 className="mb-0">Buy, sell, and trade on the go</h6>
                                    <p className="text-muted mt-2 mb-0">Manage your holdings from your mobile device</p>
                                </div>
                            </li>

                            <li className="d-flex mt-4">
                                <MdOutlineCheckCircle className="h4 text-primary"/>

                                <div className="flex-1 ms-3">
                                    <h6 className="mb-0">Take control of your wealth</h6>
                                    <p className="text-muted mt-2 mb-0">Rest assured you (and only you) have access to your funds</p>
                                </div>
                            </li>
                        </ul>
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

                <Charts/>

                <div className="row justify-content-center">
                    <div className="col-12 mt-4 pt-2">
                        <div className="table-responsive bg-light">
                           <Trade/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-100 mt-60">
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
        </section>
        <Footer/>
        </>
    )
}